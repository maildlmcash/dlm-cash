import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, phone, countryCode: _countryCode, type } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!email && !phone) {
      navigate('/forgot-password');
    }
  }, [email, phone, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
  };

  const handleVerifyOTP = async () => {
    setError('');
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const payload: any = { otp: otpString };
      if (type === 'email' && email) {
        payload.email = email;
      } else if (type === 'mobile' && phone) {
        payload.phone = phone;
      }

      const response = await apiService.verifyPasswordResetOTP(payload);

      if (response.success) {
        setOtpVerified(true);
      } else {
        setError(response.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');

    if (!otpVerified) {
      setError('Please verify OTP first');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        otp: otp.join(''),
        newPassword,
      };
      if (type === 'email' && email) {
        payload.email = email;
      } else if (type === 'mobile' && phone) {
        payload.phone = phone;
      }

      const response = await apiService.resetPassword(payload);

      if (response.success) {
        // Navigate to login page
        navigate('/login', { state: { message: 'Password reset successfully. Please login with your new password.' } });
      } else {
        setError(response.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setError('');
    setLoading(true);

    try {
      const payload: any = {};
      if (type === 'email' && email) {
        payload.email = email;
      } else if (type === 'mobile' && phone) {
        payload.phone = phone;
      }

      const response = await apiService.forgotPassword(payload);

      if (response.success) {
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        setOtpVerified(false);
      } else {
        setError(response.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayContact = type === 'email' ? email : phone;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/signup.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Home Icon */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors z-20"
        aria-label="Go to home"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </Link>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[30%] min-w-[350px] max-w-md mx-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="mb-6">
            <h1 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#09090b',
                marginBottom: '8px'
              }}
            >
              Reset Password
            </h1>
            <p 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '14px',
                color: '#71717a',
                lineHeight: '1.5em'
              }}
            >
              {type === 'email' ? (
                <>We've sent a 6-digit verification code to <span style={{ color: '#09090b', fontWeight: 600 }}>{displayContact}</span></>
              ) : (
                <>
                  {import.meta.env.DEV && (
                    <span className="text-yellow-600 text-sm block mb-2">⚠️ Development Mode: SMS not sent. Enter any 6-digit code.</span>
                  )}
                  {!import.meta.env.DEV && <>We've sent a 6-digit verification code to <span style={{ color: '#09090b', fontWeight: 600 }}>{displayContact}</span></>}
                </>
              )}
            </p>
          </div>

          {!otpVerified ? (
            <>
              {/* OTP Input */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-semibold mb-3"
                  style={{ color: '#09090b' }}
                >
                  Enter Verification Code
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-black transition-all"
                      style={{
                        fontFamily: 'Inter, "Inter Placeholder", sans-serif'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Verify OTP Button */}
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
                className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                  className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    color: resendTimer > 0 ? '#71717a' : '#09090b',
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif'
                  }}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* New Password */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#09090b' }}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all pr-10"
                    style={{
                      fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#09090b' }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all pr-10"
                    style={{
                      fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Reset Password Button */}
              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}

          {/* Bottom Link */}
          <div className="text-center mt-8">
            <p 
              className="text-sm"
              style={{ color: '#71717a' }}
            >
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="font-semibold hover:underline"
                style={{ color: '#09090b' }}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Support Contact */}
          <div className="text-center mt-8">
            <p 
              className="text-sm"
              style={{ color: '#71717a' }}
            >
              Need help?{' '}
              <a 
                href="mailto:maildlm.cash@gmail.com" 
                className="font-medium hover:underline"
                style={{ color: '#22c55e' }}
              >
                maildlm.cash@gmail.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;


