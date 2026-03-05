import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface Deposit {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  proofUrl?: string;
  txId?: string;
  rejectionCount?: number;
  bankAccount?: {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

interface BlockchainDeposit {
  id: string;
  txHash: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  status: string;
  credited: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface UserDepositStats {
  totalApprovedAmount: string;
  totalApprovedCount: number;
}

const Deposits = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, _setPage] = useState(1);
  const [filter, setFilter] = useState('PENDING');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'INR' | 'USDT'>('ALL');
  const [userStats, setUserStats] = useState<Record<string, UserDepositStats>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    loadDeposits();
  }, [page, filter, currencyFilter]);

  const loadDeposits = async () => {
    setLoading(true);
    setSelectedIds([]);
    try {
      const params: any = { page, limit: 20 };
      if (filter !== 'PENDING') params.status = filter;
      if (currencyFilter !== 'ALL') params.currency = currencyFilter;
      
      const response = filter === 'PENDING'
        ? await adminApi.getPendingDeposits(params)
        : await adminApi.getAllDeposits(params);
      
      if (response.success && response.data) {
        const data = response.data as any;
        let regularDeposits = Array.isArray(data) ? data : data.data || [];
        
        // Apply currency filter to regular deposits
        if (currencyFilter !== 'ALL') {
          regularDeposits = regularDeposits.filter((d: Deposit) => d.currency === currencyFilter);
        }
        
        // If filter is PENDING, fetch and merge with blockchain deposits
        if (filter === 'PENDING') {
          try {
            const blockchainResponse = await adminApi.getPendingBlockchainDeposits();
            if (blockchainResponse.success && blockchainResponse.data) {
              const blockchainData = blockchainResponse.data as any;
              const fetchedBlockchainDeposits = blockchainData.deposits || [];
              
              // Convert blockchain deposits to regular deposit format
              const convertedBlockchainDeposits = fetchedBlockchainDeposits.map((bd: BlockchainDeposit): Deposit => ({
                id: bd.id,
                amount: bd.amount,
                currency: 'USDT',
                method: 'BLOCKCHAIN',
                status: bd.status,
                txId: bd.txHash,
                user: {
                  ...bd.user,
                  phone: '',
                },
                createdAt: bd.blockTimestamp,
              }));
              
              // Apply currency filter to blockchain deposits
              const filteredBlockchainDeposits = currencyFilter === 'USDT' || currencyFilter === 'ALL' 
                ? convertedBlockchainDeposits 
                : [];
              
              // Merge and sort by date
              const mergedDeposits = [...regularDeposits, ...filteredBlockchainDeposits]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              
              setDeposits(mergedDeposits);
              await calculateUserStats(mergedDeposits);
            } else {
              setDeposits(regularDeposits);
              await calculateUserStats(regularDeposits);
            }
          } catch (error) {
            console.error('Failed to load blockchain deposits:', error);
            setDeposits(regularDeposits);
            await calculateUserStats(regularDeposits);
          }
        } else {
          setDeposits(regularDeposits);
          await calculateUserStats(regularDeposits);
        }
      }
    } catch (error) {
      console.error('Failed to load deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = async (currentDeposits: Deposit[]) => {
    // Get unique user IDs (not user-currency pairs)
    const userIds = [...new Set(currentDeposits.map(d => d.user.id))];
    const stats: Record<string, UserDepositStats> = {};

    console.log('🔍 Calculating deposit stats for users:', userIds);

    // Fetch all approved deposits for each user (without currency filter)
    for (const userId of userIds) {
      try {
        const response = await adminApi.getAllDeposits({ 
          userId, 
          status: 'APPROVED',
          limit: 1000 
        });
        
        console.log(`📊 Deposit response for user ${userId}:`, response);
        
        if (response.success && response.data) {
          const data = response.data as any;
          const allDeposits = Array.isArray(data) ? data : data.data || [];
          
          console.log(`💰 Total deposits for user ${userId}:`, allDeposits.length);
          
          // Group by currency and calculate stats
          const currencies = [...new Set(currentDeposits.filter(d => d.user.id === userId).map(d => d.currency))];
          
          currencies.forEach(currency => {
            const currencyDeposits = allDeposits.filter((d: any) => d.currency === currency);
            const totalAmount = currencyDeposits.reduce((sum: number, d: any) => sum + parseFloat(d.amount || '0'), 0);
            
            const key = `${userId}-${currency}`;
            stats[key] = {
              totalApprovedAmount: totalAmount.toFixed(2),
              totalApprovedCount: currencyDeposits.length
            };
            
            console.log(`✅ Deposit stats for ${key}:`, stats[key]);
          });
        } else {
          console.log(`❌ No deposit data for user ${userId}`);
        }
      } catch (error) {
        console.error(`Failed to fetch deposit stats for user ${userId}:`, error);
      }
    }
    
    console.log('📈 Final deposit stats:', stats);
    setUserStats(stats);
  };

  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  const handleApprove = async (id: string) => {
    // Check if this is a blockchain deposit
    const deposit = deposits.find(d => d.id === id);
    const isBlockchain = deposit?.method === 'BLOCKCHAIN';
    
    confirm(
      isBlockchain ? 'Approve Blockchain Deposit' : 'Approve Deposit',
      isBlockchain 
        ? 'Are you sure you want to approve this blockchain deposit? The user\'s balance will be credited.'
        : 'Are you sure you want to approve this deposit?',
      async () => {
        setProcessing(id);
        try {
          const response = isBlockchain
            ? await adminApi.approveBlockchainDeposit(id)
            : await adminApi.approveDeposit(id);
          
          if (response.success) {
            showToast.success(isBlockchain ? 'Blockchain deposit approved and credited successfully' : 'Deposit approved successfully');
            loadDeposits();
          } else {
            showToast.error(response.error || 'Failed to approve deposit');
          }
        } catch (error) {
          showToast.error('Failed to approve deposit');
        } finally {
          setProcessing(null);
        }
      },
      'info'
    );
  };

  const handleReject = async (id: string) => {
    // Check if this is a blockchain deposit
    const deposit = deposits.find(d => d.id === id);
    const isBlockchain = deposit?.method === 'BLOCKCHAIN';
    
    confirm(
      isBlockchain ? 'Reject Blockchain Deposit' : 'Reject Deposit',
      'Are you sure you want to reject this deposit?',
      async () => {
        setProcessing(id);
        try {
          const response = isBlockchain
            ? await adminApi.rejectBlockchainDeposit(id)
            : await adminApi.rejectDeposit(id);
          
          if (response.success) {
            showToast.success(isBlockchain ? 'Blockchain deposit rejected successfully' : 'Deposit rejected successfully');
            loadDeposits();
          } else {
            showToast.error(response.error || 'Failed to reject deposit');
          }
        } catch (error) {
          showToast.error('Failed to reject deposit');
        } finally {
          setProcessing(null);
        }
      },
      'danger'
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === deposits.filter(d => d.status === 'PENDING').length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deposits.filter(d => d.status === 'PENDING').map(d => d.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      showToast.error('Please select at least one deposit to approve');
      return;
    }

    const hasBlockchain = deposits.some(d => selectedIds.includes(d.id) && d.method === 'BLOCKCHAIN');

    confirm(
      'Approve Selected Deposits',
      `Are you sure you want to approve ${selectedIds.length} deposit(s)?${hasBlockchain ? ' This includes blockchain deposits that will credit user balances.' : ''}`,
      async () => {
        setBulkProcessing(true);

        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
          try {
            const deposit = deposits.find(d => d.id === id);
            const isBlockchain = deposit?.method === 'BLOCKCHAIN';
            
            const response = isBlockchain
              ? await adminApi.approveBlockchainDeposit(id)
              : await adminApi.approveDeposit(id);
            
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
          showToast.success(`${successCount} deposit(s) approved successfully`);
        }
        if (failCount > 0) {
          showToast.error(`${failCount} deposit(s) failed to approve`);
        }

        setBulkProcessing(false);
        loadDeposits();
      },
      'info'
    );
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      showToast.error('Please select at least one deposit to reject');
      return;
    }

    confirm(
      'Reject Selected Deposits',
      `Are you sure you want to reject ${selectedIds.length} deposit(s)?`,
      async () => {
        setBulkProcessing(true);

        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
          try {
            const deposit = deposits.find(d => d.id === id);
            const isBlockchain = deposit?.method === 'BLOCKCHAIN';
            
            const response = isBlockchain
              ? await adminApi.rejectBlockchainDeposit(id)
              : await adminApi.rejectDeposit(id);
            
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
          showToast.success(`${successCount} deposit(s) rejected successfully`);
        }
        if (failCount > 0) {
          showToast.error(`${failCount} deposit(s) failed to reject`);
        }

        setBulkProcessing(false);
        loadDeposits();
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Deposit Management</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Review and approve deposit requests</p>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {selectedIds.length} deposit(s) selected
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        {/* Currency Type Filters */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Currency Type
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrencyFilter('ALL')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                currencyFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              All Currencies
            </button>
            <button
              onClick={() => setCurrencyFilter('INR')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                currencyFilter === 'INR'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              💵 INR
            </button>
            <button
              onClick={() => setCurrencyFilter('USDT')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
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
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                filter === 'PENDING'
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                filter === 'APPROVED'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
                filter === 'REJECTED'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all ${
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

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading deposits...</div>
        ) : deposits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No deposits found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50">
                <tr>
                  {filter === 'PENDING' && (
                    <th className="px-4 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === deposits.filter(d => d.status === 'PENDING').length && deposits.filter(d => d.status === 'PENDING').length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Deposited</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Count</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits.map((deposit) => (
                  <tr 
                    key={deposit.id} 
                    className={selectedIds.includes(deposit.id) ? 'bg-blue-100 hover:bg-blue-150' : deposit.method === 'BLOCKCHAIN' ? 'hover:bg-purple-50 bg-purple-25' : 'hover:bg-gray-50'}
                  >
                    {filter === 'PENDING' && (
                      <td className="px-4 py-4">
                        {deposit.status === 'PENDING' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(deposit.id)}
                            onChange={() => handleSelectOne(deposit.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {deposit.method === 'BLOCKCHAIN' && <span className="text-purple-600">⛓️</span>}
                          {deposit.user.name || deposit.user.email || deposit.user.phone}
                        </div>
                        <div className="text-sm text-gray-500">{deposit.user.email || deposit.user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {deposit.currency} {parseFloat(deposit.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-green-600 font-semibold">
                        {userStats[`${deposit.user.id}-${deposit.currency}`]?.totalApprovedAmount ? 
                          `${deposit.currency} ${parseFloat(userStats[`${deposit.user.id}-${deposit.currency}`].totalApprovedAmount).toLocaleString()}` 
                          : 'Loading...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {userStats[`${deposit.user.id}-${deposit.currency}`]?.totalApprovedCount ?? '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.method === 'BLOCKCHAIN' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          ⛓️ Blockchain (Sepolia)
                        </span>
                      ) : (
                        <>
                          {deposit.method}
                          {deposit.bankAccount && (
                            <div className="text-xs text-gray-400 mt-1">
                              {deposit.bankAccount.accountName} - {deposit.bankAccount.accountNumber}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {deposit.txId ? (
                        deposit.method === 'BLOCKCHAIN' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {deposit.txId.slice(0, 10)}...{deposit.txId.slice(-8)}
                            </span>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${deposit.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="View on Etherscan"
                            >
                              🔗
                            </a>
                          </div>
                        ) : (
                          <span className="font-mono text-xs">{deposit.txId}</span>
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(deposit.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(deposit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        {deposit.proofUrl && (
                          <a
                            href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '')}/uploads/${deposit.proofUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors w-fit text-sm font-semibold"
                          >
                            📷 View Screenshot
                          </a>
                        )}
                        {deposit.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(deposit.id)}
                              disabled={processing === deposit.id}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                            >
                              {processing === deposit.id && <LoadingSpinner size="sm" />}
                              {processing === deposit.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(deposit.id)}
                              disabled={processing === deposit.id}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                            >
                              {processing === deposit.id && <LoadingSpinner size="sm" />}
                              {processing === deposit.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
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

export default Deposits;
