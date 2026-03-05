import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ROILog {
  id: string;
  userId: string;
  investmentId: string;
  amount: string;
  status: string;
  createdAt: string;
}

interface SalaryLog {
  id: string;
  userId: string;
  amount: string;
  periodFrom: string;
  periodTo: string;
  remarks?: string;
  createdAt: string;
}

const ROISalary = () => {
  const [activeTab, setActiveTab] = useState<'roi' | 'salary' | 'settings' | 'boost'>('roi');
  const [roiLogs, setRoiLogs] = useState<ROILog[]>([]);
  const [salaryLogs, setSalaryLogs] = useState<SalaryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, _setPage] = useState(1);
  const [minReferralsForBoost, setMinReferralsForBoost] = useState(0);
  const [savingBoost, setSavingBoost] = useState(false);
  interface SalaryLevel {
    days: number;
    turnoverAmount: number;
    salaryIncomeAmount: number;
    salaryPaymentTimes: number;
  }

  interface SalaryRule {
    freeReferralCount: number;
    paidReferralCount: number;
    levels: SalaryLevel[];
  }

  const [salarySettings, setSalarySettings] = useState<{
    qualificationTimeLimitHours: number;
    freeUser: SalaryRule;
    paidUser: SalaryRule;
  }>({
    qualificationTimeLimitHours: 72,
    freeUser: {
      freeReferralCount: 0,
      paidReferralCount: 0,
      levels: [],
    },
    paidUser: {
      freeReferralCount: 0,
      paidReferralCount: 0,
      levels: [],
    },
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (activeTab === 'roi') {
      loadROILogs();
    } else if (activeTab === 'salary') {
      loadSalaryLogs();
    } else if (activeTab === 'settings') {
      loadSalarySettings();
    } else if (activeTab === 'boost') {
      loadBoostSettings();
    }
  }, [activeTab, page]);

  const loadBoostSettings = async () => {
    try {
      const response = await adminApi.getROIBoostSettings();
      if (response.success && response.data) {
        const data = response.data as any;
        setMinReferralsForBoost(data.minReferralsForBoost || 0);
      }
    } catch (error) {
      console.error('Failed to load boost settings:', error);
    }
  };

  const saveBoostSettings = async () => {
    setSavingBoost(true);
    try {
      const response = await adminApi.updateROIBoostSettings({
        minReferralsForBoost,
      });
      if (response.success) {
        showToast.success('ROI Boost settings saved successfully');
      } else {
        showToast.error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      showToast.error('Failed to save boost settings');
    } finally {
      setSavingBoost(false);
    }
  };

  const loadSalarySettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await adminApi.getSalarySettings();
      if (response.success && response.data) {
        const data = response.data as any;
        // Ensure levels arrays exist and have proper structure
        const freeUserLevels = (data.freeUser?.levels || []).map((level: any) => ({
          days: level.days || 30,
          turnoverAmount: level.turnoverAmount || 0,
          salaryIncomeAmount: level.salaryIncomeAmount || 0,
          salaryPaymentTimes: level.salaryPaymentTimes || 1,
        }));
        const paidUserLevels = (data.paidUser?.levels || []).map((level: any) => ({
          days: level.days || 30,
          turnoverAmount: level.turnoverAmount || 0,
          salaryIncomeAmount: level.salaryIncomeAmount || 0,
          salaryPaymentTimes: level.salaryPaymentTimes || 1,
        }));

        setSalarySettings({
          qualificationTimeLimitHours: data.qualificationTimeLimitHours || 72,
          freeUser: {
            freeReferralCount: data.freeUser?.freeReferralCount || 0,
            paidReferralCount: data.freeUser?.paidReferralCount || 0,
            levels: freeUserLevels,
          },
          paidUser: {
            freeReferralCount: data.paidUser?.freeReferralCount || 0,
            paidReferralCount: data.paidUser?.paidReferralCount || 0,
            levels: paidUserLevels,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load salary settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSalarySettings = async () => {
    setSavingSettings(true);
    try {
      const response = await adminApi.saveSalarySettings(salarySettings);
      if (response.success) {
        showToast.success('Salary settings saved successfully');
      } else {
        showToast.error(response.error || 'Failed to save salary settings');
      }
    } catch (error) {
      showToast.error('Failed to save salary settings');
    } finally {
      setSavingSettings(false);
    }
  };


  const loadROILogs = async () => {
    setLoading(true);
    try {
      // This would need to be implemented in backend
      // For now, using transactions filtered by ROI_CREDIT type
      const response = await adminApi.getAllTransactions({
        page,
        limit: 20,
        type: 'ROI_CREDIT'
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setRoiLogs(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load ROI logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryLogs = async () => {
    setLoading(true);
    try {
      // This would need to be implemented in backend
      // For now, using transactions filtered by SALARY_CREDIT type
      const response = await adminApi.getAllTransactions({
        page,
        limit: 20,
        type: 'SALARY_CREDIT'
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setSalaryLogs(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load salary logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">ROI & Salary Management</h1>
        <p className="text-gray-600 mt-1">Manage ROI credits and salary income</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('boost')}
              className={`px-6 py-3 border-b-2 font-medium text-sm cursor-pointer ${activeTab === 'boost'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              🚀 ROI Boost
            </button>
            <button
              onClick={() => setActiveTab('roi')}
              className={`px-6 py-3 border-b-2 font-medium text-sm cursor-pointer ${activeTab === 'roi'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              ROI Logs
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-6 py-3 border-b-2 font-medium text-sm cursor-pointer ${activeTab === 'salary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Salary Logs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 border-b-2 font-medium text-sm cursor-pointer ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'roi' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">ROI Credit Logs</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Configure ROI Rules
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Manual ROI Credit
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading ROI logs...</div>
              ) : roiLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No ROI logs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roiLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2 text-sm">{log.userId.substring(0, 8)}...</td>
                          <td className="px-4 py-2 text-sm font-medium">₹{parseFloat(log.amount).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button className="text-blue-600 hover:text-blue-900 cursor-pointer">Re-credit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'salary' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Salary Income Logs</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Configure Salary Rules
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Manual Salary Adjustment
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading salary logs...</div>
              ) : salaryLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No salary logs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salaryLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2 text-sm">{log.userId.substring(0, 8)}...</td>
                          <td className="px-4 py-2 text-sm font-medium">₹{parseFloat(log.amount).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {new Date(log.periodFrom).toLocaleDateString()} - {new Date(log.periodTo).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">{log.remarks || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Salary Configuration</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Configure qualification rules for salary income. Users must meet referral count requirement (free OR paid) and qualify for at least one level based on turnover.
                </p>

                {loadingSettings ? (
                  <div className="p-8 text-center text-gray-500">Loading settings...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Global Qualification Time Limit */}
                    <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
                      <h3 className="text-xl font-semibold mb-3 text-yellow-800">⏰ Qualification Time Limit</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Set the time window (in hours) from user signup date within which users must meet the qualification requirements.
                        After this time expires, users will be <strong>permanently disqualified</strong> from earning salary, even if they meet requirements later.
                      </p>
                      <div className="max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Limit (Hours)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={salarySettings.qualificationTimeLimitHours}
                          onChange={(e) => setSalarySettings({
                            ...salarySettings,
                            qualificationTimeLimitHours: parseInt(e.target.value) || 1
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Default: 72 hours (3 days). Users have this time from signup to qualify.
                        </p>
                      </div>
                    </div>

                    {/* Free User Configuration */}
                    <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                      <h3 className="text-xl font-semibold mb-4 text-green-800">Free User Configuration</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        If user is free (not verified), they need to have free referral count OR paid referral count more than set values.
                      </p>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Free Referral Count (More than)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={salarySettings.freeUser.freeReferralCount}
                              onChange={(e) => setSalarySettings({
                                ...salarySettings,
                                freeUser: {
                                  ...salarySettings.freeUser,
                                  freeReferralCount: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Paid Referral Count (More than)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={salarySettings.freeUser.paidReferralCount}
                              onChange={(e) => setSalarySettings({
                                ...salarySettings,
                                freeUser: {
                                  ...salarySettings.freeUser,
                                  paidReferralCount: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                          <p className="text-sm text-green-800">
                            <strong>🔗 Note:</strong> Salary levels are managed in the <strong>Referrals → Level Config</strong> page.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Paid User Configuration */}
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <h3 className="text-xl font-semibold mb-4 text-blue-800">Paid User Configuration</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        If user is paid (verified), they need to have free referral count OR paid referral count more than set values.
                      </p>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Free Referral Count (More than)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={salarySettings.paidUser.freeReferralCount}
                              onChange={(e) => setSalarySettings({
                                ...salarySettings,
                                paidUser: {
                                  ...salarySettings.paidUser,
                                  freeReferralCount: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Paid Referral Count (More than)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={salarySettings.paidUser.paidReferralCount}
                              onChange={(e) => setSalarySettings({
                                ...salarySettings,
                                paidUser: {
                                  ...salarySettings.paidUser,
                                  paidReferralCount: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            <strong>🔗 Note:</strong> Salary levels are managed in the <strong>Referrals → Level Config</strong> page.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSalarySettings}
                      disabled={savingSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                    >
                      {savingSettings && <LoadingSpinner size="sm" />}
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'boost' && (
            <div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">🚀 ROI Boost Settings</h2>
                  <p className="text-gray-600 text-sm">
                    Configure the minimum number of total referrals required for users to qualify for ROI boost income.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">ℹ️ How ROI Boost Works</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>When a user reaches the minimum referral count, they become qualified for ROI boost</li>
                    <li>Qualified users earn a percentage of their referrals' ROI payouts</li>
                    <li>The boost percentage is set per plan (in the Plans page)</li>
                    <li>If a referral requests breakdown, their ROI stops, and the parent's boost also stops</li>
                    <li>If breakdown is cancelled, both ROI and boost resume</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Total Referrals Required
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Users must have at least this many total referrals (free + paid) to qualify for ROI boost income
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={minReferralsForBoost}
                    onChange={(e) => setMinReferralsForBoost(parseInt(e.target.value) || 0)}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10"
                  />
                </div>

                <button
                  onClick={saveBoostSettings}
                  disabled={savingBoost}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {savingBoost && <LoadingSpinner size="sm" />}
                  {savingBoost ? 'Saving...' : 'Save Boost Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ROISalary;
