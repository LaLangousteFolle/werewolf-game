// src/app/auth/callback/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleDiscordCallback, saveAuth } from '@/lib/auth';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('Code manquant dans l’URL');
      return;
    }

    const authenticate = async () => {
      try {
        const auth = await handleDiscordCallback(code);
        saveAuth(auth);
        router.push('/game');
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          'Erreur inconnue lors de l’authentification';
        setError(msg);
      }
    };

    authenticate();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Erreur lors de l’authentification
          </h1>
          <p className="text-red-400 mb-6 break-words">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">
          🔄 Authentification en cours...
        </div>
        <div className="text-gray-400">Veuillez patienter</div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">
              🔄 Chargement de l’authentification...
            </div>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
