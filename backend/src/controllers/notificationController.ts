import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { AppError } from '../middleware/errorHandler';

export class NotificationController {
  public async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const result = await notificationService.getUserNotifications(req.user.id);
      res.status(200).json({ success: true, data: result.notifications, unreadCount: result.unreadCount });
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const { id } = req.params;
      const updated = await notificationService.markAsRead(req.user.id, id);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
