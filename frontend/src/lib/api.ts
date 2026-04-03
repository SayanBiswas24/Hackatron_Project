const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Goals
  async fetchGoals(userId: string) {
    const res = await fetch(`${API_BASE_URL}/goals/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async createGoal(data: any) {
    const res = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create goal');
    return result;
  },

  async depositCustodial(data: any) {
    const res = await fetch(`${API_BASE_URL}/goals/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to deposit');
    return result;
  },

  // Wallet / Funding
  async setupWallet(data: any) {
    const res = await fetch(`${API_BASE_URL}/wallet/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to setup wallet');
    return result;
  },

  async optIn(userId: string) {
    const res = await fetch(`${API_BASE_URL}/wallet/optin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to opt in');
    return result;
  },

  async fetchWalletBalance(userId: string) {
    const res = await fetch(`${API_BASE_URL}/wallet/balance/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch balance');
    return res.json();
  },

  async faucetUsdc(userId: string) {
    const res = await fetch(`${API_BASE_URL}/wallet/faucet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Faucet request failed');
    return result;
  },

  // Simulated High-Fidelity Purchase
  async purchaseUsdc(userId: string, amount: number, paymentMethod: string = 'Credit Card') {
    const res = await fetch(`${API_BASE_URL}/wallet/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, paymentMethod })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Purchase simulation failed');
    return result;
  },

  // User / Auth
  async fetchUser(userId: string) {
    const res = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async fetchActivity(userId: string) {
    const res = await fetch(`${API_BASE_URL}/auth/activity/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  }
};
