import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import GlassCard from '../common/GlassCard';

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  kycStatus: string;
  createdAt: string;
  totalReferralCount: number;
  paidReferralCount: number;
  freeReferralCount: number;
  level: number;
  isPaid: boolean;
  children?: ReferralUser[];
}

interface ReferralIncome {
  id: string;
  level: number;
  amount: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
  };
}

const Referral = () => {
  const { type } = useParams<{ type: string }>();
  const [user, setUser] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<ReferralUser[]>([]);
  const [referralIncomes, setReferralIncomes] = useState<ReferralIncome[]>([]);
  const [totalIncome, setTotalIncome] = useState('0');
  const [loading, setLoading] = useState(true);
  const [_page, _setPage] = useState(1);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setReferralLink(`${window.location.origin}/signup?ref=${userData.referralCode}`);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    if (!type) {
      // Default to invite if no type
      return;
    }
    if (type === 'tree') {
      loadReferralTree();
    } else if (type === 'income') {
      loadReferralIncome();
    }
    // invite type doesn't need to load data
  }, [type, _page]);

  const loadReferralTree = async () => {
    try {
      setLoading(true);
      const response = await userApi.getReferralTree(2); // Only Level 1 and Level 2
      if (response.success && response.data) {
        const data = response.data as any;
        setReferralTree(data.tree || []);
      } else {
        showToast.error(response.error || 'Failed to load referral tree');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadReferralIncome = async () => {
    try {
      setLoading(true);
      const response = await userApi.getReferralIncome({ page: _page, limit: 20 });
      if (response.success && response.data) {
        const data = response.data as any;
        setReferralIncomes(data.incomes || []);
        setTotalIncome(data.total || '0');
      } else {
        showToast.error(response.error || 'Failed to load referral income');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    showToast.success('Referral link copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    const message = `Join DLM.Cash using my referral link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || '0');
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
    });
  };

  const renderReferralTree = (referrals: ReferralUser[], level: number = 1) => {
    if (referrals.length === 0) return null;

    return (
      <div className="space-y-3">
        {referrals.map((referral, index) => (
          <motion.div
            key={referral.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            style={{ marginLeft: `${(level - 1) * 1}rem` }}
          >
            <GlassCard>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-3 py-1 bg-accent-blue/20 text-black rounded-full text-xs font-bold border border-accent-blue/30">
                      Level {referral.level}
                    </span>
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        referral.isPaid
                          ? 'bg-success/20 text-success border border-success/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {referral.isPaid ? 'Paid' : 'Free'}
                    </motion.span>
                    {referral.kycStatus && referral.kycStatus !== 'APPROVED' && (
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          referral.kycStatus === 'APPROVED'
                            ? 'bg-info/20 text-info border border-info/30'
                            : 'bg-warning/20 text-warning border border-warning/30'
                        }`}
                      >
                        KYC: {referral.kycStatus}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-1">
                    {referral.name || referral.email || referral.phone || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600 font-mono mb-3">Code: {referral.referralCode}</p>
                  <div className="flex gap-3 text-xs">
                    <div className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">
                      <span className="text-gray-600">Total: </span>
                      <span className="text-gray-900 font-semibold">{referral.totalReferralCount || 0}</span>
                    </div>
                    <div className="px-2 py-1 bg-green-50 border border-green-200 rounded">
                      <span className="text-gray-600">Paid: </span>
                      <span className="text-green-600 font-semibold">{referral.paidReferralCount || 0}</span>
                    </div>
                    <div className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">
                      <span className="text-gray-600">Free: </span>
                      <span className="text-gray-900 font-semibold">{referral.freeReferralCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              {referral.children && referral.children.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pl-4 border-l-2 border-accent-blue/30"
                >
                  {renderReferralTree(referral.children, level + 1)}
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    );
  };

  if (type === 'invite') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Invite & Share
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Share your referral link and earn rewards</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="border-accent-blue/30 bg-gradient-to-br from-accent-blue/10 via-accent-purple/10 to-accent-cyan/10">
            <div className="text-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-accent-blue/20 rounded-full mb-6 border-2 border-accent-blue/30"
              >
                <span className="text-5xl">🔗</span>
              </motion.div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Your Referral Code</h2>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-block px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl shadow-lg"
              >
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {user?.referralCode || 'N/A'}
                </p>
              </motion.div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3 text-center">
                📎 Referral Link
              </label>
              <div className="flex gap-2 max-w-lg mx-auto">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <AnimatedButton
                  onClick={copyReferralLink}
                  size="md"
                >
                  Copy
                </AnimatedButton>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-center max-w-lg mx-auto">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1"
              >
                <AnimatedButton
                  onClick={shareViaWhatsApp}
                  variant="secondary"
                  fullWidth
                  className="bg-gradient-to-r from-accent-green to-green-600 hover:from-green-600 hover:to-accent-green"
                >
                  <span className="text-lg mr-2">📱</span>
                  WhatsApp
                </AnimatedButton>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1"
              >
                <AnimatedButton
                  onClick={() => {
                    const subject = 'Join DLM.Cash';
                    const body = `Join DLM.Cash using my referral link: ${referralLink}`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                  variant="secondary"
                  fullWidth
                  className="bg-gradient-to-r from-accent-blue to-blue-600 hover:from-blue-600 hover:to-accent-blue"
                >
                  <span className="text-lg mr-2">📧</span>
                  Email
                </AnimatedButton>
              </motion.div>
              
            </div>

            {/* View Referral Tree Button */}
            <div className="pt-6 border-t border-white/10">
              <Link to="/referral/tree">
                <AnimatedButton
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="max-w-md mx-auto"
                >
                  <span className="text-xl mr-2">🌳</span>
                  View Referral Tree
                </AnimatedButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (type === 'tree') {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Team Tree
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">View your referral network hierarchy</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : referralTree.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {renderReferralTree(referralTree)}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <GlassCard>
              <div className="text-6xl mb-4">🌳</div>
              <p className="text-gray-400 mb-2 text-lg">No referrals yet</p>
              <p className="text-sm text-gray-500">Start inviting friends to build your team!</p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    );
  }

  if (type === 'income') {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Referral Income
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Track your earnings from referrals</p>
        </motion.div>

        {/* Total Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="bg-gradient-to-br from-accent-blue/10 via-accent-purple/10 to-accent-cyan/10 border-accent-blue/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium uppercase tracking-wider">Total Referral Income</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</h3>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="text-3xl sm:text-4xl"
              >
                💰
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Income List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : referralIncomes.length > 0 ? (
          <div className="space-y-4">
            {referralIncomes.map((income, index) => (
              <motion.div
                key={income.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold border border-blue-300">
                          Level {income.level}
                        </span>
                        <span className="text-gray-900 font-semibold">
                          from {income.fromUser.name || income.fromUser.email || income.fromUser.phone}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-mono">Code: {income.fromUser.referralCode}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(income.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-success">
                        +{formatCurrency(income.amount)}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <GlassCard>
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-400 text-lg">No referral income yet</p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
};

export default Referral;

