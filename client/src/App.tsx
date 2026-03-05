import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Landing from './components/Landing';
import Login from './components/Login';
import Signup from './components/Signup';
import Contact from './components/Contact';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import About from './components/About';
import Features from './components/Features';
import UserLayout from './components/user/UserLayout';
import UserProtectedRoute from './components/user/UserProtectedRoute';
import UserDashboard from './components/user/Dashboard';
import UserWallet from './components/user/Wallet';
import UserInvestment from './components/user/Investment';
import UserROIIncome from './components/user/ROIIncome';
import UserReferral from './components/user/Referral';
import UserTransactions from './components/user/Transactions';
import UserNotifications from './components/user/Notifications';
import UserProfilePage from './components/user/Profile';
import UserSupport from './components/user/Support';
import KYC from './components/user/KYC';
import EmailVerification from './components/EmailVerification';
import MobileVerification from './components/MobileVerification';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import Dashboard from './components/admin/Dashboard';
import Users from './components/admin/Users';
import UserProfile from './components/admin/UserProfile';
import KYCManagement from './components/admin/KYCManagement';
import Plans from './components/admin/Plans';
import Investments from './components/admin/Investments';
import Deposits from './components/admin/Deposits';
import AuthKeys from './components/admin/AuthKeys';
import Withdrawals from './components/admin/Withdrawals';
import Blog from './components/admin/Blog';
import ROISalary from './components/admin/ROISalary';
import Referrals from './components/admin/Referrals';
import Breakdown from './components/admin/Breakdown';
import Transactions from './components/admin/Transactions';
import Wallets from './components/admin/Wallets';
import Currency from './components/admin/Currency';
import Staff from './components/admin/Staff';
import WhiteLabel from './components/admin/WhiteLabel';
import Notifications from './components/admin/Notifications';
import Reports from './components/admin/Reports';
import Support from './components/admin/Support';
import CMS from './components/admin/CMS';
import Settings from './components/admin/Settings';
import AdminProfile from './components/admin/AdminProfile';
import FundManagement from './components/admin/FundManagement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/verify-mobile" element={<MobileVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* User Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <Navigate to="/wallet/inr" replace />
          }
        />
        <Route
          path="/wallet/:type"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserWallet />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/investment"
          element={
            <Navigate to="/investment/plans" replace />
          }
        />
        <Route
          path="/investment/:type"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserInvestment />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/roi-income/:type?"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserROIIncome />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/referral"
          element={
            <Navigate to="/referral/invite" replace />
          }
        />
        <Route
          path="/referral/:type"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserReferral />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserTransactions />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserNotifications />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserProfilePage />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <UserSupport />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <KYC />
              </UserLayout>
            </UserProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/verified"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/pending-kyc"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/blocked"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <UserProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <KYCManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Plans />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auth-keys"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AuthKeys />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/investments"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Investments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auth-keys"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AuthKeys />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deposits"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Deposits />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Withdrawals />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Blog />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roi"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ROISalary />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/referrals"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Referrals />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/breakdown"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Breakdown />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Transactions />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/wallets"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Wallets />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/currency"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Currency />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Staff />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/whitelabel"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <WhiteLabel />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Notifications />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Support />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CMS />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fund-management"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <FundManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
