import { Router } from 'express';
import { body, param } from 'express-validator';
import {
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
} from '../controllers/certificateController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { UserRole } from '../models/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates
 * @access  All authenticated users
 */
router.get('/', getAllCertificates);

/**
 * @route   GET /api/certificates/pending
 * @desc    Get certificates pending approval
 * @access  Mines Manager
 */
router.get(
  '/pending',
  authorize(UserRole.MINES_MANAGER, UserRole.ADMIN),
  getPendingApprovals
);

/**
 * @route   GET /api/certificates/employee/:employeeId
 * @desc    Get employee training history
 * @access  All authenticated users
 */
router.get(
  '/employee/:employeeId',
  [param('employeeId').isInt().withMessage('Valid employee ID is required')],
  validateRequest,
  getEmployeeHistory
);

/**
 * @route   GET /api/certificates/:id
 * @desc    Get certificate by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Valid certificate ID is required')],
  validateRequest,
  getCertificateById
);

/**
 * @route   POST /api/certificates/generate
 * @desc    Generate draft certificates for a batch
 * @access  Admin, Training Officer
 */
router.post(
  '/generate',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [body('batchId').isInt().withMessage('Valid batch ID is required')],
  validateRequest,
  generateCertificates
);

/**
 * @route   PUT /api/certificates/:id/submit
 * @desc    Submit certificate for approval
 * @access  Admin, Training Officer
 */
router.put(
  '/:id/submit',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [param('id').isInt().withMessage('Valid certificate ID is required')],
  validateRequest,
  submitForApproval
);

/**
 * @route   POST /api/certificates/submit-bulk
 * @desc    Bulk submit certificates for approval
 * @access  Admin, Training Officer
 */
router.post(
  '/submit-bulk',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [body('certificateIds').isArray({ min: 1 }).withMessage('Certificate IDs array is required')],
  validateRequest,
  bulkSubmitForApproval
);

/**
 * @route   PUT /api/certificates/:id/approve
 * @desc    Approve certificate
 * @access  Mines Manager only
 */
router.put(
  '/:id/approve',
  authorize(UserRole.MINES_MANAGER),
  [param('id').isInt().withMessage('Valid certificate ID is required')],
  validateRequest,
  approveCertificate
);

/**
 * @route   POST /api/certificates/approve-bulk
 * @desc    Bulk approve certificates
 * @access  Mines Manager only
 */
router.post(
  '/approve-bulk',
  authorize(UserRole.MINES_MANAGER),
  [body('certificateIds').isArray({ min: 1 }).withMessage('Certificate IDs array is required')],
  validateRequest,
  bulkApprove
);

/**
 * @route   PUT /api/certificates/:id/reject
 * @desc    Reject certificate
 * @access  Mines Manager only
 */
router.put(
  '/:id/reject',
  authorize(UserRole.MINES_MANAGER),
  [
    param('id').isInt().withMessage('Valid certificate ID is required'),
    body('reason').notEmpty().trim().withMessage('Rejection reason is required'),
  ],
  validateRequest,
  rejectCertificate
);

/**
 * @route   PUT /api/certificates/:id/resubmit
 * @desc    Resubmit rejected certificate
 * @access  Admin, Training Officer
 */
router.put(
  '/:id/resubmit',
  authorize(UserRole.ADMIN, UserRole.TRAINING_OFFICER),
  [param('id').isInt().withMessage('Valid certificate ID is required')],
  validateRequest,
  resubmitCertificate
);

export default router;
