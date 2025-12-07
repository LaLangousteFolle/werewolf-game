// src/app/login/page.tsx
'use client';

import { getDiscordAuthUrl } from '@/lib/auth';

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      const url = await getDiscordAuthUrl();
      // window n'est utilisé qu'ici, côté client
      window.location.href = url;
    } catch (e) {
      alert("Erreur lors de l'authentification");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-8">
      <button
        onClick={handleLogin}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
      >
        Se connecter avec Discord
      </button>
    </div>
  );
}
