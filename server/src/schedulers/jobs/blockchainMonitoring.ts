import { monitorAllDeposits } from '../../utils/blockchainMonitor';

/**
 * Blockchain deposit monitoring job
 * Runs periodically to check for new USDT deposits across all networks
 */
export const checkBlockchainDeposits = async (): Promise<void> => {
  try {
    console.log('🔄 Starting blockchain deposit check...');
    await monitorAllDeposits();
    console.log('✅ Blockchain deposit check completed');
  } catch (error: any) {
    console.error('❌ Error in blockchain deposit check:', error.message);
    throw error;
  }
};
