import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class NotificationService {
  public async getUserNotifications(userId: string, limit = 50) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          auction: {
            select: {
              id: true,
              externalId: true,
              title: true,
              status: true,
              source: { select: { code: true } }
            }
          }
        }
      }),
      prisma.notification.count({
        where: { userId, read: false }
      })
    ]);

    return { notifications, unreadCount };
  }

  public async markAsRead(userId: string, notificationId: string) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!existing) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
  }

  public async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }
}

export const notificationService = new NotificationService();
