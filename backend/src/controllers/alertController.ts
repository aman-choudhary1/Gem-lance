import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alertService';
import { AppError } from '../middleware/errorHandler';

export class AlertController {
  public async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const alerts = await alertService.getUserAlerts(req.user.id);
      res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  public async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const alert = await alertService.createAlert(req.user.id, req.body);
      res.status(201).json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  public async updateAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const { id } = req.params;
      const updated = await alertService.updateAlert(req.user.id, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public async deleteAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const { id } = req.params;
      const result = await alertService.deleteAlert(req.user.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
