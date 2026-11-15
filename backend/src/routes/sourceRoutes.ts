import { Router } from 'express';
import { sourceController } from '../controllers/sourceController';

const router = Router();

router.get('/', sourceController.getAllSources);
router.get('/analytics/report', sourceController.getAnalyticsReport);
router.get('/scraper/recent-jobs', sourceController.getRecentJobs);
router.post('/batch-sync', sourceController.triggerBatchSync);
router.post('/:code/sync', sourceController.triggerSync);
router.get('/:code', sourceController.getSourceByCode);

export default router;
