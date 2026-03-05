import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';

interface Notification {
  id: string;
  userId?: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    body: '',
    type: 'GENERAL',
    sendTo: 'all', // all, paid, kyc_pending, specific
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllNotifications();
      if (response.success && response.data) {
        const data = response.data as any;
        setNotifications(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.title || !formData.body) {
      showToast.warning('Please fill title and message');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const payload: any = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
      };

      // For bulk notifications, we'll need to handle this differently
      // For now, if specific user, send to that user
      if (formData.sendTo === 'specific' && formData.userId) {
        payload.userId = formData.userId;
      }

      const response = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast.success('Notification sent successfully');
        setShowModal(false);
        setFormData({ userId: '', title: '', body: '', type: 'GENERAL', sendTo: 'all' });
        loadNotifications();
      } else {
        showToast.error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      showToast.error('Failed to send notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications Management</h1>
          <p className="text-gray-600 mt-1">Send and manage notifications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Send Notification
        </button>
      </div>

      {/* Notification Templates */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Deposit', 'ROI', 'Referral', 'KYC', 'Withdrawal'].map((type) => (
            <div key={type} className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer">
              <h3 className="font-medium mb-2">{type} Notification</h3>
              <p className="text-sm text-gray-600">Template for {type.toLowerCase()} notifications</p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">Use Template</button>
            </div>
          ))}
        </div>
      </div>

      {/* Sent Notifications */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sent Notifications</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Logs
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No notifications found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notif) => (
                  <tr key={notif.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{notif.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {notif.type || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notif.userId ? notif.userId.substring(0, 8) + '...' : 'All Users'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {notif.isRead ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Read</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Unread</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notif.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Send Notification</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                <select
                  value={formData.sendTo}
                  onChange={(e) => setFormData({ ...formData, sendTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="paid">Paid Users Only</option>
                  <option value="kyc_pending">KYC Pending Users</option>
                  <option value="specific">Specific User</option>
                </select>
              </div>
              {formData.sendTo === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter user ID"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="ROI">ROI</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="KYC">KYC</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleSend(e)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ userId: '', title: '', body: '', type: 'GENERAL', sendTo: 'all' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
