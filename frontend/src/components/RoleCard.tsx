// src/components/RoleCard.tsx
import { Crown, Eye, Droplet, Heart, Target, Feather, Shield, User } from 'lucide-react';

interface RoleCardProps {
  role: string;
}

const roleConfig: Record<string, {
  icon: any;
  color: string;
  description: string;
}> = {
  'Loup-Garou': {
    icon: Crown,
    color: 'bg-red-900 border-red-700',
    description: 'Vous devez éliminer les villageois. Votez avec les autres loups pour tuer quelqu\'un chaque nuit.',
  },
  'Voyante': {
    icon: Eye,
    color: 'bg-purple-900 border-purple-700',
    description: 'Chaque nuit, vous pouvez découvrir le rôle d\'un joueur.',
  },
  'Sorcière': {
    icon: Droplet,
    color: 'bg-green-900 border-green-700',
    description: 'Vous avez 2 potions : une pour sauver la victime des loups, une pour tuer quelqu\'un.',
  },
  'Chasseur': {
    icon: Target,
    color: 'bg-orange-900 border-orange-700',
    description: 'Si vous mourez, vous pouvez éliminer un joueur avec vous.',
  },
  'Cupidon': {
    icon: Heart,
    color: 'bg-pink-900 border-pink-700',
    description: 'La première nuit, vous désignez deux amoureux. Si l\'un meurt, l\'autre aussi.',
  },
  'Garde': {
    icon: Shield,
    color: 'bg-blue-900 border-blue-700',
    description: 'Chaque nuit, vous protégez un joueur contre les loups (pas le même deux fois de suite).',
  },
  'Villageois': {
    icon: User,
    color: 'bg-gray-800 border-gray-600',
    description: 'Vous êtes un simple villageois. Utilisez votre vote le jour pour éliminer les loups !',
  },
};

export function RoleCard({ role }: RoleCardProps) {
  const config = roleConfig[role] || roleConfig['Villageois'];
  const Icon = config.icon;

  return (
    <div className={`${config.color} border-2 rounded-xl p-6 mb-8 shadow-2xl`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-black/30 p-4 rounded-lg">
          <Icon className="w-12 h-12 text-white" />
        </div>
        <div>
          <div className="text-sm text-gray-300 uppercase tracking-wider">Votre rôle</div>
          <h2 className="text-3xl font-bold text-white">{role}</h2>
        </div>
      </div>
      <p className="text-gray-200 text-lg leading-relaxed">
        {config.description}
      </p>
    </div>
  );
}
