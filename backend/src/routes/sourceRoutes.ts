import { Router } from 'express';
import { sourceController } from '../controllers/sourceController';
import { authenticateJwt, requireAdmin } from '../middleware/auth';
import cgstateFullFetchRoutes from './cgstateFullFetchRoutes';

const router = Router();

router.get('/', sourceController.getAllSources);
router.get('/analytics/report', sourceController.getAnalyticsReport);
router.get('/scraper/recent-jobs', sourceController.getRecentJobs);
// Triggering ingestion launches outbound scrapes, so it is restricted to administrators.
// Admin-assisted full fetch for Chhattisgarh (an admin types the portal's code)
router.use('/cgstate/full-fetch', cgstateFullFetchRoutes);
router.post('/batch-sync', authenticateJwt, requireAdmin, sourceController.triggerBatchSync);
router.post('/:code/sync', authenticateJwt, requireAdmin, sourceController.triggerSync);
router.get('/:code', sourceController.getSourceByCode);

export default router;
