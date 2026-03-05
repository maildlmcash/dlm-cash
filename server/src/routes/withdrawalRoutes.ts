import { Router } from 'express';
import {
  createWithdrawal,
  createWithdrawalValidation,
  getWithdrawals,
  getWithdrawalById,
} from '../controllers/withdrawalController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createWithdrawalValidation), createWithdrawal);
router.get('/', getWithdrawals);
router.get('/:id', getWithdrawalById);

export default router;
