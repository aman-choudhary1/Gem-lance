import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService';

export class CategoryController {
  public async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await categoryService.getAllCategories();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
