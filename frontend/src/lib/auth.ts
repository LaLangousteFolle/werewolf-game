// src/lib/auth.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PlayerAuth {
  accessToken: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
}

// Helpers sûrs pour localStorage
function safeSetItem(key: string, value: string) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
  } catch {
    return null;
  }
  return null;
}

function safeRemoveItem(key: string) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

// ========== OAuth ==========

export const saveAuth = (auth: PlayerAuth): void => {
  safeSetItem('auth_token', auth.accessToken);
  safeSetItem('user_data', JSON.stringify(auth.user));
};

export const getAuthToken = (): string | null => {
  return safeGetItem('auth_token');
};

export const getUserData = (): PlayerAuth['user'] | null => {
  const data = safeGetItem('user_data');
  return data ? JSON.parse(data) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const logout = (): void => {
  safeRemoveItem('auth_token');
  safeRemoveItem('user_data');
};

export const getDiscordAuthUrl = async (): Promise<string> => {
  const response = await axios.get(`${API_URL}/auth/login`);
  return response.data.auth_url;
};

export const handleDiscordCallback = async (code: string): Promise<PlayerAuth> => {
  const response = await axios.post(`${API_URL}/auth/callback?code=${code}`);
  return response.data;
};

export const getCurrentUser = async (): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Non authentifié');

  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
