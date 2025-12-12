import { Request, Response } from 'express';
import { Certificate, CertSequence, BatchEmployee, Batch, Training, Employee, Attendance, WorkflowStatus, CompletionStatus } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { logUserAction } from '../utils/logger.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { addDays } from 'date-fns';

/**
 * Get all certificates with filters
 * GET /api/certificates
 */
export const getAllCertificates = asyncHandler(async (req: Request, res: Response) => {
  const { status, trainingId, employeeId } = req.query;

  const where: any = {};
  if (status) where.workflowStatus = status;
  if (trainingId) where.trainingId = trainingId;
  if (employeeId) where.employeeId = employeeId;

  const certificates = await Certificate.findAll({
    where,
    include: [
      { model: Training, as: 'training', attributes: ['id', 'name', 'code', 'trainingType'] },
      { model: Employee, as: 'employee', attributes: ['id', 'sapId', 'fullName', 'designation'] },
      { model: Batch, as: 'batch', attributes: ['id', 'startDate', 'endDate', 'venue'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.json({
    success: true,
    data: { certificates },
  });
});

/**
 * Get certificates pending approval (for Mines Manager)
 * GET /api/certificates/pending
 */
export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  const certificates = await Certificate.findAll({
    where: { workflowStatus: WorkflowStatus.PENDING_APPROVAL },
    include: [
      { model: Training, as: 'training', attributes: ['id', 'name', 'code', 'trainingType'] },
      { model: Employee, as: 'employee', attributes: ['id', 'sapId', 'fullName', 'designation', 'photoUrl'] },
      { model: Batch, as: 'batch', attributes: ['id', 'startDate', 'endDate', 'venue', 'instructorName'] },
    ],
    order: [['createdAt', 'ASC']], // Oldest first for FIFO approval
  });

  res.json({
    success: true,
    data: { certificates },
  });
});

/**
 * Get certificate by ID
 * GET /api/certificates/:id
 */
export const getCertificateById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const certificate = await Certificate.findByPk(id, {
    include: [
      { model: Training, as: 'training' },
      { model: Employee, as: 'employee' },
      { model: Batch, as: 'batch' },
    ],
  });

  if (!certificate) {
    throw new NotFoundError('Certificate');
  }

  res.json({
    success: true,
    data: { certificate },
  });
});

/**
 * Generate draft certificates for a completed batch
 * POST /api/certificates/generate
 */
export const generateCertificates = asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.body;

  // Get batch with training
  const batch = await Batch.findByPk(batchId, {
    include: [{ model: Training, as: 'training' }],
  });

  if (!batch) {
    throw new NotFoundError('Batch');
  }

  const training = (batch as any).training;
  const durationDays = training.durationDays;

  // Get enrolled employees
  const enrollments = await BatchEmployee.findAll({
    where: { batchId },
    include: [{ model: Employee, as: 'employee' }],
  });

  // Get attendance records
  const attendance = await Attendance.findAll({
    where: { batchId },
  });

  // Build attendance map
  const attendanceMap: { [empId: number]: number } = {};
  attendance.forEach(a => {
    if (a.isPresent) {
      attendanceMap[a.employeeId] = (attendanceMap[a.employeeId] || 0) + 1;
    }
  });

  // Generate certificates for employees with full attendance
  const generatedCertificates: any[] = [];
  const skippedEmployees: { id: number; name: string; reason: string }[] = [];

  for (const enrollment of enrollments) {
    const employee = (enrollment as any).employee;
    const daysPresent = attendanceMap[employee.id] || 0;

    // Check if already has certificate for this batch
    const existingCert = await Certificate.findOne({
      where: { batchId, employeeId: employee.id },
    });

    if (existingCert) {
      skippedEmployees.push({
        id: employee.id,
        name: employee.fullName,
        reason: 'Certificate already exists',
      });
      continue;
    }

    // Check attendance completion
    if (daysPresent < durationDays) {
      skippedEmployees.push({
        id: employee.id,
        name: employee.fullName,
        reason: `Incomplete attendance (${daysPresent}/${durationDays} days)`,
      });
      continue;
    }

    // Calculate validity dates
    const issueDate = batch.endDate;
    const validFrom = batch.endDate;
    const validUntil = addDays(new Date(batch.endDate), training.validityDays);

    // Create draft certificate
    const certificate = await Certificate.create({
      employeeId: employee.id,
      trainingId: training.id,
      batchId: batch.id,
      workflowStatus: WorkflowStatus.DRAFT,
      attendanceStatus: CompletionStatus.COMPLETE,
      daysAttended: daysPresent,
      issueDate,
      validFrom,
      validUntil,
      createdBy: req.user!.id,
    });

    generatedCertificates.push(certificate);
  }

  logUserAction(req.user!.id, 'generate_certificates', 'batches', batchId, {
    generated: generatedCertificates.length,
    skipped: skippedEmployees.length,
  });

  res.status(201).json({
    success: true,
    data: {
      generated: generatedCertificates.length,
      skipped: skippedEmployees,
    },
  });
});

/**
 * Submit certificate for approval
 * PUT /api/certificates/:id/submit
 */
export const submitForApproval = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const certificate = await Certificate.findByPk(id);
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }

  if (certificate.workflowStatus !== WorkflowStatus.DRAFT) {
    throw new ValidationError('Only draft certificates can be submitted for approval');
  }

  await certificate.update({
    workflowStatus: WorkflowStatus.PENDING_APPROVAL,
    submittedAt: new Date(),
    submittedBy: req.user!.id,
  });

  logUserAction(req.user!.id, 'submit_for_approval', 'certificates', certificate.id);

  res.json({
    success: true,
    data: { certificate },
  });
});

/**
 * Bulk submit certificates for approval
 * POST /api/certificates/submit-bulk
 */
export const bulkSubmitForApproval = asyncHandler(async (req: Request, res: Response) => {
  const { certificateIds } = req.body;

  if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw new ValidationError('Certificate IDs array is required');
  }

  const result = await Certificate.update(
    {
      workflowStatus: WorkflowStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
      submittedBy: req.user!.id,
    },
    {
      where: {
        id: { [Op.in]: certificateIds },
        workflowStatus: WorkflowStatus.DRAFT,
      },
    }
  );

  logUserAction(req.user!.id, 'bulk_submit_for_approval', 'certificates', 0, { count: result[0] });

  res.json({
    success: true,
    data: { submitted: result[0] },
  });
});

/**
 * Approve certificate (Mines Manager)
 * PUT /api/certificates/:id/approve
 */
export const approveCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const certificate = await Certificate.findByPk(id, {
    include: [{ model: Training, as: 'training' }],
  });

  if (!certificate) {
    throw new NotFoundError('Certificate');
  }

  if (certificate.workflowStatus !== WorkflowStatus.PENDING_APPROVAL) {
    throw new ValidationError('Only pending certificates can be approved');
  }

  // Generate certificate number
  const training = (certificate as any).training;
  const year = new Date().getFullYear();
  const certNumber = await CertSequence.getNextCertificateNumber(training.trainingType, year);

  await certificate.update({
    workflowStatus: WorkflowStatus.APPROVED,
    certificateNumber: certNumber,
    approvedAt: new Date(),
    approvedBy: req.user!.id,
  });

  logUserAction(req.user!.id, 'approve_certificate', 'certificates', certificate.id, { certNumber });

  res.json({
    success: true,
    data: { certificate },
  });
});

/**
 * Bulk approve certificates
 * POST /api/certificates/approve-bulk
 */
export const bulkApprove = asyncHandler(async (req: Request, res: Response) => {
  const { certificateIds } = req.body;

  if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw new ValidationError('Certificate IDs array is required');
  }

  const certificates = await Certificate.findAll({
    where: {
      id: { [Op.in]: certificateIds },
      workflowStatus: WorkflowStatus.PENDING_APPROVAL,
    },
    include: [{ model: Training, as: 'training' }],
  });

  const year = new Date().getFullYear();
  const approved: any[] = [];

  for (const cert of certificates) {
    const training = (cert as any).training;
    const certNumber = await CertSequence.getNextCertificateNumber(training.trainingType, year);

    await cert.update({
      workflowStatus: WorkflowStatus.APPROVED,
      certificateNumber: certNumber,
      approvedAt: new Date(),
      approvedBy: req.user!.id,
    });

    approved.push({ id: cert.id, certificateNumber: certNumber });
  }

  logUserAction(req.user!.id, 'bulk_approve', 'certificates', 0, { count: approved.length });

  res.json({
    success: true,
    data: { approved },
  });
});

/**
 * Reject certificate
 * PUT /api/certificates/:id/reject
 */
export const rejectCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    throw new ValidationError('Rejection reason is required');
  }

  const certificate = await Certificate.findByPk(id);
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }

  if (certificate.workflowStatus !== WorkflowStatus.PENDING_APPROVAL) {
    throw new ValidationError('Only pending certificates can be rejected');
  }

  await certificate.update({
    workflowStatus: WorkflowStatus.REJECTED,
    rejectedAt: new Date(),
    rejectedBy: req.user!.id,
    rejectionReason: reason.trim(),
  });

  logUserAction(req.user!.id, 'reject_certificate', 'certificates', certificate.id, { reason });

  res.json({
    success: true,
    data: { certificate },
  });
});

/**
 * Resubmit rejected certificate
 * PUT /api/certificates/:id/resubmit
 */
export const resubmitCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const certificate = await Certificate.findByPk(id);
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }

  if (certificate.workflowStatus !== WorkflowStatus.REJECTED) {
    throw new ValidationError('Only rejected certificates can be resubmitted');
  }

  await certificate.update({
    workflowStatus: WorkflowStatus.PENDING_APPROVAL,
    submittedAt: new Date(),
    submittedBy: req.user!.id,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
  });

  logUserAction(req.user!.id, 'resubmit_certificate', 'certificates', certificate.id);

  res.json({
    success: true,
    data: { certificate },
  });
});

/**
 * Get employee training history
 * GET /api/certificates/employee/:employeeId
 */
export const getEmployeeHistory = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.params;

  const certificates = await Certificate.findAll({
    where: {
      employeeId,
      workflowStatus: WorkflowStatus.APPROVED,
    },
    include: [
      { model: Training, as: 'training' },
      { model: Batch, as: 'batch' },
    ],
    order: [['validUntil', 'DESC']],
  });

  res.json({
    success: true,
    data: { certificates },
  });
});

export default {
  getAllCertificates,
  getPendingApprovals,
  getCertificateById,
  generateCertificates,
  submitForApproval,
  bulkSubmitForApproval,
  approveCertificate,
  bulkApprove,
  rejectCertificate,
  resubmitCertificate,
  getEmployeeHistory,
};
