// src/app/page.tsx
import Link from 'next/link';
import { Play } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          🐺 Loup-Garou Online
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Jouez au loup-garou avec vos amis sur Discord
        </p>
        <Link
          href="/game"
          className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-semibold transition"
        >
          <Play className="w-6 h-6" />
          Jouer maintenant
        </Link>
      </div>
    </div>
  );
}
