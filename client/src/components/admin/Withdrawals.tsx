import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface Withdrawal {
  id: string;
  amount: string;
  currency: string;
  method: string;
  walletType?: string;
  status: string;
  destination?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
  };
  txId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

interface WithdrawalStats {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalAmount: number;
  approvedAmount: number;
}

interface UserWithdrawalStats {
  totalApprovedAmount: string;
  totalApprovedCount: number;
}

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [userStats, setUserStats] = useState<Record<string, UserWithdrawalStats>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, _setPage] = useState(1);
  const [filter, setFilter] = useState('PENDING');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'INR' | 'USDT'>('ALL');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [txId, setTxId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    loadWithdrawals();
    loadStats();
  }, [page, filter, currencyFilter]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await adminApi.getWithdrawalStats();
      if (response.success && response.data) {
        setStats(response.data as WithdrawalStats);
      }
    } catch (error) {
      console.error('Failed to load withdrawal statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    setLoading(true);
    setSelectedIds([]);
    try {
      const params: any = { page, limit: 20 };
      if (filter !== 'PENDING') params.status = filter;
      if (currencyFilter !== 'ALL') params.currency = currencyFilter;
      
      const response = filter === 'PENDING'
        ? await adminApi.getPendingWithdrawals(params)
        : await adminApi.getAllWithdrawals(params);
      
      if (response.success && response.data) {
        const data = response.data as any;
        let withdrawalsList = Array.isArray(data) ? data : data.data || [];
        
        // Apply currency filter for PENDING status (frontend filtering)
        if (filter === 'PENDING' && currencyFilter !== 'ALL') {
          withdrawalsList = withdrawalsList.filter((w: any) => w.currency === currencyFilter);
        }
        
        // Parse bankDetails JSON string to object
        withdrawalsList = withdrawalsList.map((w: any) => {
          let parsedBankDetails = null;
          
          if (w.bankDetails) {
            try {
              // If it's a string, parse it
              if (typeof w.bankDetails === 'string') {
                parsedBankDetails = JSON.parse(w.bankDetails);
              } else {
                parsedBankDetails = w.bankDetails;
              }
            } catch (error) {
              console.error('Failed to parse bank details:', error);
              parsedBankDetails = null;
            }
          }
          
          return {
            ...w,
            bankDetails: parsedBankDetails,
          };
        });
        
        setWithdrawals(withdrawalsList);
        
        // Calculate user statistics from loaded withdrawals
        await calculateUserStats(withdrawalsList);
      }
    } catch (error) {
      showToast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = async (currentWithdrawals: Withdrawal[]) => {
    // Get unique user IDs (not user-currency pairs)
    const userIds = [...new Set(currentWithdrawals.map(w => w.user.id))];
    const stats: Record<string, UserWithdrawalStats> = {};

    console.log('🔍 Calculating stats for users:', userIds);

    // Fetch all approved withdrawals for each user (without currency filter)
    for (const userId of userIds) {
      try {
        const response = await adminApi.getAllWithdrawals({ 
          userId, 
          status: 'APPROVED',
          limit: 1000 
        });
        
        console.log(`📊 Response for user ${userId}:`, response);
        
        if (response.success && response.data) {
          const data = response.data as any;
          const allWithdrawals = Array.isArray(data) ? data : data.data || [];
          
          console.log(`💰 Total withdrawals for user ${userId}:`, allWithdrawals.length);
          
          // Group by currency and calculate stats
          const currencies = [...new Set(currentWithdrawals.filter(w => w.user.id === userId).map(w => w.currency))];
          
          currencies.forEach(currency => {
            const currencyWithdrawals = allWithdrawals.filter((w: any) => w.currency === currency);
            const totalAmount = currencyWithdrawals.reduce((sum: number, w: any) => sum + parseFloat(w.amount || '0'), 0);
            
            const key = `${userId}-${currency}`;
            stats[key] = {
              totalApprovedAmount: totalAmount.toFixed(2),
              totalApprovedCount: currencyWithdrawals.length
            };
            
            console.log(`✅ Stats for ${key}:`, stats[key]);
          });
        } else {
          console.log(`❌ No data for user ${userId}`);
        }
      } catch (error) {
        console.error(`Failed to fetch stats for user ${userId}:`, error);
      }
    }
    
    console.log('📈 Final stats:', stats);
    setUserStats(stats);
  };

  const handleApprove = async (id: string) => {
    if (!selectedWithdrawal || selectedWithdrawal.id !== id) {
      setSelectedWithdrawal(withdrawals.find(w => w.id === id) || null);
      return;
    }

    confirm(
      'Approve Withdrawal',
      'Are you sure you want to approve this withdrawal?',
      async () => {
        setProcessing(id);
        
        // Show processing toast for USDT withdrawals
        const withdrawal = withdrawals.find(w => w.id === id);
        if (withdrawal?.currency === 'USDT') {
          showToast.info('Processing blockchain transaction... This may take a few moments.');
        }
        
        try {
          const response = await adminApi.approveWithdrawal(id, txId || undefined);
          if (response.success) {
            showToast.success('Withdrawal approved successfully');
            loadWithdrawals();
            loadStats();
            setSelectedWithdrawal(null);
            setTxId('');
          } else {
            showToast.error(response.error || 'Failed to approve withdrawal');
          }
        } catch (error) {
          showToast.error('Failed to approve withdrawal');
        } finally {
          setProcessing(null);
        }
      },
      'info'
    );
  };

  const handleReject = async (id: string) => {
    confirm(
      'Reject Withdrawal',
      'Are you sure you want to reject this withdrawal?',
      async () => {
        setProcessing(id);
        try {
          const response = await adminApi.rejectWithdrawal(id);
          if (response.success) {
            showToast.success('Withdrawal rejected successfully');
            loadWithdrawals();
            loadStats();
            setSelectedWithdrawal(null);
          } else {
            showToast.error(response.error || 'Failed to reject withdrawal');
          }
        } catch (error) {
          showToast.error('Failed to reject withdrawal');
        } finally {
          setProcessing(null);
        }
      },
      'danger'
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === withdrawals.filter(w => w.status === 'PENDING').length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(withdrawals.filter(w => w.status === 'PENDING').map(w => w.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      showToast.error('Please select at least one withdrawal to approve');
      return;
    }

    const hasUSDT = withdrawals.some(w => selectedIds.includes(w.id) && w.currency === 'USDT');

    confirm(
      'Approve Selected Withdrawals',
      `Are you sure you want to approve ${selectedIds.length} withdrawal(s)?${hasUSDT ? ' This includes USDT withdrawals that will be processed on blockchain.' : ''}`,
      async () => {
        setBulkProcessing(true);
        if (hasUSDT) {
          showToast.info('Processing blockchain transactions... This may take a few moments.');
        }

        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
          try {
            const response = await adminApi.approveWithdrawal(id);
            if (response.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        if (successCount > 0) {
          showToast.success(`${successCount} withdrawal(s) approved successfully`);
        }
        if (failCount > 0) {
          showToast.error(`${failCount} withdrawal(s) failed to approve`);
        }

        setBulkProcessing(false);
        loadWithdrawals();
        loadStats();
      },
      'info'
    );
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      showToast.error('Please select at least one withdrawal to reject');
      return;
    }

    confirm(
      'Reject Selected Withdrawals',
      `Are you sure you want to reject ${selectedIds.length} withdrawal(s)? Funds will be returned to user wallets.`,
      async () => {
        setBulkProcessing(true);

        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
          try {
            const response = await adminApi.rejectWithdrawal(id);
            if (response.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        if (successCount > 0) {
          showToast.success(`${successCount} withdrawal(s) rejected successfully`);
        }
        if (failCount > 0) {
          showToast.error(`${failCount} withdrawal(s) failed to reject`);
        }

        setBulkProcessing(false);
        loadWithdrawals();
        loadStats();
      },
      'danger'
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Withdrawal Management</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Review and approve withdrawal requests</p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="p-8 text-center">
          <LoadingSpinner />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Withdraw Amount</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              ₹{stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Transactions</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Approved</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.approvedCount}</div>
            <div className="text-xs text-gray-500 mt-1">
              ₹{stats.approvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Rejected</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.rejectedCount}</div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {selectedIds.length} withdrawal(s) selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
              >
                {bulkProcessing && <LoadingSpinner size="sm" />}
                ✓ Approve All
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
              >
                {bulkProcessing && <LoadingSpinner size="sm" />}
                ✗ Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency and Status Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Currency Tabs */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Currency Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrencyFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                currencyFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              All Currencies
            </button>
            <button
              onClick={() => setCurrencyFilter('INR')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                currencyFilter === 'INR'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              💵 INR
            </button>
            <button
              onClick={() => setCurrencyFilter('USDT')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                currencyFilter === 'USDT'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              ₮ USDT
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border ${
                filter === 'PENDING'
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border ${
                filter === 'APPROVED'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border ${
                filter === 'REJECTED'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border ${
                filter === ''
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading withdrawals...</div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No withdrawals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50">
                <tr>
                  {filter === 'PENDING' && (
                    <th className="px-4 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === withdrawals.filter(w => w.status === 'PENDING').length && withdrawals.filter(w => w.status === 'PENDING').length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Withdrawn</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Count</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className={selectedIds.includes(withdrawal.id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}>
                    {filter === 'PENDING' && (
                      <td className="px-4 py-4">
                        {withdrawal.status === 'PENDING' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(withdrawal.id)}
                            onChange={() => handleSelectOne(withdrawal.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user.name || withdrawal.user.email || withdrawal.user.phone}
                        </div>
                        <div className="text-sm text-gray-500">{withdrawal.user.email || withdrawal.user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {withdrawal.currency} {parseFloat(withdrawal.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-green-600 font-semibold">
                        {userStats[`${withdrawal.user.id}-${withdrawal.currency}`]?.totalApprovedAmount ? 
                          `${withdrawal.currency} ${parseFloat(userStats[`${withdrawal.user.id}-${withdrawal.currency}`].totalApprovedAmount).toLocaleString()}` 
                          : 'Loading...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {userStats[`${withdrawal.user.id}-${withdrawal.currency}`]?.totalApprovedCount ?? '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {withdrawal.walletType || withdrawal.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{withdrawal.method}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {withdrawal.bankDetails ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900 text-sm truncate" title={withdrawal.bankDetails.accountName}>
                            {withdrawal.bankDetails.accountName}
                          </p>
                          <p className="font-mono text-xs text-gray-600">
                            A/C: {withdrawal.bankDetails.accountNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {withdrawal.bankDetails.ifscCode}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={withdrawal.bankDetails.bankName}>
                            {withdrawal.bankDetails.bankName}
                          </p>
                          {withdrawal.bankDetails.branchName && (
                            <p className="text-xs text-gray-400 truncate" title={withdrawal.bankDetails.branchName}>
                              {withdrawal.bankDetails.branchName}
                            </p>
                          )}
                        </div>
                      ) : withdrawal.destination ? (
                        <span className="font-mono text-xs break-all">{withdrawal.destination}</span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(withdrawal.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(withdrawal.id)}
                              disabled={processing === withdrawal.id}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                            >
                              {processing === withdrawal.id && <LoadingSpinner size="sm" />}
                              {processing === withdrawal.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(withdrawal.id)}
                              disabled={processing === withdrawal.id}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                            >
                              {processing === withdrawal.id && <LoadingSpinner size="sm" />}
                              {processing === withdrawal.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {withdrawal.txId && (
                          <span className="text-xs text-gray-500 self-center">TX: {withdrawal.txId.substring(0, 10)}...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {selectedWithdrawal && selectedWithdrawal.status === 'PENDING' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 w-[90%] sm:w-[70%] md:w-[50%] lg:w-[40%] xl:w-[30%] shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">Approve Withdrawal</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium">
                  {selectedWithdrawal.currency} {parseFloat(selectedWithdrawal.amount).toLocaleString()}
                </p>
              </div>
              {selectedWithdrawal.bankDetails && (
                <div>
                  <p className="text-sm text-gray-600">Bank Details</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg space-y-1">
                    <p className="font-medium text-gray-900">{selectedWithdrawal.bankDetails.accountName}</p>
                    <p className="font-mono text-sm">{selectedWithdrawal.bankDetails.accountNumber}</p>
                    <p className="text-sm">{selectedWithdrawal.bankDetails.ifscCode}</p>
                    <p className="text-sm text-gray-600">{selectedWithdrawal.bankDetails.bankName}</p>
                    {selectedWithdrawal.bankDetails.branchName && (
                      <p className="text-sm text-gray-500">{selectedWithdrawal.bankDetails.branchName}</p>
                    )}
                  </div>
                </div>
              )}
              {selectedWithdrawal.destination && !selectedWithdrawal.bankDetails && (
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium">{selectedWithdrawal.destination}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(selectedWithdrawal.id)}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setTxId('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title || 'Confirm Action'}
        message={config?.message || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={config?.type || 'warning'}
      />
    </div>
  );
};

export default Withdrawals;
