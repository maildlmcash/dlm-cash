import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboardStats,
  getReferralTree,
  getReferralIncome,
  getROIIncome,
  getCurrencyRate,
  getROIBoostIncome,
  getDirectReferralIncome,
  getSalaryIncome,
} from '../controllers/userDashboardController';
import { getWallets, getWalletByType, getTransactions, getTransactionById, redeemToUSDT } from '../controllers/walletController';
import { getPlans, getPlanById, getInvestments, getInvestmentById, getInvestmentRealTimeROI, requestBreakdown, cancelBreakdown } from '../controllers/investmentController';
import { getMyKyc, getKycStatus } from '../controllers/kycController';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { addBankAccount, getUserBankAccounts, deleteBankAccount, addBankAccountValidation } from '../controllers/userBankAccountController';
import { getCryptoPrices, getCryptoPrice } from '../controllers/cryptoPriceController';
import { getWithdrawEnabledNetworks, getDepositEnabledNetworks } from '../controllers/networkConfigController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Wallets
router.get('/wallets', getWallets);
router.get('/wallets/:type', getWalletByType);
router.post('/wallets/redeem-to-usdt', redeemToUSDT);

// Transactions
router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionById);

// Investments
router.get('/plans', getPlans);
router.get('/plans/:id', getPlanById);
router.get('/investments', getInvestments);
router.get('/investments/:id', getInvestmentById);
router.get('/investments/:id/roi/realtime', getInvestmentRealTimeROI);
router.post('/investments/:id/breakdown', requestBreakdown);
router.delete('/investments/:investmentId/breakdown', cancelBreakdown);

// KYC
router.get('/kyc', getMyKyc);
router.get('/kyc/status', getKycStatus);

// Referrals
router.get('/referrals/tree', getReferralTree);
router.get('/referrals/income', getReferralIncome);

// ROI & Income
router.get('/roi-income', getROIIncome);
router.get('/roi-boost', getROIBoostIncome);
router.get('/direct-referral-income', getDirectReferralIncome);
router.get('/salary-income', getSalaryIncome);

// Currency
router.get('/currency/rate', getCurrencyRate);

// Crypto Prices
router.get('/crypto-prices', getCryptoPrices);
router.get('/crypto-prices/:symbol', getCryptoPrice);

// Network Configuration
router.get('/networks/withdraw', getWithdrawEnabledNetworks);
router.get('/networks/deposit', getDepositEnabledNetworks);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);

// User Bank Accounts
router.post('/bank-accounts', addBankAccountValidation, addBankAccount);
router.get('/bank-accounts', getUserBankAccounts);
router.delete('/bank-accounts/:id', deleteBankAccount);

export default router;

