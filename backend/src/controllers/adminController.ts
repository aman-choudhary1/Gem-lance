import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';
import { sourceService } from '../services/sourceService';

export class AdminController {
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getDashboardOverview();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getScraperStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getScraperStatus();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getScrapeJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const data = await adminService.getScrapeJobs(limit);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async triggerManualScrape(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { source } = req.params;
      const result = await adminService.triggerManualScrape(source);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async toggleSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const result = await sourceService.toggleSource(id, enabled);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
