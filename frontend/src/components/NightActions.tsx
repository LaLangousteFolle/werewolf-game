// src/components/NightActions.tsx
'use client';

import { useState } from 'react';
import { api, Player } from '@/lib/api';
import { PlayerCard } from './PlayerCard';
import { Eye, Droplet, Heart, Shield } from 'lucide-react';

interface NightActionsProps {
  player: Player;
  allPlayers: Player[];
  phase: string;
}

export function NightActions({ player, allPlayers, phase }: NightActionsProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  if (phase !== 'night' || !player.role) {
    return null;
  }

  // Actions spécifiques par rôle
  const handleAction = async () => {
    if (!selectedTarget || loading) return;

    setLoading(true);
    try {
      // TODO: Implémenter les actions de nuit via l'API
      // Pour l'instant, on simule juste
      await new Promise(resolve => setTimeout(resolve, 500));
      setActionDone(true);
      alert(`Action effectuée sur ${allPlayers.find(p => p.id === selectedTarget)?.display_name}`);
    } catch (error) {
      console.error('Erreur action:', error);
      alert('Erreur lors de l\'action');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les cibles valides selon le rôle
  const getValidTargets = () => {
    return allPlayers.filter(p => {
      if (!p.is_alive) return false;
      if (p.id === player.id) return false; // On ne peut pas se cibler soi-même
      return true;
    });
  };

  const validTargets = getValidTargets();

  // Interface selon le rôle
  const renderRoleInterface = () => {
    switch (player.role) {
      case 'Loup-Garou':
        return (
          <div className="bg-red-950/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-900 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Choisissez votre victime</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Votez pour éliminer un villageois. Les autres loups votent aussi.
            </p>
            {renderTargetSelection()}
          </div>
        );

      case 'Voyante':
        return (
          <div className="bg-purple-950/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-900 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Découvrez un rôle</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Sélectionnez un joueur pour découvrir son rôle.
            </p>
            {renderTargetSelection()}
          </div>
        );

      case 'Sorcière':
        return (
          <div className="bg-green-950/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-900 p-3 rounded-lg">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Utilisez vos potions</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Potion de vie : Sauvez la victime des loups<br />
              Potion de mort : Tuez un joueur
            </p>
            <div className="space-y-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                💙 Sauver la victime
              </button>
              <div className="text-center text-gray-400">ou</div>
              {renderTargetSelection('Tuer')}
            </div>
          </div>
        );

      case 'Garde':
        return (
          <div className="bg-blue-950/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-900 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Protégez quelqu'un</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Choisissez un joueur à protéger contre les loups cette nuit.
            </p>
            {renderTargetSelection()}
          </div>
        );

      case 'Cupidon':
        return (
          <div className="bg-pink-950/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-pink-900 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Désignez les amoureux</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Sélectionnez deux joueurs qui seront liés pour toute la partie.
            </p>
            {renderTargetSelection()}
          </div>
        );

      case 'Villageois':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-300 text-lg">
              💤 Vous dormez paisiblement cette nuit...
            </p>
            <p className="text-gray-400 mt-2">
              Attendez le jour pour voter !
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTargetSelection = (actionLabel = 'Confirmer') => {
    if (actionDone) {
      return (
        <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 text-center">
          <p className="text-green-400 font-semibold">✅ Action effectuée !</p>
          <p className="text-gray-300 text-sm mt-2">Attendez la fin de la nuit...</p>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {validTargets.map((target) => (
            <div
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`cursor-pointer transition-all ${
                selectedTarget === target.id
                  ? 'ring-2 ring-yellow-500 scale-105'
                  : 'hover:scale-105'
              }`}
            >
              <PlayerCard player={target} />
            </div>
          ))}
        </div>

        <button
          onClick={handleAction}
          disabled={!selectedTarget || loading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
        >
          {loading ? '⏳ En cours...' : `⚡ ${actionLabel}`}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderRoleInterface()}
    </div>
  );
}
