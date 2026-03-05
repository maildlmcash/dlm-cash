import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../services/adminApi';
import LoadingSpinner from '../common/LoadingSpinner';
import GlassCard from '../common/GlassCard';

interface FundStats {
  contractUSDTBalance: number;
  inrBalance: number;
  investmentsINR: number;
  investmentsUSDT: number;
  tradingValue: number;
  depositINRFees: number;
  depositUSDTFees: number;
  withdrawalINRFees: number;
  withdrawalUSDTFees: number;
  adminWithdrawals: number;
  adminDeposits: number;
  currencyRate: number;
}

interface PoolTransaction {
  id: string;
  type: string;
  amount: number;
  address?: string;
  txHash?: string;
  blockNumber?: number;
  adminId: string;
  adminRemarks?: string;
  status: string;
  createdAt: string;
}

const FundManagement = () => {
  const [stats, setStats] = useState<FundStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [depositRemarks, setDepositRemarks] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Pool transactions
  const [poolTransactions, setPoolTransactions] = useState<PoolTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadFundStats();
    loadPoolTransactions();
  }, []);

  const loadFundStats = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getFeeStats('all');
      if (response.success && response.data) {
        setStats(response.data as FundStats);
      } else {
        showToast.error('Failed to load fund statistics');
      }
    } catch (error) {
      showToast.error('An error occurred while loading fund statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadPoolTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await adminApi.getPoolTransactions({ limit: 10 });
      if (response.success && response.data) {
        const data = response.data as any;
        setPoolTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load pool transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) {
      showToast.warning('Please enter address and amount');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await adminApi.withdrawPoolFunds({
        address: withdrawAddress,
        amount: withdrawAmount,
        remarks: withdrawRemarks,
      });

      if (response.success) {
        showToast.success('Withdrawal successful!');
        setShowWithdrawModal(false);
        setWithdrawAddress('');
        setWithdrawAmount('');
        setWithdrawRemarks('');
        loadFundStats();
        loadPoolTransactions();
      } else {
        showToast.error(response.message || 'Withdrawal failed');
      }
    } catch (error: any) {
      showToast.error(error.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositTxHash) {
      showToast.warning('Please enter amount and transaction hash');
      return;
    }

    setDepositing(true);
    try {
      const response = await adminApi.recordPoolDeposit({
        amount: depositAmount,
        txHash: depositTxHash,
        remarks: depositRemarks,
      });

      if (response.success) {
        showToast.success('Deposit recorded successfully!');
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositTxHash('');
        setDepositRemarks('');
        loadFundStats();
        loadPoolTransactions();
      } else {
        showToast.error(response.message || 'Failed to record deposit');
      }
    } catch (error: any) {
      showToast.error(error.message || 'Failed to record deposit');
    } finally {
      setDepositing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Fund Management
          </h1>
          <p className="text-gray-600 text-lg">Platform earnings from transaction fees</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Add Funds Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDepositModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <span>💰</span>
            <span>Add Funds</span>
          </motion.button>

          {/* Withdraw Funds Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <span>📤</span>
            <span>Withdraw Funds</span>
          </motion.button>
        </div>
      </motion.div>



      {/* Total Earnings Card */}


      {/* 5 Main Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Contract USDT Balance */}
          <GlassCard className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">Smart Contract Balance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(stats?.contractUSDTBalance || 0, 'USDT')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total USDT in pool contract</p>
              </div>
              <span className="text-4xl">💎</span>
            </div>
          </GlassCard>

          {/* 2. INR Balance */}
          <GlassCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">INR Balance</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats?.inrBalance || 0, 'INR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Deposits - Withdrawals (INR)</p>
              </div>
              <span className="text-4xl">💵</span>
            </div>
          </GlassCard>

          {/* 3. Investments INR */}
          <GlassCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">Investments (INR)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats?.investmentsINR || 0, 'INR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total INR investments</p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </GlassCard>

          {/* 4. Investments USDT */}
          <GlassCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">Investments (USDT)</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(stats?.investmentsUSDT || 0, 'USDT')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total USDT investments</p>
              </div>
              <span className="text-4xl">📈</span>
            </div>
          </GlassCard>

          {/* 5. Trading Value */}
          <GlassCard className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">Trading Value</p>
                <p className="text-3xl font-bold text-pink-600">
                  {formatCurrency(stats?.tradingValue || 0, 'INR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Investments - ROI - Refunds</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCard>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Earnings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>📥</span>
                <span>Deposit Fees</span>
              </h4>
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 }}
                  className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200"
                >
                  <span className="text-sm font-medium text-gray-700">INR Deposits (Manual)</span>
                  <span className="font-bold text-blue-600">{formatCurrency(stats?.depositINRFees || 0, 'INR')}</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 }}
                  className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl border border-indigo-200"
                >
                  <span className="text-sm font-medium text-gray-700">USDT Deposits (Blockchain)</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(stats?.depositUSDTFees || 0, 'USDT')}</span>
                </motion.div>

              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>📤</span>
                <span>Withdrawal Fees</span>
              </h4>
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 }}
                  className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-200"
                >
                  <span className="text-sm font-medium text-gray-700">INR Withdrawals</span>
                  <span className="font-bold text-orange-600">{formatCurrency(stats?.withdrawalINRFees || 0, 'INR')}</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-200"
                >
                  <span className="text-sm font-medium text-gray-700">USDT Withdrawals</span>
                  <span className="font-bold text-red-600">{formatCurrency(stats?.withdrawalUSDTFees || 0, 'USDT')}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Admin Pool Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <GlassCard>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Pool Transactions</h3>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total Withdrawals:</span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(stats?.adminWithdrawals || 0, 'USDT')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total Deposits:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(stats?.adminDeposits || 0, 'USDT')}</span>
              </div>
            </div>
          </div>

          {loadingTransactions ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : poolTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address/TxHash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {poolTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.type === 'WITHDRAW'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                          }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(tx.amount, 'USDT')}</td>
                      <td className="px-4 py-3 text-sm">
                        {tx.type === 'WITHDRAW' && tx.address && (
                          <span className="font-mono text-xs">{tx.address.slice(0, 10)}...{tx.address.slice(-8)}</span>
                        )}
                        {tx.type === 'DEPOSIT' && tx.txHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-mono text-xs"
                          >
                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 w-[30%] min-w-[400px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Withdraw Funds from Pool</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Address
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={withdrawing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Withdrawing...</span>
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 w-[30%] min-w-[400px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Funds to Pool</h2>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Instructions:</strong> Transfer USDT to the pool contract using your wallet, then record the transaction details here.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Hash
                  </label>
                  <input
                    type="text"
                    value={depositTxHash}
                    onChange={(e) => setDepositTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={depositing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={depositing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {depositing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    'Record Deposit'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default FundManagement;
