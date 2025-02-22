'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const SearchContainer = dynamic(() => import('./components/SearchContainer'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-xl text-gray-400">Loading...</div>
        </div>
      }>
        <SearchContainer />
      </Suspense>
    </main>
  );
}
