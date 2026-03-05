import { Link } from 'react-router-dom';

const UnauthorizedAccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access the admin panel. 
          Only users with SUPER_ADMIN, ADMIN, or KYC_MANAGER roles can access this area.
        </p>
        <Link
          to="/admin/login"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
