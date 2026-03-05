import { useState } from 'react';
import { showToast } from '../../utils/toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
}

const Staff = () => {
  const [staff, _setStaff] = useState<Staff[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF',
  });

  const roles = ['SUPER_ADMIN', 'ADMIN', 'KYC_MANAGER', 'FINANCE', 'SUPPORT', 'STAFF'];

  const handleCreate = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: 'STAFF' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff & Role Management</h1>
          <p className="text-gray-600 mt-1">Manage staff members and their roles</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {staff.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No staff members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No staff members available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Role-Based Permissions</h2>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {roles.map((role) => (
            <div key={role} className="border rounded-lg p-4">
              <h3 className="font-medium mb-2 text-gray-900">{role}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {['Dashboard', 'Users', 'KYC', 'Plans', 'Deposits', 'Withdrawals', 'Reports'].map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked={role === 'SUPER_ADMIN'} />
                    <span className="text-sm text-gray-900">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Permissions
        </button>
      </div>

      {/* Create Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Add Staff Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!formData.name || !formData.email || !formData.password) {
                      showToast.warning('Please fill all required fields');
                      return;
                    }
                    try {
                      // Use auth register endpoint to create staff
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/register`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify({
                          name: formData.name,
                          email: formData.email,
                          phone: formData.phone || undefined,
                          password: formData.password,
                          role: formData.role,
                        }),
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                        showToast.success('Staff member created successfully');
                        setShowModal(false);
                        setFormData({ name: '', email: '', phone: '', password: '', role: 'STAFF' });
                      } else {
                        showToast.error(data.message || 'Failed to create staff member');
                      }
                    } catch (error) {
                      showToast.error('Failed to create staff member');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
