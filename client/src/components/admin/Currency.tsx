import { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';
import { adminApi } from '../../services/adminApi';
import LoadingSpinner from '../common/LoadingSpinner';

const Currency = () => {
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [autoFetch, setAutoFetch] = useState(true);
  const [fetchingFromMoralis, setFetchingFromMoralis] = useState(false);
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    loadCurrencyRate();
  }, []);

  // Auto-fetch from Moralis every 5 seconds when auto-fetch is enabled
  useEffect(() => {
    if (!autoFetch) return;

    // Fetch immediately on mount when auto-fetch is enabled
    fetchFromMoralis();

    // Set up interval to fetch every 5 seconds
    const interval = setInterval(() => {
      fetchFromMoralis();
    }, 5000);

    // Cleanup interval on unmount or when auto-fetch is disabled
    return () => clearInterval(interval);
  }, [autoFetch]);

  const loadCurrencyRate = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCurrencyRate();
      if (response.success && response.data) {
        const data = response.data as any;
        setRate(parseFloat(data.rate));
        setAutoFetch(data.source === 'moralis');
      }
    } catch (error) {
      showToast.error('Failed to load currency rate');
    } finally {
      setLoading(false);
    }
  };

  const fetchFromMoralis = async () => {
    try {
      setFetchingFromMoralis(true);
      const response = await adminApi.fetchMoralisRate();
      if (response.success && response.data) {
        const data = response.data as any;
        setRate(parseFloat(data.rate));
        setAutoFetch(true);
      } else {
        setAutoFetch(false);
      }
    } catch (error) {
      setAutoFetch(false);
    } finally {
      setFetchingFromMoralis(false);
    }
  };

  const handleUpdateRate = () => {
    if (!rate || rate <= 0) {
      showToast.error('Please enter a valid rate');
      return;
    }

    confirm(
      'Update Currency Rate',
      `Are you sure you want to update the currency rate to ₹${rate.toFixed(2)} per USDT manually?`,
      async () => {
        try {
          const response = await adminApi.updateCurrencyRate({ rate, source: 'manual' });
          if (response.success) {
            showToast.success('Currency rate updated successfully');
            setAutoFetch(false);
            loadCurrencyRate();
          } else {
            showToast.error(response.error || 'Failed to update rate');
          }
        } catch (error) {
          showToast.error('An error occurred while updating rate');
        }
      },
      'info'
    );
  };

  const handleToggleAutoFetch = () => {
    if (autoFetch) {
      // Switching to manual mode
      confirm(
        'Switch to Manual Mode',
        'Are you sure you want to stop automatic rate fetching from Moralis? You will need to update the rate manually.',
        () => {
          setAutoFetch(false);
          showToast.info('Switched to manual mode');
        },
        'warning'
      );
    } else {
      // Switching to auto mode - fetch from Moralis
      confirm(
        'Resume Auto Fetch',
        'Do you want to fetch the latest rate from Moralis and enable automatic updates?',
        () => {
          fetchFromMoralis();
        },
        'info'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Currency Converter</h1>
        <p className="text-gray-600 mt-1">Manage INR ⇄ USDT exchange rates</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Rate */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Current Exchange Rate</h2>
              <div className="space-y-4">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">INR to USDT</p>
                  <p className="text-4xl font-bold text-blue-600">₹{rate.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-2">1 USDT = ₹{rate.toFixed(2)}</p>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      autoFetch 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {autoFetch ? 'Auto-fetched from Moralis' : 'Manual Override'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {!autoFetch && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manual Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rate}
                          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter rate"
                        />
                      </div>
                      <button
                        onClick={handleUpdateRate}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Update Rate Manually
                      </button>
                    </>
                  )}
                  {autoFetch && (
                    <button
                      onClick={fetchFromMoralis}
                      disabled={fetchingFromMoralis}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {fetchingFromMoralis ? 'Fetching...' : 'Fetch Latest from Moralis'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-Fetch Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Rate Source Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto-Fetch from Moralis</p>
                    <p className="text-sm text-gray-500">Updates every 5 seconds automatically</p>
                  </div>
                  <button
                    onClick={handleToggleAutoFetch}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoFetch ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoFetch ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Auto-Fetch Mode:</strong> The system fetches the latest exchange rate from Moralis API every 5 seconds.
                  </p>
                  <p>
                    <strong>Manual Mode:</strong> You can set and update the rate manually as needed.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium text-sm">Current Mode</p>
                  <p className="text-blue-700 text-xs mt-1">
                    {autoFetch 
                      ? 'Rates are automatically fetched every 5 seconds. Switch to manual mode if you need to override the rate.'
                      : 'You are using manual rate entry. Switch to auto-fetch mode to use live rates from Moralis.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
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

export default Currency;
