import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import { detectInputType, validatePassword } from "../utils/validation";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [countryCode, setCountryCode] = useState("91");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extract referral code from URL query parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setIsReferralFromUrl(true);
    }
  }, [searchParams]);

  const inputType = detectInputType(input);

  const handleSignup = async () => {
    setError('');

    if (!input.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (inputType === 'invalid') {
      setError('Please enter a valid email or phone number');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Invalid password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Notice');
      return;
    }

    setLoading(true);

    try {
      const signupPayload: any = { password };

      if (inputType === 'email') {
        signupPayload.email = input.trim();
      } else {
        const phoneNumber = input.trim().replace(/\s+/g, '');
        signupPayload.phone = `+${countryCode}${phoneNumber}`;
      }

      if (referralCode.trim()) {
        signupPayload.referralCode = referralCode.trim().toUpperCase();
      }

      const response = await apiService.signup(signupPayload);

      if (response.success && response.data) {
        if (inputType === 'email') {
          navigate('/verify-email', { state: { email: input.trim() } });
        } else {
          const phoneNumber = input.trim().replace(/\s+/g, '');
          navigate('/verify-mobile', {
            state: { phone: `+${countryCode}${phoneNumber}`, countryCode },
          });
        }
      } else {
        setError(response.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
        className="relative z-10 w-[30%] min-w-[350px] mx-4 my-8"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-h-[90vh] overflow-y-auto"
        >
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
                Create account
              </h1>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '14px',
                  color: '#71717a',
                  lineHeight: '1.5em'
                }}
              >
                Sign up to start your investment journey.
              </p>
            </div>

            {/* Email/Phone Input */}
            <div className="mb-4">
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                {inputType === 'email' ? 'Your email address' : inputType === 'mobile' ? 'Your phone number' : 'Email address or phone number'}
              </label>
              {inputType === 'mobile' && (
                <div className="flex gap-2 mb-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer"
                    style={{
                      fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                      fontSize: '13px'
                    }}
                  >
                    <option value="1">+1 (US)</option>
                    <option value="44">+44 (UK)</option>
                    <option value="91">+91 (IN)</option>
                    <option value="86">+86 (CN)</option>
                    <option value="81">+81 (JP)</option>
                    <option value="49">+49 (DE)</option>
                    <option value="33">+33 (FR)</option>
                    <option value="61">+61 (AU)</option>
                  </select>
                </div>
              )}
              <input
                type={inputType === 'email' ? 'email' : 'tel'}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                placeholder={inputType === 'email' ? 'Enter your email' : inputType === 'mobile' ? 'Enter phone number' : 'Email or phone number'}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '13px',
                  color: '#09090b'
                }}
              />
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Create a password"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all pr-10"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '13px',
                    color: '#09090b'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirm your password"
                  className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all pr-10 ${
                    password !== confirmPassword && confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '13px',
                    color: '#09090b'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
              {password !== confirmPassword && confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Referral Code Input */}
            <div className="mb-4">
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                Referral code <span className="text-gray-500 text-xs font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/\s+/g, '');
                  setReferralCode(value);
                  setError('');
                }}
                placeholder="Enter referral code"
                maxLength={20}
                disabled={isReferralFromUrl}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all ${
                  isReferralFromUrl ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '13px',
                  color: '#09090b'
                }}
              />
              {referralCode && (
                <p className="mt-1 text-xs text-gray-500">
                  {isReferralFromUrl 
                    ? 'Referral code applied from link' 
                    : "You'll be referred by the user with this code"
                  }
                </p>
              )}
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

            {/* Agreement */}
            <div className="mb-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 bg-white text-black focus:ring-black focus:ring-2 cursor-pointer"
                />
                <span 
                  className="text-sm"
                  style={{ color: '#71717a' }}
                >
                  By creating an account, I agree to DLM CASH's{" "}
                  <Link to="/terms" className="font-medium hover:underline" style={{ color: '#09090b' }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="font-medium hover:underline" style={{ color: '#09090b' }}>
                    Privacy Policy
                  </Link>.
                </span>
              </label>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleSignup}
              disabled={loading || !agreed}
              className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '14px'
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            {/* Bottom Links */}
            <div className="text-center mt-8">
              <p 
                className="text-sm"
                style={{ color: '#71717a' }}
              >
                Already have an account?{' '}
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

export default Signup;
