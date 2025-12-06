// src/components/PhaseIndicator.tsx
import { Moon, Sun, Vote, Trophy } from 'lucide-react';

interface PhaseIndicatorProps {
  phase: string;
  dayNumber: number;
}

export function PhaseIndicator({ phase, dayNumber }: PhaseIndicatorProps) {
  const phaseConfig = {
    lobby: { icon: Trophy, label: 'En attente', color: 'bg-gray-500' },
    night: { icon: Moon, label: 'Nuit', color: 'bg-indigo-900' },
    day: { icon: Sun, label: 'Jour', color: 'bg-amber-500' },
    voting: { icon: Vote, label: 'Vote', color: 'bg-red-600' },
    ended: { icon: Trophy, label: 'Terminé', color: 'bg-green-600' },
  };

  const config = phaseConfig[phase as keyof typeof phaseConfig] || phaseConfig.lobby;
  const Icon = config.icon;

  return (
    <div className={`${config.color} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      <Icon className="w-6 h-6" />
      <div>
        <div className="font-bold text-lg">{config.label}</div>
        {dayNumber > 0 && <div className="text-sm opacity-80">Jour {dayNumber}</div>}
      </div>
    </div>
  );
}
