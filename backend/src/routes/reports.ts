import { Router } from 'express';
import { param } from 'express-validator';
import {
  getEmployeeReport,
  getBatchReport,
  getTrainingReport,
  getDepartmentReport,
  exportCertificates,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/reports/employee/:employeeId
 * @desc    Get employee training history report
 * @access  Authenticated users
 */
router.get(
  '/employee/:employeeId',
  [param('employeeId').isInt().withMessage('Valid employee ID is required')],
  validateRequest,
  getEmployeeReport
);

/**
 * @route   GET /api/reports/batch/:batchId
 * @desc    Get batch report
 * @access  Authenticated users
 */
router.get(
  '/batch/:batchId',
  [param('batchId').isInt().withMessage('Valid batch ID is required')],
  validateRequest,
  getBatchReport
);

/**
 * @route   GET /api/reports/training/:trainingId
 * @desc    Get training summary report
 * @access  Authenticated users
 */
router.get(
  '/training/:trainingId',
  [param('trainingId').isInt().withMessage('Valid training ID is required')],
  validateRequest,
  getTrainingReport
);

/**
 * @route   GET /api/reports/department/:departmentId
 * @desc    Get department compliance report
 * @access  Authenticated users
 */
router.get(
  '/department/:departmentId',
  [param('departmentId').isInt().withMessage('Valid department ID is required')],
  validateRequest,
  getDepartmentReport
);

/**
 * @route   GET /api/reports/export/certificates
 * @desc    Export certificates to CSV
 * @access  Authenticated users
 */
router.get('/export/certificates', exportCertificates);

export default router;
