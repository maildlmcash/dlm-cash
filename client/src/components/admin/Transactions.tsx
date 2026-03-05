import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Wallet {
  type: string;
}

interface Transaction {
  id: string;
  userId: string;
  user: User;
  wallet: Wallet | null;
  walletId: string | null;
  type: string;
  amount: string;
  currency: string;
  status: string;
  description?: string;
  txId?: string;
  meta?: {
    purchaseMethod?: string;
    planId?: string;
    planName?: string;
    epinCode?: string;
    [key: string]: any;
  };
  createdAt: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  useEffect(() => {
    loadTransactions();
  }, [page, filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllTransactions({
        page,
        limit: 50,
        type: filters.type || undefined,
        status: filters.status || undefined,
        userId: filters.userId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        search: filters.search || undefined,
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setTransactions(Array.isArray(data) ? data : data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      showToast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      DEPOSIT: 'bg-green-100 text-green-800',
      WITHDRAW: 'bg-red-100 text-red-800',
      ROI_CREDIT: 'bg-blue-100 text-blue-800',
      SALARY_CREDIT: 'bg-purple-100 text-purple-800',
      DIRECT_REFERRAL_INCOME: 'bg-yellow-100 text-yellow-800',
      BOOST_INCOME: 'bg-orange-100 text-orange-800',
      REFUND: 'bg-pink-100 text-pink-800',
      BREAKDOWN: 'bg-orange-100 text-orange-800',
      INVESTMENT: 'bg-indigo-100 text-indigo-800',
      PLAN_PURCHASE: 'bg-teal-100 text-teal-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Transaction Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">View and manage all transactions</p>
          {!loading && total > 0 && (
            <p className="text-sm text-gray-500 mt-1">Total: {total.toLocaleString()} transactions</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Email, name, transaction ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAW">Withdraw</option>
              <option value="INVESTMENT">Investment</option>
              <option value="PLAN_PURCHASE">Plan Purchase</option>
              <option value="ROI_CREDIT">ROI Credit</option>
              <option value="SALARY_CREDIT">Salary Credit</option>
              <option value="DIRECT_REFERRAL_INCOME">Direct Referral</option>
              <option value="BOOST_INCOME">Boost Income</option>
              <option value="REFUND">Refund</option>
              <option value="BREAKDOWN">Breakdown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">📋</p>
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TX ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx, index) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(page - 1) * 50 + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tx.user.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">{tx.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                      <td className="px-4 py-3">
                        {tx.wallet ? (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {tx.wallet.type}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </div>
                        <div className="text-xs text-gray-500">{tx.currency}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(tx.status)}</td>
                      <td className="px-4 py-3">
                        {tx.description ? (
                          <div className="text-xs text-gray-600 max-w-xs truncate" title={tx.description}>
                            {tx.description}
                          </div>
                        ) : tx.meta?.planName ? (
                          <div className="text-xs text-gray-600">
                            Plan: {tx.meta.planName}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tx.txId ? (
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded" title={tx.txId}>
                            {tx.txId.length > 12 ? `${tx.txId.substring(0, 12)}...` : tx.txId}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Transactions;
