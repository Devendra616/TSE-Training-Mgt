import { Router } from "express";
import { body } from "express-validator";
import {
  uploadMigrationFile,
  checkDuplicate,
  migrateCertificate,
  bulkMigrate,
  getMigrationStats,
} from "../controllers/migrationController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { UserRole } from "../models/index.js";
import { uploadMigrationDocument } from "../middleware/upload.js";

const router = Router();

// All routes require authentication and Admin/Training Officer role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER));

/**
 * @route   POST /api/migration/upload
 * @desc    Upload file for migration
 * @access  Admin, Training Officer
 */
router.post("/upload", uploadMigrationDocument, uploadMigrationFile);

/**
 * @route   POST /api/migration/check-duplicate
 * @desc    Check for duplicate certificates
 * @access  Admin, Training Officer
 */
router.post(
  "/check-duplicate",
  [
    body("employeeId").optional().isInt(),
    body("trainingId").optional().isInt(),
    body("issueDate").optional().isString(),
    body("certificateNumber").optional().isString(),
  ],
  validateRequest,
  checkDuplicate,
);

/**
 * @route   POST /api/migration/certificate
 * @desc    Migrate a single certificate
 * @access  Admin, Training Officer
 */
router.post(
  "/certificate",
  [
    body("employeeId").isInt().withMessage("Valid employee ID is required"),
    body("trainingId").isInt().withMessage("Valid training ID is required"),
    body("issueDate").notEmpty().withMessage("Issue date is required"),
    body("certificateNumber").optional().isString(),
    body("validFrom").optional().isString(),
    body("validUntil").optional().isString(),
    body("daysAttended").optional().isInt({ min: 1 }),
  ],
  validateRequest,
  migrateCertificate,
);

/**
 * @route   POST /api/migration/bulk
 * @desc    Bulk migrate certificates
 * @access  Admin, Training Officer
 */
router.post(
  "/bulk",
  [
    body("certificates")
      .isArray({ min: 1 })
      .withMessage("Certificates array is required"),
  ],
  validateRequest,
  bulkMigrate,
);

/**
 * @route   GET /api/migration/stats
 * @desc    Get migration statistics
 * @access  Admin, Training Officer
 */
router.get("/stats", getMigrationStats);

export default router;
