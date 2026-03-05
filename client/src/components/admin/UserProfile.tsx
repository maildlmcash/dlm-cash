import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import LoadingSpinner from '../common/LoadingSpinner';

interface UserDetails {
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
  wallets: any[];
  investments: any[];
  transactions: any[];
  kycDocuments: any[];
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [referralTree, setReferralTree] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [roiLogs, setRoiLogs] = useState<any[]>([]);
  const [loadingRoiLogs, setLoadingRoiLogs] = useState(false);
  const [roiLogsPage, setRoiLogsPage] = useState(1);
  const [roiLogsTotalPages, setRoiLogsTotalPages] = useState(1);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await adminApi.getUserDetails(id!);
      if (response.success && response.data) {
        setUser(response.data as UserDetails);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferralTree = async () => {
    if (!id) return;
    try {
      setLoadingTree(true);
      const response = await adminApi.getUserReferralTree(id, 2);
      if (response.success && response.data) {
        const data = response.data as any;
        setReferralTree(data.tree || []);
      }
    } catch (error) {
      console.error('Failed to load referral tree:', error);
    } finally {
      setLoadingTree(false);
    }
  };

  const loadLoginLogs = async (page: number = 1) => {
    if (!id) return;
    try {
      setLoadingLogs(true);
      const response = await adminApi.getUserLoginLogs(id, { page, limit: 10 });
      if (response.success && response.data) {
        const data = response.data as any;
        setLoginLogs(data.data || []);
        if (data.pagination) {
          setLogsTotalPages(data.pagination.totalPages || 1);
          setLogsPage(data.pagination.page || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load login logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadRoiLogs = async (page: number = 1) => {
    if (!id) return;
    try {
      setLoadingRoiLogs(true);
      const response = await adminApi.getUserRoiLogs(id, { page, limit: 10 });
      if (response.success && response.data) {
        const data = response.data as any;
        setRoiLogs(data.data || []);
        if (data.pagination) {
          setRoiLogsTotalPages(data.pagination.totalPages || 1);
          setRoiLogsPage(data.pagination.page || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load ROI logs:', error);
    } finally {
      setLoadingRoiLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'referrals' && id) {
      loadReferralTree();
    }
    if (activeTab === 'logs' && id) {
      loadLoginLogs(1);
    }
    if (activeTab === 'roi' && id) {
      loadRoiLogs(1);
    }
  }, [activeTab, id]);

  if (loading) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">User not found</div>;
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'kyc', label: 'KYC Docs' },
    { id: 'investments', label: 'Investments' },
    { id: 'wallets', label: 'Wallets' },
    { id: 'roi', label: 'ROI Logs' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'logs', label: 'Login Logs' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Users
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{user.name || 'User'}</h1>
          <p className="text-gray-600">{user.email || user.phone}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Credit Wallet
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Debit Wallet
          </button>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-semibold">{user.status}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">KYC Status</p>
          <p className="text-lg font-semibold">{user.kycStatus}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Referrals</p>
          <p className="text-lg font-semibold">{user.totalReferralCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Role</p>
          <p className="text-lg font-semibold">{user.role}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-gray-900">{user.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-gray-900">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                  <p className="mt-1 text-gray-900">{user.referralCode || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div>
              {user.kycDocuments && user.kycDocuments.length > 0 ? (
                <div className="space-y-4">
                  {user.kycDocuments.map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <p className="font-medium">{doc.docType}</p>
                      <p className="text-sm text-gray-600">Status: {doc.status}</p>
                      <div className="flex gap-4 mt-2">
                        {doc.fileUrl && (
                          <a
                            href={(() => {
                              // Get base URL and remove /api suffix if present (static files are at root)
                              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                              const baseUrl = apiBaseUrl.replace(/\/api$/, '');
                              
                              // Extract filename from path
                              let filename = doc.fileUrl;
                              if (filename.includes('/')) {
                                filename = filename.split('/').pop() || filename;
                              } else if (filename.includes('\\')) {
                                filename = filename.split('\\').pop() || filename;
                              }
                              
                              return `${baseUrl}/uploads/${filename}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        )}
                        {doc.selfieUrl && (
                          <a
                            href={(() => {
                              // Get base URL and remove /api suffix if present (static files are at root)
                              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                              const baseUrl = apiBaseUrl.replace(/\/api$/, '');
                              
                              // Extract filename from path
                              let filename = doc.selfieUrl;
                              if (filename.includes('/')) {
                                filename = filename.split('/').pop() || filename;
                              } else if (filename.includes('\\')) {
                                filename = filename.split('\\').pop() || filename;
                              }
                              
                              return `${baseUrl}/uploads/${filename}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Selfie
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No KYC documents uploaded</p>
              )}
            </div>
          )}

          {activeTab === 'investments' && (
            <div>
              {user.investments && user.investments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Plan</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.investments.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-2">{inv.plan?.name || 'N/A'}</td>
                          <td className="px-4 py-2">${parseFloat(inv.amount).toLocaleString()} USDT</td>
                          <td className="px-4 py-2">{inv.status}</td>
                          <td className="px-4 py-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No investments found</p>
              )}
            </div>
          )}

          {activeTab === 'wallets' && (
            <div>
              {user.wallets && user.wallets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.wallets.map((wallet: any) => (
                    <div key={wallet.id} className="border rounded-lg p-4">
                      <p className="font-medium">{wallet.type} Wallet</p>
                      <p className="text-2xl font-bold mt-2">₹{parseFloat(wallet.balance).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Pending: ₹{parseFloat(wallet.pending).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Currency: {wallet.currency}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No wallets found</p>
              )}
            </div>
          )}

          {activeTab === 'roi' && (
            <div>
              {loadingRoiLogs ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : roiLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No ROI logs found</p>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Wallet</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {roiLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(log.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {log.currency === 'INR' ? '₹' : '$'}{parseFloat(log.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                {log.wallet?.type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                log.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : log.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : log.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate" title={log.description}>
                              {log.description || 'ROI Credit'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {roiLogsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-4">
                      <button
                        onClick={() => loadRoiLogs(roiLogsPage - 1)}
                        disabled={roiLogsPage === 1}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {roiLogsPage} of {roiLogsTotalPages}
                      </span>
                      <button
                        onClick={() => loadRoiLogs(roiLogsPage + 1)}
                        disabled={roiLogsPage === roiLogsTotalPages}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold">{user.totalReferralCount}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Paid Referrals</p>
                  <p className="text-2xl font-bold">{user.paidReferralCount || 0}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Free Referrals</p>
                  <p className="text-2xl font-bold">{user.freeReferralCount || 0}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Referral Tree</h3>
              {loadingTree ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : referralTree.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No referrals found</p>
              ) : (
                <div className="space-y-3">
                  {referralTree.map((referral) => (
                    <div key={referral.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-600">Level {referral.level}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              referral.isPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {referral.isPaid ? 'Paid' : 'Free'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              referral.kycStatus === 'APPROVED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              KYC: {referral.kycStatus}
                            </span>
                          </div>
                          <p className="font-semibold">{referral.name || referral.email || referral.phone || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">Code: {referral.referralCode}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>Total: {referral.totalReferralCount}</span>
                            <span>Paid: {referral.paidReferralCount}</span>
                            <span>Free: {referral.freeReferralCount}</span>
                          </div>
                        </div>
                      </div>
                      {referral.children && referral.children.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-300">
                          <p className="text-xs text-gray-500 mb-2">Level {referral.level + 1} Referrals:</p>
                          {referral.children.map((child: any) => (
                            <div key={child.id} className="border rounded p-3 mb-2 bg-gray-50">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-600">Level {child.level}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  child.isPaid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {child.isPaid ? 'Paid' : 'Free'}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{child.name || child.email || child.phone || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">Code: {child.referralCode}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              {loadingLogs ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : loginLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No login logs found</p>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP Address</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User Agent</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loginLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(log.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                              {log.ipAddress}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate" title={log.userAgent}>
                              {log.userAgent}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                log.success
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {log.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {logsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-4">
                      <button
                        onClick={() => loadLoginLogs(logsPage - 1)}
                        disabled={logsPage === 1}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {logsPage} of {logsTotalPages}
                      </span>
                      <button
                        onClick={() => loadLoginLogs(logsPage + 1)}
                        disabled={logsPage === logsTotalPages}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
