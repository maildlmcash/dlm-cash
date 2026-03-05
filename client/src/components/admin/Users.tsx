import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  kycStatus: string;
  referralCode: string;
  totalReferralCount: number;
  paidReferralCount: number;
  freeReferralCount: number;
  createdAt: string;
}

const Users = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

  // Determine filter from route
  const getFilterFromRoute = () => {
    if (location.pathname.includes('verified')) return { kycStatus: 'APPROVED' };
    if (location.pathname.includes('pending-kyc')) return { kycStatus: 'PENDING' };
    if (location.pathname.includes('blocked')) return { status: 'BLOCKED' };
    return {};
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, statusFilter, location.pathname]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const filters = getFilterFromRoute();
      const response = await adminApi.getAllUsers({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || filters.status || undefined,
      });

      if (response.success && response.data) {
        const data = response.data as any;
        setUsers(Array.isArray(data) ? data : data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    confirm(
      'Confirm Action',
      `Are you sure you want to ${newStatus.toLowerCase()} this user?`,
      async () => {
        try {
          const response = await adminApi.updateUserStatus(userId, newStatus);
          if (response.success) {
            showToast.success('User status updated successfully');
            loadUsers();
          } else {
            showToast.error(response.error || 'Failed to update status');
          }
        } catch (error) {
          showToast.error('Failed to update user status');
        }
      },
      newStatus === 'BLOCKED' ? 'danger' : 'warning'
    );
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      BLOCKED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      DELETED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getKycBadge = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all users in the system</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/users" className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap">
            All Users
          </Link>
          <Link to="/admin/users/verified" className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap">
            Verified
          </Link>
          <Link to="/admin/users/pending-kyc" className="px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm whitespace-nowrap">
            Pending KYC
          </Link>
          <Link to="/admin/users/blocked" className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap">
            Blocked
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Referrals</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{user.email || user.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getKycBadge(user.kycStatus)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.totalReferralCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewProfile(user.id)}
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors text-sm font-semibold"
                          >
                            View
                          </button>
                          {user.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleStatusChange(user.id, 'BLOCKED')}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors text-sm font-semibold"
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors text-sm font-semibold"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 text-sm font-semibold hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 text-sm font-semibold hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title || 'Confirm Action'}
        message={config?.message || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={config?.type || 'warning'}
      />
    </div>
  );
};

export default Users;
