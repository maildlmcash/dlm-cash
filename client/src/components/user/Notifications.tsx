import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import GlassCard from '../common/GlassCard';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await userApi.getNotifications({
        limit: 100,
        isRead: filter === 'unread' ? false : undefined,
      });

      if (response.success && response.data) {
        const data = response.data as any;
        setNotifications(Array.isArray(data) ? data : data.data || []);
      } else {
        showToast.error(response.error || 'Failed to load notifications');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await userApi.markNotificationAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(unreadNotifications.map((n) => markAsRead(n.id)));
      showToast.success('All notifications marked as read');
    } catch (error) {
      showToast.error('Failed to mark all as read');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'KYC':
        return '📄';
      case 'TRANSACTION':
        return '💳';
      case 'ROI':
        return '💰';
      case 'REFERRAL':
        return '🔗';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Notifications
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Stay updated with your account activity</p>
        </div>
        {unreadCount > 0 && (
          <AnimatedButton onClick={markAllAsRead} size="md">
            ✓ Mark All as Read
          </AnimatedButton>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2 border-b border-white/10"
      >
        {(['all', 'unread'] as const).map((f, index) => (
          <motion.button
            key={f}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -2 }}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 font-semibold transition-all relative ${
              filter === f
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-300">
                {unreadCount}
              </span>
            )}
            {filter === f && (
              <motion.div
                layoutId="activeNotificationTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <GlassCard className={`cursor-pointer transition-all ${
                notification.isRead
                  ? 'border-white/10 opacity-75'
                  : 'border-accent-blue/50 bg-accent-blue/10'
              }`}>
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className="text-4xl"
                  >
                    {getNotificationIcon(notification.type || '')}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">{notification.title}</h3>
                      {!notification.isRead && (
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 bg-accent-blue rounded-full"
                        />
                      )}
                    </div>
                    <p className="text-gray-400 mb-2">{notification.body}</p>
                    <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
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
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-400 text-lg">No notifications found</p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default Notifications;

