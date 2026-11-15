import { Router } from 'express';
import { auctionController } from '../controllers/auctionController';
import { validate } from '../middleware/validate';
import { auctionFilterSchema, endingSoonQuerySchema } from '../validators/auctionSchemas';

const router = Router();

router.get('/', validate(auctionFilterSchema, 'query'), auctionController.getAuctions);
router.get('/search', validate(auctionFilterSchema, 'query'), auctionController.search);
router.get('/ending-soon', validate(endingSoonQuerySchema, 'query'), auctionController.getEndingSoon);
router.get('/stats', auctionController.getStats);
router.get('/:id', auctionController.getAuctionById);

export default router;
