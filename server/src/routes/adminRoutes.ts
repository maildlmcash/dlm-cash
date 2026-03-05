import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  getPendingKyc,
  approveKyc,
  rejectKyc,
  getPendingDeposits,
  getAllDeposits,
  approveDeposit,
  rejectDeposit,
  getAllWithdrawals,
  getPendingWithdrawals,
  getWithdrawalStats,
  approveWithdrawal,
  rejectWithdrawal,
  getAllRefundRequests,
  approveRefundRequest,
  rejectRefundRequest,
  getUserReferralTree,
  getUserLoginLogs,
  getUserRoiLogs,
  monitorBlockchainDeposits,
  recalculateDepositBalances,
  getPendingBlockchainDeposits,
  approveBlockchainDeposit,
  rejectBlockchainDeposit,
  getAllTransactions,
  triggerRoiCalculation,
  triggerSalaryCalculation,
} from '../controllers/adminController';
import {
  createPlan,
  createPlanValidation,
  getAllPlans,
  updatePlan,
  deletePlan,
  togglePlanStatus,
  getAllInvestments,
  getInvestmentStats,
} from '../controllers/planController';
import {
  getSalarySettings,
  saveSalarySettings,
  getBreakdownSettings,
  saveBreakdownSettings,
  getDepositSettings,
  saveDepositSettings,
  getPlatformFeeSettings,
  savePlatformFeeSettings,
  getROIBoostSettings,
  updateROIBoostSettings,
} from '../controllers/settingsController';
import { getFeeStats } from '../controllers/fundManagementController';
import {
  withdrawPoolFunds,
  recordPoolDeposit,
  getPoolTransactions,
} from '../controllers/poolController';
import {
  getAllBankAccounts,
  getBankAccountById,
  createBankAccount,
  createBankAccountValidation,
  updateBankAccount,
  updateBankAccountValidation,
  deleteBankAccount,
} from '../controllers/bankAccountController';
import {
  getAllUpiAccounts,
  getUpiAccountById,
  createUpiAccount,
  createUpiAccountValidation,
  updateUpiAccount,
  updateUpiAccountValidation,
  deleteUpiAccount,
} from '../controllers/upiAccountController';
import {
  getPendingInvestments,
  approveInvestment,
  rejectInvestment,
} from '../controllers/adminController';
import {
  generateAuthKeys,
  generateAuthKeysValidation,
  getAuthKeys,
  distributeAuthKey,
  distributeAuthKeyToEmail,
  distributeAuthKeyToEmailValidation,
  getAuthKeyStats,
} from '../controllers/authKeyController';
import {
  getCurrentCurrencyRate,
  updateCurrencyRate,
  updateCurrencyRateValidation,
  getCurrencyRateLogs,
  fetchMoralisRate,
} from '../controllers/currencyController';
import {
  getNetworkConfigs,
  updateNetworkConfig,
} from '../controllers/networkConfigController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { upload } from '../utils/upload';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'KYC_MANAGER', 'FINANCE'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.get('/users/:id/referral-tree', getUserReferralTree);
router.get('/users/:id/login-logs', getUserLoginLogs);
router.get('/users/:id/roi-logs', getUserRoiLogs);
router.put('/users/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateUserStatus);
router.put('/users/:id/role', authorize('SUPER_ADMIN'), updateUserRole);

// KYC Management
router.get('/kyc/pending', authorize('SUPER_ADMIN', 'ADMIN', 'KYC_MANAGER'), getPendingKyc);
router.post('/kyc/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'KYC_MANAGER'), approveKyc);
router.post('/kyc/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'KYC_MANAGER'), rejectKyc);

// Deposit Management
router.get('/deposits/pending', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getPendingDeposits);
router.get('/deposits', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getAllDeposits);
router.post('/deposits/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), approveDeposit);
router.post('/deposits/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), rejectDeposit);

// Withdrawal Management
router.get('/withdrawals', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getAllWithdrawals);
router.get('/withdrawals/pending', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getPendingWithdrawals);
router.get('/withdrawals/stats', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getWithdrawalStats);
router.post('/withdrawals/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), approveWithdrawal);
router.post('/withdrawals/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), rejectWithdrawal);

// Plan Management
router.post('/plans', authorize('SUPER_ADMIN', 'ADMIN'), validate(createPlanValidation), createPlan);
router.get('/plans', getAllPlans);
router.put('/plans/:id', authorize('SUPER_ADMIN', 'ADMIN'), updatePlan);
router.delete('/plans/:id', authorize('SUPER_ADMIN', 'ADMIN'), deletePlan);
router.put('/plans/:id/toggle', authorize('SUPER_ADMIN', 'ADMIN'), togglePlanStatus);

// Investment Management
router.get('/investments', getAllInvestments);
router.get('/investments/pending', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getPendingInvestments);
router.get('/investments/stats', getInvestmentStats);
router.post('/investments/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), approveInvestment);
router.post('/investments/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), rejectInvestment);

// Salary Settings
router.get('/salary/settings', authorize('SUPER_ADMIN', 'ADMIN'), getSalarySettings);
router.post('/salary/settings', authorize('SUPER_ADMIN', 'ADMIN'), saveSalarySettings);

// Breakdown Settings
router.get('/breakdown/settings', authorize('SUPER_ADMIN', 'ADMIN'), getBreakdownSettings);
router.post('/breakdown/settings', authorize('SUPER_ADMIN', 'ADMIN'), saveBreakdownSettings);

// Deposit Settings
router.get('/deposit/settings', authorize('SUPER_ADMIN', 'ADMIN'), getDepositSettings);
router.post('/deposit/settings', authorize('SUPER_ADMIN', 'ADMIN'), saveDepositSettings);

// Platform Fee Settings
router.get('/platform-fee/settings', authorize('SUPER_ADMIN', 'ADMIN'), getPlatformFeeSettings);
router.post('/platform-fee/settings', authorize('SUPER_ADMIN', 'ADMIN'), savePlatformFeeSettings);

// Refund Request Management
router.get('/breakdown/refunds', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getAllRefundRequests);
router.post('/breakdown/refunds/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), approveRefundRequest);
router.post('/breakdown/refunds/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), rejectRefundRequest);

// Authentication Key Management
router.post('/auth-keys/generate', authorize('SUPER_ADMIN', 'ADMIN'), validate(generateAuthKeysValidation), generateAuthKeys);
router.get('/auth-keys', authorize('SUPER_ADMIN', 'ADMIN'), getAuthKeys);
router.get('/auth-keys/stats', authorize('SUPER_ADMIN', 'ADMIN'), getAuthKeyStats);
router.post('/auth-keys/:id/distribute', authorize('SUPER_ADMIN', 'ADMIN'), distributeAuthKey);
router.post('/auth-keys/:id/distribute-email', authorize('SUPER_ADMIN', 'ADMIN'), validate(distributeAuthKeyToEmailValidation), distributeAuthKeyToEmail);

// Bank Account Management
router.get('/bank-accounts', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getAllBankAccounts);
router.get('/bank-accounts/:id', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getBankAccountById);
router.post('/bank-accounts', authorize('SUPER_ADMIN', 'ADMIN'), validate(createBankAccountValidation), createBankAccount);
router.put('/bank-accounts/:id', authorize('SUPER_ADMIN', 'ADMIN'), validate(updateBankAccountValidation), updateBankAccount);
router.delete('/bank-accounts/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteBankAccount);

// UPI Account Management
router.get('/upi-accounts', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getAllUpiAccounts);
router.get('/upi-accounts/:id', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE'), getUpiAccountById);
router.post('/upi-accounts', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('qrCode'), validate(createUpiAccountValidation), createUpiAccount);
router.put('/upi-accounts/:id', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('qrCode'), validate(updateUpiAccountValidation), updateUpiAccount);
router.delete('/upi-accounts/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteUpiAccount);

// Currency Management
router.get('/currency/rate', getCurrentCurrencyRate);
router.post('/currency/rate', authorize('SUPER_ADMIN', 'ADMIN'), validate(updateCurrencyRateValidation), updateCurrencyRate);
router.post('/currency/fetch-moralis', authorize('SUPER_ADMIN', 'ADMIN'), fetchMoralisRate);
router.get('/currency/logs', authorize('SUPER_ADMIN', 'ADMIN'), getCurrencyRateLogs);

// Blockchain Monitoring
router.post('/blockchain/monitor', authorize('SUPER_ADMIN', 'ADMIN'), monitorBlockchainDeposits);
router.post('/blockchain/recalculate-balances', authorize('SUPER_ADMIN', 'ADMIN'), recalculateDepositBalances);
router.get('/blockchain/deposits/pending', authorize('SUPER_ADMIN', 'ADMIN'), getPendingBlockchainDeposits);
router.post('/blockchain/deposits/:transactionId/approve', authorize('SUPER_ADMIN', 'ADMIN'), approveBlockchainDeposit);
router.post('/blockchain/deposits/:transactionId/reject', authorize('SUPER_ADMIN', 'ADMIN'), rejectBlockchainDeposit);

// Transaction Management
router.get('/transactions', getAllTransactions);

// Fund Management
router.get('/fund-management/fees', authorize('SUPER_ADMIN', 'ADMIN'), getFeeStats);

// Pool Management
router.post('/pool/withdraw', authorize('SUPER_ADMIN', 'ADMIN'), withdrawPoolFunds);
router.post('/pool/deposit', authorize('SUPER_ADMIN', 'ADMIN'), recordPoolDeposit);
router.get('/pool/transactions', authorize('SUPER_ADMIN', 'ADMIN'), getPoolTransactions);

// ROI Boost Settings
router.get('/settings/roi-boost', authorize('SUPER_ADMIN', 'ADMIN'), getROIBoostSettings);
router.post('/settings/roi-boost', authorize('SUPER_ADMIN', 'ADMIN'), updateROIBoostSettings);

// Network Configuration
router.get('/networks', authorize('SUPER_ADMIN', 'ADMIN'), getNetworkConfigs);
router.put('/networks/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateNetworkConfig);

// Manual CRON Triggers (for testing)
router.post('/cron/trigger-roi-calculation', authorize('SUPER_ADMIN', 'ADMIN'), triggerRoiCalculation);
router.post('/cron/trigger-salary-calculation', authorize('SUPER_ADMIN', 'ADMIN'), triggerSalaryCalculation);

export default router;
