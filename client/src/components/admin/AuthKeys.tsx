import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';

interface AuthKey {
  id: string;
  code: string;
  planId: string;
  plan: {
    id: string;
    name: string;
    amount: string;
  };
  generatedBy: string;
  distributedTo: string | null;
  distributedToUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  usedBy: string | null;
  usedByUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  usedAt: string | null;
  status: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
}

interface AuthKeyStats {
  total: number;
  active: number;
  used: number;
  distributed: number;
  notDistributed: number;
  remaining: number;
  statsByPlan: Array<{
    planId: string;
    planName: string;
    total: number;
    active: number;
    used: number;
    distributed: number;
    notDistributed: number;
    remaining: number;
  }>;
}

const AuthKeys = () => {
  const [authKeys, setAuthKeys] = useState<AuthKey[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<AuthKeyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    planId: '',
    status: '',
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPlanForGenerate, setSelectedPlanForGenerate] = useState<{ id: string; name: string } | null>(null);
  const [generateQuantity, setGenerateQuantity] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedKeyForAssign, setSelectedKeyForAssign] = useState<AuthKey | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{ userId: string; userName: string; userEmail: string } | null>(null);
  
  // Bulk assignment states
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkSelectedPlan, setBulkSelectedPlan] = useState('');
  const [bulkAvailableKeys, setBulkAvailableKeys] = useState<AuthKey[]>([]);
  const [bulkLoadingKeys, setBulkLoadingKeys] = useState(false);
  const [bulkKycTab, setBulkKycTab] = useState<'REGISTERED' | 'NON_REGISTERED'>('REGISTERED');
  const [bulkUsers, setBulkUsers] = useState<any[]>([]);
  const [bulkLoadingUsers, setBulkLoadingUsers] = useState(false);
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkManualEmails, setBulkManualEmails] = useState<string[]>([]);
  const [bulkEmailInput, setBulkEmailInput] = useState('');
  const [bulkUserSearch, setBulkUserSearch] = useState('');
  
  // Manual email states for single assign
  const [showManualEmailInput, setShowManualEmailInput] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  useEffect(() => {
    loadPlans();
    loadStats();
  }, []);

  useEffect(() => {
    loadAuthKeys();
  }, [page, filters]);

  useEffect(() => {
    if (bulkSelectedPlan) {
      loadBulkAvailableKeys();
    }
  }, [bulkSelectedPlan]);

  useEffect(() => {
    if (showBulkAssignModal && bulkSelectedPlan) {
      loadBulkUsers();
    }
  }, [bulkKycTab, showBulkAssignModal, bulkSelectedPlan]);

  const loadPlans = async () => {
    try {
      const response = await adminApi.getAllPlans();
      if (response.success && response.data) {
        const data = response.data as any;
        setPlans(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await adminApi.getAuthKeyStats();
      if (response.success && response.data) {
        setStats(response.data as AuthKeyStats);
      }
    } catch (error) {
      console.error('Failed to load Authentication Key statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAuthKeys = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
      };
      if (filters.planId) params.planId = filters.planId;
      if (filters.status) params.status = filters.status;

      const response = await adminApi.getAuthKeys(params);
      console.log('Auth Keys Response:', response); // Debug log
      
      if (response.success && response.data) {
        const data = response.data as any;
        
        // Check if response has pagination wrapped inside data
        if (data.pagination) {
          console.log('Pagination found in data:', data.pagination); // Debug log
          setAuthKeys(data.data || []);
          setTotalPages(data.pagination.totalPages || 1);
        } else if (Array.isArray(data)) {
          // Direct array response
          setAuthKeys(data);
          setTotalPages(1);
        } else if (data.data) {
          // Nested data without pagination
          setAuthKeys(data.data || []);
          setTotalPages(data.totalPages || 1);
        } else {
          // Fallback
          setAuthKeys([]);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error loading auth keys:', error); // Debug log
      showToast.error('Failed to load Authentication Keys');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleGenerateKeys = (planId: string, planName: string) => {
    setSelectedPlanForGenerate({ id: planId, name: planName });
    setGenerateQuantity('');
    setShowGenerateModal(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForGenerate) return;

    const quantity = parseInt(generateQuantity);
    if (isNaN(quantity) || quantity < 1 || quantity > 1000) {
      showToast.error('Please enter a valid quantity between 1 and 1000');
      return;
    }

    setGenerating(true);
    try {
      const response = await adminApi.generateAuthKeys({
        planId: selectedPlanForGenerate.id,
        quantity,
      });

      if (response.success) {
        showToast.success(`${quantity} Authentication Keys generated successfully`);
        setShowGenerateModal(false);
        loadAuthKeys();
        loadStats();
      } else {
        showToast.error(response.error || 'Failed to generate keys');
      }
    } catch (error) {
      showToast.error('Failed to generate keys');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignKey = async (authKey: AuthKey) => {
    setSelectedKeyForAssign(authKey);
    setUserSearch('');
    setShowAssignModal(true);
    
    // Load all users initially
    setSearchingUsers(true);
    try {
      const response = await adminApi.getAllUsers({ limit: 100 });
      if (response.success && response.data) {
        const data = response.data as any;
        setSearchedUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleUserSearch = async (search: string) => {
    setUserSearch(search);
    if (search.length < 2) {
      setSearchedUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await adminApi.getAllUsers({ search, limit: 10 });
      if (response.success && response.data) {
        const data = response.data as any;
        setSearchedUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAssignToUser = async (userId: string, userName: string, userEmail: string) => {
    if (!selectedKeyForAssign) return;

    setPendingAssignment({ userId, userName, userEmail });
    setShowConfirmModal(true);
  };

  const handleAssignToManualEmail = async () => {
    if (!selectedKeyForAssign) return;
    
    const email = manualEmail.trim();
    if (!email) {
      showToast.error('Please enter an email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    setAssigning(true);
    try {
      const response = await adminApi.distributeAuthKeyToEmail(selectedKeyForAssign.id, email);
      if (response.success) {
        showToast.success('Authentication Key assigned and email sent successfully');
        setShowAssignModal(false);
        setManualEmail(''); // Only clear on success
        setShowManualEmailInput(false);
        loadAuthKeys();
        loadStats();
      } else {
        showToast.error(response.error || `Failed to send key to ${email}. Please verify the email address is correct.`);
      }
    } catch (error) {
      showToast.error(`Failed to send key to ${email}. Email service error.`);
    } finally {
      setAssigning(false);
    }
  };

  const confirmAssignment = async () => {
    if (!selectedKeyForAssign || !pendingAssignment) return;

    setAssigning(true);
    try {
      const response = await adminApi.distributeAuthKey(selectedKeyForAssign.id, pendingAssignment.userId);
      if (response.success) {
        showToast.success('Authentication Key assigned successfully and email sent to user');
        setShowAssignModal(false);
        setShowConfirmModal(false);
        setPendingAssignment(null);
        loadAuthKeys();
        loadStats();
      } else {
        showToast.error(response.error || 'Failed to assign key');
      }
    } catch (error) {
      showToast.error('Failed to assign key');
    } finally {
      setAssigning(false);
    }
  };

  const loadBulkAvailableKeys = async () => {
    setBulkLoadingKeys(true);
    try {
      const response = await adminApi.getAuthKeys({
        planId: bulkSelectedPlan,
        status: 'ACTIVE',
        limit: 1000,
      });
      if (response.success && response.data) {
        const data = response.data as any;
        // Handle both response formats
        let keys = Array.isArray(data) ? data : data.data || [];
        const unassignedKeys = keys.filter((key: AuthKey) => !key.distributedTo);
        setBulkAvailableKeys(unassignedKeys);
      }
    } catch (error) {
      showToast.error('Failed to load available keys');
      setBulkAvailableKeys([]);
    } finally {
      setBulkLoadingKeys(false);
    }
  };

  const loadBulkUsers = async () => {
    setBulkLoadingUsers(true);
    setBulkUsers([]);
    setBulkSelectedUsers(new Set());
    
    // Only load users for REGISTERED tab
    if (bulkKycTab === 'NON_REGISTERED') {
      setBulkLoadingUsers(false);
      return;
    }
    
    try {
      const response = await adminApi.getAllUsers({ limit: 1000 });
      if (response.success && response.data) {
        const data = response.data as any;
        let users = Array.isArray(data) ? data : data.data || [];
        
        // Show all registered users
        setBulkUsers(users);
      }
    } catch (error) {
      showToast.error('Failed to load users');
      setBulkUsers([]);
    } finally {
      setBulkLoadingUsers(false);
    }
  };

  const handleBulkUserToggle = (userId: string) => {
    const newSelected = new Set(bulkSelectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      if (newSelected.size >= bulkAvailableKeys.length) {
        showToast.error(`You can only select up to ${bulkAvailableKeys.length} users (available keys)`);
        return;
      }
      newSelected.add(userId);
    }
    setBulkSelectedUsers(newSelected);
  };

  const handleAddBulkManualEmail = () => {
    const email = bulkEmailInput.trim();
    if (!email) {
      showToast.error('Please enter an email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }
    
    if (bulkManualEmails.includes(email)) {
      showToast.error('Email already added');
      return;
    }
    
    if (bulkManualEmails.length >= bulkAvailableKeys.length) {
      showToast.error(`You can only add up to ${bulkAvailableKeys.length} emails (available keys)`);
      return;
    }
    
    setBulkManualEmails([...bulkManualEmails, email]);
    setBulkEmailInput('');
  };

  const handleRemoveBulkManualEmail = (email: string) => {
    setBulkManualEmails(bulkManualEmails.filter(e => e !== email));
  };

  const handleBulkSelectAll = () => {
    if (bulkSelectedUsers.size === Math.min(bulkUsers.length, bulkAvailableKeys.length)) {
      setBulkSelectedUsers(new Set());
    } else {
      const maxSelection = Math.min(bulkUsers.length, bulkAvailableKeys.length);
      const newSelected = new Set(bulkUsers.slice(0, maxSelection).map(u => u.id));
      setBulkSelectedUsers(newSelected);
    }
  };

  const handleBulkAssign = async () => {
    const totalSelected = bulkSelectedUsers.size + bulkManualEmails.length;
    
    if (totalSelected === 0) {
      showToast.error('Please select at least one user or add at least one email');
      return;
    }

    if (totalSelected > bulkAvailableKeys.length) {
      showToast.error('Selected recipients exceed available keys');
      return;
    }

    setBulkAssigning(true);
    try {
      let successCount = 0;
      let failCount = 0;
      let keyIndex = 0;
      const failedEmails: string[] = [];

      // Assign to registered users first
      const userIds = Array.from(bulkSelectedUsers);
      for (let i = 0; i < userIds.length; i++) {
        try {
          const response = await adminApi.distributeAuthKey(bulkAvailableKeys[keyIndex].id, userIds[i]);
          if (response.success) {
            successCount++;
          } else {
            failCount++;
          }
          keyIndex++;
        } catch (error) {
          failCount++;
          keyIndex++;
        }
      }

      // Then assign to manual emails
      for (let i = 0; i < bulkManualEmails.length; i++) {
        try {
          const response = await adminApi.distributeAuthKeyToEmail(bulkAvailableKeys[keyIndex].id, bulkManualEmails[i]);
          if (response.success) {
            successCount++;
          } else {
            failCount++;
            failedEmails.push(bulkManualEmails[i]);
          }
          keyIndex++;
        } catch (error) {
          failCount++;
          failedEmails.push(bulkManualEmails[i]);
          keyIndex++;
        }
      }

      if (successCount > 0) {
        showToast.success(`Successfully assigned ${successCount} Authentication Keys`);
      }
      if (failCount > 0) {
        if (failedEmails.length > 0) {
          showToast.error(`Failed to send keys to ${failedEmails.length} email(s): ${failedEmails.join(', ')}. Please verify the email addresses.`);
        } else {
          showToast.error(`Failed to assign ${failCount} keys to registered users`);
        }
      }

      setShowBulkAssignModal(false);
      setBulkSelectedPlan('');
      setBulkSelectedUsers(new Set());
      setBulkAvailableKeys([]);
      setBulkUsers([]);
      setBulkManualEmails([]); // Only clear on success
      setBulkEmailInput('');
      loadAuthKeys();
      loadStats();
    } catch (error) {
      showToast.error('Failed to assign keys');
    } finally {
      setBulkAssigning(false);
    }
  };

  const getStatusBadge = (authKey: AuthKey) => {
    if (authKey.usedBy) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Used</span>;
    }
    if (authKey.status === 'ACTIVE') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{authKey.status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Authentication Key Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and track all Authentication Keys</p>
        </div>
        <button
          onClick={() => setShowBulkAssignModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <span>👥</span>
          <span>Bulk Assign</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="p-8 text-center">
          <LoadingSpinner />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Keys</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Used/Redeemed</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.used}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Remaining</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.remaining}</div>
          </div>
        </div>
      )}

      {/* Statistics by Plan */}
      {stats && stats.statsByPlan && stats.statsByPlan.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics by Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Plan Name</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Active</th>
                  <th className="text-right p-2">Used</th>
                  <th className="text-right p-2">Distributed</th>
                  <th className="text-right p-2">Not Distributed</th>
                  <th className="text-right p-2">Remaining</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.statsByPlan.map((planStat) => (
                  <tr key={planStat.planId} className="border-b">
                    <td className="p-2 font-medium">{planStat.planName}</td>
                    <td className="p-2 text-right">{planStat.total}</td>
                    <td className="p-2 text-right text-green-600">{planStat.active}</td>
                    <td className="p-2 text-right text-red-600">{planStat.used}</td>
                    <td className="p-2 text-right">{planStat.distributed}</td>
                    <td className="p-2 text-right">{planStat.notDistributed}</td>
                    <td className="p-2 text-right text-blue-600 font-semibold">{planStat.remaining}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleGenerateKeys(planStat.planId, planStat.planName)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs cursor-pointer"
                      >
                        🔑 Generate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Plan</label>
            <select
              value={filters.planId}
              onChange={(e) => handleFilterChange('planId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Plans</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* E-PINs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S. No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used At</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : authKeys.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No Authentication Keys found
                  </td>
                </tr>
              ) : (
                authKeys.map((authKey, index) => (
                  <tr key={authKey.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                      {(page - 1) * 20 + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {authKey.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{authKey.plan.name}</div>
                        <div className="text-xs text-gray-500">${parseFloat(authKey.plan.amount).toLocaleString()} USDT</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(authKey)}</td>
                    <td className="px-4 py-3 text-sm">
                      {authKey.distributedToUser ? (
                        <div>
                          <div className="font-medium text-gray-800">
                            {authKey.distributedToUser.name || authKey.distributedToUser.email}
                          </div>
                          {authKey.distributedToUser.name && (
                            <div className="text-xs text-gray-500">{authKey.distributedToUser.email}</div>
                          )}
                        </div>
                      ) : authKey.distributedTo ? (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600">✉️</span>
                          <span className="font-medium text-gray-800">
                            {authKey.distributedTo === 'MANUAL_EMAIL' 
                              ? 'Manual Email (Legacy)' 
                              : authKey.distributedTo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {authKey.usedByUser ? (
                        <div>
                          <div className="font-medium text-gray-800">
                            {authKey.usedByUser.name || authKey.usedByUser.email}
                          </div>
                          {authKey.usedByUser.name && (
                            <div className="text-xs text-gray-500">{authKey.usedByUser.email}</div>
                          )}
                        </div>
                      ) : authKey.status === 'ACTIVE' ? (
                        <span className="text-green-600 font-medium">Unused</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {authKey.usedAt ? new Date(authKey.usedAt).toLocaleString() : authKey.status === 'ACTIVE' ? (
                        <span className="text-green-600 font-medium">Unused</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(authKey.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!authKey.distributedTo && authKey.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleAssignKey(authKey)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs cursor-pointer"
                        >
                          Assign
                        </button>
                      ) : authKey.distributedTo ? (
                        <span className="text-xs text-gray-500">Assigned</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && authKeys.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Generate Keys Modal */}
      {showGenerateModal && selectedPlanForGenerate && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !generating) {
              setShowGenerateModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[30%]">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">🔑 Generate Authentication Keys</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                  className="text-gray-600 hover:text-gray-900 text-2xl leading-none disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleGenerateSubmit} className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                Generate Authentication Keys for: <span className="font-semibold text-gray-900">{selectedPlanForGenerate.name}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (1-1000) *
                </label>
                <input
                  type="number"
                  value={generateQuantity}
                  onChange={(e) => setGenerateQuantity(e.target.value)}
                  required
                  min="1"
                  max="1000"
                  placeholder="Enter quantity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer font-medium"
                >
                  {generating ? 'Generating...' : 'Generate Keys'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Key Modal */}
      {showAssignModal && selectedKeyForAssign && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !assigning) {
              setShowAssignModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[30%] max-h-[80vh] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Assign Authentication Key</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={assigning}
                  className="text-gray-600 hover:text-gray-900 text-2xl leading-none disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Key Code</p>
                <code className="text-sm font-mono font-semibold text-gray-900">{selectedKeyForAssign.code}</code>
                <p className="text-xs text-gray-600 mt-2 mb-1">Plan</p>
                <p className="text-sm font-medium text-gray-900">{selectedKeyForAssign.plan.name}</p>
              </div>
              
              {/* Toggle between registered user and manual email */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManualEmailInput(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    !showManualEmailInput
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  👤 Registered User
                </button>
                <button
                  onClick={() => setShowManualEmailInput(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    showManualEmailInput
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✉️ Manual Email
                </button>
              </div>

              {!showManualEmailInput ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search User *
                    </label>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      autoFocus
                    />
                  </div>
                  {searchingUsers && (
                    <div className="text-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                  {!searchingUsers && searchedUsers.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <style>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {searchedUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAssignToUser(user.id, user.name, user.email)}
                          disabled={assigning}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">{user.name || 'No Name'}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-500">{user.phone}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searchingUsers && searchedUsers.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No users found
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Enter email address..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The authentication key will be sent to this email address
                    </p>
                  </div>
                  <button
                    onClick={handleAssignToManualEmail}
                    disabled={assigning || !manualEmail.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {assigning ? 'Assigning...' : '✓ Assign to Email'}
                  </button>
                </>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  // Clear states when modal is closed via Cancel
                  setShowManualEmailInput(false);
                  setManualEmail('');
                }}
                disabled={assigning}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !bulkAssigning) {
              setShowBulkAssignModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[40%] max-h-[85vh] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">👥 Bulk Assign Authentication Keys</h2>
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  disabled={bulkAssigning}
                  className="text-gray-600 hover:text-gray-900 text-2xl leading-none disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Plan <span className="text-red-600">*</span>
                </label>
                <select
                  value={bulkSelectedPlan}
                  onChange={(e) => {
                    setBulkSelectedPlan(e.target.value);
                    setBulkSelectedUsers(new Set());
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Keys Count */}
              {bulkSelectedPlan && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {bulkLoadingKeys ? (
                    <div className="flex items-center gap-2 text-blue-700">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">Loading available keys...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Available Authentication Keys</p>
                        <p className="text-xs text-blue-700 mt-1">Unassigned keys ready for distribution</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {bulkAvailableKeys.length}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bulkSelectedPlan && bulkAvailableKeys.length > 0 && (
                <>
                  {/* User Type Tabs */}
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setBulkKycTab('REGISTERED')}
                      className={`px-4 py-2 font-semibold transition-all relative ${
                        bulkKycTab === 'REGISTERED'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      👤 Registered Users {bulkSelectedUsers.size > 0 && `(${bulkSelectedUsers.size})`}
                    </button>
                    <button
                      onClick={() => setBulkKycTab('NON_REGISTERED')}
                      className={`px-4 py-2 font-semibold transition-all relative ${
                        bulkKycTab === 'NON_REGISTERED'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ✉️ Non-Registered (Manual Email) {bulkManualEmails.length > 0 && `(${bulkManualEmails.length})`}
                    </button>
                  </div>

                  {bulkKycTab === 'REGISTERED' ? (
                    <>
                      {/* Selected Count */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 font-medium">
                            Registered Users: {bulkSelectedUsers.size} | Manual Emails: {bulkManualEmails.length} | Total: {bulkSelectedUsers.size + bulkManualEmails.length} / {bulkAvailableKeys.length}
                          </span>
                          {bulkUsers.length > 0 && (
                            <button
                              onClick={handleBulkSelectAll}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {bulkSelectedUsers.size === Math.min(bulkUsers.length, bulkAvailableKeys.length) ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div>
                        <input
                          type="text"
                          value={bulkUserSearch}
                          onChange={(e) => setBulkUserSearch(e.target.value)}
                          placeholder="🔍 Search by name, email, or mobile number..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      {/* Users List */}
                      <div className="border border-gray-200 rounded-lg">
                        {bulkLoadingUsers ? (
                          <div className="p-8 text-center">
                            <LoadingSpinner />
                            <p className="text-sm text-gray-600 mt-2">Loading users...</p>
                          </div>
                        ) : bulkUsers.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <p className="text-lg mb-1">👤</p>
                            <p className="text-sm">No registered users found</p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {bulkUsers
                              .filter((user) => {
                                if (!bulkUserSearch.trim()) return true;
                                const search = bulkUserSearch.toLowerCase();
                                const name = String(user.name || '').toLowerCase();
                                const email = String(user.email || '').toLowerCase();
                                const phone = String(user.phone || '').toLowerCase();
                                return name.includes(search) || email.includes(search) || phone.includes(search);
                              })
                              .map((user) => (
                              <label
                                key={user.id}
                                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  bulkSelectedUsers.has(user.id) ? 'bg-blue-50' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={bulkSelectedUsers.has(user.id)}
                                  onChange={() => handleBulkUserToggle(user.id)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{user.name || 'No Name'}</div>
                                  <div className="text-sm text-gray-600">{user.email}</div>
                                  {user.phone && (
                                    <div className="text-xs text-gray-500">{user.phone}</div>
                                  )}
                                  <div className="mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      user.kycStatus === 'VERIFIED' || user.kycStatus === 'APPROVED'
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {user.kycStatus || 'PENDING'}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={bulkEmailInput}
                            onChange={(e) => setBulkEmailInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBulkManualEmail();
                              }
                            }}
                            placeholder="Enter email address..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                          <button
                            onClick={handleAddBulkManualEmail}
                            disabled={!bulkEmailInput.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                          >
                            + Add
                          </button>
                        </div>

                        {/* Email List */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-sm text-green-700 font-medium mb-2">
                            Registered Users: {bulkSelectedUsers.size} | Manual Emails: {bulkManualEmails.length} | Total: {bulkSelectedUsers.size + bulkManualEmails.length} / {bulkAvailableKeys.length}
                          </div>
                        </div>

                        {bulkManualEmails.length > 0 && (
                          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                            {bulkManualEmails.map((email, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">✉️</span>
                                  <div>
                                    <div className="font-medium text-gray-900">{email}</div>
                                    <div className="text-xs text-gray-500">Email #{index + 1}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveBulkManualEmail(email)}
                                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {bulkManualEmails.length === 0 && (
                          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                            <p className="text-lg mb-1">📧</p>
                            <p className="text-sm">No emails added yet</p>
                            <p className="text-xs mt-1">Add email addresses above to assign keys</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {bulkSelectedPlan && bulkAvailableKeys.length === 0 && !bulkLoadingKeys && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800 font-medium">No available keys for this plan</p>
                  <p className="text-yellow-700 text-sm mt-1">Please generate keys first</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkAssigning || (bulkSelectedUsers.size === 0 && bulkManualEmails.length === 0) || !bulkSelectedPlan}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
                >
                  {bulkAssigning ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Assigning...
                    </span>
                  ) : (
                    `Assign ${bulkSelectedUsers.size + bulkManualEmails.length} Key${(bulkSelectedUsers.size + bulkManualEmails.length) !== 1 ? 's' : ''}`
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setBulkManualEmails([]);
                    setBulkEmailInput('');
                  }}
                  disabled={bulkAssigning}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedKeyForAssign && pendingAssignment && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !assigning) {
              setShowConfirmModal(false);
              setPendingAssignment(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[25%] animate-scale-in">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚠️</div>
                <h2 className="text-xl font-bold text-white">Confirm Assignment</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800 font-semibold mb-2">⚠️ Important Notice</p>
                <p className="text-xs text-blue-700">
                  This action cannot be undone. The user will receive an email with the Authentication Key.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Key Code</p>
                  <code className="text-sm font-mono font-bold text-gray-900">{selectedKeyForAssign.code}</code>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Plan</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedKeyForAssign.plan.name}</p>
                  <p className="text-xs text-gray-600 mt-1">Amount: ${parseFloat(selectedKeyForAssign.plan.amount).toLocaleString()} USDT</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1 font-semibold">Assigning To</p>
                  <p className="text-sm font-bold text-blue-900">{pendingAssignment.userName || 'No Name'}</p>
                  <p className="text-xs text-blue-700 mt-1">{pendingAssignment.userEmail}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmAssignment}
                  disabled={assigning}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 cursor-pointer font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  {assigning ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Assigning...
                    </span>
                  ) : (
                    '✓ Confirm & Assign'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingAssignment(null);
                  }}
                  disabled={assigning}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold transition-all"
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

export default AuthKeys;

