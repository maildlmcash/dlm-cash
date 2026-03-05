import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';

interface ReferralIncome {
  id: string;
  fromUserId: string;
  toUserId: string;
  level: number;
  amount: string;
  createdAt: string;
}


interface LevelConfig {
  salary: number;
  turnover: number;
  timeline: number;
}

const Referrals = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'income' | 'tree'>('config');
  const [referralIncome, setReferralIncome] = useState<ReferralIncome[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([
    { salary: 100, turnover: 1000, timeline: 30 },
  ]);

  useEffect(() => {
    if (activeTab === 'income') {
      loadReferralIncome();
    }
  }, [activeTab]);

  const loadReferralIncome = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllTransactions({
        type: 'REFERRAL'
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setReferralIncome(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load referral income:', error);
    } finally {
      setLoading(false);
    }
  };


  const addLevelConfig = () => {
    setLevelConfigs([
      ...levelConfigs,
      { salary: 0, turnover: 0, timeline: 30 },
    ]);
  };

  const removeLevelConfig = (index: number) => {
    setLevelConfigs(levelConfigs.filter((_, i) => i !== index));
  };

  const updateLevelConfig = (index: number, field: keyof LevelConfig, value: number) => {
    const updated = [...levelConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setLevelConfigs(updated);
  };

  const saveLevelConfigs = () => {
    // TODO: Implement API call to save level configs
    showToast.success('Level configuration saved successfully');
    console.log('Saving level configs:', levelConfigs);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Referral System</h1>
        <p className="text-gray-600 mt-1">Manage multi-level referral commissions</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Level Config
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${activeTab === 'income'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Referral Income
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${activeTab === 'tree'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Referral Tree
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Progressive Level System */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-300">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-purple-900">💰 Progressive Level System</h2>
                    <p className="text-sm text-purple-700 mt-1">Configure salary levels with turnover requirements and timelines</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addLevelConfig}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                    >
                      + Add Level
                    </button>
                    <button
                      onClick={saveLevelConfigs}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                      💾 Save Config
                    </button>
                  </div>
                </div>

                {levelConfigs.length === 0 ? (
                  <div className="text-center py-8 text-purple-700">
                    <p className="text-lg mb-2">No levels configured</p>
                    <p className="text-sm">Click "Add Level" to create your first level</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {levelConfigs.map((config, index) => (
                      <div key={index} className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-purple-900">Level {index + 1}</h3>
                          <button
                            onClick={() => removeLevelConfig(index)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                          >
                            🗑️ Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Salary */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              💵 Salary Amount (USDT)
                            </label>
                            <input
                              type="number"
                              value={config.salary}
                              onChange={(e) => updateLevelConfig(index, 'salary', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500"
                              min="0"
                              step="1"
                              placeholder="e.g., 100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Paid once when level completed</p>
                          </div>

                          {/* Turnover */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📈 Turnover Required (USDT)
                            </label>
                            <input
                              type="number"
                              value={config.turnover}
                              onChange={(e) => updateLevelConfig(index, 'turnover', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500"
                              min="0"
                              step="1"
                              placeholder="e.g., 1000"
                            />
                            <p className="text-xs text-gray-500 mt-1">Additional investment needed</p>
                          </div>

                          {/* Timeline */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ⏱️ Timeline (Days)
                            </label>
                            <input
                              type="number"
                              value={config.timeline}
                              onChange={(e) => updateLevelConfig(index, 'timeline', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500"
                              min="1"
                              step="1"
                              placeholder="e.g., 30"
                            />
                            <p className="text-xs text-gray-500 mt-1">Days to complete level</p>
                          </div>
                        </div>

                        {/* Level Summary */}
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">
                            <strong>Summary:</strong> User must achieve <strong>${config.turnover}</strong> turnover within <strong>{config.timeline} days</strong> to earn <strong>${config.salary}</strong> salary
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-300">
                  <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How It Works</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>✓ Users progress through levels one by one</li>
                    <li>✓ Each level requires additional turnover (not cumulative)</li>
                    <li>✓ Turnover = investments from direct referrals + their referrals</li>
                    <li>✓ Must complete within timeline or stuck at current level</li>
                    <li>✓ Salary paid to USDT wallet when level completed</li>
                  </ul>
                </div>
              </div>

              {/* Referral Commission Configuration
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-300">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-green-900">🎯 Multi-Level Commission Configuration</h2>
                  <p className="text-sm text-green-700 mt-1">Set commission percentages for referral levels</p>
                </div>
                <div className="space-y-4">
                  {levels.map((level) => (
                    <div key={level.level} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-white border-2 border-green-200 rounded-lg">
                      <div className="w-full sm:w-32">
                        <span className="font-medium text-green-900">Level {level.level}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={level.commissionPercent}
                          onChange={(e) => handleUpdateLevel(level.level, parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div className="w-full sm:w-20 text-left sm:text-right">
                        <span className="text-gray-600 font-medium">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  💾 Save Commission Config
                </button>
              </div> */}
            </div>
          )}

          {activeTab === 'income' && (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xl font-semibold">Referral Income Logs</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
                  Export Report
                </button>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading referral income...</div>
              ) : referralIncome.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No referral income found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">From User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {referralIncome.map((income) => (
                        <tr key={income.id}>
                          <td className="px-4 py-2 text-sm">{income.fromUserId.substring(0, 8)}...</td>
                          <td className="px-4 py-2 text-sm">{income.toUserId.substring(0, 8)}...</td>
                          <td className="px-4 py-2 text-sm">Level {income.level}</td>
                          <td className="px-4 py-2 text-sm font-medium">${parseFloat(income.amount).toLocaleString()} USDT</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {new Date(income.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tree' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Referral Tree Viewer</h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by User ID, Email, Phone, or Referral Code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const searchTerm = (e.target as HTMLInputElement).value;
                      if (!searchTerm) {
                        showToast.warning('Please enter a search term');
                        return;
                      }
                      try {
                        // Search for user and show their referral tree
                        const response = await adminApi.getAllUsers({ search: searchTerm, limit: 1 });
                        if (response.success && response.data) {
                          const data = response.data as any;
                          const users = Array.isArray(data) ? data : data.data || [];
                          if (users.length > 0) {
                            showToast.info(`Found user: ${users[0].name || users[0].email || users[0].phone}\nReferral Code: ${users[0].referralCode}\nTotal Referrals: ${users[0].totalReferralCount}`);
                          } else {
                            showToast.warning('User not found');
                          }
                        }
                      } catch (error) {
                        showToast.error('Failed to search user');
                      }
                    }
                  }}
                />
              </div>
              <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                <p className="mb-2">Enter a user ID, email, phone, or referral code above and press Enter to search</p>
                <p className="text-sm">Referral tree visualization will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Referrals;
