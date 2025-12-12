import api from './api';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedType: string | null;
  relatedId: number | null;
  createdAt: string;
}

/**
 * Get user notifications
 */
export async function getNotifications(unreadOnly?: boolean): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const response = await api.get('/notifications', {
    params: { unreadOnly },
  });
  return response.data.data;
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: number): Promise<Notification> {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data.data.notification;
}

/**
 * Mark all as read
 */
export async function markAllAsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

export default { getNotifications, markAsRead, markAllAsRead };
