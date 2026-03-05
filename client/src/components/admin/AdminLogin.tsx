import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api';
import { setUserToStorage, isAdminRole, hasAdminAccess } from '../../utils/auth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && hasAdminAccess()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData: any = { password: formData.password };
      if (formData.email) {
        loginData.email = formData.email;
      } else if (formData.phone) {
        loginData.phone = formData.phone;
      } else {
        setError('Please enter email or phone');
        setLoading(false);
        return;
      }

      const response = await apiService.login(loginData);
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Check if user has admin role
        if (!user || !isAdminRole(user.role)) {
          setError('Access denied. Only SUPER_ADMIN, ADMIN, or KYC_MANAGER roles can access the admin panel.');
          localStorage.removeItem('authToken');
          return;
        }

        // Store token and user info
        localStorage.setItem('authToken', token);
        setUserToStorage(user);
        navigate('/admin');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
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
        className="relative z-10 w-[30%] min-w-[350px] mx-4"
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
              Admin Portal
            </h1>
            <p 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '14px',
                color: '#71717a',
                lineHeight: '1.5em'
              }}
            >
              Sign in to access the admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email/Phone Input */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                Email or Phone
              </label>
              <input
                type="text"
                value={formData.email || formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes('@')) {
                    setFormData({ ...formData, email: value, phone: '' });
                  } else {
                    setFormData({ ...formData, phone: value, email: '' });
                  }
                  setError('');
                }}
                required
                placeholder="Enter email or phone"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '13px',
                  color: '#09090b'
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#09090b' }}
              >
                Your password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setError('');
                  }}
                  required
                  placeholder="Enter your password"
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

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: '14px'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </form>

          {/* Bottom Link */}
          <div className="text-center mt-8">
            <p 
              className="text-sm"
              style={{ color: '#71717a' }}
            >
              Not an admin?{' '}
              <Link 
                to="/login" 
                className="font-semibold hover:underline"
                style={{ color: '#09090b' }}
              >
                User login
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

export default AdminLogin;
