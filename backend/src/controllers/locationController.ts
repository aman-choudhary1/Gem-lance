import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/locationService';

export class LocationController {
  public async getStates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await locationService.getStates();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = req.query.state as string | undefined;
      const data = await locationService.getDistricts(state);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
