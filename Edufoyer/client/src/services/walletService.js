const API_BASE_URL = '/api/wallet';

class WalletService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  makeAuthenticatedRequest(url, options = {}) {
    const token = this.token || localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }

  // Get wallet balance and transactions
  async getWallet() {
    try {
      const response = await this.makeAuthenticatedRequest(API_BASE_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch wallet');
      }

      return data.data;
    } catch (error) {
      console.error('Get wallet error:', error);
      throw error;
    }
  }

  // Get only wallet balance
  async getBalance() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/balance`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch balance');
      }

      return data.data;
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Create withdrawal request
  async createWithdrawalRequest(withdrawalData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/withdraw`, {
        method: 'POST',
        body: JSON.stringify(withdrawalData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create withdrawal request');
      }

      return data;
    } catch (error) {
      console.error('Create withdrawal request error:', error);
      throw error;
    }
  }

  // Get user's withdrawal requests
  async getWithdrawals() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/withdrawals`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch withdrawals');
      }

      return data.data;
    } catch (error) {
      console.error('Get withdrawals error:', error);
      throw error;
    }
  }
}

const walletService = new WalletService();
export default walletService;











