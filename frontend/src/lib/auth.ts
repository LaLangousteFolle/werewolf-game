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

// ========== Nouvelle version OAuth ==========

export const saveAuth = (auth: PlayerAuth): void => {
  localStorage.setItem('auth_token', auth.accessToken);
  localStorage.setItem('user_data', JSON.stringify(auth.user));
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const getUserData = (): PlayerAuth['user'] | null => {
  const data = localStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
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

// ========== Ancienne version (compatibilité avec GameBoard) ==========

export interface OldPlayerAuth {
  playerId: string;
  discordUsername: string;
  discordAvatar: string;
}

export const authPlayer = (playerId: string, username: string, avatar: string): void => {
  const auth: OldPlayerAuth = {
    playerId,
    discordUsername: username,
    discordAvatar: avatar,
  };
  localStorage.setItem('player_auth', JSON.stringify(auth));
};

export const getPlayerAuth = (): OldPlayerAuth | null => {
  const auth = localStorage.getItem('player_auth');
  return auth ? JSON.parse(auth) : null;
};

export const logoutPlayer = (): void => {
  localStorage.removeItem('player_auth');
  logout(); 
};
