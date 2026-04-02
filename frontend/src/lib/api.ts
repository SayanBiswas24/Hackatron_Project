const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
  async fetchUser(userId: string) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    return res.json();
  },

  async fetchGoals(userId: string) {
    const res = await fetch(`${API_BASE_URL}/goals/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async fetchActivity(userId: string) {
    const res = await fetch(`${API_BASE_URL}/activity/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },

  async signup(data: any) {
    const res = await fetch(`${API_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sign up');
    }
    return res.json(); // { userId, fullName, message }
  },

  async signin(credentials: any) {
    const res = await fetch(`${API_BASE_URL}/users/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json(); // { userId, fullName, displayName, onboardingComplete, walletType }
  },

  async setupWallet(data: { userId: string; type: 'PERA' | 'CUSTODIAL'; mnemonic?: string; walletAddress?: string }) {
    const res = await fetch(`${API_BASE_URL}/wallet/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to setup wallet');
    }
    return res.json();
  }
};
