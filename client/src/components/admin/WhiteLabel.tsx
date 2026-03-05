import { useState } from 'react';
import { showToast } from '../../utils/toast';

interface WhiteLabelPartner {
  id: string;
  name: string;
  domain?: string;
  apiKey: string;
  contactEmail?: string;
  commissionPct: number;
  createdAt: string;
}

const WhiteLabel = () => {
  const [partners, _setPartners] = useState<WhiteLabelPartner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contactEmail: '',
    commissionPct: 5,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">White Label / Distributor</h1>
          <p className="text-gray-600 mt-1">Manage white label partners and distributors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Partner
        </button>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {partners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No white label partners found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No partners available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Earnings Reports */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Distributor Earnings Reports</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Report
          </button>
        </div>
        <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
          Earnings reports will be displayed here
        </div>
      </div>

      {/* Create Partner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add White Label Partner</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commissionPct}
                  onChange={(e) => setFormData({ ...formData, commissionPct: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!formData.name) {
                      showToast.warning('Partner name is required');
                      return;
                    }
                    try {
                      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                      const response = await fetch(`${API_BASE_URL}/admin/whitelabel`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify({
                          name: formData.name,
                          domain: formData.domain || undefined,
                          contactEmail: formData.contactEmail || undefined,
                          commissionPct: formData.commissionPct,
                        }),
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                        showToast.success('White label partner created successfully');
                        setShowModal(false);
                        setFormData({ name: '', domain: '', contactEmail: '', commissionPct: 5 });
                      } else {
                        showToast.error(data.message || 'Failed to create partner');
                      }
                    } catch (error) {
                      showToast.error('Failed to create partner');
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

export default WhiteLabel;
