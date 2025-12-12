import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { UserRole } from '../models/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  All authenticated users
 */
router.get('/', getAllDepartments);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Valid department ID is required')],
  validateRequest,
  getDepartmentById
);

/**
 * @route   POST /api/departments
 * @desc    Create department
 * @access  Admin only
 */
router.post(
  '/',
  authorize(UserRole.ADMIN),
  [body('name').notEmpty().trim().withMessage('Department name is required')],
  validateRequest,
  createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Admin only
 */
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  [
    param('id').isInt().withMessage('Valid department ID is required'),
    body('name').notEmpty().trim().withMessage('Department name is required'),
  ],
  validateRequest,
  updateDepartment
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Admin only
 */
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  [param('id').isInt().withMessage('Valid department ID is required')],
  validateRequest,
  deleteDepartment
);

export default router;
