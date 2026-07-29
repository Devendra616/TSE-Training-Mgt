import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllEmployees,
  getEmployeeById,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { uploadPhoto } from '../middleware/upload.js';
import { UserRole, Employee } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError } from '../utils/errors.js';
import { logUserAction } from '../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/employees/search
 * @desc    Search employees (for autocomplete)
 * @access  All authenticated users
 */
router.get('/search', searchEmployees);

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filters
 * @access  All authenticated users
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  getAllEmployees
);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Valid employee ID is required')],
  validateRequest,
  getEmployeeById
);

/**
 * @route   POST /api/employees
 * @desc    Create employee
 * @access  Admin, Training Officer
 */
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    body('sapId').notEmpty().trim().withMessage('SAP ID is required'),
    body('fullName').notEmpty().trim().withMessage('Full name is required'),
    body('designation').notEmpty().trim().withMessage('Designation is required'),
    body('departmentId').isInt().withMessage('Valid department ID is required'),
  ],
  validateRequest,
  createEmployee
);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Admin, Training Officer
 */
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [
    param('id').isInt().withMessage('Valid employee ID is required'),
    body('sapId').optional().notEmpty().trim(),
    body('fullName').optional().notEmpty().trim(),
    body('designation').optional().notEmpty().trim(),
    body('departmentId').optional().isInt(),
  ],
  validateRequest,
  updateEmployee
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete (deactivate) employee
 * @access  Admin only
 */
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [param('id').isInt().withMessage('Valid employee ID is required')],
  validateRequest,
  deleteEmployee
);

/**
 * @route   POST /api/employees/:id/photo
 * @desc    Upload employee photo
 * @access  Admin, Training Officer
 */
router.post(
  '/:id/photo',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [param('id').isInt().withMessage('Valid employee ID is required')],
  validateRequest,
  (req: Request, res: Response, next: NextFunction) => {
    uploadPhoto(req, res, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new NotFoundError('Employee');
    }

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;
    await employee.update({ photoUrl });

    logUserAction(req.user!.id, 'photo_upload', 'employees', employee.id);

    res.json({
      success: true,
      data: { photoUrl },
    });
  })
);

export default router;
