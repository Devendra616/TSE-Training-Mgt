import { Request, Response } from 'express';
import { Notification, User, NotificationType } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError } from '../utils/errors.js';
import { Op } from 'sequelize';

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { unreadOnly, limit = 20 } = req.query;

  const where: any = { userId };
  if (unreadOnly === 'true') {
    where.isRead = false;
  }

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
  });

  const unreadCount = await Notification.count({
    where: { userId, isRead: false },
  });

  res.json({
    success: true,
    data: { notifications, unreadCount },
  });
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const notification = await Notification.findOne({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  await notification.update({ isRead: true, readAt: new Date() });

  res.json({
    success: true,
    data: { notification },
  });
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * Create notification (internal use)
 */
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: number
): Promise<Notification> {
  return Notification.create({
    userId,
    type,
    title,
    message,
    relatedType,
    relatedId,
  });
}

/**
 * Send notification to multiple users
 */
export async function broadcastNotification(
  userIds: number[],
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: number
): Promise<void> {
  await Notification.bulkCreate(
    userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      relatedType,
      relatedId,
    }))
  );
}

/**
 * Notify all users with a specific role
 */
export async function notifyRole(
  role: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: number
): Promise<void> {
  const users = await User.findAll({
    where: { role, isActive: true },
    attributes: ['id'],
  });

  const userIds = users.map((u) => u.id);
  if (userIds.length > 0) {
    await broadcastNotification(userIds, type, title, message, relatedType, relatedId);
  }
}

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  broadcastNotification,
  notifyRole,
};
