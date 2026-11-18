import { Router } from 'express';
import authRoutes from './authRoutes';
import auctionRoutes from './auctionRoutes';
import savedAuctionRoutes from './savedAuctionRoutes';
import alertRoutes from './alertRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import sourceRoutes from './sourceRoutes';
import categoryRoutes from './categoryRoutes';
import locationRoutes from './locationRoutes';
import interestRoutes from './interestRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auctions', auctionRoutes);
router.use('/saved-auctions', savedAuctionRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/sources', sourceRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);
router.use('/interests', interestRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'AuctionLens Backend API',
    timestamp: new Date().toISOString()
  });
});

export default router;
