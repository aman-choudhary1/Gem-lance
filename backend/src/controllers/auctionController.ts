import { Request, Response, NextFunction } from 'express';
import { auctionService } from '../services/auctionService';
import { getForYou } from '../services/feedService';

export class AuctionController {
  public async getAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await auctionService.getAuctions(req.query as any);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAuctionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auction = await auctionService.getAuctionById(req.params.id);
      res.status(200).json({
        success: true,
        data: auction
      });
    } catch (error) {
      next(error);
    }
  }

  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await auctionService.getAuctions(req.query as any);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  public async getEndingSoon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const source = req.query.source as string | undefined;
      const category = req.query.category as string | undefined;

      const auctions = await auctionService.getEndingSoon(hours, limit, source, category);
      res.status(200).json({
        success: true,
        data: auctions
      });
    } catch (error) {
      next(error);
    }
  }

  public async getForYou(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(30, Math.max(1, parseInt((req.query.limit as string) || '12', 10) || 12));
      const feed = await getForYou(req.user!.id, limit);
      res.status(200).json({ success: true, ...feed });
    } catch (error) {
      next(error);
    }
  }

  public async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await auctionService.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auctionController = new AuctionController();
