const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Goals
  async fetchGoals(userId: string) {
    const res = await fetch(`${API_BASE_URL}/goals/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async createGoalMetadata(data: any) {
    const res = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create goal metadata');
    return result;
  },

  async syncGoals(userId: string) {
    const res = await fetch(`${API_BASE_URL}/goals/sync/${userId}`);
    if (!res.ok) throw new Error('Failed to sync goals');
    return res.json();
  },

  async createGoalCustodial(data: any) {
    const res = await fetch(`${API_BASE_URL}/goals/custodial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create custodial goal');
    return result;
  },

  async depositCustodial(data: any) {
    const res = await fetch(`${API_BASE_URL}/goals/deposit/custodial`, {
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

    const result = await res.json(); // 👈 add this

    if (!res.ok) {
      throw new Error(result.error || 'Failed to fetch balance');
    }

    return result;
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

  async withdrawUsdc(userId: string, amount: number) {
    const res = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Withdrawal simulation failed');
    return result;
  },

  // User / Auth
  async fetchUser(userId: string) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async fetchActivity(userId: string) {
    const res = await fetch(`${API_BASE_URL}/activity/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },

  // Auth
  async signup(data: { fullName: string; email: string; password: string }): Promise<{ userId: string; onboardingComplete: boolean }> {
    const res = await fetch(`${API_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Signup failed');
    return result;
  },

  async signin(data: { email: string; password: string }): Promise<{ userId: string; onboardingComplete: boolean }> {
    const res = await fetch(`${API_BASE_URL}/users/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Signin failed');
    return result;
  },

  // Market
  async fetchExchangeRate(): Promise<{ rate: number }> {
    const res = await fetch(`${API_BASE_URL}/market/exchange-rate`);
    if (!res.ok) throw new Error('Failed to fetch exchange rate');
    return res.json();
  },
};
