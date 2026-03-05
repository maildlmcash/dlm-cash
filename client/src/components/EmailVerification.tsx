import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state as { email?: string }) || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyOTP({
        email,
        otp: otpString,
      });

      if (response.success && response.data) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Navigate to dashboard or home
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.error || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const response = await apiService.resendOTP({ email });

      if (response.success) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(response.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

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
              Verify Your Email
            </h1>
            <p 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '14px',
                color: '#71717a',
                lineHeight: '1.5em'
              }}
            >
              We've sent a 6-digit verification code to{' '}
              <span style={{ color: '#09090b', fontWeight: 600 }}>{email}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label 
              className="block text-sm font-semibold mb-3"
              style={{ color: '#09090b' }}
            >
              Enter Verification Code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-black transition-all"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif'
                  }}
                />
              ))}
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            style={{
              fontFamily: 'Inter, "Inter Placeholder", sans-serif',
              fontSize: '14px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend Code */}
          <div className="text-center mb-6">
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                color: countdown > 0 || resendLoading ? '#71717a' : '#09090b',
                fontFamily: 'Inter, "Inter Placeholder", sans-serif'
              }}
            >
              {resendLoading
                ? 'Sending...'
                : countdown > 0
                ? `Resend code in ${countdown}s`
                : 'Resend verification code'}
            </button>
          </div>

          {/* Bottom Link */}
          <div className="text-center">
            <p 
              className="text-sm"
              style={{ color: '#71717a' }}
            >
              Wrong email?{' '}
              <Link 
                to="/signup" 
                className="font-semibold hover:underline"
                style={{ color: '#09090b' }}
              >
                Go back
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

export default EmailVerification;

