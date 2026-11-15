import { Request, Response, NextFunction } from 'express';
import { savedAuctionService } from '../services/savedAuctionService';
import { AppError } from '../middleware/errorHandler';

export class SavedAuctionController {
  public async getSavedAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const saved = await savedAuctionService.getUserSavedAuctions(req.user.id);
      res.status(200).json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  public async saveAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const { auctionId } = req.params;
      const { notes } = req.body;
      const saved = await savedAuctionService.saveAuction(req.user.id, auctionId, notes);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  public async removeSavedAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);
      const { auctionId } = req.params;
      const result = await savedAuctionService.removeSavedAuction(req.user.id, auctionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const savedAuctionController = new SavedAuctionController();
