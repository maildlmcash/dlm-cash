import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  investments: {
    total: number;
  };
  deposits: {
    total: string;
    pending: number;
  };
  withdrawals: {
    total: string;
    pending: number;
  };
  kyc: {
    pending: number;
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data as DashboardStats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load dashboard stats</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      icon: '👥',
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Total Deposits',
      value: `₹${parseFloat(stats.deposits.total).toLocaleString()}`,
      subtitle: `${stats.deposits.pending} pending`,
      icon: '💵',
      color: 'bg-green-500',
      link: '/admin/deposits',
    },
    {
      title: 'Total Withdrawals',
      value: `₹${parseFloat(stats.withdrawals.total).toLocaleString()}`,
      subtitle: `${stats.withdrawals.pending} pending`,
      icon: '💸',
      color: 'bg-orange-500',
      link: '/admin/withdrawals',
    },
    {
      title: 'Pending KYC',
      value: stats.kyc.pending,
      subtitle: 'Requires review',
      icon: '📄',
      color: 'bg-yellow-500',
      link: '/admin/kyc',
    },
    {
      title: 'Active Investments',
      value: stats.investments.total,
      subtitle: 'All time',
      icon: '💼',
      color: 'bg-purple-500',
      link: '/admin/plans',
    },
    {
      title: 'INR ⇄ USDT Rate',
      value: '₹85.50',
      subtitle: 'Current rate',
      icon: '💱',
      color: 'bg-indigo-500',
      link: '/admin/currency',
    },
  ];

  const quickActions = [
    { label: 'Verify KYC', path: '/admin/kyc', icon: '✅' },
    { label: 'Approve Deposit', path: '/admin/deposits', icon: '💵' },
    { label: 'Approve Withdrawal', path: '/admin/withdrawals', icon: '💸' },
    { label: 'Add Investment Plan', path: '/admin/plans', icon: '➕' },
    { label: 'Manage Blog', path: '/admin/blog', icon: '📝' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to DLM.Cash Admin Panel</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-gray-500 text-xs mt-1">{card.subtitle}</p>
              </div>
              <div className={`${card.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Shortcuts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl sm:text-3xl mb-2">{action.icon}</span>
              <span className="text-xs sm:text-sm text-gray-700 text-center break-words">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Deposit vs Withdrawal</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be implemented here
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">ROI Distribution Chart</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be implemented here
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Growth Chart</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be implemented here
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Referrers</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be implemented here
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
