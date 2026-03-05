import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api';
import { userApi } from '../../services/userApi';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import AnimatedInput from '../common/AnimatedInput';
import GlassCard from '../common/GlassCard';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security' | 'bank-accounts' | 'kyc'>('profile');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    reenterAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
  });
  const [addingBankAccount, setAddingBankAccount] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showReenterAccountNumber, setShowReenterAccountNumber] = useState(false);
  const [fetchingBankDetails, setFetchingBankDetails] = useState(false);
  const [bankDetailsFetched, setBankDetailsFetched] = useState(false);

  // KYC states
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    phone: '',
    panDocument: null as File | null,
    additionalDocType: 'AADHAAR' as 'AADHAAR' | 'VOTER_ID' | 'PASSPORT',
    additionalDocument: null as File | null,
    selfie: null as File | null,
  });
  const [kycErrors, setKycErrors] = useState({
    phone: '',
    panDocument: '',
    additionalDocType: '',
    additionalDocument: '',
    selfie: '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadBankAccounts();
    loadKycData();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const userData = response.data as any;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
        // Auto-fill bank account holder name with profile name
        setBankForm(prev => ({
          ...prev,
          accountName: userData.name || '',
        }));
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        showToast.error(response.error || 'Failed to load profile');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateProfile(formData);
      if (response.success) {
        showToast.success('Profile updated successfully');
        loadProfile();
      } else {
        showToast.error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        showToast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        showToast.error(response.error || 'Failed to change password');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await userApi.getUserBankAccounts();
      if (response.success && response.data) {
        setBankAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const handleAddBankAccount = async () => {
    // Check if KYC is completed
    if (user?.kycStatus !== 'APPROVED') {
      showToast.error('Please complete KYC verification before adding a bank account');
      return;
    }

    if (!bankForm.accountName || !bankForm.accountNumber || !bankForm.reenterAccountNumber || !bankForm.ifscCode || !bankForm.bankName) {
      showToast.error('Please fill in all required fields');
      return;
    }

    if (bankForm.accountNumber !== bankForm.reenterAccountNumber) {
      showToast.error('Account numbers do not match');
      return;
    }

    if (bankForm.ifscCode.length !== 11) {
      showToast.error('IFSC code must be 11 characters');
      return;
    }

    setAddingBankAccount(true);
    try {
      const response = await userApi.addUserBankAccount({
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        ifscCode: bankForm.ifscCode,
        bankName: bankForm.bankName,
        branchName: bankForm.branchName || undefined,
      });

      if (response.success) {
        showToast.success('Bank account added successfully');
        setBankForm({
          accountName: '',
          accountNumber: '',
          reenterAccountNumber: '',
          ifscCode: '',
          bankName: '',
          branchName: '',
        });
        setBankDetailsFetched(false);
        setShowAccountNumber(false);
        setShowReenterAccountNumber(false);
        loadBankAccounts();
      } else {
        showToast.error(response.error || 'Failed to add bank account');
      }
    } catch (error) {
      showToast.error('An error occurred');
    } finally {
      setAddingBankAccount(false);
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      const response = await userApi.deleteUserBankAccount(id);
      if (response.success) {
        showToast.success('Bank account deleted successfully');
        loadBankAccounts();
      } else {
        showToast.error(response.error || 'Failed to delete bank account');
      }
    } catch (error) {
      showToast.error('An error occurred');
    }
  };

  const handleAccountNumberPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    showToast.error('Please type the account number manually');
  };

  const fetchBankDetailsByIFSC = async (ifscCode: string) => {
    if (ifscCode.length !== 11) {
      setBankDetailsFetched(false);
      return;
    }
    
    setFetchingBankDetails(true);
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      if (response.ok) {
        const data = await response.json();
        setBankForm(prev => ({
          ...prev,
          bankName: data.BANK || '',
          branchName: data.BRANCH || '',
        }));
        setBankDetailsFetched(true);
       
      } else {
        setBankDetailsFetched(false);
       
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      setBankDetailsFetched(false);
      showToast.error('Failed to fetch bank details');
    } finally {
      setFetchingBankDetails(false);
    }
  };

  // KYC Functions
  const loadKycData = async () => {
    try {
      const [kycResponse, statusResponse, profileResponse] = await Promise.all([
        userApi.getMyKyc(),
        userApi.getKycStatus(),
        apiService.getProfile(),
      ]);

      if (kycResponse.success && kycResponse.data) {
        setKycDocuments(kycResponse.data as any[]);
      }

      if (profileResponse.success && profileResponse.data) {
        const userData = profileResponse.data as any;
        const documents = kycResponse.success && kycResponse.data ? (kycResponse.data as any[]) : [];
        
        if (documents.length === 0) {
          setKycStatus('');
        } else {
          setKycStatus(userData.kycStatus || '');
        }
        
        setKycFormData(prev => ({
          ...prev,
          phone: userData.phone || '',
        }));
      } else if (statusResponse.success && statusResponse.data) {
        const data = statusResponse.data as any;
        const documents = kycResponse.success && kycResponse.data ? (kycResponse.data as any[]) : [];
        if (documents.length > 0) {
          setKycStatus(data.kycStatus || '');
        } else {
          setKycStatus('');
        }
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    }
  };

  const validateKycForm = () => {
    const newErrors = {
      phone: '',
      panDocument: '',
      additionalDocType: '',
      additionalDocument: '',
      selfie: '',
    };

    if (!kycFormData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(kycFormData.phone)) {
      newErrors.phone = 'Phone number must be in E.164 format (e.g., +919876543210)';
    }

    if (!kycFormData.panDocument) {
      newErrors.panDocument = 'PAN Card is mandatory';
    }

    if (!kycFormData.additionalDocType) {
      newErrors.additionalDocType = 'Additional document type is required';
    }

    if (!kycFormData.additionalDocument) {
      newErrors.additionalDocument = 'Additional document image is required';
    }

    if (!kycFormData.selfie) {
      newErrors.selfie = 'Selfie is required';
    }

    setKycErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== '');
  };

  const handleKycFileChange = (field: 'panDocument' | 'additionalDocument' | 'selfie', file: File | null) => {
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast.error('File size must be less than 5MB');
        return;
      }
    }

    setKycFormData((prev) => ({ ...prev, [field]: file }));
    setKycErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      showToast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = (keepCapturedImage = false) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    if (!keepCapturedImage) {
      setCapturedImage(null);
    }
  };

  const captureSelfie = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        setCapturedImage(imageDataUrl);
        stopCamera(true);

        fetch(imageDataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setKycFormData((prev) => ({ ...prev, selfie: file }));
            setKycErrors((prev) => ({ ...prev, selfie: '' }));
          })
          .catch((error) => {
            console.error('Error converting image to file:', error);
            showToast.error('Error processing captured image');
          });
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateKycForm()) {
      return;
    }

    setSubmittingKyc(true);
    try {
      const panFormData = new FormData();
      panFormData.append('docType', 'PAN');
      panFormData.append('phone', kycFormData.phone);
      if (kycFormData.panDocument) {
        panFormData.append('document', kycFormData.panDocument);
      }
      if (kycFormData.selfie) {
        panFormData.append('selfie', kycFormData.selfie);
      }

      const panResponse = await userApi.uploadKyc(panFormData);
      
      if (!panResponse.success) {
        showToast.error(panResponse.error || 'Failed to upload PAN Card');
        setSubmittingKyc(false);
        return;
      }

      const additionalFormData = new FormData();
      additionalFormData.append('docType', kycFormData.additionalDocType);
      additionalFormData.append('phone', kycFormData.phone);
      if (kycFormData.additionalDocument) {
        additionalFormData.append('document', kycFormData.additionalDocument);
      }
      if (kycFormData.selfie) {
        additionalFormData.append('selfie', kycFormData.selfie);
      }

      const additionalResponse = await userApi.uploadKyc(additionalFormData);
      
      if (!additionalResponse.success) {
        showToast.error(additionalResponse.error || 'Failed to upload additional document');
        setSubmittingKyc(false);
        return;
      }

      showToast.success('KYC documents uploaded successfully! Your KYC is pending approval.');
      setKycFormData({
        phone: kycFormData.phone,
        panDocument: null,
        additionalDocType: 'AADHAAR',
        additionalDocument: null,
        selfie: null,
      });
      setCapturedImage(null);
      loadKycData();
      loadProfile();
    } catch (error) {
      showToast.error('An error occurred while uploading KYC documents');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          Profile & Settings
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">Manage your account settings and preferences</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2 border-b border-gray-200 overflow-x-auto"
      >
        {(['profile', 'password', 'security', 'bank-accounts', 'kyc'] as const).map((tab, index) => (
          <motion.button
            key={tab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold transition-all relative whitespace-nowrap ${
              activeTab === tab
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-tab={tab}
          >
            {tab === 'bank-accounts' ? 'Bank Accounts' : tab === 'kyc' ? 'KYC Verification' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Profile Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              <div className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-2">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-2">Phone cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Referral Code</label>
                  <input
                    type="text"
                    value={user?.referralCode || ''}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">KYC Status</label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`px-4 py-3 rounded-xl font-semibold ${
                      user?.kycStatus === 'APPROVED'
                        ? 'bg-success/20 text-success border border-success/30'
                        : user?.kycStatus === 'PENDING'
                        ? 'bg-warning/20 text-warning border border-warning/30'
                        : 'bg-error/20 text-error border border-error/30'
                    }`}
                  >
                    {user?.kycStatus || 'PENDING'}
                  </motion.div>
                </div>
                <AnimatedButton
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  fullWidth
                  size="lg"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    '✓ Save Changes'
                  )}
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
              <div className="space-y-5 max-w-2xl">
                <AnimatedInput
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
                <AnimatedInput
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
                <AnimatedInput
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
                <AnimatedButton
                  onClick={handleChangePassword}
                  disabled={saving}
                  fullWidth
                  size="lg"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Changing...</span>
                    </span>
                  ) : (
                    '✓ Change Password'
                  )}
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
              <div className="space-y-4 max-w-2xl">
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200"
                >
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-1">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <AnimatedButton variant="secondary" size="sm">
                    Enable
                  </AnimatedButton>
                </motion.div>
                <GlassCard className="bg-gray-50">
                  <h3 className="text-gray-900 font-semibold mb-3">Account Activity</h3>
                  <p className="text-sm text-gray-600">
                    Last login: <span className="text-gray-900 font-medium">{new Date().toLocaleString()}</span>
                  </p>
                </GlassCard>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Bank Accounts Tab */}
        {activeTab === 'bank-accounts' && (
          <motion.div
            key="bank-accounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bank Accounts</h2>
              
              {/* Add Bank Account Form */}
              <div className="space-y-5 w-[30%] mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Add New Bank Account</h3>
                
                {/* KYC Warning */}
                {user?.kycStatus !== 'APPROVED' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">KYC Verification Required</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          You must complete KYC verification before adding a bank account. Please submit your KYC documents first.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div>
                  <AnimatedInput
                    label="Account Holder Name"
                    type="text"
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    placeholder="Auto-filled from profile name"
                    disabled={true}
                  />
                  <p className="text-xs text-gray-600 mt-1">Account holder name must match your profile name</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Account Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAccountNumber ? "text" : "password"}
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showAccountNumber ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Account number is hidden for security</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Re-enter Account Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showReenterAccountNumber ? "text" : "password"}
                      value={bankForm.reenterAccountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, reenterAccountNumber: e.target.value })}
                      onPaste={handleAccountNumberPaste}
                      placeholder="Re-enter account number"
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowReenterAccountNumber(!showReenterAccountNumber)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showReenterAccountNumber ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Type manually - paste is disabled</p>
                </div>
                <div>
                  <AnimatedInput
                    label="IFSC Code"
                    type="text"
                    value={bankForm.ifscCode}
                    onChange={(e) => {
                      const ifsc = e.target.value.toUpperCase();
                      setBankForm({ ...bankForm, ifscCode: ifsc });
                      if (ifsc.length === 11) {
                        fetchBankDetailsByIFSC(ifsc);
                      } else {
                        setBankDetailsFetched(false);
                      }
                    }}
                    placeholder="Enter IFSC code"
                    maxLength={11}
                  />
                  {fetchingBankDetails && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <LoadingSpinner size="sm" />
                      <span>Fetching bank details...</span>
                    </p>
                  )}
                  {bankDetailsFetched && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <span>✅</span>
                      <span>Bank details verified</span>
                    </p>
                  )}
                </div>
                <AnimatedInput
                  label="Bank Name"
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="Auto-filled from IFSC"
                  disabled={fetchingBankDetails || bankDetailsFetched}
                />
                <AnimatedInput
                  label="Branch Name (Optional)"
                  type="text"
                  value={bankForm.branchName}
                  onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                  placeholder="Auto-filled from IFSC"
                  disabled={fetchingBankDetails || bankDetailsFetched}
                />
                <AnimatedButton
                  onClick={handleAddBankAccount}
                  disabled={addingBankAccount || user?.kycStatus !== 'APPROVED'}
                  fullWidth
                  size="lg"
                >
                  {addingBankAccount ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Adding...</span>
                    </span>
                  ) : user?.kycStatus !== 'APPROVED' ? (
                    '🔒 Complete KYC to Add Bank Account'
                  ) : (
                    '✓ Add Bank Account'
                  )}
                </AnimatedButton>
              </div>

              {/* Saved Bank Accounts List */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Bank Accounts</h3>
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">🏦</p>
                    <p className="mt-2">No bank accounts added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankAccounts.map((account, index) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{account.accountName}</p>
                          <p className="text-sm text-gray-600 font-mono mt-1">
                            {account.accountNumber.replace(/\d(?=\d{4})/g, '*')}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-600">
                            <span>🏦 {account.bankName}</span>
                            <span>📍 {account.ifscCode}</span>
                            {account.branchName && <span>🌿 {account.branchName}</span>}
                          </div>
                        </div>
                        <AnimatedButton
                          onClick={() => handleDeleteBankAccount(account.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </AnimatedButton>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* KYC Verification Tab */}
        {activeTab === 'kyc' && (
          <motion.div
            key="kyc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* KYC Status Banner */}
            <GlassCard className={`mb-8 ${
              kycStatus === 'APPROVED'
                ? 'bg-success/10 border-success/50'
                : kycStatus === 'PENDING'
                ? 'bg-warning/10 border-warning/50'
                : kycStatus === 'REJECTED'
                ? 'bg-error/10 border-error/50'
                : 'border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    KYC Status: <span className="capitalize">
                      {kycDocuments.length === 0 ? 'Not Submitted' : kycStatus || 'Not Submitted'}
                    </span>
                  </h2>
                  {kycDocuments.length > 0 && kycStatus === 'APPROVED' && (
                    <p className="text-green-700 font-semibold">Your KYC has been approved.</p>
                  )}
                  {kycDocuments.length > 0 && kycStatus === 'PENDING' && (
                    <p className="text-warning font-semibold">Your KYC is under review. Please wait for admin approval.</p>
                  )}
                  {kycDocuments.length > 0 && kycStatus === 'REJECTED' && (
                    <p className="text-error font-semibold">
                      Your KYC was rejected. Please check the remarks and submit again.
                    </p>
                  )}
                  {kycDocuments.length === 0 && (
                    <p className="text-gray-400">
                      Please complete your KYC verification to enable withdrawals.
                    </p>
                  )}
                </div>
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-5xl"
                >
                  {kycStatus === 'APPROVED' ? '✅' : kycStatus === 'PENDING' ? '⏳' : kycStatus === 'REJECTED' ? '❌' : '📄'}
                </motion.div>
              </div>
            </GlassCard>

            {/* Previous KYC Submissions */}
            {kycDocuments.length > 0 && (
              <GlassCard className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Previous Submissions</h2>
                <div className="space-y-4">
                  {kycDocuments.map((doc: any, index: number) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                    >
                      <GlassCard className="bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">Document Type: {doc.docType}</span>
                            <motion.span
                              whileHover={{ scale: 1.1 }}
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                doc.status === 'APPROVED'
                                  ? 'bg-success/20 text-success border border-success/30'
                                  : doc.status === 'PENDING'
                                  ? 'bg-warning/20 text-warning border border-warning/30'
                                  : 'bg-error/20 text-error border border-error/30'
                              }`}
                            >
                              {doc.status}
                            </motion.span>
                          </div>
                          <span className="text-sm text-gray-400">{formatDate(doc.createdAt)}</span>
                        </div>
                        {doc.remarks && (
                          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-3">
                            <p className="text-sm text-warning">
                              <span className="font-bold">Remarks:</span> {doc.remarks}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3 mt-4">
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                              const baseUrl = apiBaseUrl.replace(/\/api$/, '');
                              let filename = doc.fileUrl;
                              if (filename.includes('/')) {
                                filename = filename.split('/').pop() || filename;
                              } else if (filename.includes('\\')) {
                                filename = filename.split('\\').pop() || filename;
                              }
                              window.open(`${baseUrl}/uploads/${filename}`, '_blank');
                            }}
                          >
                            📄 View Document
                          </AnimatedButton>
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                              const baseUrl = apiBaseUrl.replace(/\/api$/, '');
                              let filename = doc.selfieUrl;
                              if (filename.includes('/')) {
                                filename = filename.split('/').pop() || filename;
                              } else if (filename.includes('\\')) {
                                filename = filename.split('\\').pop() || filename;
                              }
                              window.open(`${baseUrl}/uploads/${filename}`, '_blank');
                            }}
                          >
                            📸 View Selfie
                          </AnimatedButton>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* KYC Submission Form */}
            {(kycDocuments.length === 0 || (kycStatus !== 'PENDING' && kycStatus !== 'APPROVED')) && (
              <GlassCard>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit KYC Documents</h2>
                <form onSubmit={handleKycSubmit} className="space-y-6">
                  <AnimatedInput
                    label="Mobile Number *"
                    type="tel"
                    value={kycFormData.phone}
                    onChange={(e) => {
                      setKycFormData({ ...kycFormData, phone: e.target.value });
                      setKycErrors({ ...kycErrors, phone: '' });
                    }}
                    placeholder="+919876543210"
                    error={kycErrors.phone}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      PAN Card * (Mandatory)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleKycFileChange('panDocument', file);
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 ${
                        kycErrors.panDocument ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {kycErrors.panDocument && <p className="text-error text-sm mt-2">{kycErrors.panDocument}</p>}
                    {kycFormData.panDocument && (
                      <p className="text-sm text-success mt-2">✓ Selected: {kycFormData.panDocument.name}</p>
                    )}
                  </div>

                  <div>
                    <AnimatedInput
                      as="select"
                      label="Additional Document Type *"
                      value={kycFormData.additionalDocType}
                      onChange={(e) => {
                        setKycFormData({ ...kycFormData, additionalDocType: e.target.value as any });
                        setKycErrors({ ...kycErrors, additionalDocType: '' });
                      }}
                      error={kycErrors.additionalDocType}
                    >
                      <option value="AADHAAR">Aadhaar</option>
                      <option value="VOTER_ID">Voter ID</option>
                      <option value="PASSPORT">Passport</option>
                    </AnimatedInput>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Additional Document Image *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleKycFileChange('additionalDocument', file);
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 ${
                        kycErrors.additionalDocument ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {kycErrors.additionalDocument && <p className="text-error text-sm mt-2">{kycErrors.additionalDocument}</p>}
                    {kycFormData.additionalDocument && (
                      <p className="text-sm text-success mt-2">✓ Selected: {kycFormData.additionalDocument.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Selfie * (Required - Live Capture)
                    </label>
                    
                    {!showCamera && !capturedImage && (
                      <AnimatedButton
                        type="button"
                        onClick={startCamera}
                        fullWidth
                        size="lg"
                      >
                        📷 Capture Selfie with Camera
                      </AnimatedButton>
                    )}

                    {showCamera && (
                      <div className="space-y-4">
                        <div className="relative bg-black rounded-xl overflow-hidden border-2 border-accent-blue/30">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-auto max-h-96"
                          />
                        </div>
                        <div className="flex gap-3">
                          <AnimatedButton
                            type="button"
                            onClick={captureSelfie}
                            variant="secondary"
                            fullWidth
                          >
                            📸 Capture
                          </AnimatedButton>
                          <AnimatedButton
                            type="button"
                            onClick={() => stopCamera(false)}
                            variant="danger"
                            fullWidth
                          >
                            ❌ Cancel
                          </AnimatedButton>
                        </div>
                      </div>
                    )}

                    {capturedImage && !showCamera && (
                      <div className="space-y-4">
                        <div className="relative bg-black rounded-xl overflow-hidden border-2 border-success/30">
                          <img
                            src={capturedImage}
                            alt="Captured selfie"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                        <div className="flex gap-3">
                          <AnimatedButton
                            type="button"
                            onClick={startCamera}
                            variant="secondary"
                            fullWidth
                          >
                            🔄 Retake
                          </AnimatedButton>
                          <AnimatedButton
                            type="button"
                            onClick={() => {
                              setCapturedImage(null);
                              setKycFormData((prev) => ({ ...prev, selfie: null }));
                            }}
                            variant="danger"
                            fullWidth
                          >
                            ❌ Remove
                          </AnimatedButton>
                        </div>
                        {kycFormData.selfie && (
                          <p className="text-sm text-success text-center">✓ Selfie captured successfully</p>
                        )}
                      </div>
                    )}

                    {kycErrors.selfie && <p className="text-error text-sm mt-2">{kycErrors.selfie}</p>}
                  </div>

                  <AnimatedButton
                    type="submit"
                    disabled={submittingKyc}
                    fullWidth
                    size="lg"
                  >
                    {submittingKyc ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Uploading...</span>
                      </span>
                    ) : (
                      '✓ Submit KYC Documents'
                    )}
                  </AnimatedButton>
                </form>
              </GlassCard>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-8">
              <h3 className="font-semibold text-gray-900 mb-2">📋 Important Information</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>KYC verification is required to enable withdrawals</li>
                <li>Deposits are allowed even without KYC approval</li>
                <li>Please ensure documents are clear and readable</li>
                <li>KYC approval typically takes 24-48 hours</li>
                <li>You will be notified once your KYC is approved or rejected</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;

