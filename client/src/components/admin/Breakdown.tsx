import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface RefundRequest {
  id: string;
  investmentId: string;
  requestedBy: string;
  amount: string;
  status: string;
  adminRemarks?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  investment?: {
    user?: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    plan?: {
      name: string;
    };
    amount: string;
    roiEarned: string;
  };
}

const Breakdown = () => {
  const [deductionPercent, setDeductionPercent] = useState(20);
  const [refundTimeline, setRefundTimeline] = useState(30);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    loadSettings();
    loadRefundRequests();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminApi.getBreakdownSettings();
      if (response.success && response.data) {
        const data = response.data as any;
        setDeductionPercent(data.deductionPercentage || 20);
        setRefundTimeline(data.refundTimelineDays || 30);
      }
    } catch (error) {
      console.error('Failed to load breakdown settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRefundRequests = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter.toUpperCase();
      const response = await adminApi.getAllRefundRequests({ status });
      if (response.success && response.data) {
        const data = response.data as any;
        const requests = Array.isArray(data) ? data : data.data || [];
        setRefundRequests(requests.filter((r: RefundRequest) => r.status === 'PENDING' || r.status === 'APPROVED'));
      }
    } catch (error) {
      console.error('Failed to load refund requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefundRequests();
  }, [filter]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await adminApi.saveBreakdownSettings({
        deductionPercentage: deductionPercent,
        refundTimelineDays: refundTimeline,
      });
      if (response.success) {
        showToast.success('Breakdown settings saved successfully');
      } else {
        showToast.error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRefund = async (id: string) => {
    confirm(
      'Approve Refund Request',
      'Are you sure you want to approve this refund request? The user will be able to withdraw from breakdown wallet.',
      async () => {
        setProcessing(id);
        try {
          const response = await adminApi.approveRefundRequest(id);
          if (response.success) {
            showToast.success('Refund request approved successfully');
            loadRefundRequests();
          } else {
            showToast.error(response.error || 'Failed to approve refund request');
          }
        } catch (error) {
          showToast.error('Failed to approve refund request');
        } finally {
          setProcessing(null);
        }
      },
      'info'
    );
  };

  const handleRejectRefund = async (id: string) => {
    confirm(
      'Reject Refund Request',
      'Are you sure you want to reject this refund request? The investment will be reactivated and pending ROI will be credited.',
      async () => {
        setProcessing(id);
        try {
          const response = await adminApi.rejectRefundRequest(id);
          if (response.success) {
            showToast.success('Refund request rejected successfully');
            loadRefundRequests();
          } else {
            showToast.error(response.error || 'Failed to reject refund request');
          }
        } catch (error) {
          showToast.error('Failed to reject refund request');
        } finally {
          setProcessing(null);
        }
      },
      'danger'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Breakdown Management</h1>
        <p className="text-gray-600 mt-1">Manage breakdown deductions and refund requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Breakdown Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deduction Percentage (%)
              </label>
              <input
                type="number"
                value={deductionPercent}
                onChange={(e) => setDeductionPercent(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                This percentage will be deducted from investment breakdown amount
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Timeline (Days)
              </label>
              <input
                type="number"
                value={refundTimeline}
                onChange={(e) => setRefundTimeline(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of days before refund can be processed
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <LoadingSpinner size="sm" /> : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Refund Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Refund Requests</h2>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-sm rounded ${filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : refundRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No refund requests</div>
          ) : (
            <div className="space-y-4">
              {refundRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Request #{request.id.substring(0, 8)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.investment?.user && (
                    <div className="text-sm text-gray-600 mb-1">
                      User: {request.investment.user.name || request.investment.user.email}
                    </div>
                  )}
                  {request.investment?.plan && (
                    <div className="text-sm text-gray-600 mb-1">
                      Plan: {request.investment.plan.name}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-1">
                    Amount: ${parseFloat(request.amount).toLocaleString()} USDT
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Requested: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  {request.status === 'PENDING' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleApproveRefund(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing === request.id ? <LoadingSpinner size="sm" /> : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectRefund(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        {processing === request.id ? <LoadingSpinner size="sm" /> : 'Reject'}
                      </button>
                    </div>
                  )}
                  {request.adminRemarks && (
                    <p className="text-xs text-red-600 mt-2">Remarks: {request.adminRemarks}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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

export default Breakdown;
