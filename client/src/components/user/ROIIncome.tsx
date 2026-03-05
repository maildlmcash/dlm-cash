import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  createdAt: string;
  wallet?: {
    type: string;
  };
}

interface ROIIncomeData {
  transactions: Transaction[];
  totals: {
    roi: string;
    salary: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ROIIncome = () => {
  const { type } = useParams<{ type: string }>();
  const [data, setData] = useState<ROIIncomeData | null>(null);
  const [boostData, setBoostData] = useState<any>(null);
  const [referralData, setReferralData] = useState<any>(null);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [incomeType, setIncomeType] = useState<'ROI' | 'SALARY' | undefined>(
    type === 'roi' ? 'ROI' : type === 'salary' ? 'SALARY' : undefined
  );

  useEffect(() => {
    if (type === 'boost') {
      loadBoostData();
    } else if (type === 'referral') {
      loadReferralData();
    } else if (type === 'salary') {
      loadSalaryData();
    } else {
      loadROIIncome();
    }
  }, [page, incomeType, type]);

  const loadBoostData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getROIBoost({ page, limit: 20 });
      if (response.success && response.data) {
        setBoostData(response.data);
      } else {
        showToast.error(response.error || 'Failed to load ROI boost data');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getDirectReferralIncome({ page, limit: 20 });
      if (response.success && response.data) {
        setReferralData(response.data);
      } else {
        showToast.error(response.error || 'Failed to load referral income data');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getSalaryIncome({ page, limit: 20 });
      if (response.success && response.data) {
        setSalaryData(response.data);
      } else {
        showToast.error(response.error || 'Failed to load salary data');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadROIIncome = async () => {
    try {
      setLoading(true);
      const response = await userApi.getROIIncome({
        page,
        limit: 20,
        type: incomeType,
      });

      if (response.success && response.data) {
        setData(response.data as ROIIncomeData);
      } else {
        showToast.error(response.error || 'Failed to load ROI & Income data');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string = 'INR') => {
    const num = parseFloat(amount || '0');
    if (currency === 'USDT') {
      return `$${num.toFixed(2)} USDT`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  if (type === 'salary') {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            💰 Salary Income
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Progressive salary system based on your network's investment turnover</p>
        </motion.div>

        {/* Not Yet Qualified - User hasn't met requirements but time still available */}
        {salaryData?.levelStatus === 'NOT_STARTED' && !salaryData?.meetsReferralRequirement && !salaryData?.qualificationTimeExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <GlassCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-400">
              <div className="flex items-start gap-4">
                <div className="text-6xl">⏰</div>
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-orange-900 mb-2">
                    🎯 Complete Requirements to Start Earning Salary
                  </h2>
                  <p className="text-xs sm:text-sm text-orange-700 mb-3">
                    You need to meet the basic referral requirements to qualify for the salary income system.
                  </p>

                  <div className="bg-orange-100 rounded-lg p-3 sm:p-4 border border-orange-300 mb-3">
                    <h3 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">📋 Requirements to Qualify:</h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-orange-800">
                      <li className="flex items-start gap-2">
                        <span className="text-base">👥</span>
                        <div>
                          <strong>Referral Requirement ({salaryData.userType} User):</strong>
                          <p className="text-xs mt-1">
                            You need at least <strong>{salaryData.requiredReferrals?.free || 0} free (unverified) referrals</strong> OR <strong>{salaryData.requiredReferrals?.paid || 0} paid (verified) referrals</strong>
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-base">⏱️</span>
                        <div>
                          <strong>Time Limit:</strong>
                          <p className="text-xs mt-1">
                            Must be achieved within <strong>{salaryData.qualificationTimeLimitHours} hours</strong> ({Math.floor(salaryData.qualificationTimeLimitHours / 24)} days) from your account creation
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {salaryData.qualificationTimeRemainingHours !== undefined && salaryData.qualificationTimeRemainingHours > 0 && (
                    <div className="bg-white rounded-lg p-3 border-2 border-orange-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Time Remaining to Qualify</p>
                          <p className="text-base sm:text-lg font-bold text-orange-600">
                            {(() => {
                              const hoursRemaining = salaryData.qualificationTimeRemainingHours;
                              const days = Math.floor(hoursRemaining / 24);
                              const hours = Math.floor(hoursRemaining % 24);
                              if (days > 0) {
                                return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
                              }
                              return `${Math.round(hoursRemaining)} hour${Math.round(hoursRemaining) !== 1 ? 's' : ''}`;
                            })()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Act quickly to secure your salary income eligibility!</p>
                        </div>
                        <div className="text-5xl">⏳</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-300">
                    <p className="text-sm text-blue-800">
                      💡 <strong>How to Qualify:</strong> Share your referral link with friends and family. Once they sign up using your link, they become your referrals. Get verified users to invest for paid referrals.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Disqualified Message - User exceeded qualification time limit */}
        {(salaryData?.qualificationTimeExpired || salaryData?.levelStatus === 'DISQUALIFIED') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <GlassCard className="bg-gradient-to-br from-red-50 to-rose-50 border-red-400">
              <div className="flex items-start gap-4">
                <div className="text-6xl">❌</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-red-900 mb-2">
                    Salary Income - Permanently Disqualified
                  </h2>
                  <p className="text-red-700 mb-4">
                    Unfortunately, you have exceeded the qualification time limit of <strong>{salaryData.qualificationTimeLimitHours} hours</strong> ({Math.floor(salaryData.qualificationTimeLimitHours / 24)} days) from your account creation without meeting the basic requirements.
                  </p>
                  <div className="bg-red-100 rounded-lg p-5 border border-red-300">
                    <h3 className="font-semibold text-red-900 mb-3">❌ Requirements Not Met:</h3>
                    <ul className="space-y-2 text-sm text-red-800">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <div>
                          <strong>Referral Requirement:</strong> Need at least <strong>{salaryData.requiredReferrals?.free || 0} free referrals</strong> OR <strong>{salaryData.requiredReferrals?.paid || 0} paid referrals</strong>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <div>
                          <strong>Time Limit:</strong> Must be achieved within <strong>{salaryData.qualificationTimeLimitHours} hours</strong> ({Math.floor(salaryData.qualificationTimeLimitHours / 24)} days) of signup
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <div>
                          <strong>Your Status:</strong> <span className="font-bold text-red-900">⏰ Time Expired - Permanently Disqualified</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 bg-white rounded-lg p-4 border-2 border-red-300">
                    <p className="text-sm text-red-700 font-semibold mb-2">⚠️ What This Means:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      <li>• You cannot participate in the salary income system</li>
                      <li>• This decision is permanent and cannot be reversed</li>
                      <li>• You can still earn through ROI, referral commissions, and boost income</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded p-3 border border-gray-300">
                    💡 <strong>Note:</strong> The salary system requires early qualification to ensure active participation. Focus on other earning opportunities available in your dashboard.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* No Levels Configured - Admin hasn't set up salary levels yet */}
        {!salaryData?.qualificationTimeExpired && salaryData?.levelStatus !== 'DISQUALIFIED' &&
          salaryData?.totalLevelsAvailable === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <GlassCard className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400">
                <div className="flex items-start gap-4">
                  <div className="text-6xl">🚧</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-yellow-900 mb-2">
                      Salary System Configuration In Progress
                    </h2>
                    <p className="text-yellow-700 mb-4">
                      The salary income system is being set up by the administrators. Salary levels are not yet configured.
                    </p>

                    {salaryData?.meetsReferralRequirement ? (
                      <div className="bg-green-100 rounded-lg p-5 border border-green-300 mb-4">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <span>✅</span> You've Already Qualified!
                        </h3>
                        <p className="text-sm text-green-800">
                          Great news! You meet the referral requirements. Once the admin configures salary levels, you'll be able to start earning immediately.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-100 rounded-lg p-5 border border-blue-300 mb-4">
                        <h3 className="font-semibold text-blue-900 mb-3">📋 Your Current Status:</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li>• <strong>User Type:</strong> {salaryData.userType}</li>
                          <li>• <strong>Required:</strong> {salaryData.requiredReferrals?.free || 0} free referrals OR {salaryData.requiredReferrals?.paid || 0} paid referrals</li>
                          <li>• <strong>Time Remaining:</strong> {salaryData.qualificationTimeRemainingHours !== undefined ?
                            (() => {
                              const hours = salaryData.qualificationTimeRemainingHours;
                              const days = Math.floor(hours / 24);
                              const remainingHours = Math.floor(hours % 24);
                              if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
                              return `${Math.round(hours)} hour${Math.round(hours) !== 1 ? 's' : ''}`;
                            })() : 'N/A'}</li>
                        </ul>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
                      <p className="text-sm text-gray-700">
                        💡 <strong>What to do:</strong> Keep referring users to meet the qualification requirements while the admin sets up the salary levels. Once configured, qualified users can start earning salary income.
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

        {/* Overall Stats - Only show if not disqualified AND levels are configured */}
        {!salaryData?.qualificationTimeExpired && salaryData?.levelStatus !== 'DISQUALIFIED' &&
          salaryData?.totalLevelsAvailable > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <GlassCard className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300">
                    <p className="text-xs text-gray-600 mb-1">Current Level</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-600">
                      {salaryData?.currentLevel === 0 ? 'Not Started' : `Level ${salaryData?.currentLevel}`}
                    </p>
                  </GlassCard>
                  <GlassCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
                    <p className="text-xs text-gray-600 mb-1">Total Salary Earned</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600">
                      ${(salaryData?.totalSalaryCredited || 0).toFixed(2)}
                    </p>
                  </GlassCard>
                  <GlassCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
                    <p className="text-xs text-gray-600 mb-1">Levels Completed</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-600">
                      {salaryData?.levelsCompleted || 0} / {salaryData?.totalLevelsAvailable || 0}
                    </p>
                  </GlassCard>
                  <GlassCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300">
                    <p className="text-xs text-gray-600 mb-1">User Type</p>
                    <p className="text-lg sm:text-xl font-bold text-orange-600">
                      {salaryData?.userType || 'N/A'}
                    </p>
                  </GlassCard>
                </div>
              </motion.div>

              {/* Current Level Progress */}
              {salaryData?.currentLevelInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <GlassCard className={`${salaryData.levelStatus === 'TIMELINE_EXPIRED'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    }`}>
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Level {salaryData.currentLevelInfo.level} Progress
                          </h2>
                          <p className="text-gray-600 mt-1">
                            {salaryData.levelStatus === 'TIMELINE_EXPIRED'
                              ? '⏱️ Timeline expired - No more progress possible for this level'
                              : `Complete this level to earn $${salaryData.currentLevelInfo.salaryAmount.toFixed(2)} USDT`}
                          </p>
                        </div>
                        {!salaryData.currentLevelInfo.timelineExpired && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Days Remaining</p>
                            <p className="text-3xl font-bold text-orange-600">
                              {salaryData.currentLevelInfo.daysRemaining !== null
                                ? salaryData.currentLevelInfo.daysRemaining
                                : '—'}
                            </p>
                            <p className="text-xs text-gray-500">
                              of {salaryData.currentLevelInfo.timelineDays} days
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Investment Turnover</span>
                        <span className="text-sm font-medium text-gray-700">
                          {salaryData.currentLevelInfo.progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, salaryData.currentLevelInfo.progressPercentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>${salaryData.currentLevelInfo.turnoverAchieved.toFixed(2)} achieved</span>
                        <span>${salaryData.currentLevelInfo.turnoverRequired.toFixed(2)} required</span>
                      </div>
                    </div>

                    {/* Investment Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Investment Done</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${salaryData.currentLevelInfo.turnoverAchieved.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          From your referrals & their referrals
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Investment Left</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ${salaryData.currentLevelInfo.turnoverRemaining.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          To complete this level
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Level Salary</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${salaryData.currentLevelInfo.salaryAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Paid to USDT wallet when complete
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Next Level Info */}
              {salaryData?.nextLevelInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <GlassCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">🎯 Next Level: Level {salaryData.nextLevelInfo.level}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Turnover Required</p>
                        <p className="text-xl font-bold text-blue-600">
                          ${salaryData.nextLevelInfo.turnoverRequired.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Salary Amount</p>
                        <p className="text-xl font-bold text-green-600">
                          ${salaryData.nextLevelInfo.salaryAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Timeline</p>
                        <p className="text-xl font-bold text-orange-600">
                          {salaryData.nextLevelInfo.timelineDays} days
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Salary Transaction History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <GlassCard>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">💸 Salary Payment History</h2>

                  {!salaryData?.salaryLogs || salaryData.salaryLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-6xl mb-4">📋</p>
                      <p className="text-gray-600 text-lg">No salary payments yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Complete your first level to receive salary payment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {salaryData.salaryLogs.map((log: any) => (
                        <div key={log.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gray-900 mb-1">Level {log.level} Completed 🎉</p>
                              <p className="text-sm text-gray-600">Turnover: ${log.turnoverAchieved.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(log.periodFrom).toLocaleDateString()} - {new Date(log.periodTo).toLocaleDateString()}
                              </p>
                              {log.remarks && (
                                <p className="text-xs text-gray-600 mt-1">{log.remarks}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                +${log.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">USDT</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>

              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <GlassCard className="bg-purple-50 border-purple-300">
                  <h3 className="text-xl font-bold text-purple-900 mb-3">ℹ️ How Salary System Works</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Progressive Levels:</strong> Complete levels one by one to earn increasing salaries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Per-Level Turnover:</strong> Each level requires additional investment turnover (not cumulative)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Turnover Source:</strong> Sum of all investments from your direct referrals + their direct referrals since level started</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Timeline:</strong> Each level has its own deadline - achieve turnover within that time or stay at current level</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Payment:</strong> Salary paid once per level to your USDT wallet when you meet the turnover requirement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Requirements:</strong> Need minimum {salaryData?.requiredReferrals?.free || 0} free or {salaryData?.requiredReferrals?.paid || 0} paid referrals to start</span>
                    </li>
                  </ul>
                </GlassCard>
              </motion.div>
            </>
          )}
      </div>
    );
  }

  if (type === 'boost') {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            🚀 ROI Boost Income
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Earn extra income from your referrals' ROI payouts</p>
        </motion.div>

        {/* Qualification Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className={`${boostData?.isQualified ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {boostData?.isQualified ? '✅ Qualified for ROI Boost!' : '⏳ Not Yet Qualified'}
                </h2>
                <p className="text-gray-700">
                  {boostData?.isQualified
                    ? 'You are earning boost income from your referrals\' ROI payouts!'
                    : `You need ${boostData?.minReferralsRequired || 0} total referrals to qualify. You currently have ${boostData?.currentReferralCount || 0}.`
                  }
                </p>
              </div>
              <div className="text-6xl">
                {boostData?.isQualified ? '🎉' : '🎯'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Current Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{boostData?.currentReferralCount || 0}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Required Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{boostData?.minReferralsRequired || 0}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Boost Earned</p>
                <p className="text-2xl font-bold text-green-600">${parseFloat(boostData?.totalBoostEarned || '0').toFixed(2)} USDT</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Referrals with Breakdown Warning - Only show if user is qualified */}
        {boostData?.isQualified && boostData?.referralsWithBreakdown && boostData.referralsWithBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="bg-red-50 border-red-300">
              <h3 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                ⚠️ Boost Income Paused for Specific Plans
              </h3>
              <p className="text-red-700 mb-4">
                Your boost income from these specific plans is temporarily stopped because the investments are on breakdown:
              </p>
              <div className="space-y-3">
                {boostData.referralsWithBreakdown.map((ref: any) => (
                  <div key={ref.userId} className="bg-white rounded-lg p-4 border border-red-200">
                    <p className="font-semibold text-gray-900 mb-2">{ref.name || ref.email}</p>
                    <div className="space-y-1">
                      {ref.investments.map((inv: any) => (
                        <div key={inv.id} className="flex items-center gap-2 text-sm">
                          <span className="text-red-600">⏸️</span>
                          <span className="font-medium text-gray-800">{inv.planName}</span>
                          <span className="text-gray-500">({formatCurrency(inv.amount, 'USDT')} investment)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-red-600 mt-4 bg-red-100 p-3 rounded-lg">
                💡 <strong>Note:</strong> Only boost income from these specific plans is paused. Boost from other active plans continues normally. If they cancel the breakdown request, boost income will resume automatically.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Boost Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Boost Income History</h2>

            {!boostData?.transactions || boostData.transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-4">📊</p>
                <p className="text-gray-600 text-lg">No boost income yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  {boostData?.isQualified
                    ? 'You\'ll see income here when your referrals receive ROI payouts'
                    : 'Qualify by reaching the minimum referral count'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {boostData.transactions.map((transaction: any) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">+${parseFloat(transaction.amount).toFixed(2)} USDT</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {boostData?.pagination && boostData.pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Page {page} of {boostData.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(boostData.pagination.totalPages, page + 1))}
                      disabled={page === boostData.pagination.totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard className="bg-blue-50 border-blue-300">
            <h3 className="text-xl font-bold text-blue-900 mb-3">ℹ️ How ROI Boost Works</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Each plan has a boost percentage set by the admin</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>When your referral receives ROI, you get a percentage of that ROI as boost income</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Example: If plan has 10% boost and referral gets $100 ROI, you get $10 boost</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Boost stops if referral requests breakdown, resumes if they cancel it</span>
              </li>
            </ul>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          {type === 'referral' ? 'Direct Referral Income' :
            incomeType === 'ROI' ? 'ROI Earnings' :
              incomeType === 'SALARY' ? 'Salary Income' :
                'ROI & Income'}
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">
          {type === 'referral' ? 'Earnings from your referrals\' plan purchases' :
            'Track your earnings from investments and referrals'}
        </p>
      </motion.div>

      {/* Totals - Only show for ROI/Salary, not for referral */}
      {type !== 'referral' && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <GlassCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-4xl"
                >
                  💰
                </motion.div>
                <span className="text-sm text-gray-600 font-medium uppercase tracking-wider">Total ROI Earned</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(data.totals.roi, 'USDT')}
              </h3>
            </GlassCard>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <GlassCard className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-2xl sm:text-3xl"
                >
                  💵
                </motion.div>
                <span className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wider">Total Salary Earned</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(data.totals.salary, 'USDT')}
              </h3>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Filter Tabs - Only show for ROI/Salary, not for referral */}
      {type !== 'referral' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-2 border-b border-white/10"
        >
          {(['ROI', 'SALARY'] as const).map((t, index) => (
            <motion.button
              key={t}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -2 }}
              onClick={() => {
                setIncomeType(t);
                setPage(1);
              }}
              className={`px-6 py-3 font-semibold transition-all relative ${incomeType === t
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {t === 'ROI' ? 'ROI Earnings' : 'Salary Income'}
              {incomeType === t && (
                <motion.div
                  layoutId="activeIncomeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Transactions List - Only show for ROI/Salary, not for referral */}
      {type !== 'referral' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : data && data.transactions.length > 0 ? (
            <>
              <div className="space-y-4">
                {data.transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                  >
                    <GlassCard>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-lg font-bold text-gray-900">
                              {tx.type.replace('_', ' ')}
                            </span>
                            <motion.span
                              whileHover={{ scale: 1.1 }}
                              className={`text-xs px-3 py-1 rounded-full font-bold ${tx.status === 'COMPLETED'
                                  ? 'bg-success/20 text-success border border-success/30'
                                  : tx.status === 'PENDING'
                                    ? 'bg-warning/20 text-warning border border-warning/30'
                                    : 'bg-error/20 text-error border border-error/30'
                                }`}
                            >
                              {tx.status}
                            </motion.span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{tx.description || 'Income credit'}</p>
                          <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          {tx.type === 'ROI_CREDIT' || tx.type === 'SALARY_CREDIT' ? (
                            <div className="text-2xl font-bold text-success">
                              +{formatCurrency(tx.amount, tx.currency)}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-error">
                              -{formatCurrency(tx.amount, tx.currency)}
                            </div>
                          )}
                          {tx.wallet && (
                            <p className="text-xs text-gray-600 mt-2">
                              {tx.type === 'ROI_CREDIT' || tx.type === 'SALARY_CREDIT' ? 'To' : 'From'} {tx.wallet.type} Wallet
                            </p>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center gap-3 mt-6"
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
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <AnimatedButton
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
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
                <div className="text-6xl mb-4">💰</div>
                <p className="text-gray-600 text-lg">No {incomeType || 'income'} records found</p>
              </GlassCard>
            </motion.div>
          )}
        </>
      )}

      {/* Referral Income Section */}
      {type === 'referral' && (
        <div className="space-y-6">
          {/* Total Direct Referral Income */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    💰 Total Direct Referral Income
                  </h2>
                  <p className="text-gray-700">
                    Earned from free and paid referral purchases (always credited, regardless of boost qualification)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">
                    ${parseFloat(referralData?.totalDirectReferralIncome || '0').toFixed(2)} USDT
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Referral Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Direct Referral Income History</h2>

              {!referralData?.transactions || referralData.transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">🎁</p>
                  <p className="text-gray-600 text-lg">No referral income yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    You'll earn income here when your referrals purchase investment plans
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralData.transactions.map((transaction: any) => {
                    // Parse description to extract details
                    // Format: "Paid/Free direct referral income from Name's Plan plan purchase ($X USDT)"
                    const desc = transaction.description || '';
                    const isPaid = desc.includes('Paid');

                    // Check if this is the old format (no detailed info)
                    const hasDetails = desc.includes("'s") && desc.includes("plan purchase");

                    let referralName = 'Not Available';
                    let planName = 'Not Available';
                    let investmentAmount = '0';

                    if (hasDetails) {
                      // Extract referral name (text between "from " and "'s")
                      const nameMatch = desc.match(/from (.+?)'s/);
                      referralName = nameMatch ? nameMatch[1] : 'Not Available';

                      // Extract plan name (text between "'s " and " plan purchase")
                      const planMatch = desc.match(/'s (.+?) plan purchase/);
                      planName = planMatch ? planMatch[1] : 'Not Available';

                      // Extract amount (text between "($" and " USDT)")
                      const amountMatch = desc.match(/\(\$(.+?) USDT\)/);
                      investmentAmount = amountMatch ? amountMatch[1] : '0';
                    }

                    return (
                      <div key={transaction.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPaid ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {isPaid ? '💎 PAID REFERRAL' : '🆓 FREE REFERRAL'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {transaction.status}
                              </span>
                            </div>

                            {hasDetails ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-sm">👤 Referral:</span>
                                  <span className="font-semibold text-gray-900">{referralName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-sm">📦 Plan:</span>
                                  <span className="font-semibold text-gray-900">{planName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-sm">💰 Investment:</span>
                                  <span className="font-medium text-gray-700">${investmentAmount} USDT</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-sm">📅 Date:</span>
                                  <span className="text-gray-700 text-sm">{formatDate(transaction.createdAt)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm text-gray-700 font-medium">{desc}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-sm">📅 Date:</span>
                                  <span className="text-gray-700 text-sm">{formatDate(transaction.createdAt)}</span>
                                </div>
                                <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-2 inline-block">
                                  ℹ️ Old transaction format - detailed info not available
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500 mb-1">You Earned</p>
                            <p className="text-2xl font-bold text-purple-600">+${parseFloat(transaction.amount).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">USDT</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {referralData?.pagination && referralData.pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-700">
                        Page {page} of {referralData.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(referralData.pagination.totalPages, page + 1))}
                        disabled={page === referralData.pagination.totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* How Direct Referral Income Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard className="bg-purple-50 border-purple-300">
              <h3 className="text-xl font-bold text-purple-900 mb-3">ℹ️ How Direct Referral Income Works</h3>
              <ul className="space-y-2 text-purple-800">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>You earn direct income whenever someone you referred purchases a plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Income amount depends on whether the referral is free (unverified) or paid (verified)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>This income is <strong>always credited</strong> regardless of your ROI boost qualification status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Different from ROI Boost - Direct income is one-time per plan purchase, boost is per ROI payout</span>
                </li>
              </ul>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ROIIncome;

