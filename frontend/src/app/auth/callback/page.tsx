// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleDiscordCallback, saveAuth } from '@/lib/auth';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      router.push('/login');
      return;
    }

    const authenticate = async () => {
      try {
        const auth = await handleDiscordCallback(code);
        saveAuth(auth);
        router.push('/game');
      } catch (error) {
        console.error('Erreur auth:', error);
        alert('Erreur lors de l\'authentification');
        router.push('/login');
      }
    };

    authenticate();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">
          🔄 Authentification en cours...
        </div>
      </div>
    </div>
  );
}
