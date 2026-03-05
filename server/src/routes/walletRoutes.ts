import { Router } from 'express';
import {
  getWallets,
  getWalletByType,
  getTransactions,
  getTransactionById,
  getDepositWallet,
  getDepositTransactions,
  checkDeposits,
  getPoolBalances,
  createPendingDeposit,
  getPendingDeposits,
  redeemToUSDT,
} from '../controllers/walletController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/wallets', getWallets);
router.get('/wallets/:type', getWalletByType);
router.post('/wallets/redeem-to-usdt', redeemToUSDT);
router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionById);
router.get('/deposit-wallet', getDepositWallet);
router.get('/deposit-wallet/transactions', getDepositTransactions);
router.post('/deposit-wallet/check', checkDeposits);
router.post('/deposit-wallet/pending', createPendingDeposit);
router.get('/deposit-wallet/pending', getPendingDeposits);
router.get('/pool-balances', getPoolBalances);

export default router;
