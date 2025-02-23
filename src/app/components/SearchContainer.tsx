'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Meme {
  id: string;
  url: string;
  imageUrl: string;
  title: string;
  aiDescription: string;
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

export default function SearchContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const queryRef = useRef(query);

  // Keep queryRef in sync with query state
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Control body scroll when modal is open
  useEffect(() => {
    if (selectedMeme) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMeme]);

  const handleSearch = useCallback(async (e: React.FormEvent | null, initialSearchQuery?: string) => {
    if (e) e.preventDefault();
    
    const searchQuery = initialSearchQuery || queryRef.current;
    if (!searchQuery.trim()) return;

    // Update URL with search query
    router.push(`/?q=${encodeURIComponent(searchQuery)}`);

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setMemes(data.memes || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Perform initial search if query parameter exists
  useEffect(() => {
    if (initialQuery) {
      handleSearch(null, initialQuery);
    }
  }, [initialQuery, handleSearch]);

  return (
    <div className={`h-full ${hasSearched ? 'overflow-auto' : 'overflow-hidden'} p-4 md:p-8 flex flex-col ${hasSearched ? '' : 'items-center'}`}>
      {/* Search Form */}
      <form onSubmit={handleSearch} className={`w-full max-w-2xl mx-auto mb-8 transition-all duration-500 ${hasSearched ? '' : 'mt-[35vh]'}`}>
        <div className="flex gap-2 md:gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for memes..."
              className="w-full p-3 md:p-4 text-base rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  router.push('/');
                  setHasSearched(false);
                  setMemes([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results Grid */}
      <div className={`w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto transition-opacity duration-500 ${hasSearched ? 'opacity-100' : 'opacity-0'}`}>
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
                <p className="text-gray-300 line-clamp-2">{meme.aiDescription}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Meme Detail Modal */}
      {selectedMeme && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMeme(null)}
        >
          <div 
            className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
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
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">AI Description</h3>
                  <p className="text-gray-400">{selectedMeme.aiDescription}</p>
                </div>
                <Link
                  href={selectedMeme.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-400 hover:text-blue-300 hover:underline"
                >
                  View on knowyourmeme.com →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
