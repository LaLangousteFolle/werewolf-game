// src/components/PlayerCard.tsx
import Image from 'next/image';
import { Skull, Volume2, VolumeX } from 'lucide-react';

interface PlayerCardProps {
  player: {
    id: string;
    display_name: string;
    avatar_url: string;
    is_alive: boolean;
    is_muted: boolean;
    role?: string;
  };
  onVote?: (playerId: string) => void;
  canVote?: boolean;
  isVoted?: boolean;
}

export function PlayerCard({ player, onVote, canVote, isVoted }: PlayerCardProps) {
  return (
    <div
      className={`
        relative bg-gray-800 rounded-lg p-4 transition-all
        ${!player.is_alive ? 'opacity-50 grayscale' : ''}
        ${canVote ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''}
        ${isVoted ? 'ring-2 ring-green-500' : ''}
      `}
      onClick={() => canVote && player.is_alive && onVote?.(player.id)}
    >
      {/* Avatar */}
      <div className="relative w-20 h-20 mx-auto mb-3">
        <Image
          src={player.avatar_url}
          alt={player.display_name}
          fill
          className="rounded-full object-cover"
        />
        {!player.is_alive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Skull className="w-8 h-8 text-red-500" />
          </div>
        )}
      </div>

      {/* Nom */}
      <div className="text-center">
        <div className="font-semibold text-white truncate">{player.display_name}</div>
        {player.role && (
          <div className="text-xs text-gray-400 mt-1">{player.role}</div>
        )}
      </div>

      {/* Indicateur mute */}
      {player.is_muted && (
        <div className="absolute top-2 right-2">
          <VolumeX className="w-4 h-4 text-red-500" />
        </div>
      )}

      {isVoted && (
        <div className="absolute top-2 left-2">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
            Voté
          </div>
        </div>
      )}
    </div>
  );
}
