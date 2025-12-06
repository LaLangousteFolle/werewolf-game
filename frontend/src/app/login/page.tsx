// src/app/login/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDiscordAuthUrl } from '@/lib/auth';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const authUrl = await getDiscordAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la connexion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐺</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Loup-Garou Online
          </h1>
          <p className="text-gray-400">
            Authentifiez-vous avec Discord pour jouer
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-colors"
        >
          <LogIn className="w-6 h-6" />
          Se connecter avec Discord
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Connexion sécurisée via Discord OAuth2</p>
          <p className="mt-2">Vous devez être dans le vocal Discord pour jouer</p>
        </div>
      </div>
    </div>
  );
}
