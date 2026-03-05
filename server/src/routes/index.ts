import { Router } from 'express';
import authRoutes from './authRoutes';
import walletRoutes from './walletRoutes';
import depositRoutes from './depositRoutes';
import withdrawalRoutes from './withdrawalRoutes';
import investmentRoutes from './investmentRoutes';
import kycRoutes from './kycRoutes';
import adminRoutes from './adminRoutes';
import notificationRoutes from './notificationRoutes';
import supportRoutes from './supportRoutes';
import blogRoutes from './blogRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', walletRoutes);
router.use('/user', userRoutes); // User dashboard routes
router.use('/deposits', depositRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/invest', investmentRoutes);
router.use('/kyc', kycRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/blog', blogRoutes);

export default router;
