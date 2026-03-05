import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface Investment {
  id: string;
  amount: string;
  status: string;
  purchaseMethod?: string;
  adminRemarks?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  plan: {
    id: string;
    name: string;
    amount: string;
  };
  authKey?: {
    code: string;
  };
}

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, _setPage] = useState(1);
  const [filter, setFilter] = useState('PENDING');
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    loadInvestments();
  }, [page, filter]);

  const loadInvestments = async () => {
    setLoading(true);
    try {
      const response = filter === 'PENDING'
        ? await adminApi.getPendingInvestments({ page, limit: 20 })
        : await adminApi.getAllInvestments({ page, limit: 20, status: filter === '' ? undefined : filter });
      
      if (response.success && response.data) {
        const data = response.data as any;
        setInvestments(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (investment: Investment) => {
    const userName = investment.user.name || investment.user.email || investment.user.phone;
    const planName = investment.plan?.name || 'N/A';
    const amount = parseFloat(investment.amount).toLocaleString();
    
    confirm(
      'Approve Investment',
      `Are you sure you want to approve this investment?\n\nUser: ${userName}\nPlan: ${planName}\nAmount: $${amount} USDT`,
      async () => {
        setProcessing(investment.id);
        try {
          const response = await adminApi.approveInvestment(investment.id);
          if (response.success) {
            showToast.success('Investment approved successfully');
            loadInvestments();
          } else {
            showToast.error(response.error || 'Failed to approve investment');
          }
        } catch (error) {
          showToast.error('Failed to approve investment');
        } finally {
          setProcessing(null);
        }
      },
      'info'
    );
  };

  const handleReject = async (investment: Investment) => {
    const userName = investment.user.name || investment.user.email || investment.user.phone;
    const planName = investment.plan?.name || 'N/A';
    const amount = parseFloat(investment.amount).toLocaleString();
    
    const reason = prompt(`Reject Investment\n\nUser: ${userName}\nPlan: ${planName}\nAmount: $${amount} USDT\n\nEnter rejection reason (optional):`);
    
    if (reason === null) return; // User cancelled
    
    confirm(
      'Reject Investment',
      `Are you sure you want to reject this investment?\n\nUser: ${userName}\nPlan: ${planName}\nAmount: $${amount} USDT${reason ? `\nReason: ${reason}` : ''}`,
      async () => {
        setProcessing(investment.id);
        try {
          const response = await adminApi.rejectInvestment(investment.id, reason || undefined);
          if (response.success) {
            showToast.success('Investment rejected successfully');
            loadInvestments();
          } else {
            showToast.error(response.error || 'Failed to reject investment');
          }
        } catch (error) {
          showToast.error('Failed to reject investment');
        } finally {
          setProcessing(null);
        }
      },
      'danger'
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPurchaseMethodBadge = (method?: string) => {
    if (!method) return <span className="text-xs text-gray-500">N/A</span>;
    
    const labels: Record<string, string> = {
      ADMIN_REQUEST: 'Admin Request',
      DIRECT_WALLET_INR: 'Direct (INR Wallet)',
      DIRECT_WALLET_USDT: 'Direct (USDT Wallet)',
      AUTH_KEY: 'Auth Key',
    };
    
    const colors: Record<string, string> = {
      ADMIN_REQUEST: 'bg-blue-100 text-blue-800',
      DIRECT_WALLET_INR: 'bg-green-100 text-green-800',
      DIRECT_WALLET_USDT: 'bg-purple-100 text-purple-800',
      AUTH_KEY: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
        {labels[method] || method}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Investment Management</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Review and approve investment requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'COMPLETED' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg ${
              filter === '' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading investments...</div>
        ) : investments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No investments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((investment) => (
                  <tr key={investment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {investment.user.name || investment.user.email || investment.user.phone}
                        </div>
                        <div className="text-sm text-gray-500">{investment.user.email || investment.user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {investment.plan?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${parseFloat(investment.amount).toLocaleString()} USDT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPurchaseMethodBadge(investment.purchaseMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investment.authKey?.code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(investment.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(investment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {investment.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(investment)}
                              disabled={processing === investment.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                            >
                              {processing === investment.id && <LoadingSpinner size="sm" />}
                              {processing === investment.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(investment)}
                              disabled={processing === investment.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                            >
                              {processing === investment.id && <LoadingSpinner size="sm" />}
                              {processing === investment.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
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

export default Investments;

