import { Router } from 'express';
import {
  getDashboardOverview,
  getComplianceOverview,
  getStatsByDepartment,
  getStatsByTraining,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard overview
 * @access  All authenticated users
 */
router.get('/', getDashboardOverview);

/**
 * @route   GET /api/dashboard/compliance
 * @desc    Get compliance details
 * @access  All authenticated users
 */
router.get('/compliance', getComplianceOverview);

/**
 * @route   GET /api/dashboard/by-department
 * @desc    Get stats by department
 * @access  All authenticated users
 */
router.get('/by-department', getStatsByDepartment);

/**
 * @route   GET /api/dashboard/by-training
 * @desc    Get stats by training
 * @access  All authenticated users
 */
router.get('/by-training', getStatsByTraining);

export default router;
