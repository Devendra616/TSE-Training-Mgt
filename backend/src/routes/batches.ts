import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  enrollEmployees,
  removeEmployee,
  getBatchAttendance,
  markAttendance,
  bulkMarkAttendance,
  cloneBatch,
} from '../controllers/batchController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { UserRole, BatchStatus } from '../models/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/batches
 * @desc    Get all batches with filters
 * @access  All authenticated users
 */
router.get('/', getAllBatches);

/**
 * @route   GET /api/batches/:id
 * @desc    Get batch by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Valid batch ID is required')],
  validateRequest,
  getBatchById
);

/**
 * @route   POST /api/batches
 * @desc    Create batch
 * @access  Admin, Training Officer
 */
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    body('trainingId').isInt().withMessage('Valid training ID is required'),
    body('startDate').isDate().withMessage('Valid start date is required'),
    body('endDate').isDate().withMessage('Valid end date is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('venue').notEmpty().trim().withMessage('Venue is required'),
    body('instructorName').notEmpty().trim().withMessage('Instructor name is required'),
  ],
  validateRequest,
  createBatch
);

/**
 * @route   PUT /api/batches/:id
 * @desc    Update batch
 * @access  Admin, Training Officer
 */
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid batch ID is required'),
    body('startDate').optional().isDate(),
    body('endDate').optional().isDate(),
    body('capacity').optional().isInt({ min: 1 }),
    body('status').optional().isIn(Object.values(BatchStatus)),
  ],
  validateRequest,
  updateBatch
);

/**
 * @route   DELETE /api/batches/:id
 * @desc    Delete batch
 * @access  Admin only
 */
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [param('id').isInt().withMessage('Valid batch ID is required')],
  validateRequest,
  deleteBatch
);

/**
 * @route   POST /api/batches/:id/clone
 * @desc    Clone a batch
 * @access  Admin, Training Officer
 */
router.post(
  '/:id/clone',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid batch ID is required'),
    body('startDate').optional().isDate(),
    body('endDate').optional().isDate(),
  ],
  validateRequest,
  cloneBatch
);

/**
 * @route   POST /api/batches/:id/enroll
 * @desc    Enroll employees in batch
 * @access  Admin, Training Officer
 */
router.post(
  '/:id/enroll',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid batch ID is required'),
    body('employeeIds').isArray({ min: 1 }).withMessage('Employee IDs array is required'),
  ],
  validateRequest,
  enrollEmployees
);

/**
 * @route   DELETE /api/batches/:id/enroll/:employeeId
 * @desc    Remove employee from batch
 * @access  Admin, Training Officer
 */
router.delete(
  '/:id/enroll/:employeeId',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid batch ID is required'),
    param('employeeId').isInt().withMessage('Valid employee ID is required'),
  ],
  validateRequest,
  removeEmployee
);

/**
 * @route   GET /api/batches/:id/attendance
 * @desc    Get batch attendance
 * @access  All authenticated users
 */
router.get(
  '/:id/attendance',
  [param('id').isInt().withMessage('Valid batch ID is required')],
  validateRequest,
  getBatchAttendance
);

/**
 * @route   POST /api/batches/:id/attendance
 * @desc    Mark single attendance
 * @access  Admin, Training Officer
 */
router.post(
  '/:id/attendance',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid batch ID is required'),
    body('employeeId').isInt().withMessage('Valid employee ID is required'),
    body('dayNumber').isInt({ min: 1 }).withMessage('Valid day number is required'),
    body('isPresent').isBoolean().withMessage('isPresent must be boolean'),
  ],
  validateRequest,
  markAttendance
);

/**
 * @route   POST /api/batches/:id/attendance/bulk
 * @desc    Bulk mark attendance
 * @access  Admin, Training Officer
 */
router.post(
  '/:id/attendance/bulk',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid batch ID is required'),
    body('dayNumber').isInt({ min: 1 }).withMessage('Valid day number is required'),
    body('records').isArray({ min: 1 }).withMessage('Records array is required'),
  ],
  validateRequest,
  bulkMarkAttendance
);

export default router;
