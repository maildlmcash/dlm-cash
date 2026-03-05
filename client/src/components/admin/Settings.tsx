import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../services/adminApi';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';

// Network icon URLs from cryptologos.cc
const NETWORK_ICONS: { [key: string]: string } = {
  SEPOLIA: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=040',
  ETHEREUM: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=040',
  BSC: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=040',
};

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  upiId?: string;
  isActive: boolean;
}

const Settings = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'payment' | 'api' | 'cron' | 'bank-accounts' | 'upi-accounts' | 'deposit-settings' | 'platform-fee-settings' | 'network-config'>('general');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [bankAccountForm, setBankAccountForm] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
    isActive: true,
    visibilityType: 'ALL_USERS' as 'ALL_USERS' | 'KYC_VERIFIED' | 'SPECIFIC_USERS',
    assignedUserIds: [] as string[],
  });
  const [upiAccounts, setUpiAccounts] = useState<any[]>([]);
  const [loadingUpiAccounts, setLoadingUpiAccounts] = useState(false);
  const [editingUpiAccount, setEditingUpiAccount] = useState<any | null>(null);
  const [upiAccountForm, setUpiAccountForm] = useState({
    displayName: '',
    upiId: '',
    qrCodeUrl: '',
    isActive: true,
    visibilityType: 'ALL_USERS' as 'ALL_USERS' | 'KYC_VERIFIED' | 'SPECIFIC_USERS',
    assignedUserIds: [] as string[],
  });
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSelectorModal, setUserSelectorModal] = useState({
    isOpen: false,
    type: null as 'bank' | 'upi' | null,
    searchTerm: ''
  });
  const [depositThreshold, setDepositThreshold] = useState<number>(0);
  const [loadingDepositSettings, setLoadingDepositSettings] = useState(false);
  const [platformFeeSettings, setPlatformFeeSettings] = useState({
    minDepositUSDT: 10,
    minWithdrawalUSDT: 10,
    depositFeePercent: 0,
    withdrawalFeePercent: 0,
  });
  const [loadingPlatformFeeSettings, setLoadingPlatformFeeSettings] = useState(false);
  const [networks, setNetworks] = useState<any[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();
  const [settings, setSettings] = useState({
    appName: 'DLM.Cash',
    contactEmail: '',
    contactPhone: '',
    logo: null as File | null,
    enable2FA: false,
    loginTimeout: 30,
    ipRestrictions: '',
    upiGatewayKey: '',
    moralisApiKey: '',
    binanceApiKey: '',
    smsApiKey: '',
    emailSmtpHost: '',
    emailSmtpUser: '',
    emailSmtpPassword: '',
    roiCreditSchedule: 'Daily at 00:00',
    salaryPayoutSchedule: '1st of every month',
    reportsBackupSchedule: 'Daily at 02:00',
  });

  useEffect(() => {
    if (activeTab === 'bank-accounts') {
      loadBankAccounts();
    } else if (activeTab === 'upi-accounts') {
      loadUpiAccounts();
    } else if (activeTab === 'deposit-settings') {
      loadDepositSettings();
    } else if (activeTab === 'platform-fee-settings') {
      loadPlatformFeeSettings();
    } else if (activeTab === 'network-config') {
      loadNetworks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (bankAccountForm.visibilityType === 'SPECIFIC_USERS' || upiAccountForm.visibilityType === 'SPECIFIC_USERS') {
      loadUsers();
    }
  }, [bankAccountForm.visibilityType, upiAccountForm.visibilityType]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await adminApi.getAllUsers({ limit: 1000, status: undefined });
      console.log('Load users response:', response);
      if (response.success && response.data) {
        let users = [];
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if ((response.data as any).users && Array.isArray((response.data as any).users)) {
          users = (response.data as any).users;
        } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          users = (response.data as any).data;
        }
        console.log('Setting users:', users);
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadBankAccounts = async () => {
    setLoadingBankAccounts(true);
    try {
      const response = await adminApi.getAllBankAccounts();
      if (response.success && response.data) {
        setBankAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      showToast.error('Failed to load bank accounts');
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const loadDepositSettings = async () => {
    setLoadingDepositSettings(true);
    try {
      const response = await adminApi.getDepositSettings();
      if (response.success && response.data) {
        setDepositThreshold((response.data as any).autoCreditThreshold || 0);
      }
    } catch (error) {
      showToast.error('Failed to load deposit settings');
    } finally {
      setLoadingDepositSettings(false);
    }
  };

  const loadPlatformFeeSettings = async () => {
    setLoadingPlatformFeeSettings(true);
    try {
      const response = await adminApi.getPlatformFeeSettings();
      if (response.success && response.data) {
        const data = response.data as any;
        setPlatformFeeSettings({
          minDepositUSDT: data.minDepositUSDT || 10,
          minWithdrawalUSDT: data.minWithdrawalUSDT || 10,
          depositFeePercent: data.depositFeePercent || 0,
          withdrawalFeePercent: data.withdrawalFeePercent || 0,
        });
      }
    } catch (error) {
      showToast.error('Failed to load platform fee settings');
    } finally {
      setLoadingPlatformFeeSettings(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankAccountForm.accountName || !bankAccountForm.accountNumber || !bankAccountForm.ifscCode || !bankAccountForm.bankName) {
      showToast.error('Please fill all required fields');
      return;
    }

    if (bankAccountForm.visibilityType === 'SPECIFIC_USERS' && bankAccountForm.assignedUserIds.length === 0) {
      showToast.error('Please select at least one user for this account');
      return;
    }

    try {
      if (editingBankAccount) {
        const response = await adminApi.updateBankAccount(editingBankAccount.id, bankAccountForm);
        if (response.success) {
          showToast.success('Bank account updated successfully');
          setEditingBankAccount(null);
          resetBankAccountForm();
          loadBankAccounts();
        } else {
          showToast.error(response.error || 'Failed to update bank account');
        }
      } else {
        const response = await adminApi.createBankAccount(bankAccountForm);
        if (response.success) {
          showToast.success('Bank account created successfully');
          resetBankAccountForm();
          loadBankAccounts();
        } else {
          showToast.error(response.error || 'Failed to create bank account');
        }
      }
    } catch (error) {
      showToast.error('An error occurred');
    }
  };

  const handleDeleteBankAccount = (id: string) => {
    confirm(
      'Delete Bank Account',
      'Are you sure you want to delete this bank account? This action cannot be undone.',
      async () => {
        try {
          const response = await adminApi.deleteBankAccount(id);
          if (response.success) {
            showToast.success('Bank account deleted successfully');
            loadBankAccounts();
          } else {
            showToast.error(response.error || 'Failed to delete bank account');
          }
        } catch (error) {
          showToast.error('Failed to delete bank account');
        }
      },
      'danger'
    );
  };

  const resetBankAccountForm = () => {
    setBankAccountForm({
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      upiId: '',
      isActive: true,
      visibilityType: 'ALL_USERS',
      assignedUserIds: [],
    });
    setEditingBankAccount(null);
  };

  const handleEditBankAccount = (account: any) => {
    setEditingBankAccount(account);
    setBankAccountForm({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      branchName: account.branchName || '',
      upiId: account.upiId || '',
      isActive: account.isActive,
      visibilityType: account.visibilityType || 'ALL_USERS',
      assignedUserIds: account.assignedUserIds || [],
    });
  };

  const loadUpiAccounts = async () => {
    setLoadingUpiAccounts(true);
    try {
      const response = await adminApi.getAllUpiAccounts();
      if (response.success && response.data) {
        setUpiAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      showToast.error('Failed to load UPI accounts');
    } finally {
      setLoadingUpiAccounts(false);
    }
  };

  const handleSaveUpiAccount = async () => {
    if (!upiAccountForm.displayName || !upiAccountForm.upiId) {
      showToast.error('Please fill all required fields');
      return;
    }

    if (upiAccountForm.visibilityType === 'SPECIFIC_USERS' && upiAccountForm.assignedUserIds.length === 0) {
      showToast.error('Please select at least one user for this account');
      return;
    }

    try {
      if (editingUpiAccount) {
        const response = await adminApi.updateUpiAccount(editingUpiAccount.id, upiAccountForm);
        if (response.success) {
          showToast.success('UPI account updated successfully');
          loadUpiAccounts();
          resetUpiAccountForm();
        } else {
          showToast.error(response.error || 'Failed to update UPI account');
        }
      } else {
        const response = await adminApi.createUpiAccount(upiAccountForm);
        if (response.success) {
          showToast.success('UPI account created successfully');
          loadUpiAccounts();
          resetUpiAccountForm();
        } else {
          showToast.error(response.error || 'Failed to create UPI account');
        }
      }
    } catch (error) {
      showToast.error('An error occurred');
    }
  };

  const handleDeleteUpiAccount = (id: string) => {
    confirm(
      'Delete UPI Account',
      'Are you sure you want to delete this UPI account? This action cannot be undone.',
      async () => {
        try {
          const response = await adminApi.deleteUpiAccount(id);
          if (response.success) {
            showToast.success('UPI account deleted successfully');
            loadUpiAccounts();
          } else {
            showToast.error(response.error || 'Failed to delete UPI account');
          }
        } catch (error) {
          showToast.error('Failed to delete UPI account');
        }
      },
      'danger'
    );
  };

  const resetUpiAccountForm = () => {
    setUpiAccountForm({
      displayName: '',
      upiId: '',
      qrCodeUrl: '',
      isActive: true,
      visibilityType: 'ALL_USERS',
      assignedUserIds: [],
    });
    setEditingUpiAccount(null);
    setQrPreviewUrl('');
  };

  const handleEditUpiAccount = (account: any) => {
    setEditingUpiAccount(account);
    setUpiAccountForm({
      displayName: account.displayName,
      upiId: account.upiId,
      qrCodeUrl: account.qrCodeUrl || '',
      isActive: account.isActive,
      visibilityType: account.visibilityType || 'ALL_USERS',
      assignedUserIds: account.assignedUserIds || [],
    });
    // Set preview URL for existing QR code with backend URL
    if (account.qrCodeUrl && typeof account.qrCodeUrl === 'string') {
      const fullUrl = account.qrCodeUrl.startsWith('http') 
        ? account.qrCodeUrl 
        : `${BACKEND_URL}${account.qrCodeUrl}`;
      setQrPreviewUrl(fullUrl);
    }
  };

  const handleSaveDepositSettings = async () => {
    try {
      const response = await adminApi.saveDepositSettings({ autoCreditThreshold: depositThreshold });
      if (response.success) {
        showToast.success('Deposit settings saved successfully');
      } else {
        showToast.error(response.error || 'Failed to save deposit settings');
      }
    } catch (error) {
      showToast.error('Failed to save deposit settings');
    }
  };

  const handleSavePlatformFeeSettings = async () => {
    try {
      const response = await adminApi.savePlatformFeeSettings(platformFeeSettings);
      if (response.success) {
        showToast.success('Platform fee settings saved successfully');
      } else {
        showToast.error(response.error || 'Failed to save platform fee settings');
      }
    } catch (error) {
      showToast.error('Failed to save platform fee settings');
    }
  };

  const loadNetworks = async () => {
    setLoadingNetworks(true);
    try {
      console.log('🔄 Loading networks from API...');
      const response = await adminApi.getNetworkConfigs();
      console.log('📡 API Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Handle both direct array and nested data structure
        let networkData = response.data;
        
        // If data is wrapped in another data property (from pagination handling)
        if (networkData && typeof networkData === 'object' && 'data' in networkData) {
          networkData = (networkData as any).data;
        }
        
        const networks = Array.isArray(networkData) ? networkData : [];
        console.log('✅ Processed networks:', networks.length, networks);
        setNetworks(networks);
        
        if (networks.length > 0) {
          showToast.success(`Loaded ${networks.length} network(s)`);
        } else {
          console.warn('⚠️ No networks found in response');
        }
      } else {
        console.error('❌ API returned error:', response.error);
        showToast.error(response.error || 'Failed to load networks');
      }
    } catch (error) {
      console.error('❌ Exception loading networks:', error);
      showToast.error('Failed to load networks');
    } finally {
      setLoadingNetworks(false);
    }
  };

  const handleUpdateNetwork = async (networkId: string | null, networkName: string, field: string, value: any) => {
    try {
      const updateData: any = { [field]: value };
      
      // If no ID, this is a new network - include the network name
      if (!networkId || networkId === 'null') {
        updateData.network = networkName;
      }
      
      const response = await adminApi.updateNetworkConfig(networkId || 'null', updateData);
      if (response.success) {
        showToast.success('Network updated successfully');
        loadNetworks();
      } else {
        showToast.error(response.error || 'Failed to update network');
      }
    } catch (error) {
      showToast.error('Failed to update network');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings & Configurations</h1>
        <p className="text-gray-600 mt-1">Configure system settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {[
              { id: 'general', label: 'General' },
              { id: 'security', label: 'Security' },
              { id: 'cron', label: 'Cron Setup' },
              { id: 'bank-accounts', label: 'Bank Accounts' },
              { id: 'upi-accounts', label: 'UPI Accounts' },
              { id: 'deposit-settings', label: 'Deposit Settings' },
              { id: 'platform-fee-settings', label: 'Platform Fee' },
              { id: 'network-config', label: 'Supported Networks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (JPG, JPEG, PNG only)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                      if (!validTypes.includes(file.type)) {
                        showToast.warning('Please select a valid image file (JPG, JPEG, or PNG)');
                        e.target.value = '';
                        return;
                      }
                      setSettings({ ...settings, logo: file });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable2FA}
                    onChange={(e) => setSettings({ ...settings, enable2FA: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable 2FA for Admin</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.loginTimeout}
                  onChange={(e) => setSettings({ ...settings, loginTimeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Restrictions</label>
                <textarea
                  value={settings.ipRestrictions}
                  onChange={(e) => setSettings({ ...settings, ipRestrictions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  rows={3}
                  placeholder="Enter allowed IPs (one per line)"
                />
              </div>
            </div>
          )}

          {activeTab === 'cron' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ROI Credit Schedule</label>
                <select
                  value={settings.roiCreditSchedule}
                  onChange={(e) => setSettings({ ...settings, roiCreditSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option>Daily at 00:00</option>
                  <option>Daily at 12:00</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Payout Schedule</label>
                <select
                  value={settings.salaryPayoutSchedule}
                  onChange={(e) => setSettings({ ...settings, salaryPayoutSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option>1st of every month</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reports Backup Schedule</label>
                <select
                  value={settings.reportsBackupSchedule}
                  onChange={(e) => setSettings({ ...settings, reportsBackupSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Daily at 02:00</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'bank-accounts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Account Management</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    {editingBankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccountForm.accountName}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccountForm.accountNumber}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccountForm.ifscCode}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccountForm.bankName}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={bankAccountForm.branchName}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, branchName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bankAccountForm.isActive}
                          onChange={(e) => setBankAccountForm({ ...bankAccountForm, isActive: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">Active (shown to users)</span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Visibility <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="visibilityType"
                            value="ALL_USERS"
                            checked={bankAccountForm.visibilityType === 'ALL_USERS'}
                            onChange={() => setBankAccountForm({ ...bankAccountForm, visibilityType: 'ALL_USERS', assignedUserIds: [] })}
                            className="mr-2"
                          />
                          <span className="text-sm">All Users</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="visibilityType"
                            value="KYC_VERIFIED"
                            checked={bankAccountForm.visibilityType === 'KYC_VERIFIED'}
                            onChange={() => setBankAccountForm({ ...bankAccountForm, visibilityType: 'KYC_VERIFIED', assignedUserIds: [] })}
                            className="mr-2"
                          />
                          <span className="text-sm">KYC Verified Users Only</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="visibilityType"
                            value="SPECIFIC_USERS"
                            checked={bankAccountForm.visibilityType === 'SPECIFIC_USERS'}
                            onChange={() => setBankAccountForm({ ...bankAccountForm, visibilityType: 'SPECIFIC_USERS' })}
                            className="mr-2"
                          />
                          <span className="text-sm">Specific Users</span>
                        </label>
                      </div>
                    </div>
                    {bankAccountForm.visibilityType === 'SPECIFIC_USERS' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to Users <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            loadUsers();
                            setUserSelectorModal({ isOpen: true, type: 'bank', searchTerm: '' });
                          }}
                          className="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-left flex items-center justify-between"
                        >
                          <span>
                            {bankAccountForm.assignedUserIds.length === 0
                              ? 'Select Users'
                              : `${bankAccountForm.assignedUserIds.length} user(s) selected`}
                          </span>
                          <span className="text-xl">👥</span>
                        </button>
                        {bankAccountForm.assignedUserIds.length > 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            Selected: {bankAccountForm.assignedUserIds.length} user(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveBankAccount}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingBankAccount ? 'Update' : 'Add'} Bank Account
                    </button>
                    {editingBankAccount && (
                      <button
                        onClick={resetBankAccountForm}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Existing Bank Accounts</h4>
                  {loadingBankAccounts ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : bankAccounts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No bank accounts added yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Account Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Account Number</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">IFSC</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Bank</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Visibility</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankAccounts.map((account: any) => (
                            <tr key={account.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border text-sm">{account.accountName}</td>
                              <td className="px-4 py-2 border text-sm font-mono">{account.accountNumber}</td>
                              <td className="px-4 py-2 border text-sm">{account.ifscCode}</td>
                              <td className="px-4 py-2 border text-sm">{account.bankName}</td>
                              <td className="px-4 py-2 border text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  account.visibilityType === 'ALL_USERS' ? 'bg-blue-100 text-blue-800' :
                                  account.visibilityType === 'KYC_VERIFIED' ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {account.visibilityType === 'ALL_USERS' ? 'All Users' :
                                   account.visibilityType === 'KYC_VERIFIED' ? 'KYC Verified' :
                                   `${(account.assignedUserIds || []).length} Users`}
                                </span>
                              </td>
                              <td className="px-4 py-2 border text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {account.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-2 border text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditBankAccount(account)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBankAccount(account.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upi-accounts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">UPI Account Management</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    {editingUpiAccount ? 'Edit UPI Account' : 'Add New UPI Account'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={upiAccountForm.displayName}
                        onChange={(e) => setUpiAccountForm({ ...upiAccountForm, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="e.g., DLM Cash UPI"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UPI ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={upiAccountForm.upiId}
                        onChange={(e) => setUpiAccountForm({ ...upiAccountForm, upiId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="e.g., dlmcash@paytm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        QR Code Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUpiAccountForm({ ...upiAccountForm, qrCodeUrl: file as any });
                            // Create preview URL
                            const previewUrl = URL.createObjectURL(file);
                            setQrPreviewUrl(previewUrl);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload QR code image (JPG, PNG)</p>
                      
                      {/* QR Code Preview */}
                      {(qrPreviewUrl || (typeof upiAccountForm.qrCodeUrl === 'string' && upiAccountForm.qrCodeUrl)) && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                          <img
                            src={
                              qrPreviewUrl || 
                              (typeof upiAccountForm.qrCodeUrl === 'string' && upiAccountForm.qrCodeUrl.startsWith('http') 
                                ? upiAccountForm.qrCodeUrl 
                                : `${BACKEND_URL}${upiAccountForm.qrCodeUrl}`)
                            }
                            alt="QR Code Preview"
                            className="w-48 h-48 object-contain border border-gray-300 rounded-lg"
                            onError={(e) => {
                              console.error('Failed to load QR preview:', upiAccountForm.qrCodeUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={upiAccountForm.isActive}
                          onChange={(e) => setUpiAccountForm({ ...upiAccountForm, isActive: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">Active (shown to users)</span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Visibility <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="upiVisibilityType"
                            value="ALL_USERS"
                            checked={upiAccountForm.visibilityType === 'ALL_USERS'}
                            onChange={() => setUpiAccountForm({ ...upiAccountForm, visibilityType: 'ALL_USERS', assignedUserIds: [] })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-900">All Users</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="upiVisibilityType"
                            value="KYC_VERIFIED"
                            checked={upiAccountForm.visibilityType === 'KYC_VERIFIED'}
                            onChange={() => setUpiAccountForm({ ...upiAccountForm, visibilityType: 'KYC_VERIFIED', assignedUserIds: [] })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-900">KYC Verified Users Only</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="upiVisibilityType"
                            value="SPECIFIC_USERS"
                            checked={upiAccountForm.visibilityType === 'SPECIFIC_USERS'}
                            onChange={() => setUpiAccountForm({ ...upiAccountForm, visibilityType: 'SPECIFIC_USERS' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-900">Specific Users</span>
                        </label>
                      </div>
                    </div>
                    {upiAccountForm.visibilityType === 'SPECIFIC_USERS' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to Users <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            loadUsers();
                            setUserSelectorModal({ isOpen: true, type: 'upi', searchTerm: '' });
                          }}
                          className="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-left flex items-center justify-between"
                        >
                          <span>
                            {upiAccountForm.assignedUserIds.length === 0
                              ? 'Select Users'
                              : `${upiAccountForm.assignedUserIds.length} user(s) selected`}
                          </span>
                          <span className="text-xl">👥</span>
                        </button>
                        {upiAccountForm.assignedUserIds.length > 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            Selected: {upiAccountForm.assignedUserIds.length} user(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveUpiAccount}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingUpiAccount ? 'Update' : 'Add'} UPI Account
                    </button>
                    {editingUpiAccount && (
                      <button
                        onClick={resetUpiAccountForm}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Existing UPI Accounts</h4>
                  {loadingUpiAccounts ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : upiAccounts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No UPI accounts added yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Display Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">UPI ID</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">QR Code</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Visibility</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upiAccounts.map((account: any) => (
                            <tr key={account.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border text-sm text-gray-900">{account.displayName}</td>
                              <td className="px-4 py-2 border text-sm font-mono text-gray-900">{account.upiId}</td>
                              <td className="px-4 py-2 border text-sm">
                                {account.qrCodeUrl ? (
                                  <a 
                                    href={account.qrCodeUrl.startsWith('http') ? account.qrCodeUrl : `${BACKEND_URL}${account.qrCodeUrl}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-blue-900 hover:underline"
                                  >
                                    View QR
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No QR</span>
                                )}
                              </td>
                              <td className="px-4 py-2 border text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  account.visibilityType === 'ALL_USERS' ? 'bg-blue-100 text-blue-800' :
                                  account.visibilityType === 'KYC_VERIFIED' ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {account.visibilityType === 'ALL_USERS' ? 'All Users' :
                                   account.visibilityType === 'KYC_VERIFIED' ? 'KYC Verified' :
                                   `${(account.assignedUserIds || []).length} Users`}
                                </span>
                              </td>
                              <td className="px-4 py-2 border text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {account.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-2 border text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditUpiAccount(account)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUpiAccount(account.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposit-settings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Deposit Management Settings</h3>
                {loadingDepositSettings ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-Credit Threshold (INR)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Deposits below this amount will be automatically credited to user's wallet. Deposits above this amount will require admin approval.
                      </p>
                      <input
                        type="number"
                        value={depositThreshold}
                        onChange={(e) => setDepositThreshold(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter threshold amount"
                      />
                    </div>
                    <button
                      onClick={handleSaveDepositSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Deposit Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'platform-fee-settings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Fee Configuration</h3>
                {loadingPlatformFeeSettings ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Min Deposit Value */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Deposit Value (USDT)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Minimum amount users can deposit in USDT
                        </p>
                        <input
                          type="number"
                          value={platformFeeSettings.minDepositUSDT}
                          onChange={(e) => setPlatformFeeSettings({
                            ...platformFeeSettings,
                            minDepositUSDT: parseFloat(e.target.value) || 0
                          })}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="e.g., 10"
                        />
                      </div>

                      {/* Min Withdrawal Value */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Withdrawal Value (USDT)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Minimum amount users can withdraw in USDT
                        </p>
                        <input
                          type="number"
                          value={platformFeeSettings.minWithdrawalUSDT}
                          onChange={(e) => setPlatformFeeSettings({
                            ...platformFeeSettings,
                            minWithdrawalUSDT: parseFloat(e.target.value) || 0
                          })}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="e.g., 10"
                        />
                      </div>

                      {/* Deposit Fee Percent */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deposit Platform Fee (%)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Percentage fee deducted from deposits (0-100%)
                        </p>
                        <input
                          type="number"
                          value={platformFeeSettings.depositFeePercent}
                          onChange={(e) => setPlatformFeeSettings({
                            ...platformFeeSettings,
                            depositFeePercent: parseFloat(e.target.value) || 0
                          })}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="e.g., 2.5"
                        />
                      </div>

                      {/* Withdrawal Fee Percent */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Withdrawal Platform Fee (%)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Percentage fee deducted from withdrawals (0-100%)
                        </p>
                        <input
                          type="number"
                          value={platformFeeSettings.withdrawalFeePercent}
                          onChange={(e) => setPlatformFeeSettings({
                            ...platformFeeSettings,
                            withdrawalFeePercent: parseFloat(e.target.value) || 0
                          })}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="e.g., 1.5"
                        />
                      </div>
                    </div>

                    {/* Example Calculations */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">Fee Calculation Examples</h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div>
                          <strong>Deposit Fee:</strong> User deposits ₹1000 → Platform fee: ₹{(1000 * platformFeeSettings.depositFeePercent / 100).toFixed(2)} → Amount credited: ₹{(1000 - (1000 * platformFeeSettings.depositFeePercent / 100)).toFixed(2)}
                        </div>
                        <div>
                          <strong>Withdrawal Fee:</strong> User withdraws ₹1000 → Platform fee: ₹{(1000 * platformFeeSettings.withdrawalFeePercent / 100).toFixed(2)} → Amount sent: ₹{(1000 - (1000 * platformFeeSettings.withdrawalFeePercent / 100)).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSavePlatformFeeSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Platform Fee Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'network-config' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Blockchain Network Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">Manage supported blockchain networks for deposits and withdrawals. Only active networks will be shown to users.</p>
                
                {loadingNetworks ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Network
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Chain ID
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Active
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Withdraw
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deposit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Explorer API Key
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {networks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                              No networks configured
                            </td>
                          </tr>
                        ) : (
                          networks.map((network) => (
                            <tr key={network.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 mr-3 flex items-center justify-center flex-shrink-0">
                                    <img 
                                      src={NETWORK_ICONS[network.network] || NETWORK_ICONS['ETHEREUM']}
                                      alt={network.network}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">${network.network.substring(0, 2)}</div>`;
                                        }
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{network.name}</div>
                                    <div className="text-xs text-gray-500">{network.network}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {network.chainId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={network.isActive}
                                  onChange={(e) => handleUpdateNetwork(network.id, network.network, 'isActive', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={network.withdrawEnabled}
                                  onChange={(e) => handleUpdateNetwork(network.id, network.network, 'withdrawEnabled', e.target.checked)}
                                  disabled={!network.isActive}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={network.depositEnabled}
                                  onChange={(e) => handleUpdateNetwork(network.id, network.network, 'depositEnabled', e.target.checked)}
                                  disabled={!network.isActive}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={network.explorerApiKey || ''}
                                  onChange={(e) => {
                                    // Update immediately on change for API key
                                    const newValue = e.target.value;
                                    setNetworks(networks.map(n => 
                                      n.network === network.network 
                                        ? { ...n, explorerApiKey: newValue }
                                        : n
                                    ));
                                  }}
                                  onBlur={(e) => {
                                    // Save to backend on blur
                                    handleUpdateNetwork(network.id, network.network, 'explorerApiKey', e.target.value);
                                  }}
                                  className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Optional explorer API key"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    
                    {/* Legend */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Guide:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• <strong>Active:</strong> Enable the network to make it available</li>
                        <li>• <strong>Withdraw:</strong> Allow users to withdraw USDT on this network</li>
                        <li>• <strong>Deposit:</strong> Allow users to deposit USDT on this network</li>
                        <li>• <strong>Pool Address:</strong> Smart contract address for withdrawals (update before enabling mainnet)</li>
                        <li>• ⚠️ <span className="text-orange-600">Ensure pool addresses are correct before enabling networks!</span></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'bank-accounts' && activeTab !== 'upi-accounts' && activeTab !== 'deposit-settings' && activeTab !== 'platform-fee-settings' && activeTab !== 'network-config' && (
            <div className="mt-6 pt-4 border-t">
            <button
              onClick={async () => {
                try {
                  const formDataToSend = new FormData();
                  
                  // Add all settings to form data
                  Object.entries(settings).forEach(([key, value]) => {
                    if (key === 'logo' && value instanceof File) {
                      formDataToSend.append('logo', value);
                    } else if (key !== 'logo' && value !== null && value !== undefined) {
                      formDataToSend.append(key, String(value));
                    }
                  });

                  const response = await adminApi.saveSettings(formDataToSend);
                  if (response.success) {
                    showToast.success('Settings saved successfully');
                  } else {
                    showToast.error(response.error || 'Failed to save settings');
                  }
                } catch (error) {
                  showToast.error('Failed to save settings');
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
          )}

        </div>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title || 'Confirm Action'}
        message={config?.message || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={config?.type || 'warning'}
      />

      {/* User Selector Modal */}
      {userSelectorModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-[30%] max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Select Users</h3>
              <button
                onClick={() => setUserSelectorModal({ isOpen: false, type: null, searchTerm: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {allUsers.map(user => {
                    const currentAssignedIds = userSelectorModal.type === 'bank' 
                      ? bankAccountForm.assignedUserIds 
                      : upiAccountForm.assignedUserIds;
                    const isSelected = currentAssignedIds.includes(user.id);

                    return (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...currentAssignedIds, user.id]
                              : currentAssignedIds.filter(id => id !== user.id);
                            
                            if (userSelectorModal.type === 'bank') {
                              setBankAccountForm({ ...bankAccountForm, assignedUserIds: newIds });
                            } else {
                              setUpiAccountForm({ ...upiAccountForm, assignedUserIds: newIds });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div className="ml-2">
                          {user.kycStatus === 'APPROVED' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              KYC Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {user.kycStatus || 'Not Verified'}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {userSelectorModal.type === 'bank' 
                  ? bankAccountForm.assignedUserIds.length 
                  : upiAccountForm.assignedUserIds.length} users selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setUserSelectorModal({ isOpen: false, type: null, searchTerm: '' })}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
