import { Certificate, Employee, Training, Batch, WorkflowStatus } from '../models/index.js';
import { config } from '../config/index.js';
import { differenceInDays, addDays } from 'date-fns';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export type ComplianceStatus = 'compliant' | 'due_soon' | 'overdue' | 'never_trained';

export interface EmployeeCompliance {
  employee: {
    id: number;
    sapId: string;
    fullName: string;
    designation: string;
    photoUrl: string | null;
    departmentName: string;
  };
  trainings: {
    trainingId: number;
    trainingName: string;
    trainingCode: string;
    isMandatory: boolean;
    status: ComplianceStatus;
    validUntil: Date | null;
    daysRemaining: number | null;
    lastCertificateId: number | null;
  }[];
  overallStatus: ComplianceStatus;
}

export interface ComplianceStats {
  total: number;
  compliant: number;
  dueSoon: number;
  overdue: number;
  neverTrained: number;
}

/**
 * Calculate compliance status based on validity date
 */
export function calculateComplianceStatus(validUntil: Date | null): { status: ComplianceStatus; daysRemaining: number | null } {
  if (!validUntil) {
    return { status: 'never_trained', daysRemaining: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysRemaining = differenceInDays(validUntil, today);
  const warningDays = config.compliance.warningDays;

  if (daysRemaining < 0) {
    return { status: 'overdue', daysRemaining };
  } else if (daysRemaining <= warningDays) {
    return { status: 'due_soon', daysRemaining };
  } else {
    return { status: 'compliant', daysRemaining };
  }
}

/**
 * Get compliance data for a single employee
 */
export async function getEmployeeCompliance(employeeId: number): Promise<EmployeeCompliance | null> {
  const employee = await Employee.findByPk(employeeId, {
    include: ['department'],
  });

  if (!employee) {
    return null;
  }

  // Get all mandatory trainings
  const mandatoryTrainings = await Training.findAll({
    where: { isMandatory: true, isActive: true },
  });

  // Get latest certificates for this employee (through batches)
  const certificates = await Certificate.findAll({
    where: {
      employeeId,
      workflowStatus: WorkflowStatus.APPROVED,
    },
    include: [
      {
        model: Batch,
        as: 'batch',
        include: [{ model: Training, as: 'training' }],
      },
    ],
    order: [['nextDueDate', 'DESC']],
  });

  // Build training compliance map
  const trainings = mandatoryTrainings.map((training) => {
    // Find latest certificate for this training
    const cert = certificates.find((c: any) => c.batch?.trainingId === training.id);
    const validUntil = cert?.nextDueDate || null;
    const { status, daysRemaining } = calculateComplianceStatus(validUntil);

    return {
      trainingId: training.id,
      trainingName: training.name,
      trainingCode: training.code,
      isMandatory: training.isMandatory,
      status,
      validUntil,
      daysRemaining,
      lastCertificateId: cert?.id || null,
    };
  });

  // Determine overall status
  let overallStatus: ComplianceStatus = 'compliant';
  if (trainings.some((t) => t.status === 'overdue')) {
    overallStatus = 'overdue';
  } else if (trainings.some((t) => t.status === 'never_trained')) {
    overallStatus = 'never_trained';
  } else if (trainings.some((t) => t.status === 'due_soon')) {
    overallStatus = 'due_soon';
  }

  return {
    employee: {
      id: employee.id,
      sapId: employee.sapId,
      fullName: employee.fullName,
      designation: employee.designation,
      photoUrl: employee.photoUrl,
      departmentName: (employee as any).department?.name || '',
    },
    trainings,
    overallStatus,
  };
}

/**
 * Get compliance overview stats
 */
export async function getComplianceStats(): Promise<ComplianceStats> {
  // Get total active employees
  const totalEmployees = await Employee.count({
    where: { status: 'active' },
  });

  // Count employees with at least one approved certificate
  const employeesWithCerts = await Certificate.findAll({
    where: { workflowStatus: WorkflowStatus.APPROVED },
    attributes: ['employeeId'],
    group: ['employeeId'],
    raw: true,
  }) as any[];

  const employeeIdsWithCerts = new Set(employeesWithCerts.map((e: any) => e.employeeId));

  // Get employees with overdue certificates (join through batches)
  const overdueQuery = await sequelize.query(`
    SELECT DISTINCT c.employee_id
    FROM certificates c
    INNER JOIN batches b ON c.batch_id = b.id
    INNER JOIN trainings t ON b.training_id = t.id
    WHERE c.workflow_status = 'approved'
    AND t.is_mandatory = true
    AND c.next_due_date < NOW()
    AND c.next_due_date = (
      SELECT MAX(c2.next_due_date)
      FROM certificates c2
      INNER JOIN batches b2 ON c2.batch_id = b2.id
      WHERE c2.employee_id = c.employee_id
      AND b2.training_id = b.training_id
      AND c2.workflow_status = 'approved'
    )
  `, { type: 'SELECT' }) as any[];

  // Get employees with due soon (within warning days)
  const dueSoonQuery = await sequelize.query(`
    SELECT DISTINCT c.employee_id
    FROM certificates c
    INNER JOIN batches b ON c.batch_id = b.id
    INNER JOIN trainings t ON b.training_id = t.id
    WHERE c.workflow_status = 'approved'
    AND t.is_mandatory = true
    AND c.next_due_date >= NOW()
    AND c.next_due_date <= NOW() + INTERVAL '${config.compliance.warningDays} days'
    AND c.next_due_date = (
      SELECT MAX(c2.next_due_date)
      FROM certificates c2
      INNER JOIN batches b2 ON c2.batch_id = b2.id
      WHERE c2.employee_id = c.employee_id
      AND b2.training_id = b.training_id
      AND c2.workflow_status = 'approved'
    )
    AND c.employee_id NOT IN (${overdueQuery.length > 0 ? overdueQuery.map((r: any) => r.employee_id).join(',') : '0'})
  `, { type: 'SELECT' }) as any[];

  const overdue = overdueQuery.length;
  const dueSoon = dueSoonQuery.length;
  const neverTrained = totalEmployees - employeeIdsWithCerts.size;
  const compliant = totalEmployees - overdue - dueSoon - neverTrained;

  return {
    total: totalEmployees,
    compliant: Math.max(0, compliant),
    dueSoon,
    overdue,
    neverTrained,
  };
}

/**
 * Get employees with upcoming due dates
 */
export async function getUpcomingDueDates(limit: number = 10): Promise<any[]> {
  const today = new Date();
  const futureDate = addDays(today, 60); // Next 60 days

  const results = await Certificate.findAll({
    where: {
      workflowStatus: WorkflowStatus.APPROVED,
      nextDueDate: {
        [Op.gte]: today,
        [Op.lte]: futureDate,
      },
    },
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'sapId', 'fullName', 'designation'] },
      {
        model: Batch,
        as: 'batch',
        include: [{ model: Training, as: 'training', attributes: ['id', 'name', 'code'] }],
      },
    ],
    order: [['nextDueDate', 'ASC']],
    limit,
  });

  return results.map((cert: any) => {
    const { status, daysRemaining } = calculateComplianceStatus(new Date(cert.nextDueDate));
    return {
      id: cert.id,
      employee: cert.employee,
      training: cert.batch?.training,
      nextDueDate: cert.nextDueDate,
      complianceStatus: status,
      daysRemaining,
    };
  });
}

/**
 * Get overdue employees
 */
export async function getOverdueEmployees(): Promise<any[]> {
  const results = await sequelize.query(`
    SELECT 
      e.id as employee_id,
      e.sap_id,
      e.full_name,
      e.designation,
      t.id as training_id,
      t.name as training_name,
      t.code as training_code,
      c.next_due_date,
      EXTRACT(DAY FROM NOW() - c.next_due_date) as days_overdue
    FROM employees e
    INNER JOIN certificates c ON e.id = c.employee_id
    INNER JOIN batches b ON c.batch_id = b.id
    INNER JOIN trainings t ON b.training_id = t.id
    WHERE c.workflow_status = 'approved'
    AND t.is_mandatory = true
    AND c.next_due_date < NOW()
    AND c.next_due_date = (
      SELECT MAX(c2.next_due_date)
      FROM certificates c2
      INNER JOIN batches b2 ON c2.batch_id = b2.id
      WHERE c2.employee_id = c.employee_id
      AND b2.training_id = b.training_id
      AND c2.workflow_status = 'approved'
    )
    ORDER BY c.next_due_date ASC
    LIMIT 20
  `, { type: 'SELECT' });

  return results as any[];
}

export default {
  calculateComplianceStatus,
  getEmployeeCompliance,
  getComplianceStats,
  getUpcomingDueDates,
  getOverdueEmployees,
};
