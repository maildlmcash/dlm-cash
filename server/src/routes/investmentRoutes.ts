import { Router } from 'express';
import {
  getPlans,
  getPlanById,
  createInvestment,
  createInvestmentValidation,
  getInvestments,
  getInvestmentById,
  getInvestmentRealTimeROI,
} from '../controllers/investmentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/plans', getPlans);
router.get('/plans/:id', getPlanById);
router.post('/investments', validate(createInvestmentValidation), createInvestment);
router.get('/investments', getInvestments);
router.get('/investments/:id', getInvestmentById);
router.get('/investments/:id/roi/realtime', getInvestmentRealTimeROI);

export default router;
