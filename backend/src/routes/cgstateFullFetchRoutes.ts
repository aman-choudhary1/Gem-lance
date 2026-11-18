import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { runScraperPipeline } from '../scraper/pipeline';
import {
  FullFetchStats,
  getFullFetchProgress,
  setFullFetchProgress,
  startFullFetch,
  submitFullFetchCode
} from '../providers/cgstate/cgstateFullFetch';

/**
 * Admin-assisted full fetch of the Chhattisgarh open-tender list (see cgstateFullFetch.ts).
 *
 *   POST /start   -> { status: 'needs_code', sessionId, code, ... }
 *   POST /submit  -> { status: 'needs_code', ... }   portal asked for a (new) code: show it again
 *                 -> { status: 'done', ...import summary }
 */
const router = Router();
router.use(authenticateJwt, requireAdmin);

const submitSchema = z.object({
  sessionId: z.string().min(10),
  code: z.string().trim().min(3, 'Type the code shown').max(20)
});

router.post('/start', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (getFullFetchProgress()?.running) throw new AppError('A full fetch is already running', 409, 'CG_FULL_FETCH_RUNNING');
    res.status(200).json({ success: true, data: await startFullFetch() });
  } catch (error) {
    next(error);
  }
});

router.get('/progress', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: getFullFetchProgress() });
});

router.post('/submit', validate(submitSchema), async (req: Request, res: Response, next: NextFunction) => {
  if (getFullFetchProgress()?.running) {
    next(new AppError('A full fetch is already running', 409, 'CG_FULL_FETCH_RUNNING'));
    return;
  }
  const startedAt = new Date().toISOString();
  let stats: FullFetchStats = { pagesRead: 0, totalPages: null, rows: 0 };
  setFullFetchProgress({ ...stats, running: true, startedAt });

  try {
    const step = await submitFullFetchCode(req.body.sessionId, req.body.code, (s) => {
      stats = s;
      setFullFetchProgress({ ...s, running: true, startedAt });
    });

    if (step.status === 'needs_code') {
      res.status(200).json({ success: true, data: step });
      return;
    }

    // All pages read (or as many as the portal allowed): import them once, through the normal pipeline.
    const { rawAuctions, ...info } = step;
    const summary = await runScraperPipeline('CGSTATE', async () => rawAuctions);
    res.status(200).json({ success: true, data: { ...summary, ...info } });
  } catch (error) {
    next(error);
  } finally {
    setFullFetchProgress({ ...stats, running: false, startedAt });
  }
});

export default router;
