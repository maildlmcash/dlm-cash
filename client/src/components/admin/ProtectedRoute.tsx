import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { hasAdminAccess, getUserFromStorage, isAdminRole } from '../../utils/auth';
import { apiService } from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Check if user info is in storage
      const user = getUserFromStorage();
      if (user && hasAdminAccess()) {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // If no user in storage, fetch profile to verify role
      try {
        const response = await apiService.getProfile();
        if (response.success && response.data) {
          const userData = response.data as any;
          // Store user info
          localStorage.setItem('user', JSON.stringify(userData));
          // Check if user has admin role
          if (isAdminRole(userData.role)) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Checking authorization...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Clear invalid auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
