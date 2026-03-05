// Admin API service for all admin endpoints

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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AdminApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {};

      // Only set Content-Type for JSON, not for FormData
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      // Merge any additional headers
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

      // For paginated responses, return the whole response
      // Otherwise just return the data
      return {
        success: true,
        data: (data.pagination ? { data: data.data, pagination: data.pagination } : data.data) as any,
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
    return this.request('/admin/dashboard/stats');
  }

  // Network Configuration
  async getNetworkConfigs() {
    return this.request('/admin/networks');
  }

  async updateNetworkConfig(id: string, data: any) {
    return this.request(`/admin/networks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createNetworkConfig(data: any) {
    return this.request('/admin/networks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNetworkConfig(id: string) {
    return this.request(`/admin/networks/${id}`, {
      method: 'DELETE',
    });
  }

  // User Management
  async getAllUsers(params?: { page?: number; limit?: number; status?: string; role?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/admin/users?${queryParams.toString()}`);
  }

  async getUserDetails(id: string) {
    return this.request(`/admin/users/${id}`);
  }

  async updateUserStatus(id: string, status: string) {
    return this.request(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.request(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // KYC Management
  async getPendingKyc(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.request(`/admin/kyc/pending?${queryParams.toString()}`);
  }

  async approveKyc(id: string, remarks?: string) {
    return this.request(`/admin/kyc/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  async rejectKyc(id: string, remarks: string) {
    return this.request(`/admin/kyc/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  // Deposit Management
  async getPendingDeposits(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.request(`/admin/deposits/pending?${queryParams.toString()}`);
  }

  async approveDeposit(id: string) {
    return this.request(`/admin/deposits/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectDeposit(id: string) {
    return this.request(`/admin/deposits/${id}/reject`, {
      method: 'POST',
    });
  }

  // Withdrawal Management
  async getPendingWithdrawals(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.request(`/admin/withdrawals/pending?${queryParams.toString()}`);
  }

  async getWithdrawalStats() {
    return this.request('/admin/withdrawals/stats');
  }

  async approveWithdrawal(id: string, txId?: string) {
    return this.request(`/admin/withdrawals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ txId }),
    });
  }

  async rejectWithdrawal(id: string) {
    return this.request(`/admin/withdrawals/${id}/reject`, {
      method: 'POST',
    });
  }

  // Plan Management
  async getAllPlans(params?: { page?: number; limit?: number; isActive?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    return this.request(`/admin/plans?${queryParams.toString()}`);
  }

  async createPlan(data: {
    name: string;
    description?: string;
    amount: number;
    roiAmount: number;
    durationTimes: number;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    frequencyDay?: number;
    frequencyDays?: number[]; // For DAILY: array of days [1,2,3,4,5] where 1=Monday, 7=Sunday
  }) {
    return this.request('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlan(id: string, data: {
    name?: string;
    description?: string;
    amount?: number;
    roiAmount?: number;
    durationTimes?: number;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    frequencyDay?: number;
    frequencyDays?: number[]; // For DAILY: array of days [1,2,3,4,5] where 1=Monday, 7=Sunday
    isActive?: boolean;
  }) {
    return this.request(`/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlan(id: string) {
    return this.request(`/admin/plans/${id}`, {
      method: 'DELETE',
    });
  }

  async togglePlanStatus(id: string) {
    return this.request(`/admin/plans/${id}/toggle`, {
      method: 'PUT',
    });
  }

  // Investment Management
  async getAllInvestments(params?: { page?: number; limit?: number; status?: string; userId?: string; planId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.planId) queryParams.append('planId', params.planId);

    return this.request(`/admin/investments?${queryParams.toString()}`);
  }

  async getInvestmentStats() {
    return this.request('/admin/investments/stats');
  }

  // Blog Management
  async getAllBlogPosts(params?: { page?: number; limit?: number; isPublished?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());

    return this.request(`/blog/posts?${queryParams.toString()}`);
  }

  async createBlogPost(data: {
    title: string;
    shortDesc?: string;
    content: string;
    thumbnail?: string;
    authorName?: string;
    categoryId?: string;
    isPublished?: boolean;
    publishAt?: string;
    tags?: string[];
  }) {
    return this.request('/blog/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlogPost(id: string, data: {
    title?: string;
    shortDesc?: string;
    content?: string;
    thumbnail?: string;
    authorName?: string;
    categoryId?: string;
    isPublished?: boolean;
    publishAt?: string;
    tags?: string[];
  }) {
    return this.request(`/blog/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlogPost(id: string) {
    return this.request(`/blog/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async getBlogCategories() {
    return this.request('/blog/categories');
  }

  async createBlogCategory(data: { name: string; color?: string }) {
    return this.request('/blog/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Deposits (all statuses)
  async getAllDeposits(params?: { page?: number; limit?: number; status?: string; userId?: string; currency?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.currency) queryParams.append('currency', params.currency);

    return this.request(`/admin/deposits?${queryParams.toString()}`);
  }

  // Withdrawals (all statuses)
  async getAllWithdrawals(params?: { page?: number; limit?: number; status?: string; userId?: string; currency?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.currency) queryParams.append('currency', params.currency);

    return this.request(`/admin/withdrawals?${queryParams.toString()}`);
  }

  // Transactions
  async getAllTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/admin/transactions?${queryParams.toString()}`);
  }

  // Wallets
  async getAllWallets(params?: { page?: number; limit?: number; userId?: string; type?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.type) queryParams.append('type', params.type);

    return this.request(`/user/wallets?${queryParams.toString()}`);
  }

  // Support Tickets
  async getAllTickets(params?: { page?: number; limit?: number; status?: string; userId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);

    return this.request(`/support/all?${queryParams.toString()}`);
  }

  async updateTicketStatus(id: string, status: string) {
    return this.request(`/support/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Notifications
  async getAllNotifications(params?: { page?: number; limit?: number; userId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);

    return this.request(`/notifications?${queryParams.toString()}`);
  }

  async sendNotification(data: {
    userId?: string;
    title: string;
    body: string;
    type?: string;
  }) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Wallet adjustments
  async adjustWallet(userId: string, walletType: string, amount: number, type: 'credit' | 'debit', description?: string) {
    return this.request(`/admin/wallets/${userId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ walletType, amount, type, description }),
    });
  }

  // Settings
  async saveSettings(settings: FormData) {
    return this.request('/admin/settings', {
      method: 'POST',
      headers: {}, // Don't set Content-Type, let browser set it with boundary for FormData
      body: settings as any,
    });
  }

  // Salary Settings
  async getSalarySettings() {
    return this.request('/admin/salary/settings');
  }

  async saveSalarySettings(data: {
    freeUser: {
      freeReferralCount: number;
      paidReferralCount: number;
      levels: Array<{
        days: number;
        turnoverAmount: number;
        salaryIncomeAmount: number;
        salaryPaymentTimes: number;
      }>;
    };
    paidUser: {
      freeReferralCount: number;
      paidReferralCount: number;
      levels: Array<{
        days: number;
        turnoverAmount: number;
        salaryIncomeAmount: number;
        salaryPaymentTimes: number;
      }>;
    };
  }) {
    return this.request('/admin/salary/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Breakdown Settings
  async getBreakdownSettings() {
    return this.request('/admin/breakdown/settings');
  }

  async saveBreakdownSettings(data: {
    refundTimelineDays: number;
    deductionPercentage: number;
  }) {
    return this.request('/admin/breakdown/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Refund Requests
  async getAllRefundRequests(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/admin/breakdown/refunds?${queryParams.toString()}`);
  }

  async approveRefundRequest(id: string) {
    return this.request(`/admin/breakdown/refunds/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectRefundRequest(id: string, adminRemarks?: string) {
    return this.request(`/admin/breakdown/refunds/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ adminRemarks }),
    });
  }

  // User Referral Tree
  async getUserReferralTree(userId: string, level?: number) {
    const query = level ? `?level=${level}` : '';
    return this.request(`/admin/users/${userId}/referral-tree${query}`);
  }

  async getUserLoginLogs(userId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return this.request(`/admin/users/${userId}/login-logs?${queryParams.toString()}`);
  }

  async getUserRoiLogs(userId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return this.request(`/admin/users/${userId}/roi-logs?${queryParams.toString()}`);
  }

  // Investment Management
  async getPendingInvestments(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return this.request(`/admin/investments/pending?${queryParams.toString()}`);
  }

  async approveInvestment(id: string, adminRemarks?: string) {
    return this.request(`/admin/investments/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminRemarks }),
    });
  }

  async rejectInvestment(id: string, adminRemarks?: string) {
    return this.request(`/admin/investments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ adminRemarks }),
    });
  }

  // Authentication Key Management
  async generateAuthKeys(data: { planId: string; quantity: number; distributeToUserId?: string }) {
    return this.request('/admin/auth-keys/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAuthKeys(params?: { page?: number; limit?: number; planId?: string; status?: string; distributedTo?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.planId) queryParams.append('planId', params.planId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.distributedTo) queryParams.append('distributedTo', params.distributedTo);
    return this.request(`/admin/auth-keys?${queryParams.toString()}`);
  }

  async distributeAuthKey(id: string, userId: string) {
    return this.request(`/admin/auth-keys/${id}/distribute`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async distributeAuthKeyToEmail(id: string, email: string) {
    return this.request(`/admin/auth-keys/${id}/distribute-email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getAuthKeyStats(planId?: string) {
    const queryParams = planId ? `?planId=${planId}` : '';
    return this.request(`/admin/auth-keys/stats${queryParams}`);
  }

  // Bank Account Management
  async getAllBankAccounts() {
    return this.request('/admin/bank-accounts');
  }

  async getBankAccountById(id: string) {
    return this.request(`/admin/bank-accounts/${id}`);
  }

  async createBankAccount(data: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
    upiId?: string;
    isActive?: boolean;
  }) {
    return this.request('/admin/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBankAccount(id: string, data: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
    upiId?: string;
    isActive?: boolean;
  }) {
    return this.request(`/admin/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBankAccount(id: string) {
    return this.request(`/admin/bank-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // UPI Account Management
  async getAllUpiAccounts() {
    return this.request('/admin/upi-accounts');
  }

  async getUpiAccountById(id: string) {
    return this.request(`/admin/upi-accounts/${id}`);
  }

  async createUpiAccount(data: {
    displayName: string;
    upiId: string;
    qrCodeUrl?: File | string;
    isActive?: boolean;
    visibilityType?: string;
    assignedUserIds?: string[];
  }) {
    const formData = new FormData();
    formData.append('displayName', data.displayName);
    formData.append('upiId', data.upiId);
    if (data.qrCodeUrl instanceof File) {
      formData.append('qrCode', data.qrCodeUrl);
    }
    if (data.isActive !== undefined) {
      formData.append('isActive', String(data.isActive));
    }
    if (data.visibilityType) {
      formData.append('visibilityType', data.visibilityType);
    }
    if (data.assignedUserIds && data.assignedUserIds.length > 0) {
      formData.append('assignedUserIds', JSON.stringify(data.assignedUserIds));
    }

    return this.request('/admin/upi-accounts', {
      method: 'POST',
      body: formData,
    });
  }

  async updateUpiAccount(id: string, data: {
    displayName?: string;
    upiId?: string;
    qrCodeUrl?: File | string;
    isActive?: boolean;
    visibilityType?: string;
    assignedUserIds?: string[];
  }) {
    const formData = new FormData();
    if (data.displayName) {
      formData.append('displayName', data.displayName);
    }
    if (data.upiId) {
      formData.append('upiId', data.upiId);
    }
    if (data.qrCodeUrl instanceof File) {
      formData.append('qrCode', data.qrCodeUrl);
    }
    if (data.isActive !== undefined) {
      formData.append('isActive', String(data.isActive));
    }
    if (data.visibilityType) {
      formData.append('visibilityType', data.visibilityType);
    }
    if (data.assignedUserIds) {
      formData.append('assignedUserIds', JSON.stringify(data.assignedUserIds));
    }

    return this.request(`/admin/upi-accounts/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteUpiAccount(id: string) {
    return this.request(`/admin/upi-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Deposit Settings
  async getDepositSettings() {
    return this.request('/admin/deposit/settings');
  }

  async saveDepositSettings(data: { autoCreditThreshold: number }) {
    return this.request('/admin/deposit/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Platform Fee Settings
  async getPlatformFeeSettings() {
    return this.request('/admin/platform-fee/settings');
  }

  async savePlatformFeeSettings(data: {
    minDepositUSDT: number;
    minWithdrawalUSDT: number;
    depositFeePercent: number;
    withdrawalFeePercent: number;
  }) {
    return this.request('/admin/platform-fee/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Currency Management
  async getCurrencyRate() {
    return this.request('/admin/currency/rate');
  }

  async updateCurrencyRate(data: { rate: number; source?: string }) {
    return this.request('/admin/currency/rate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async fetchMoralisRate() {
    return this.request('/admin/currency/fetch-moralis', {
      method: 'POST',
    });
  }

  async getCurrencyRateLogs(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.request(`/admin/currency/logs?${queryParams.toString()}`);
  }

  // Blockchain Deposit Management
  async getPendingBlockchainDeposits() {
    return this.request('/admin/blockchain/deposits/pending');
  }

  // Fund Management - Fee Statistics
  async getFeeStats(dateRange: 'all' | 'today' | 'week' | 'month' = 'all') {
    return this.request(`/admin/fund-management/fees?range=${dateRange}`);
  }

  // Pool Management
  async withdrawPoolFunds(data: { address: string; amount: string; remarks?: string }) {
    return this.request('/admin/pool/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordPoolDeposit(data: { amount: string; txHash: string; remarks?: string }) {
    return this.request('/admin/pool/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPoolTransactions(params?: { type?: string; status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return this.request(`/admin/pool/transactions?${queryParams.toString()}`);
  }

  async approveBlockchainDeposit(transactionId: string) {
    return this.request(`/admin/blockchain/deposits/${transactionId}/approve`, {
      method: 'POST',
    });
  }

  async rejectBlockchainDeposit(transactionId: string, reason?: string) {
    return this.request(`/admin/blockchain/deposits/${transactionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ROI Boost Settings
  async getROIBoostSettings() {
    return this.request('/admin/settings/roi-boost');
  }

  async updateROIBoostSettings(data: { minReferralsForBoost: number }) {
    return this.request('/admin/settings/roi-boost', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const adminApi = new AdminApiService();
