// src/hooks/useWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { GameState } from '@/lib/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useWebSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(`${WS_URL}/ws`);

    websocket.onopen = () => {
      console.log('✅ WebSocket connecté');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setGameState(data);
      } catch (error) {
        console.error('Erreur parsing WebSocket:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket erreur:', error);
    };

    websocket.onclose = () => {
      console.log('🔌 WebSocket déconnecté');
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, [ws]);

  return { gameState, isConnected, sendMessage };
}
