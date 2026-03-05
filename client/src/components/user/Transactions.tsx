import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import GlassCard from '../common/GlassCard';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  txId?: string;
  createdAt: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });

  useEffect(() => {
    loadTransactions();
  }, [page, filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await userApi.getTransactions({
        page,
        limit: 20,
        type: filters.type || undefined,
        status: filters.status || undefined,
      });

      if (response.success && response.data) {
        const data = response.data as any;
        setTransactions(Array.isArray(data) ? data : data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      } else {
        showToast.error(response.error || 'Failed to load transactions');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'Description', 'TX ID'];
    const rows = transactions.map((tx) => [
      new Date(tx.createdAt).toLocaleString(),
      tx.type,
      tx.amount,
      tx.currency,
      tx.status,
      tx.description || '',
      tx.txId || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Transactions exported successfully');
  };

  const formatCurrency = (amount: string, currency: string = 'INR') => {
    const num = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const transactionTypes = [
    'DEPOSIT',
    'WITHDRAW',
    'ROI_CREDIT',
    'SALARY_CREDIT',
    'REFUND',
    'BREAKDOWN',
    'PLAN_PURCHASE',
    'PLAN_PAYOUT',
    'DIRECT_REFERRAL',
  ];

  const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'COMPLETED'];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Transactions
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">View all your transaction history</p>
        </div>
        <AnimatedButton onClick={exportCSV} size="md">
          📥 Export CSV
        </AnimatedButton>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                {transactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <AnimatedButton
                onClick={() => {
                  setFilters({ type: '', status: '' });
                  setPage(1);
                }}
                variant="secondary"
                fullWidth
                size="lg"
                className="!text-black"
              >
                Clear Filters
              </AnimatedButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : transactions.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        TX ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((tx, index) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {tx.type.replace('_', ' ')}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                            tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' || tx.type === 'REFUND' || tx.type === 'BREAKDOWN' || tx.type === 'DIRECT_REFERRAL'
                              ? 'text-green-600'
                              : (tx.status === 'REJECTED' || tx.status === 'FAILED')
                              ? 'text-gray-600'
                              : 'text-red-600'
                          }`}
                        >
                          {tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' || tx.type === 'REFUND' || tx.type === 'BREAKDOWN' || tx.type === 'DIRECT_REFERRAL' 
                            ? '+' 
                            : (tx.status === 'REJECTED' || tx.status === 'FAILED')
                            ? ''
                            : '-'}
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            className={`text-xs px-3 py-1 rounded-full font-bold ${
                              tx.status === 'COMPLETED' || tx.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : tx.status === 'PENDING'
                                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            }`}
                          >
                            {tx.status}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tx.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {tx.txId ? (
                            tx.txId.startsWith('0x') ? (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${tx.txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                title={tx.txId}
                              >
                                <span className="truncate max-w-[150px]">
                                  {tx.txId.slice(0, 10)}...{tx.txId.slice(-8)}
                                </span>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="truncate max-w-xs block" title={tx.txId}>
                                {tx.txId}
                              </span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3"
            >
              <AnimatedButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="secondary"
                size="md"
              >
                ← Previous
              </AnimatedButton>
              <span className="text-gray-600 font-semibold px-4">
                Page {page} of {totalPages}
              </span>
              <AnimatedButton
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="secondary"
                size="md"
              >
                Next →
              </AnimatedButton>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <GlassCard>
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">No transactions found</p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default Transactions;

