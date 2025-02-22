'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Meme {
  id: string;
  url: string;
  imageUrl: string;
  title: string;
  ai_description: string;
}

function MemeCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="relative h-48 bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setMemes(data.memes || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for memes..."
            className="flex-1 p-4 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {loading ? (
          // Show loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <MemeCardSkeleton key={index} />
          ))
        ) : (
          // Show actual meme results
          memes.map((meme) => (
            <div
              key={meme.id}
              className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition hover:scale-105"
              onClick={() => setSelectedMeme(meme)}
            >
              <div className="relative h-48">
                <Image
                  src={meme.imageUrl}
                  alt={meme.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-white">{meme.title}</h3>
                <p className="text-gray-300 line-clamp-2">{meme.ai_description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Meme Detail Modal */}
      {selectedMeme && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedMeme.title}</h2>
                <button
                  onClick={() => setSelectedMeme(null)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="relative h-96 mb-4">
                <Image
                  src={selectedMeme.imageUrl}
                  alt={selectedMeme.title}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-gray-300 mb-4">{selectedMeme.ai_description}</p>
              <Link
                href={selectedMeme.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                View Original Source →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
