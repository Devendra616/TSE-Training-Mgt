import { Request, Response } from "express";
import {
  Certificate,
  Employee,
  Training,
  Batch,
  Department,
  WorkflowStatus,
} from "../models/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { NotFoundError } from "../utils/errors.js";
import { getEmployeeCompliance } from "../services/complianceService.js";
import { format } from "date-fns";
import { Op } from "sequelize";

/**
 * Get employee training history
 * GET /api/reports/employee/:employeeId
 */
export const getEmployeeReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    const employee = await Employee.findByPk(employeeId, {
      include: ["department"],
    });

    if (!employee) {
      throw new NotFoundError("Employee");
    }

    // Get all certificates
    const certificates = await Certificate.findAll({
      where: { employeeId },
      include: [
        { model: Training, as: "training" },
        { model: Batch, as: "batch" },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get compliance status
    const compliance = await getEmployeeCompliance(Number(employeeId));

    res.json({
      success: true,
      data: {
        employee: {
          ...employee.toJSON(),
          department: (employee as any).department,
        },
        certificates,
        compliance: compliance?.trainings || [],
      },
    });
  },
);

/**
 * Get batch report
 * GET /api/reports/batch/:batchId
 */
export const getBatchReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const batch = await Batch.findByPk(batchId, {
      include: [
        { model: Training, as: "training" },
        {
          model: Employee,
          as: "employees",
          through: { attributes: ["enrollmentStatus", "enrolledAt"] },
        },
      ],
    });

    if (!batch) {
      throw new NotFoundError("Batch");
    }

    // Get certificates for this batch
    const certificates = await Certificate.findAll({
      where: { batchId },
      include: [{ model: Employee, as: "employee" }],
    });

    // Stats
    const enrolledCount = (batch as any).employees?.length || 0;
    const certifiedCount = certificates.filter(
      (c) => c.workflowStatus === WorkflowStatus.APPROVED,
    ).length;
    const pendingCount = certificates.filter(
      (c) => c.workflowStatus === WorkflowStatus.PENDING_APPROVAL,
    ).length;

    res.json({
      success: true,
      data: {
        batch,
        stats: {
          enrolled: enrolledCount,
          certified: certifiedCount,
          pending: pendingCount,
          completion:
            enrolledCount > 0
              ? Math.round((certifiedCount / enrolledCount) * 100)
              : 0,
        },
        certificates,
      },
    });
  },
);

/**
 * Get training summary report
 * GET /api/reports/training/:trainingId
 */
export const getTrainingReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { trainingId } = req.params;

    const training = await Training.findByPk(trainingId);
    if (!training) {
      throw new NotFoundError("Training");
    }

    // Get all batches for this training
    const batches = await Batch.findAll({
      where: { trainingId },
      order: [["startDate", "DESC"]],
    });

    // Get all certificates
    const certificates = await Certificate.findAll({
      where: { trainingId, workflowStatus: WorkflowStatus.APPROVED },
      include: [{ model: Employee, as: "employee" }],
    });

    // Stats
    const totalBatches = batches.length;
    const totalCertified = certificates.length;
    const currentlyValid = certificates.filter(
      (c) => c.validUntil && new Date(c.validUntil) >= new Date(),
    ).length;

    res.json({
      success: true,
      data: {
        training,
        stats: {
          totalBatches,
          totalCertified,
          currentlyValid,
        },
        batches,
        recentCertificates: certificates.slice(0, 20),
      },
    });
  },
);

/**
 * Get department compliance report
 * GET /api/reports/department/:departmentId
 */
export const getDepartmentReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { departmentId } = req.params;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new NotFoundError("Department");
    }

    // Get employees in department
    const employees = await Employee.findAll({
      where: { departmentId, status: "active" },
    });

    // Get compliance for each employee
    const complianceData = await Promise.all(
      employees.map((emp) => getEmployeeCompliance(emp.id)),
    );

    const compliantCount = complianceData.filter(
      (c) => c?.overallStatus === "compliant",
    ).length;
    const dueSoonCount = complianceData.filter(
      (c) => c?.overallStatus === "due_soon",
    ).length;
    const overdueCount = complianceData.filter(
      (c) => c?.overallStatus === "overdue",
    ).length;

    res.json({
      success: true,
      data: {
        department,
        stats: {
          totalEmployees: employees.length,
          compliant: compliantCount,
          dueSoon: dueSoonCount,
          overdue: overdueCount,
          complianceRate:
            employees.length > 0
              ? Math.round((compliantCount / employees.length) * 100)
              : 0,
        },
        employees: complianceData.filter(Boolean),
      },
    });
  },
);

/**
 * Export certificates to CSV
 * GET /api/reports/export/certificates
 */
export const exportCertificates = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, trainingId, from, to } = req.query;

    const where: any = {};
    if (status) where.workflowStatus = status;
    if (trainingId) where.trainingId = trainingId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = from;
      if (to) where.createdAt[Op.lte] = to;
    }

    const certificates = await Certificate.findAll({
      where,
      include: [
        { model: Employee, as: "employee" },
        { model: Training, as: "training" },
        { model: Batch, as: "batch" },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Build CSV
    const headers = [
      "Certificate Number",
      "Employee Name",
      "SAP ID",
      "Training",
      "Training Code",
      "Issue Date",
      "Valid From",
      "Valid Until",
      "Status",
    ];

    const rows = certificates.map((cert) => [
      (cert as any).certificateNumber || "Pending",
      (cert as any).employee?.fullName || "",
      (cert as any).employee?.sapId || "",
      (cert as any).training?.name || "",
      (cert as any).training?.code || "",
      cert.issueDate ? format(new Date(cert.issueDate), "yyyy-MM-dd") : "N/A",
      cert.validFrom ? format(new Date(cert.validFrom), "yyyy-MM-dd") : "N/A",
      cert.validUntil ? format(new Date(cert.validUntil), "yyyy-MM-dd") : "N/A",
      cert.workflowStatus,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=certificates.csv",
    );
    res.send(csv);
  },
);

export default {
  getEmployeeReport,
  getBatchReport,
  getTrainingReport,
  getDepartmentReport,
  exportCertificates,
};
