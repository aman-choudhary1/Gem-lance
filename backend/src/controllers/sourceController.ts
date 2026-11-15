import { Request, Response, NextFunction } from 'express';
import { sourceService } from '../services/sourceService';

export class SourceController {
  public async getAllSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sourceService.getAllSources();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getSourceByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sourceService.getSourceByCode(req.params.code);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getAnalyticsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sourceService.getAnalyticsReport();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const result = await sourceService.triggerSync(code);
      res.status(200).json({
        success: true,
        message: `Ingestion completed for [${code.toUpperCase()}]`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async triggerBatchSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { codes } = req.body || {};
      const results = await sourceService.triggerBatchSync(codes);
      res.status(200).json({
        success: true,
        message: `Batch ingestion completed for ${results.length} portals`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  public async getRecentJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await sourceService.getRecentJobs(limit);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const sourceController = new SourceController();
