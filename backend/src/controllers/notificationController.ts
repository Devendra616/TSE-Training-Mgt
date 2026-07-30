import { Request, Response } from "express";
import { Notification, User, NotificationType } from "../models/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { NotFoundError } from "../utils/errors.js";

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { unreadOnly, limit = 20 } = req.query;

    const where: any = { userId };
    if (unreadOnly === "true") {
      where.isRead = false;
    }

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
    });

    const unreadCount = await Notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: { notifications, unreadCount },
    });
  },
);

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
    throw new NotFoundError("Notification");
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
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  },
);

/**
 * Helper to generate link from related entity
 */
function generateLink(type?: string, id?: number): string | null {
  if (!type || !id) return null;

  switch (type) {
    case "certificate":
    case "certificates":
      return "/certificates"; // or /certificates/${id} but list view is safer for now or if bulk
    case "batch":
      return `/batches/${id}`;
    case "training":
      return `/trainings/${id}`;
    case "employee":
      return `/employees/${id}`;
    default:
      return null;
  }
}

/**
 * Create notification (internal use)
 */
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: number,
): Promise<Notification> {
  const link = generateLink(relatedType, relatedId);

  return Notification.create({
    userId,
    type,
    title,
    message,
    link,
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
  relatedId?: number,
): Promise<void> {
  const link = generateLink(relatedType, relatedId);

  await Notification.bulkCreate(
    userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link,
    })),
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
  relatedId?: number,
): Promise<void> {
  const users = await User.findAll({
    where: { role, isActive: true },
    attributes: ["id"],
  });

  const userIds = users.map((u) => u.id);
  if (userIds.length > 0) {
    await broadcastNotification(
      userIds,
      type,
      title,
      message,
      relatedType,
      relatedId,
    );
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
