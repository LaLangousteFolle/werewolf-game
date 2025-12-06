// src/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Player {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  role?: string;
  is_alive: boolean;
  is_muted: boolean;
}

export interface GameState {
  phase: 'lobby' | 'night' | 'day' | 'voting' | 'ended';
  day_number: number;
  players: Player[];
  dead_players: string[];
  votes: Record<string, string>;
}

export const api = {
  async getGameState(): Promise<GameState> {
    const response = await axios.get(`${API_URL}/game/state`);
    return response.data
  },
  async getPlayersFromDiscord(): Promise<{ success: boolean; players: Player[] }> {
      const response = await axios.get('http://localhost:8080/api/players');
      return response.data;
  },

  async startGame(): Promise<{ success: boolean; message: string; players: number }> {
    const response = await axios.post(`${API_URL}/game/start`);
    return response.data;
  },

  async changePhase(phase: string): Promise<{ success: boolean; phase: string }> {
    const response = await axios.post(`${API_URL}/game/phase/${phase}`);
    return response.data;
  },

  async submitVote(voterId: string, targetId: string): Promise<{ success: boolean }> {
    const response = await axios.post(`${API_URL}/game/vote`, {
      voter_id: voterId,
      target_id: targetId,
    });
    return response.data;
  },

  async getPlayers(): Promise<{ players: Player[] }> {
    const response = await axios.get(`${API_URL}/game/players`);
    return response.data;
  },

  async resetGame(): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${API_URL}/game/reset`);
    return response.data;
  },
};
