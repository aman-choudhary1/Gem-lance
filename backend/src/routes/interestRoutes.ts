import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { getInterests, setInterests, MAX_INTERESTS } from '../services/interestService';

const router = Router();
router.use(authenticateJwt);

const setInterestsSchema = z.object({
  categoryIds: z.array(z.string().min(1)).max(MAX_INTERESTS, `Choose at most ${MAX_INTERESTS} categories`)
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    res.status(200).json({ success: true, data: await getInterests(req.user.id) });
  } catch (error) {
    next(error);
  }
});

router.put('/', validate(setInterestsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    res.status(200).json({ success: true, data: await setInterests(req.user.id, req.body.categoryIds) });
  } catch (error) {
    next(error);
  }
});

export default router;
