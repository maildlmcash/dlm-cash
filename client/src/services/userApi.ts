// User API service for user dashboard endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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

class UserApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {};

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
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

  // Dashboard
  async getDashboardStats() {
    return this.request('/user/dashboard/stats');
  }

  // Wallets
  async getWallets() {
    return this.request('/user/wallets');
  }

  async getWalletByType(type: string) {
    return this.request(`/user/wallets/${type}`);
  }

  // Transactions
  async getTransactions(params?: { page?: number; limit?: number; type?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/user/transactions${query ? `?${query}` : ''}`);
  }

  async getTransactionById(id: string) {
    return this.request(`/user/transactions/${id}`);
  }

  // Investments
  async getPlans() {
    return this.request('/user/plans');
  }

  async getPlanById(id: string) {
    return this.request(`/user/plans/${id}`);
  }

  async getInvestments(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/user/investments${query ? `?${query}` : ''}`);
  }

  async getInvestmentById(id: string) {
    return this.request(`/user/investments/${id}`);
  }

  async getInvestmentRealTimeROI(id: string) {
    return this.request(`/user/investments/${id}/roi/realtime`);
  }

  async requestBreakdown(investmentId: string) {
    return this.request(`/user/investments/${investmentId}/breakdown`, {
      method: 'POST',
    });
  }

  async cancelBreakdown(investmentId: string) {
    return this.request(`/user/investments/${investmentId}/breakdown`, {
      method: 'DELETE',
    });
  }

  async createInvestment(data: {
    planId: string;
    amount: number;
    purchaseMethod: 'ADMIN_REQUEST' | 'DIRECT_WALLET_INR' | 'DIRECT_WALLET_USDT' | 'AUTH_KEY';
    authKeyCode?: string;
    walletType?: 'INR' | 'USDT';
  }) {
    return this.request('/invest/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // KYC
  async getMyKyc() {
    return this.request('/user/kyc');
  }

  async getKycStatus() {
    return this.request('/user/kyc/status');
  }

  async uploadKyc(formData: FormData) {
    const token = this.getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/kyc/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

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

  // Referrals
  async getReferralTree(level?: number) {
    const query = level ? `?level=${level}` : '';
    return this.request(`/user/referrals/tree${query}`);
  }

  async getReferralIncome(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/user/referrals/income${query ? `?${query}` : ''}`);
  }

  // ROI & Income
  async getROIIncome(params?: { page?: number; limit?: number; type?: 'ROI' | 'SALARY' }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const query = queryParams.toString();
    return this.request(`/user/roi-income${query ? `?${query}` : ''}`);
  }

  // Currency
  async getCurrencyRate() {
    return this.request('/user/currency/rate');
  }

  // ROI Boost
  async getROIBoost(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/user/roi-boost${query ? `?${query}` : ''}`);
  }

  async getDirectReferralIncome(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/user/direct-referral-income${query ? `?${query}` : ''}`);
  }

  async getSalaryIncome(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/user/salary-income${query ? `?${query}` : ''}`);
  }

  // Deposit Wallet (EVM)
  async getDepositWallet() {
    return this.request('/user/deposit-wallet');
  }

  async getDepositWalletTransactions(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/user/deposit-wallet/transactions${query ? `?${query}` : ''}`);
  }

  async getPoolBalances() {
    return this.request('/user/pool-balances');
  }

  async checkDeposits() {
    return this.request('/user/deposit-wallet/check', {
      method: 'POST',
    });
  }

  async createPendingDeposit(data: { txHash: string; amount: number; network?: string }) {
    return this.request('/user/deposit-wallet/pending', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPendingDeposits() {
    return this.request('/user/deposit-wallet/pending');
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number; isRead?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());

    const query = queryParams.toString();
    return this.request(`/user/notifications${query ? `?${query}` : ''}`);
  }
  async markNotificationAsRead(id: string) {
    return this.request(`/user/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Deposits
  async getActiveBankAccounts() {
    return this.request('/deposits/bank-accounts');
  }

  async getActiveUpiAccounts() {
    return this.request('/deposits/upi-accounts');
  }

  async getDepositSettings() {
    return this.request('/deposits/settings');
  }

  async getPlatformFeeSettings() {
    return this.request('/deposits/platform-fee-settings');
  }

  async createDeposit(formData: FormData) {
    const token = this.getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/deposits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

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

  async getDeposits(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/deposits${query ? `?${query}` : ''}`);
  }

  // Withdrawals
  async createWithdrawal(data: {
    amount: number;
    currency: string;
    method: string;
    destination?: string;
    walletType?: string;
    withdrawalAddress?: string;
    bankDetails?: any;
    network?: string;
  }) {
    return this.request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWithdrawals(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/withdrawals${query ? `?${query}` : ''}`);
  }

  // User Bank Accounts
  async addUserBankAccount(data: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
  }) {
    return this.request('/user/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserBankAccounts() {
    return this.request('/user/bank-accounts');
  }

  async deleteUserBankAccount(id: string) {
    return this.request(`/user/bank-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Crypto Prices
  async getCryptoPrices() {
    return this.request('/user/crypto-prices');
  }

  async getCryptoPrice(symbol: string) {
    return this.request(`/user/crypto-prices/${symbol}`);
  }

  // Network Configuration
  async getDepositEnabledNetworks() {
    return this.request('/user/networks/deposit');
  }

  async getWithdrawEnabledNetworks() {
    return this.request('/user/networks/withdraw');
  }

  // Redeem funds from special wallets to USDT wallet
  async redeemToUSDT(data: {
    fromWalletType: 'ROI' | 'SALARY' | 'BREAKDOWN';
    amount: number;
  }) {
    return this.request('/user/wallets/redeem-to-usdt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const userApi = new UserApiService();

