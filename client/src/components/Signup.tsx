import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import { detectInputType } from "../utils/validation";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [input, setInput] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralPreview, setReferralPreview] = useState("");
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [countryCode, setCountryCode] = useState("91");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  // Extract referral code from URL query parameter
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
      setIsReferralFromUrl(true);
    }
  }, [searchParams]);

  const inputType = detectInputType(input);

  const handleValidateReferral = async () => {
    setReferralValid(null);
    setReferralPreview("");

    const value = referralCode.trim();
    if (!value) return;

    const res = await apiService.validateReferral(value);
    if (res.success && res.data?.valid) {
      setReferralValid(true);
      setReferralPreview(res.data.previewName || "");
    } else {
      setReferralValid(false);
      setReferralPreview("");
    }
  };

  const handleStartRegistration = async () => {
    setError('');

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!input.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (inputType === 'invalid') {
      setError('Please enter a valid email or phone number');
      return;
    }

    // Mobile number length validation based on country code
    if (inputType === 'mobile') {
      const raw = input.trim().replace(/\s+/g, '');
      const digits = raw.replace(/[^0-9]/g, '');
      let validLen = true;

      switch (countryCode) {
        case '91': // India
        case '1':  // USA / Canada
        case '44': // UK
        case '92': // Pakistan
        case '81': // Japan
          validLen = digits.length === 10;
          break;
        case '61': // Australia
        case '971': // UAE
          validLen = digits.length === 9;
          break;
        case '49': // Germany
          validLen = digits.length === 10 || digits.length === 11;
          break;
        case '33': // France
          validLen = digits.length === 9;
          break;
        case '65': // Singapore
          validLen = digits.length === 8;
          break;
        default:
          // For any other code, require at least 8 digits
          validLen = digits.length >= 8;
      }

      if (!validLen) {
        setError('Invalid Mobile Number Length');
        return;
      }
    }

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Notice');
      return;
    }

    setLoading(true);

    try {
      const payload: any = { fullName };

      if (inputType === 'email') {
        payload.email = input.trim();
      } else {
        const phoneNumber = input.trim().replace(/\s+/g, '');
        payload.phone = `+${countryCode}${phoneNumber}`;
      }

      if (referralCode.trim()) {
        payload.referral = referralCode.trim();
      }

      const response = await apiService.startRegistration(payload);
      if (response.success && response.data) {
        setPendingId(response.data.pendingId);
        setStep("otp");
      } else {
        setError(response.error || 'Failed to start registration. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!pendingId) {
      setError("Registration session not found. Please start again.");
      return;
    }
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyRegistrationOtp({
        pendingId,
        otp: otp.trim(),
      });
      if (response.success && response.data) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/dashboard", { replace: true });
      } else {
        setError(response.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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

            {/* Full Name */}
            {step === "form" && (
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#09090b" }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: "13px",
                    color: "#09090b",
                  }}
                />
              </div>
            )}

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
                    <option value="91">+91 (India)</option>
                    <option value="1">+1 (USA / Canada)</option>
                    <option value="44">+44 (UK)</option>
                    <option value="61">+61 (Australia)</option>
                    <option value="971">+971 (UAE)</option>
                    <option value="92">+92 (Pakistan)</option>
                    <option value="49">+49 (Germany)</option>
                    <option value="33">+33 (France)</option>
                    <option value="65">+65 (Singapore)</option>
                    <option value="81">+81 (Japan)</option>
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
                disabled={step === "otp"}
              />
            </div>

            {/* OTP Input (Step 2) */}
            {step === "otp" && (
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#09090b" }}
                >
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="6-digit code"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: "13px",
                    color: "#09090b",
                  }}
                />
              </div>
            )}

            {/* Referral Input */}
            <div className="mb-4">
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                Referral (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => {
                    if (!isReferralFromUrl) {
                      setReferralCode(e.target.value);
                      setReferralValid(null);
                      setReferralPreview("");
                    }
                  }}
                  onBlur={handleValidateReferral}
                  placeholder="Referral code / email / phone"
                  maxLength={50}
                  disabled={isReferralFromUrl}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all ${
                    isReferralFromUrl ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: "13px",
                    color: "#09090b",
                  }}
                />
                {referralValid === true && (
                  <span className="text-green-600 text-xs font-semibold">
                    {referralPreview || "✓"}
                  </span>
                )}
                {referralValid === false && (
                  <span className="text-red-600 text-xs font-semibold">
                    Invalid
                  </span>
                )}
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

            {/* Continue / Verify Button */}
            <button
              onClick={step === "form" ? handleStartRegistration : handleVerifyOtp}
              disabled={loading || !agreed}
              className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '14px'
              }}
            >
              {loading
                ? step === "form"
                  ? "Starting registration..."
                  : "Verifying OTP..."
                : step === "form"
                  ? "Create account"
                  : "Verify & continue"}
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
