import { Router } from 'express';
import { param } from 'express-validator';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Authenticated users
 */
router.get('/', getNotifications);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Authenticated users
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Authenticated users
 */
router.put(
  '/:id/read',
  [param('id').isInt().withMessage('Valid notification ID is required')],
  validateRequest,
  markAsRead
);

export default router;
