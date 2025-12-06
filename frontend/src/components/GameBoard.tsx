// src/components/GameBoard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api, Player } from '@/lib/api';
import { getUserData, logout, isAuthenticated } from '@/lib/auth';
import { PhaseIndicator } from './PhaseIndicator';
import { PlayerCard } from './PlayerCard';
import { RoleCard } from './RoleCard';
import { NightActions } from './NightActions';
import { DayVote } from './DayVote';
import { Play, RotateCcw, LogOut } from 'lucide-react';

export function GameBoard() {
  const { gameState, isConnected } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getUserData();
    if (!user) {
      router.push('/login');
      return;
    }
  
    if (gameState) {
      const player = gameState.players.find(p => p.id === user.id);
      setCurrentPlayer(player || null);
    }
  }, [gameState, router]);
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleStartGame = async () => {
    setLoading(true);
    try {
      await api.startGame();
    } catch (error) {
      console.error('Erreur démarrage:', error);
      alert('Erreur lors du démarrage de la partie');
    } finally {
      setLoading(false);
    }
  };

  if (!currentPlayer && gameState?.phase !== 'lobby') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            ❌ Vous n'êtes pas dans cette partie
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Retour à la sélection
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {isConnected ? '🔄 Chargement...' : '🔌 Connexion au serveur...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">🐺 Loup-Garou</h1>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Vous êtes</div>
              <div className="font-semibold">{currentPlayer?.display_name}</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
              title="Changer de joueur"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>

        <PhaseIndicator phase={gameState.phase} dayNumber={gameState.day_number} />
      </div>

      {/* Lobby - En attente */}
      {gameState.phase === 'lobby' && (
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">En attente de démarrage</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {gameState.players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          <button
            onClick={handleStartGame}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-xl flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            <Play className="w-6 h-6" />
            Démarrer la partie
          </button>
        </div>
      )}

      {/* Phase de nuit */}
      {gameState.phase === 'night' && currentPlayer && (
        <div className="max-w-4xl mx-auto">
          <RoleCard role={currentPlayer.role!} />
          
          {currentPlayer.is_alive && (
            <NightActions
              player={currentPlayer}
              allPlayers={gameState.players}
              phase={gameState.phase}
            />
          )}
        </div>
      )}

      {/* Phase de jour - Vote */}
      {gameState.phase === 'day' && currentPlayer && (
        <div className="max-w-6xl mx-auto">
          {currentPlayer.is_alive ? (
            <DayVote
              currentPlayer={currentPlayer}
              players={gameState.players}
              votes={gameState.votes}
            />
          ) : (
            <div className="text-center">
              <p className="text-2xl text-gray-400 mb-8">
                💀 Vous êtes mort, vous ne pouvez plus voter
              </p>
            </div>
          )}

          {/* Joueurs vivants */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Joueurs vivants ({gameState.players.filter(p => p.is_alive).length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gameState.players
                .filter(p => p.is_alive)
                .map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
