import { Navigate } from 'react-router-dom';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check if user is verified
    if (!user.isVerified) {
      // Redirect to appropriate verification page
      if (user.email) {
        return <Navigate to="/verify-email" replace />;
      } else if (user.phone) {
        return <Navigate to="/verify-mobile" replace />;
      }
    }

    // Check if user is admin - redirect to admin panel
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

export default UserProtectedRoute;

