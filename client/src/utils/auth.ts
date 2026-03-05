// Auth utility functions

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  kycStatus?: string;
}

const ALLOWED_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'KYC_MANAGER'];

export const isAdminRole = (role: string): boolean => {
  return ALLOWED_ADMIN_ROLES.includes(role);
};

export const getUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setUserToStorage = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearUserFromStorage = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
};

export const hasAdminAccess = (): boolean => {
  const user = getUserFromStorage();
  if (!user) return false;
  return isAdminRole(user.role);
};
