// src/components/VotePanel.tsx
import { useState } from 'react';
import { PlayerCard } from './PlayerCard';
import { api } from '@/lib/api';

interface VotePanelProps {
  players: any[];
  currentPlayerId: string;
  phase: string;
  votes: Record<string, string>;
}

export function VotePanel({ players, currentPlayerId, phase, votes }: VotePanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canVote = phase === 'voting' || phase === 'day';
  const hasVoted = currentPlayerId in votes;

  const handleVote = async (targetId: string) => {
    if (!canVote || hasVoted || loading) return;

    setLoading(true);
    try {
      await api.submitVote(currentPlayerId, targetId);
      setSelectedTarget(targetId);
    } catch (error) {
      console.error('Erreur lors du vote:', error);
      alert('Erreur lors du vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">
        {canVote ? 'Votez pour éliminer un joueur' : 'Votes'}
      </h2>

      {hasVoted && (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4">
          ✅ Vous avez voté !
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {players
          .filter((p) => p.is_alive)
          .map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onVote={handleVote}
              canVote={canVote && !hasVoted && player.id !== currentPlayerId}
              isVoted={votes[currentPlayerId] === player.id}
            />
          ))}
      </div>

      {/* Statistiques des votes */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Votes: {Object.keys(votes).length} / {players.filter((p) => p.is_alive).length}
        </h3>
      </div>
    </div>
  );
}
