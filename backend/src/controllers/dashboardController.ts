import { Request, Response } from 'express';
import { Employee, Training, Batch, Certificate, WorkflowStatus, BatchStatus } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getComplianceStats, getUpcomingDueDates, getOverdueEmployees } from '../services/complianceService.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Get dashboard overview
 * GET /api/dashboard
 */
export const getDashboardOverview = asyncHandler(async (_req: Request, res: Response) => {
  // Get compliance stats
  const compliance = await getComplianceStats();

  // Get counts
  const [employeeCount, trainingCount, activeBatchCount, pendingCertCount] = await Promise.all([
    Employee.count({ where: { status: 'active' } }),
    Training.count(),
    Batch.count({ where: { status: { [Op.in]: [BatchStatus.SCHEDULED, BatchStatus.IN_PROGRESS] } } }),
    Certificate.count({ where: { workflowStatus: WorkflowStatus.PENDING_APPROVAL } }),
  ]);

  // Get recent activity (last 5) - join through batch to get training
  const recentCertificates = await Certificate.findAll({
    where: { workflowStatus: WorkflowStatus.APPROVED },
    include: [
      { model: Employee, as: 'employee', attributes: ['fullName'] },
      {
        model: Batch,
        as: 'batch',
        include: [{ model: Training, as: 'training', attributes: ['name'] }],
      },
    ],
    order: [['approvalAt', 'DESC']],
    limit: 5,
  });

  const recentActivity = recentCertificates.map((cert: any) => ({
    type: 'certificate_approved',
    employee: cert.employee?.fullName,
    training: cert.batch?.training?.name,
    timestamp: cert.approvalAt,
  }));

  // Get upcoming due
  const upcomingDue = await getUpcomingDueDates(5);

  res.json({
    success: true,
    data: {
      stats: {
        totalEmployees: employeeCount,
        totalTrainings: trainingCount,
        activeBatches: activeBatchCount,
        pendingApprovals: pendingCertCount,
      },
      compliance: {
        total: compliance.total,
        compliant: compliance.compliant,
        dueSoon: compliance.dueSoon,
        overdue: compliance.overdue,
        neverTrained: compliance.neverTrained,
        complianceRate: compliance.total > 0 
          ? Math.round((compliance.compliant / compliance.total) * 100) 
          : 0,
      },
      recentActivity,
      upcomingDue,
    },
  });
});

/**
 * Get compliance overview
 * GET /api/dashboard/compliance
 */
export const getComplianceOverview = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getComplianceStats();
  const upcoming = await getUpcomingDueDates(20);
  const overdue = await getOverdueEmployees();

  res.json({
    success: true,
    data: {
      stats,
      upcoming,
      overdue,
    },
  });
});

/**
 * Get training completion stats by department
 * GET /api/dashboard/by-department
 */
export const getStatsByDepartment = asyncHandler(async (_req: Request, res: Response) => {
  const results = await sequelize.query(`
    SELECT 
      d.id as department_id,
      d.name as department_name,
      COUNT(DISTINCT e.id) as total_employees,
      COUNT(DISTINCT CASE 
        WHEN c.next_due_date >= NOW() THEN e.id 
        ELSE NULL 
      END) as compliant_employees,
      COUNT(DISTINCT CASE 
        WHEN c.next_due_date < NOW() THEN e.id 
        ELSE NULL 
      END) as overdue_employees
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
    LEFT JOIN certificates c ON e.id = c.employee_id AND c.workflow_status = 'approved'
    GROUP BY d.id, d.name
    ORDER BY d.name
  `, { type: 'SELECT' });

  res.json({
    success: true,
    data: { departments: results },
  });
});

/**
 * Get training completion stats by training type
 * GET /api/dashboard/by-training
 */
export const getStatsByTraining = asyncHandler(async (_req: Request, res: Response) => {
  const results = await sequelize.query(`
    SELECT 
      t.id as training_id,
      t.name as training_name,
      t.code as training_code,
      t.is_mandatory,
      COUNT(DISTINCT c.employee_id) as certified_employees,
      COUNT(DISTINCT CASE 
        WHEN c.next_due_date >= NOW() THEN c.employee_id 
        ELSE NULL 
      END) as currently_valid
    FROM trainings t
    LEFT JOIN batches b ON t.id = b.training_id
    LEFT JOIN certificates c ON b.id = c.batch_id AND c.workflow_status = 'approved'
    GROUP BY t.id, t.name, t.code, t.is_mandatory
    ORDER BY t.name
  `, { type: 'SELECT' });

  res.json({
    success: true,
    data: { trainings: results },
  });
});

export default {
  getDashboardOverview,
  getComplianceOverview,
  getStatsByDepartment,
  getStatsByTraining,
};
