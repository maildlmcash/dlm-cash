import cron from 'node-cron';
import { calculateDailyROI } from './jobs/roiCalculation';
import { calculateMonthlySalary } from './jobs/salaryCalculation';
import { monitorAllDeposits } from '../utils/blockchainMonitor';
import { sweepDepositWalletsMultiChain } from './jobs/fundSweeperMultiChain';
import { cleanupExpiredPendingDeposits } from '../controllers/walletController';

export const initSchedulers = () => {
  // Daily ROI calculation - runs every day at midnight
  cron.schedule(process.env.ROI_CALCULATION_CRON || '0 0 * * *', async () => {
    console.log('🔄 Running daily ROI calculation...');
    try {
      await calculateDailyROI();
      console.log('✅ Daily ROI calculation completed');
    } catch (error) {
      console.error('❌ Daily ROI calculation failed:', error);
    }
  });

  // Monthly salary calculation - runs on 1st of every month at midnight
  cron.schedule(process.env.SALARY_CALCULATION_CRON || '0 0 1 * *', async () => {
    console.log('🔄 Running monthly salary calculation...');
    try {
      await calculateMonthlySalary();
      console.log('✅ Monthly salary calculation completed');
    } catch (error) {
      console.error('❌ Monthly salary calculation failed:', error);
    }
  });

  // Blockchain deposit monitoring - runs every 30 seconds (reduced for cleaner logs in development)
  let isMonitoring = false;
  const monitoringInterval = process.env.NODE_ENV === 'development' ? '*/30 * * * * *' : '*/2 * * * * *';
  cron.schedule(monitoringInterval, async () => {
    if (isMonitoring) return; // Skip if previous run still in progress
    isMonitoring = true;
    // Only log in production or when deposits are found
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) console.log('🔄 Running blockchain deposit monitoring...');
    try {
      await monitorAllDeposits();
      if (!isDev) console.log('✅ Blockchain monitoring completed');
    } catch (error) {
      console.error('❌ Blockchain deposit monitoring failed:', error);
    } finally {
      isMonitoring = false;
    }
  });

  // Multi-chain fund sweeper - runs every 2 minutes
  let isSweeping = false;
  cron.schedule('0 */2 * * * *', async () => {
    if (isSweeping) return; // Skip if previous run still in progress
    isSweeping = true;
    console.log('🔄 Running multi-chain fund sweeper...');
    try {
      await sweepDepositWalletsMultiChain();
      console.log('✅ Multi-chain fund sweeper completed');
    } catch (error) {
      console.error('❌ Multi-chain fund sweeper failed:', error);
    } finally {
      isSweeping = false;
    }
  });

  // Cleanup expired pending deposits - runs every minute
  cron.schedule('*/1 * * * *', async () => {
    try {
      await cleanupExpiredPendingDeposits();
    } catch (error) {
      console.error('❌ Pending deposits cleanup failed:', error);
    }
  });

  console.log('⏰ Schedulers initialized (ROI, Salary, Multi-Chain Monitoring, Multi-Chain Sweeper, Pending Cleanup)');
};
