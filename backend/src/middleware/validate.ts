import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type ValidatableSchema = AnyZodObject | ZodEffects<AnyZodObject>;

export function validate(schema: ValidatableSchema, target: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}
