import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Receipt, 
  Bell, 
  User, 
  Headphones,
  LogOut
} from 'lucide-react';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import PageTransition from '../common/PageTransition';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [hasKycDocuments, setHasKycDocuments] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    fetchUnreadCount();
    fetchKycStatus();

    // Auto-open sidebar on large screens
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchKycStatus = async () => {
    try {
      const [statusResponse, kycResponse] = await Promise.all([
        userApi.getKycStatus(),
        userApi.getMyKyc(),
      ]);

      if (statusResponse.success && statusResponse.data) {
        const data = statusResponse.data as any;
        const documents = kycResponse.success && kycResponse.data ? (kycResponse.data as any[]) : [];
        
        if (documents.length > 0) {
          const latestDoc = documents[0];
          setKycStatus(latestDoc.status || data.kycStatus || '');
          setHasKycDocuments(true);
        } else {
          setKycStatus('');
          setHasKycDocuments(false);
        }
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await userApi.getNotifications({ limit: 1, isRead: false });
      if (response.success && response.data) {
        const fullResponse = await userApi.getNotifications({ limit: 100, isRead: false });
        if (fullResponse.success && fullResponse.data) {
          const notifications = (fullResponse.data as any).data || [];
          setUnreadNotifications(notifications.length);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/wallet', label: 'Wallet', icon: Wallet, submenu: [
      { path: '/wallet/inr', label: 'INR Wallet' },
      { path: '/wallet/usdt', label: 'USDT Wallet' },
      { path: '/wallet/roi', label: 'ROI Wallet' },
      { path: '/wallet/salary', label: 'Salary Wallet' },
      { path: '/wallet/breakdown', label: 'Breakdown Wallet' },
      { path: '/wallet/converter', label: 'Converter' },
    ]},
    { path: '/investment', label: 'Investment', icon: Receipt, submenu: [
      { path: '/investment/plans', label: 'Active Plans' },
      { path: '/investment/browse', label: 'Browse Plans' },
      { path: '/investment/history', label: 'Plan History' },
    ]},
    { path: '/roi-income', label: 'ROI & Income', icon: DollarSign, submenu: [
      { path: '/roi-income/roi', label: 'ROI Earnings' },
      { path: '/roi-income/salary', label: 'Salary Income' },
      { path: '/roi-income/boost', label: 'ROI Boost' },
      { path: '/roi-income/referral', label: 'Direct Referral Income' },
    ]},
    { path: '/referral', label: 'Referral', icon: Users, submenu: [
      { path: '/referral/invite', label: 'Invite & Share' },
      { path: '/referral/tree', label: 'Team Tree' },
      { path: '/referral/income', label: 'Referral Income' },
    ]},
    { path: '/transactions', label: 'Transactions', icon: TrendingUp },
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
    { path: '/profile', label: 'Profile & Settings', icon: User },
    { path: '/support', label: 'Help & Support', icon: Headphones },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    showToast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Animated Background Gradient - Multi-color vibrant dark theme */}
      {/* Animated Background Gradient - Multi-color vibrant dark theme */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-white"></div>
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-pink/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 75, 0],
            y: [0, -75, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/3 w-72 h-72 bg-accent-emerald/8 rounded-full blur-3xl"
        />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 border-b border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 45, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200"
              >
                <div className="w-6 h-6 bg-blue-600 rounded transform -rotate-45"></div>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  DLM CASH
                </h1>
                <p className="text-xs text-gray-600">Premium Platform</p>
              </div>
            </div>
          </motion.div>

          {/* User Profile Card */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 m-4 rounded-xl bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || user.email || user.phone || 'User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate font-mono">
                    {user.referralCode || 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-4 pb-4">
            <ul className="space-y-1">
              {menuItems.map((item, index) => {
                const active = isActive(item.path);
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isExpanded = expandedMenu === item.path;
                const hasActiveSubmenu = hasSubmenu && item.submenu?.some(sub => isActive(sub.path));

                return (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <div>
                      <Link
                        to={item.path}
                        onClick={() => {
                          setSidebarOpen(false);
                          if (hasSubmenu) {
                            toggleSubmenu(item.path);
                          }
                        }}
                        className={`group relative flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                          active || hasActiveSubmenu
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 5 }}
                          >
                            <item.icon className="w-5 h-5" />
                          </motion.div>
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && item.badge > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-error text-white text-xs px-2 py-0.5 rounded-full font-bold"
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </motion.span>
                          )}
                          {hasSubmenu && (
                            <motion.svg
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </motion.svg>
                          )}
                        </div>
                        {(active || hasActiveSubmenu) && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>

                      {/* Submenu */}
                      <AnimatePresence>
                        {hasSubmenu && isExpanded && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-1 ml-4 space-y-1 overflow-hidden"
                          >
                            {item.submenu?.map((subItem) => {
                              const subActive = isActive(subItem.path);
                              return (
                                <motion.li
                                  key={subItem.path}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  <Link
                                    to={subItem.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                                      subActive
                                        ? 'text-blue-700 font-medium bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                  >
                                    {subItem.label}
                                  </Link>
                                </motion.li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 border-t border-gray-200"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </motion.button>
          </motion.div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72">
        {/* Modern Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors z-50 relative"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              {/* KYC Status Badge */}
              {kycStatus && hasKycDocuments && kycStatus !== 'APPROVED' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl ${
                    kycStatus === 'PENDING'
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : kycStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : ''
                  }`}
                >
                  KYC: {kycStatus}
                </motion.div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content with Transition */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
