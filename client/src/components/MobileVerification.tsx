import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

const MobileVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, countryCode } = (location.state as { phone?: string; countryCode?: string }) || {};
  const mobile = phone; // For backward compatibility

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!phone && !mobile) {
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
  }, [phone, mobile, navigate]);

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
      const phoneNumber = phone || mobile;
      const response = await apiService.verifyOTP({
        phone: phoneNumber,
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
      const phoneNumber = phone || mobile;
      const response = await apiService.resendOTP({ phone: phoneNumber });

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

  const phoneNumber = phone || mobile;
  const displayMobile = phoneNumber?.startsWith('+')
    ? phoneNumber
    : (countryCode ? `+${countryCode} ${phoneNumber}` : phoneNumber || 'your phone');

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-[#1E2329] rounded-2xl p-8 lg:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded transform rotate-45"></div>
            <span className="text-2xl font-bold text-white">DLM CASH</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Verify your mobile</h2>
          <p className="text-gray-400 mb-8">
            {import.meta.env.DEV ? (
              <>
                <span className="text-yellow-500 text-sm block mb-2">⚠️ Development Mode: SMS not sent. Enter any 6-digit code.</span>
                Verification code for <span className="text-white font-medium">{displayMobile}</span>
              </>
            ) : (
              <>We've sent a 6-digit verification code to <span className="text-white font-medium">{displayMobile}</span></>
            )}
          </p>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-3">
              Enter verification code
            </label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
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
                  className="w-full h-14 text-center text-2xl font-bold bg-[#0B0E11] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                />
              ))}
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors mb-4"
          >
            {loading ? 'Verifying...' : 'Verify Mobile'}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-blue-500 hover:underline disabled:text-gray-600 disabled:no-underline text-sm"
            >
              {resendLoading
                ? 'Sending...'
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : 'Resend code'}
            </button>
          </div>

          {/* Back to Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="text-gray-400 hover:text-white text-sm"
            >
              ← Back to signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileVerification;

