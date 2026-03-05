import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  TrendingUp, 
  Wallet, 
  Gift, 
  LineChart, 
  Briefcase, 
  Users, 
  IndianRupee, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
// import AnimatedCard from '../common/AnimatedCard';
import AnimatedButton from '../common/AnimatedButton';
import GlassCard from '../common/GlassCard';

interface DashboardStats {
  wallets: {
    inr: { balance: string; pending: string };
    usdt: { balance: string; pending: string };
    roi: { balance: string };
    salary: { balance: string };
    breakdown: { balance: string };
  };
  roi: {
    totalEarned: string;
  };
  salaryIncome?: string;
  directReferralIncome?: string;
  investments: {
    active: number;
    total: number;
    totalInvested: string;
  };
  referrals: {
    total: number;
    paid: number;
    free: number;
  };
  latestTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    currency: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
  notifications: {
    unread: number;
  };
  kycStatus: string;
  hasKycDocuments?: boolean;
}

interface CryptoPrice {
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  updatedAt: string;
  cached?: boolean;
}

// Coin icon URLs from cryptologos.cc
const COIN_ICONS: { [key: string]: string } = {
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=040',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=040',
  XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=040',
  BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=040',
  USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040',
  DOGE: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=040',
  SHIB: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg?v=040',
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [cryptoPricesLoading, setCryptoPricesLoading] = useState(false);

  useEffect(() => {
    loadDashboardStats();
    loadCryptoPrices();
  }, []);

  const loadCryptoPrices = async () => {
    try {
      setCryptoPricesLoading(true);
      const response = await userApi.getCryptoPrices();
      if (response.success && response.data) {
        setCryptoPrices(response.data as CryptoPrice[]);
      }
    } catch (error) {
      console.error('Failed to load crypto prices:', error);
    } finally {
      setCryptoPricesLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await userApi.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data as DashboardStats);
      } else {
        showToast.error(response.error || 'Failed to load dashboard stats');
      }
    } catch (error) {
      showToast.error('An error occurred while loading dashboard');
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
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
        <AnimatedButton onClick={loadDashboardStats} className="mt-4">
          Retry
        </AnimatedButton>
      </div>
    );
  }

  const statCards = [
    {
      title: 'ROI Earned',
      value: formatCurrency(stats?.roi?.totalEarned || '0', 'USDT'),
      subtitle: 'Total returns from investments',
      icon: TrendingUp,
      link: '/roi-income/roi',
      percentage: 24.5,
      trend: 'up',
      delay: 0.1,
    },
    {
      title: 'Salary Income',
      value: formatCurrency(stats?.salaryIncome || '0', 'USDT'),
      subtitle: 'Team performance rewards',
      icon: Wallet,
      link: '/roi-income/salary',
      percentage: 15.2,
      trend: 'up',
      delay: 0.15,
    },
    {
      title: 'Direct Referral Income',
      value: formatCurrency(stats?.directReferralIncome || '0', 'USDT'),
      subtitle: 'Earnings from referral purchases',
      icon: Gift,
      link: '/roi-income/referral',
      percentage: 18.7,
      trend: 'up',
      delay: 0.2,
    },
    {
      title: 'Active Plans',
      value: stats.investments.active.toString(),
      subtitle: 'Currently running investments',
      icon: LineChart,
      link: '/investment/plans',
      percentage: 12.3,
      trend: 'up',
      delay: 0.25,
    },
    {
      title: 'Total Invested',
      value: formatCurrency(stats.investments.totalInvested, 'USDT'),
      subtitle: `${stats.investments.total} total plans`,
      icon: Briefcase,
      link: '/investment/history',
      percentage: 36.8,
      trend: 'up',
      delay: 0.3,
    },
    {
      title: 'Referrals',
      value: stats.referrals.total.toString(),
      subtitle: `${stats.referrals.paid} paid, ${stats.referrals.free} free`,
      icon: Users,
      link: '/referral/tree',
      percentage: 8.2,
      trend: 'down',
      delay: 0.35,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">Welcome back! Here's your investment overview</p>
        </div>
        
        {/* Notification Bell */}
        <Link to="/notifications">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {stats.notifications.unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {stats.notifications.unread}
              </motion.span>
            )}
          </motion.div>
        </Link>
      </motion.div>

      {/* KYC Incomplete Banner */}
      {stats.kycStatus !== 'APPROVED' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/kyc">
            <GlassCard className="border-blue-200 hover:border-blue-400 bg-blue-50 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="flex-shrink-0"
                  >
                    <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600" />
                  </motion.div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5">KYC Verification Incomplete</h3>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {stats.kycStatus === 'PENDING' && stats.hasKycDocuments
                        ? 'Your KYC is under review. Please wait for admin approval.'
                        : stats.kycStatus === 'REJECTED'
                        ? 'Your KYC was rejected. Please resubmit your documents.'
                        : 'Please complete your KYC verification.'}
                    </p>
                  </div>
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="text-blue-700 font-semibold text-xs sm:text-sm flex-shrink-0"
                >
                  Complete KYC →
                </motion.div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: card.delay }}
          >
            <Link to={card.link}>
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                {/* Icon and Title */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </div>
                  <h3 className="text-gray-600 font-medium text-xs">
                    {card.title}
                  </h3>
                </div>

                {/* Value and Trend */}
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-all">
                      {card.value}
                    </h2>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-0.5 ${
                        card.trend === 'up'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {card.trend === 'up' ? '↑' : '↓'} {card.percentage}%
                    </motion.div>
                  </div>
                  <p className="text-xs text-gray-500">vs last month</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Wallet Balances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Wallet Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
          {[
            { type: 'inr', label: 'INR', balance: stats.wallets.inr.balance, pending: stats.wallets.inr.pending, link: '/wallet/inr', icon: IndianRupee, currency: 'INR' },
            { type: 'usdt', label: 'USDT', balance: stats.wallets.usdt.balance, pending: stats.wallets.usdt.pending, link: '/wallet/usdt', icon: DollarSign, currency: 'USDT' },
            { type: 'roi', label: 'ROI', balance: stats.wallets.roi.balance, pending: '0', link: '/wallet/roi', icon: BarChart3, currency: 'USDT' },
            { type: 'salary', label: 'Salary', balance: stats.wallets.salary.balance, pending: '0', link: '/wallet/salary', icon: Wallet, currency: 'USDT' },
            { type: 'breakdown', label: 'Breakdown', balance: stats.wallets.breakdown.balance, pending: '0', link: '/wallet/breakdown', icon: RefreshCw, currency: 'USDT' },
          ].map((wallet, index) => (
            <motion.div
              key={wallet.type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <Link to={wallet.link}>
                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                      <wallet.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{wallet.label}</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-all">
                    {formatCurrency(wallet.balance, wallet.currency || wallet.label)}
                  </div>
                  {parseFloat(wallet.pending) > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 rounded px-1.5 py-0.5 inline-block mt-1">
                      Pending: {formatCurrency(wallet.pending, wallet.currency || wallet.label)}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Latest Transactions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Latest Transactions</h2>
              <Link
                to="/transactions"
                className="text-blue-600 hover:text-blue-700 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                View All →
              </Link>
            </div>
            {stats.latestTransactions.length > 0 ? (
              <div className="space-y-2">
                {stats.latestTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all gap-2"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900">
                          {tx.type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            tx.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'PENDING'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 break-words">{tx.description || 'Transaction'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className={`text-sm sm:text-base font-bold break-all ${
                        tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-6 text-sm">No transactions yet</p>
            )}
          </div>
        </motion.div>

        {/* Crypto Prices */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Crypto Prices</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={loadCryptoPrices}
                disabled={cryptoPricesLoading}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${cryptoPricesLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
            
            {cryptoPricesLoading && cryptoPrices.length === 0 ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : cryptoPrices.length > 0 ? (
              <div className="space-y-2">
                {cryptoPrices.map((crypto, index) => {
                  const change = parseFloat(crypto.change24h);
                  const isPositive = change >= 0;
                  
                  return (
                    <motion.div
                      key={crypto.symbol}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={COIN_ICONS[crypto.symbol]}
                            alt={crypto.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback if icon not found
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">${crypto.symbol.substring(0, 2)}</div>`;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs sm:text-sm">{crypto.symbol}</div>
                          <div className="text-xs text-gray-500">{crypto.name}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-sm sm:text-base">
                          ${parseFloat(crypto.price).toLocaleString('en-US', { 
                            minimumFractionDigits: crypto.symbol === 'SHIB' ? 6 : 2,
                            maximumFractionDigits: crypto.symbol === 'SHIB' ? 6 : crypto.symbol === 'BTC' || crypto.symbol === 'ETH' ? 2 : 4 
                          })}
                        </div>
                        <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                
                
                
              </div>
            ) : (
              <p className="text-gray-600 text-center py-6 text-sm">No prices available</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
