// src/components/DayVote.tsx
'use client';

import { useState } from 'react';
import { api, Player } from '@/lib/api';
import { PlayerCard } from './PlayerCard';
import { Vote } from 'lucide-react';

interface DayVoteProps {
  currentPlayer: Player;
  players: Player[];
  votes: Record<string, string>;
}

export function DayVote({ currentPlayer, players, votes }: DayVoteProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasVoted = currentPlayer.id in votes;
  const livingPlayers = players.filter(p => p.is_alive && p.id !== currentPlayer.id);

  const handleVote = async () => {
    if (!selectedTarget || loading || hasVoted) return;

    setLoading(true);
    try {
      await api.submitVote(currentPlayer.id, selectedTarget);
    } catch (error) {
      console.error('Erreur vote:', error);
      alert('Erreur lors du vote');
    } finally {
      setLoading(false);
    }
  };

  // Compter les votes par cible
  const votesByTarget: Record<string, number> = {};
  Object.values(votes).forEach(targetId => {
    votesByTarget[targetId] = (votesByTarget[targetId] || 0) + 1;
  });

  return (
    <div className="bg-gray-900 rounded-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-600 p-3 rounded-lg">
          <Vote className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Vote du village</h2>
          <p className="text-gray-400">
            {hasVoted
              ? '✅ Vous avez voté - Attendez les autres joueurs'
              : 'Votez pour éliminer un joueur suspect'}
          </p>
        </div>
      </div>

      {/* Progression des votes */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 font-semibold">Progression</span>
          <span className="text-white font-bold">
            {Object.keys(votes).length} / {players.filter(p => p.is_alive).length}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${(Object.keys(votes).length / players.filter(p => p.is_alive).length) * 100}%`,
            }}
          />
        </div>
      </div>

      {hasVoted ? (
        // Affichage après avoir voté
        <div>
          <div className="bg-green-600/20 border border-green-600 rounded-lg p-6 mb-6 text-center">
            <p className="text-green-400 font-semibold text-lg mb-2">
              ✅ Votre vote a été enregistré
            </p>
            <p className="text-gray-300">
              Vous avez voté pour{' '}
              <span className="font-bold">
                {players.find(p => p.id === votes[currentPlayer.id])?.display_name}
              </span>
            </p>
          </div>

          {/* Statistiques des votes (sans révéler qui a voté pour qui) */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              📊 Votes actuels
            </h3>
            <div className="space-y-3">
              {Object.entries(votesByTarget)
                .sort(([, a], [, b]) => b - a)
                .map(([targetId, count]) => {
                  const target = players.find(p => p.id === targetId);
                  if (!target) return null;

                  return (
                    <div
                      key={targetId}
                      className="flex items-center justify-between bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={target.avatar_url}
                          alt={target.display_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="text-white font-semibold">
                          {target.display_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-500">
                          {count}
                        </span>
                        <span className="text-gray-400">
                          vote{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        // Interface de vote
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {livingPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className={`cursor-pointer transition-all ${
                  selectedTarget === player.id
                    ? 'ring-4 ring-red-500 scale-105'
                    : 'hover:scale-105'
                }`}
              >
                <PlayerCard
                  player={player}
                  isVoted={selectedTarget === player.id}
                />
                {votesByTarget[player.id] && (
                  <div className="mt-2 text-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {votesByTarget[player.id]} vote{votesByTarget[player.id] > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleVote}
            disabled={!selectedTarget || loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg transition-colors"
          >
            {loading ? '⏳ Vote en cours...' : selectedTarget ? '🗳️ Confirmer mon vote' : '❌ Sélectionnez un joueur'}
          </button>
        </div>
      )}
    </div>
  );
}
