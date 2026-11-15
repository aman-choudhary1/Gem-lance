import { Router } from 'express';
import { savedAuctionController } from '../controllers/savedAuctionController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', savedAuctionController.getSavedAuctions);
router.post('/:auctionId', savedAuctionController.saveAuction);
router.delete('/:auctionId', savedAuctionController.removeSavedAuction);

export default router;
