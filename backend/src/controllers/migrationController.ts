import { Request, Response } from "express";
import {
  Certificate,
  Employee,
  Training,
  WorkflowStatus,
  AttendanceStatus,
} from "../models/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../utils/errors.js";
import { logUserAction } from "../utils/logger.js";
import { Op } from "sequelize";
import { addDays, isValid } from "date-fns";
import fs from "fs";
import path from "path";
import config from "../config/index.js";

const normalizeCertificateNumber = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

/**
 * Upload file for migration (PDF/Image)
 * POST /api/migration/upload
 */
export const uploadMigrationFile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError("File is required");
    }

    const fileUrl = `/uploads/certificates/${req.file.filename}`;

    logUserAction(req.user!.id, "upload_migration_file", "migration", 0, {
      filename: req.file.filename,
    });

    res.status(201).json({
      success: true,
      data: {
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  },
);

/**
 * Delete a previously uploaded migration file
 * DELETE /api/migration/upload/:filename
 */
export const deleteMigrationFile = asyncHandler(
  async (req: Request, res: Response) => {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const validFilenameRegex = /^cert-[0-9a-fA-F-]+\.[A-Za-z0-9]{1,10}$/;

    if (!validFilenameRegex.test(safeFilename) || safeFilename !== filename) {
      throw new ValidationError("Invalid filename");
    }

    const storedFilePath = path.join(
      config.upload.certificatesDir,
      safeFilename,
    );

    if (fs.existsSync(storedFilePath)) {
      fs.unlinkSync(storedFilePath);
      logUserAction(req.user!.id, "delete_migration_file", "migration", 0, {
        filename: safeFilename,
      });
    }

    res.json({ success: true, data: { filename: safeFilename } });
  },
);

/**
 * Check for duplicate certificates before migration
 * POST /api/migration/check-duplicate
 */
export const checkDuplicate = asyncHandler(
  async (req: Request, res: Response) => {
    const { employeeId, trainingId, issueDate, certificateNumber } = req.body;
    const normalizedCertificateNumber =
      normalizeCertificateNumber(certificateNumber);

    // Check by certificate number if provided
    if (normalizedCertificateNumber) {
      const existing = await Certificate.findOne({
        where: { certNumber: { [Op.iLike]: normalizedCertificateNumber } },
      });

      if (existing) {
        return res.json({
          success: true,
          data: {
            isDuplicate: true,
            reason: "Certificate number already exists",
            existingCertificate: existing,
          },
        });
      }
    }

    // Check by employee + training + issue date
    if (employeeId && trainingId && issueDate) {
      const parsedDate = new Date(issueDate);
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

      const existing = await Certificate.findOne({
        where: {
          employeeId,
          trainingId,
          issueDate: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      if (existing) {
        return res.json({
          success: true,
          data: {
            isDuplicate: true,
            reason:
              "Certificate already exists for this employee, training, and date",
            existingCertificate: existing,
          },
        });
      }
    }

    res.json({
      success: true,
      data: { isDuplicate: false },
    });
  },
);

/**
 * Migrate a single legacy certificate
 * POST /api/migration/certificate
 */
export const migrateCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      employeeId,
      trainingId,
      certificateNumber,
      issueDate,
      validFrom,
      validUntil,
      daysAttended,
      sourceFileName,
      certificatePath,
      notes,
    } = req.body;
    const normalizedCertificateNumber =
      normalizeCertificateNumber(certificateNumber);

    logUserAction(
      req.user!.id,
      "migrate_certificate_received",
      "migration",
      0,
      {
        certificatePath,
      },
    );
    // Log incoming certificatePath so production diagnostics can verify the upload path.

    // Validate employee
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new NotFoundError("Employee");
    }

    // Validate training
    const training = await Training.findByPk(trainingId);
    if (!training) {
      throw new NotFoundError("Training");
    }

    // Check for duplicate
    if (normalizedCertificateNumber) {
      const existing = await Certificate.findOne({
        where: { certNumber: { [Op.iLike]: normalizedCertificateNumber } },
      });
      if (existing) {
        throw new ConflictError("Certificate number already exists");
      }
    }

    // Validate dates
    const parsedIssueDate = new Date(issueDate);
    if (!isValid(parsedIssueDate)) {
      throw new ValidationError("Invalid issue date");
    }

    // Calculate validUntil if not provided
    const finalValidFrom = validFrom ? new Date(validFrom) : parsedIssueDate;
    const finalValidUntil = validUntil
      ? new Date(validUntil)
      : addDays(finalValidFrom, training.validityDays);

    // Validate uploaded certificate path if provided and normalize to stored filename.
    // Fix: certificatePath must reference the actual stored file name from uploadMigrationFile,
    // not the original client-supplied URL or original name.
    const storedCertificateFilename = certificatePath
      ? path.basename(certificatePath)
      : null;
    if (storedCertificateFilename) {
      const storedFilePath = path.join(
        config.upload.certificatesDir,
        storedCertificateFilename,
      );
      if (!fs.existsSync(storedFilePath)) {
        throw new ValidationError(
          "Referenced certificate file does not exist on server, please re-upload",
        );
      }
    }

    const certificate = await Certificate.create({
      employeeId,
      trainingId,
      batchId: null as number | null, // No batch for migrated certificates
      workflowStatus: WorkflowStatus.APPROVED, // Migrated = already approved
      attendanceStatus: AttendanceStatus.PRESENT,
      certNumber: normalizedCertificateNumber || null,
      certificatePath: storedCertificateFilename,
      daysAttended: daysAttended || training.durationDays,
      issueDate: parsedIssueDate,
      validFrom: finalValidFrom,
      validUntil: finalValidUntil,
      isMigrated: true,
      migratedAt: new Date(),
      migratedBy: req.user!.id,
      approvalAt: new Date(), // Auto-approved for migration
      approvedBy: req.user!.id,
      createdBy: req.user!.id,
      notes: [notes, sourceFileName].filter(Boolean).join(" | ") || null,
    });

    logUserAction(
      req.user!.id,
      "migrate_certificate",
      "migration",
      certificate.id,
      {
        employeeId,
        trainingId,
        certificateNumber,
      },
    );

    res.status(201).json({
      success: true,
      data: { certificate },
    });
  },
);

/**
 * Bulk migrate certificates
 * POST /api/migration/bulk
 */
export const bulkMigrate = asyncHandler(async (req: Request, res: Response) => {
  const { certificates } = req.body;

  if (!Array.isArray(certificates) || certificates.length === 0) {
    throw new ValidationError("Certificates array is required");
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as { index: number; error: string }[],
  };

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];

    try {
      // Validate employee
      const employee = await Employee.findByPk(cert.employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Validate training
      const training = await Training.findByPk(cert.trainingId);
      if (!training) {
        throw new Error("Training not found");
      }

      // Check duplicate
      const normalizedBulkCertificateNumber = normalizeCertificateNumber(
        cert.certificateNumber,
      );

      if (normalizedBulkCertificateNumber) {
        const existing = await Certificate.findOne({
          where: {
            certNumber: { [Op.iLike]: normalizedBulkCertificateNumber },
          },
        });
        if (existing) {
          throw new Error("Certificate number already exists");
        }
      }

      const parsedIssueDate = new Date(cert.issueDate);
      if (!isValid(parsedIssueDate)) {
        throw new Error("Invalid issue date");
      }

      const finalValidFrom = cert.validFrom
        ? new Date(cert.validFrom)
        : parsedIssueDate;
      const finalValidUntil = cert.validUntil
        ? new Date(cert.validUntil)
        : addDays(finalValidFrom, training.validityDays);

      // Validate uploaded certificate path if provided and normalize to stored filename.
      // Fix: certificatePath for bulk migration must point to the actual stored disk filename.
      const storedCertificateFilename = cert.certificatePath
        ? path.basename(cert.certificatePath)
        : null;
      if (storedCertificateFilename) {
        const storedFilePath = path.join(
          config.upload.certificatesDir,
          storedCertificateFilename,
        );
        if (!fs.existsSync(storedFilePath)) {
          throw new Error(
            "Referenced certificate file does not exist on server, please re-upload",
          );
        }
      }

      await Certificate.create({
        employeeId: cert.employeeId,
        trainingId: cert.trainingId,
        batchId: null as number | null as number | null,
        workflowStatus: WorkflowStatus.APPROVED,
        attendanceStatus: AttendanceStatus.PRESENT,
        certNumber: normalizedBulkCertificateNumber || null,
        certificatePath: storedCertificateFilename,
        daysAttended: cert.daysAttended || training.durationDays,
        issueDate: parsedIssueDate,
        validFrom: finalValidFrom,
        validUntil: finalValidUntil,
        isMigrated: true,
        migratedAt: new Date(),
        migratedBy: req.user!.id,
        approvalAt: new Date(),
        approvedBy: req.user!.id,
        createdBy: req.user!.id,
        notes:
          [cert.notes, cert.sourceFileName].filter(Boolean).join(" | ") || null,
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        index: i,
        error: error.message || "Unknown error",
      });
    }
  }

  logUserAction(req.user!.id, "bulk_migrate", "migration", 0, {
    success: results.success,
    failed: results.failed,
  });

  res.json({
    success: true,
    data: results,
  });
});

/**
 * Get migration stats
 * GET /api/migration/stats
 */
export const getMigrationStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const totalMigrated = await Certificate.count({
      where: { isMigrated: true },
    });

    const byTraining = await Certificate.findAll({
      where: { isMigrated: true },
      include: [
        { model: Training, as: "training", attributes: ["name", "code"] },
      ],
      attributes: [
        "trainingId",
        [
          Certificate.sequelize!.fn(
            "COUNT",
            Certificate.sequelize!.col("Certificate.id"),
          ),
          "count",
        ],
      ],
      group: ["trainingId", "training.id", "training.name", "training.code"],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        totalMigrated,
        byTraining,
      },
    });
  },
);

export default {
  uploadMigrationFile,
  checkDuplicate,
  migrateCertificate,
  bulkMigrate,
  getMigrationStats,
};
