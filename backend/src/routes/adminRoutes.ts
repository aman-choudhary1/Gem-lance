import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateJwt, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(authenticateJwt, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/scraper/status', adminController.getScraperStatus);
router.get('/scraper/jobs', adminController.getScrapeJobs);
router.post('/scraper/run/:source', adminController.triggerManualScrape);
router.patch('/sources/:id/toggle', adminController.toggleSource);

export default router;
