// API service for authentication endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface SignupRequest {
  email?: string;
  phone?: string;
  password: string;
  name?: string;
  referralCode?: string;
}

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  otp: string;
}

interface ResendOtpRequest {
  email?: string;
  phone?: string;
}

interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
}

interface VerifyPasswordResetOtpRequest {
  email?: string;
  phone?: string;
  otp: string;
}

interface ResetPasswordRequest {
  email?: string;
  phone?: string;
  otp: string;
  newPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // Add auth token if available
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options,
      });

      const data: BackendResponse<T> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Signup with email or phone
  // OTP is automatically sent on registration
  async signup(payload: SignupRequest): Promise<ApiResponse<{ user: any; requiresVerification: boolean }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Verify OTP
  async verifyOTP(payload: VerifyOtpRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Resend OTP
  async resendOTP(payload: ResendOtpRequest): Promise<ApiResponse<null>> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Login with email or phone
  async login(payload: LoginRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Forgot Password - Request OTP
  async forgotPassword(payload: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Verify Password Reset OTP
  async verifyPasswordResetOTP(payload: VerifyPasswordResetOtpRequest): Promise<ApiResponse<{ verified: boolean }>> {
    return this.request('/auth/verify-password-reset-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Reset Password
  async resetPassword(payload: ResetPasswordRequest): Promise<ApiResponse<null>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Get User Profile
  async getProfile(): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/profile', {
      method: 'GET',
    });
  }

  // Update User Profile
  async updateProfile(payload: { name?: string; email?: string; phone?: string }): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Change Password
  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
    return this.request<null>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiService = new ApiService();
export type { SignupRequest, LoginRequest, VerifyOtpRequest, ResendOtpRequest, ForgotPasswordRequest, VerifyPasswordResetOtpRequest, ResetPasswordRequest };

