import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { userApi } from '../../services/userApi';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import AnimatedInput from '../common/AnimatedInput';
import GlassCard from '../common/GlassCard';

interface KycDocument {
  id: string;
  docType: string;
  fileUrl: string;
  selfieUrl: string;
  status: string;
  remarks?: string;
  createdAt: string;
}

const KYC = () => {
  const [user, setUser] = useState<any>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: '',
    panDocument: null as File | null, // PAN Card (mandatory)
    additionalDocType: 'AADHAAR' as 'AADHAAR' | 'VOTER_ID' | 'PASSPORT',
    additionalDocument: null as File | null, // Additional document
    selfie: null as File | null,
  });

  // Camera capture state
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    phone: '',
    panDocument: '',
    additionalDocType: '',
    additionalDocument: '',
    selfie: '',
  });

  useEffect(() => {
    loadUserData();
    loadKycData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const userData = response.data as any;
        setUser(userData);
        setFormData((prev) => ({
          ...prev,
          phone: userData.phone || '',
        }));
        setKycStatus(userData.kycStatus || 'PENDING');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadKycData = async () => {
    try {
      setLoading(true);
      const [kycResponse, statusResponse, profileResponse] = await Promise.all([
        userApi.getMyKyc(),
        userApi.getKycStatus(),
        apiService.getProfile(),
      ]);

      if (kycResponse.success && kycResponse.data) {
        setKycDocuments(kycResponse.data as KycDocument[]);
      }

      // Use the same status source as dashboard - from user profile
      if (profileResponse.success && profileResponse.data) {
        const userData = profileResponse.data as any;
        const documents = kycResponse.success && kycResponse.data ? (kycResponse.data as KycDocument[]) : [];
        
        // If no documents exist, treat as not submitted
        if (documents.length === 0) {
          setKycStatus('');
        } else {
          // Use the user's kycStatus from profile (same as dashboard)
          setKycStatus(userData.kycStatus || '');
        }
      } else if (statusResponse.success && statusResponse.data) {
        const data = statusResponse.data as any;
        const documents = kycResponse.success && kycResponse.data ? (kycResponse.data as KycDocument[]) : [];
        if (documents.length > 0) {
          setKycStatus(data.kycStatus || '');
        } else {
          setKycStatus('');
        }
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      phone: '',
      panDocument: '',
      additionalDocType: '',
      additionalDocument: '',
      selfie: '',
    };

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be in E.164 format (e.g., +919876543210)';
    }

    // PAN Card is mandatory
    if (!formData.panDocument) {
      newErrors.panDocument = 'PAN Card is mandatory';
    }

    // Additional document type is required
    if (!formData.additionalDocType) {
      newErrors.additionalDocType = 'Additional document type is required';
    }

    // Additional document is required
    if (!formData.additionalDocument) {
      newErrors.additionalDocument = 'Additional document image is required';
    }

    if (!formData.selfie) {
      newErrors.selfie = 'Selfie is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== '');
  };

  const handleFileChange = (field: 'panDocument' | 'additionalDocument' | 'selfie', file: File | null) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('File size must be less than 5MB');
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Camera capture functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Front camera
        audio: false,
      });
      setStream(mediaStream);
      setShowCamera(true);
      // Set video srcObject after state update
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
        
        // Set captured image first (synchronously)
        setCapturedImage(imageDataUrl);
        
        // Stop camera but keep the captured image
        stopCamera(true);

        // Convert data URL to File (asynchronously)
        fetch(imageDataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setFormData((prev) => ({ ...prev, selfie: file }));
            setErrors((prev) => ({ ...prev, selfie: '' }));
          })
          .catch((error) => {
            console.error('Error converting image to file:', error);
            showToast.error('Error processing captured image');
          });
      }
    }
  };

  // Cleanup camera on unmount and update video srcObject when stream changes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // First upload PAN Card
      const panFormData = new FormData();
      panFormData.append('docType', 'PAN');
      panFormData.append('phone', formData.phone);
      if (formData.panDocument) {
        panFormData.append('document', formData.panDocument);
      }
      if (formData.selfie) {
        panFormData.append('selfie', formData.selfie);
      }

      const panResponse = await userApi.uploadKyc(panFormData);
      
      if (!panResponse.success) {
        showToast.error(panResponse.error || 'Failed to upload PAN Card');
        setSubmitting(false);
        return;
      }

      // Then upload additional document
      const additionalFormData = new FormData();
      additionalFormData.append('docType', formData.additionalDocType);
      additionalFormData.append('phone', formData.phone);
      if (formData.additionalDocument) {
        additionalFormData.append('document', formData.additionalDocument);
      }
      if (formData.selfie) {
        additionalFormData.append('selfie', formData.selfie);
      }

      const additionalResponse = await userApi.uploadKyc(additionalFormData);
      
      if (!additionalResponse.success) {
        showToast.error(additionalResponse.error || 'Failed to upload additional document');
        setSubmitting(false);
        return;
      }

      const response = additionalResponse;

      if (response.success) {
        showToast.success('KYC documents uploaded successfully! Your KYC is pending approval.');
        setFormData({
          phone: formData.phone,
          panDocument: null,
          additionalDocType: 'AADHAAR',
          additionalDocument: null,
          selfie: null,
        });
        loadKycData();
        loadUserData();
      } else {
        showToast.error(response.error || 'Failed to upload KYC documents');
      }
    } catch (error) {
      showToast.error('An error occurred while uploading KYC documents');
    } finally {
      setSubmitting(false);
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

  // Check if user has actually submitted documents
  const hasSubmittedDocuments = kycDocuments.length > 0;
  const canSubmitNew = !hasSubmittedDocuments || (kycStatus !== 'PENDING' && kycStatus !== 'APPROVED');

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          KYC Verification
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">Verify your identity to enable withdrawals</p>
      </motion.div>

      {/* KYC Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCard className={`${
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
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                KYC Status: <span className="capitalize">
                  {!hasSubmittedDocuments ? 'Not Submitted' : kycStatus || 'Not Submitted'}
                </span>
              </h2>
              {hasSubmittedDocuments && kycStatus === 'APPROVED' && (
                <p className="text-green-700 font-semibold">Your KYC has been approved.</p>
              )}
              {hasSubmittedDocuments && kycStatus === 'PENDING' && (
                <p className="text-warning font-semibold">Your KYC is under review. Please wait for admin approval.</p>
              )}
              {hasSubmittedDocuments && kycStatus === 'REJECTED' && (
                <p className="text-error font-semibold">
                  Your KYC was rejected. Please check the remarks and submit again.
                </p>
              )}
              {!hasSubmittedDocuments && (
                <p className="text-gray-400">
                  Please complete your KYC verification.
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
      </motion.div>

      {/* Previous KYC Submissions */}
      {kycDocuments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Previous Submissions</h2>
            <div className="space-y-4">
              {kycDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
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
        </motion.div>
      )}

      {/* KYC Submission Form */}
      {canSubmitNew && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Submit KYC Documents</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mobile Number */}
              <AnimatedInput
                label="Mobile Number *"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setErrors({ ...errors, phone: '' });
                }}
                placeholder="+919876543210"
                error={errors.phone}
              />
              <p className="text-xs text-gray-600 -mt-4">
                {user?.phone
                  ? 'Your registered mobile number (you can update it)'
                  : 'Enter your mobile number in E.164 format (e.g., +919876543210)'}
              </p>

              {/* PAN Card Upload (Mandatory) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  PAN Card * (Mandatory)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('panDocument', file);
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 ${
                    errors.panDocument ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.panDocument && <p className="text-error text-sm mt-2">{errors.panDocument}</p>}
                {formData.panDocument && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-success mt-2 flex items-center gap-1"
                  >
                    <span>✓</span>
                    <span>Selected: {formData.panDocument.name} ({(formData.panDocument.size / 1024).toFixed(2)} KB)</span>
                  </motion.p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Upload a clear image of your PAN Card (Max 5MB, JPEG/PNG/WebP)
                </p>
              </div>

              {/* Additional Document Type */}
              <div>
                <AnimatedInput
                  as="select"
                  label="Additional Document Type * (Choose one)"
                  value={formData.additionalDocType}
                  onChange={(e) => {
                    setFormData({ ...formData, additionalDocType: e.target.value as any });
                    setErrors({ ...errors, additionalDocType: '' });
                  }}
                  error={errors.additionalDocType}
                  className="cursor-pointer z-50"
                >
                  <option value="AADHAAR" className="bg-white text-gray-900 py-2">Aadhaar</option>
                  <option value="VOTER_ID" className="bg-white text-gray-900 py-2">Voter ID</option>
                  <option value="PASSPORT" className="bg-white text-gray-900 py-2">Passport</option>
                </AnimatedInput>
              </div>

              {/* Additional Document Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Additional Document Image * ({formData.additionalDocType === 'AADHAAR' ? 'Aadhaar' : formData.additionalDocType === 'VOTER_ID' ? 'Voter ID' : 'Passport'})
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('additionalDocument', file);
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 ${
                    errors.additionalDocument ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.additionalDocument && <p className="text-error text-sm mt-2">{errors.additionalDocument}</p>}
                {formData.additionalDocument && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-success mt-2 flex items-center gap-1"
                  >
                    <span>✓</span>
                    <span>Selected: {formData.additionalDocument.name} ({(formData.additionalDocument.size / 1024).toFixed(2)} KB)</span>
                  </motion.p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Upload a clear image of your {formData.additionalDocType === 'AADHAAR' ? 'Aadhaar' : formData.additionalDocType === 'VOTER_ID' ? 'Voter ID' : 'Passport'} (Max 5MB, JPEG/PNG/WebP)
                </p>
              </div>

              {/* Selfie Capture */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Selfie * (Required - Live Capture)
                </label>
                
                {!showCamera && !capturedImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3"
                  >
                    <AnimatedButton
                      type="button"
                      onClick={startCamera}
                      fullWidth
                      size="lg"
                    >
                      📷 Capture Selfie with Camera
                    </AnimatedButton>
                    <p className="text-xs text-gray-400 text-center">
                      Click to open camera and capture your selfie live
                    </p>
                  </motion.div>
                )}

                {showCamera && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
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
                        className="bg-gradient-to-r from-success to-green-600 hover:from-green-600 hover:to-success"
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
                  </motion.div>
                )}

                {capturedImage && !showCamera && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
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
                          setFormData((prev) => ({ ...prev, selfie: null }));
                        }}
                        variant="danger"
                        fullWidth
                      >
                        ❌ Remove
                      </AnimatedButton>
                    </div>
                    {formData.selfie && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-success text-center flex items-center justify-center gap-1"
                      >
                        <span>✓</span>
                        <span>Selfie captured successfully ({(formData.selfie.size / 1024).toFixed(2)} KB)</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {errors.selfie && <p className="text-error text-sm mt-2">{errors.selfie}</p>}
              </div>

              {/* Submit Button */}
              <AnimatedButton
                type="submit"
                disabled={submitting}
                fullWidth
                size="lg"
              >
                {submitting ? (
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
        </motion.div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-2">📋 Important Information</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>KYC verification is required to enable withdrawals</li>
          <li>Deposits are allowed even without KYC approval</li>
          <li>Please ensure documents are clear and readable</li>
          <li>KYC approval typically takes 24-48 hours</li>
          <li>You will be notified once your KYC is approved or rejected</li>
        </ul>
      </div>
    </div>
  );
};

export default KYC;

