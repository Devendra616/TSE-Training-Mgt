import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { UserRole } from '../models/index.js';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Valid user ID is required')],
  validateRequest,
  getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin
 */
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').notEmpty().trim().withMessage('Full name is required'),
    body('role').isIn(Object.values(UserRole)).withMessage('Valid role is required'),
  ],
  validateRequest,
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Valid user ID is required'),
    body('email').optional().isEmail().normalizeEmail(),
    body('fullName').optional().notEmpty().trim(),
    body('role').optional().isIn(Object.values(UserRole)),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete (deactivate) user
 * @access  Admin
 */
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Valid user ID is required')],
  validateRequest,
  deleteUser
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Admin
 */
router.put(
  '/:id/reset-password',
  [
    param('id').isInt().withMessage('Valid user ID is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  resetUserPassword
);

export default router;
