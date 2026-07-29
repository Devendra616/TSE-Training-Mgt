import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
} from '../controllers/trainingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { UserRole, TrainingType } from '../models/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/trainings
 * @desc    Get all trainings with filters
 * @access  All authenticated users
 */
router.get('/', getAllTrainings);

/**
 * @route   GET /api/trainings/:id
 * @desc    Get training by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Valid training ID is required')],
  validateRequest,
  getTrainingById
);

/**
 * @route   POST /api/trainings
 * @desc    Create training
 * @access  Admin only
 */
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    body('name').notEmpty().trim().withMessage('Training name is required'),
    body('code').notEmpty().trim().withMessage('Training code is required'),
    body('trainingType')
      .isIn(Object.values(TrainingType))
      .withMessage(`Training type must be one of: ${Object.values(TrainingType).join(', ')}`),
    body('validityDays').isInt({ min: 1 }).withMessage('Validity days must be at least 1'),
    body('durationDays').isInt({ min: 1 }).withMessage('Duration days must be at least 1'),
    body('isMandatory').optional().isBoolean(),
  ],
  validateRequest,
  createTraining
);

/**
 * @route   PUT /api/trainings/:id
 * @desc    Update training
 * @access  Admin only
 */
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid training ID is required'),
    body('name').optional().notEmpty().trim(),
    body('code').optional().notEmpty().trim(),
    body('trainingType').optional().isIn(Object.values(TrainingType)),
    body('validityDays').optional().isInt({ min: 1 }),
    body('durationDays').optional().isInt({ min: 1 }),
    body('isMandatory').optional().isBoolean(),
  ],
  validateRequest,
  updateTraining
);

/**
 * @route   DELETE /api/trainings/:id
 * @desc    Delete training
 * @access  Admin only
 */
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [param('id').isInt().withMessage('Valid training ID is required')],
  validateRequest,
  deleteTraining
);

export default router;
