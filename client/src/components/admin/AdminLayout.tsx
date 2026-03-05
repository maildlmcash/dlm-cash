import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥', submenu: [
      { path: '/admin/users', label: 'All Users' },
      { path: '/admin/users/verified', label: 'Verified Users' },
      { path: '/admin/users/pending-kyc', label: 'Pending KYC' },
      { path: '/admin/users/blocked', label: 'Blocked Users' },
    ]},
    { path: '/admin/kyc', label: 'KYC Management', icon: '📄' },
    { path: '/admin/plans', label: 'Investment Plans', icon: '💼' },
    { path: '/admin/investments', label: 'Investments', icon: '📊' },
    { path: '/admin/auth-keys', label: 'Authentication Keys', icon: '🔑' },
    { path: '/admin/roi', label: 'ROI & Salary', icon: '💰' },
    { path: '/admin/referrals', label: 'Referral System', icon: '🔗' },
    { path: '/admin/breakdown', label: 'Breakdown', icon: '📉' },
    { path: '/admin/deposits', label: 'Deposits', icon: '💵' },
    { path: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
    { path: '/admin/transactions', label: 'Transactions', icon: '📋' },
    { path: '/admin/wallets', label: 'Wallets', icon: '💳' },
    { path: '/admin/fund-management', label: 'Fund Management', icon: '💰' },
    { path: '/admin/currency', label: 'Currency Converter', icon: '💱' },
    { path: '/admin/staff', label: 'Staff & Roles', icon: '👤' },
    { path: '/admin/whitelabel', label: 'White Label', icon: '🏷️' },
    { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/admin/reports', label: 'Reports & Analytics', icon: '📈' },
    { path: '/admin/blog', label: 'Blog Management', icon: '📝' },
    { path: '/admin/support', label: 'Support Tickets', icon: '🎫' },
    { path: '/admin/cms', label: 'CMS', icon: '📄' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    { path: '/admin/profile', label: 'Profile', icon: '👤' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">DLM.Cash Admin</h1>
            <p className="text-xs text-gray-500 mt-0.5">Operations Console</p>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors z-50 relative"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 py-6 overflow-x-hidden max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
