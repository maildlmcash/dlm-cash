import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface Wallet {
  id: string;
  userId: string;
  user?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  type: string;
  balance: string;
  pending: string;
  locked: boolean;
  currency: string;
}

const Wallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();
  const [adjustForm, setAdjustForm] = useState({
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    description: '',
  });

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllWallets();
      if (response.success && response.data) {
        const data = response.data as any;
        const walletsList = Array.isArray(data) ? data : data.data || [];
        
        // Fetch user details for each wallet
        const walletsWithUsers = await Promise.all(
          walletsList.map(async (wallet: Wallet) => {
            try {
              const userResponse = await adminApi.getUserDetails(wallet.userId);
              if (userResponse.success && userResponse.data) {
                return {
                  ...wallet,
                  user: {
                    email: (userResponse.data as any).email,
                    phone: (userResponse.data as any).phone,
                    name: (userResponse.data as any).name,
                  },
                };
              }
            } catch (error) {
              console.error(`Failed to load user ${wallet.userId}:`, error);
            }
            return wallet;
          })
        );
        
        setWallets(walletsWithUsers);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setAdjustForm({ type: 'credit', amount: '', description: '' });
    setShowAdjustModal(true);
  };

  const handleSubmitAdjust = async () => {
    if (!selectedWallet || !adjustForm.amount) return;

    try {
      const response = await adminApi.adjustWallet(
        selectedWallet.userId,
        selectedWallet.type,
        parseFloat(adjustForm.amount),
        adjustForm.type,
        adjustForm.description
      );
      if (response.success) {
        showToast.success('Wallet adjusted successfully');
        setShowAdjustModal(false);
        loadWallets();
      } else {
        showToast.error(response.error || 'Failed to adjust wallet');
      }
    } catch (error) {
      showToast.error('Failed to adjust wallet');
    }
  };

  const handleFreeze = async (_walletId: string, locked: boolean) => {
    confirm(
      locked ? 'Freeze Wallet' : 'Unfreeze Wallet',
      `Are you sure you want to ${locked ? 'freeze' : 'unfreeze'} this wallet?`,
      () => {
        // This would need backend implementation
        showToast.info('Freeze/unfreeze functionality needs backend implementation');
      },
      'warning'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Wallet Management</h1>
        <p className="text-gray-600 mt-1">View and manage all user wallets</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['INR', 'USDT', 'ROI', 'SALARY', 'BREAKDOWN'].map((type) => {
          const typeWallets = wallets.filter(w => w.type === type);
          const totalBalance = typeWallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);
          const totalPending = typeWallets.reduce((sum, w) => sum + parseFloat(w.pending), 0);
          return (
            <div key={type} className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">{type} Wallet</p>
              <p className="text-xl font-bold text-gray-900">{type === 'USDT' ? 'USDT' : '₹'}{totalBalance.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Pending: {type === 'USDT' ? 'USDT' : '₹'}{totalPending.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Count: {typeWallets.length}</p>
            </div>
          );
        })}
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading wallets...</div>
        ) : wallets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No wallets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {wallet.user?.email || wallet.user?.phone || wallet.userId.substring(0, 8) + '...'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {wallet.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {wallet.currency} {parseFloat(wallet.balance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wallet.currency} {parseFloat(wallet.pending).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {wallet.locked ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Frozen
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdjust(wallet)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleFreeze(wallet.id, !wallet.locked)}
                          className={wallet.locked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}
                        >
                          {wallet.locked ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Adjust Wallet</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Wallet Type</p>
                <p className="font-medium text-gray-900">{selectedWallet.type} - {selectedWallet.currency}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as 'credit' | 'debit' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={adjustForm.description}
                  onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitAdjust}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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

export default Wallets;
