import { Router } from 'express';
import {
  createDeposit,
  createDepositValidation,
  getDeposits,
  getDepositById,
} from '../controllers/depositController';
import { getActiveBankAccounts } from '../controllers/bankAccountController';
import { getActiveUpiAccounts } from '../controllers/upiAccountController';
import { getDepositSettings, getPlatformFeeSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { upload } from '../utils/upload';

const router = Router();

router.use(authenticate);

router.get('/bank-accounts', getActiveBankAccounts);
router.get('/upi-accounts', getActiveUpiAccounts);
router.get('/settings', getDepositSettings);
router.get('/platform-fee-settings', getPlatformFeeSettings);
router.post(
  '/',
  upload.single('proof'),
  validate(createDepositValidation),
  createDeposit
);
router.get('/', getDeposits);
router.get('/:id', getDepositById);

export default router;
