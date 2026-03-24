"use client";

import Link from "next/link";

export default function CityError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
      <h1 className="font-serif text-3xl text-text mb-4">Something went wrong</h1>
      <p className="text-text-muted mb-8">We couldn&apos;t load the listings. This is usually temporary.</p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
        <Link href="/" className="px-6 py-2.5 text-text-muted hover:text-text transition-colors">
          Go home
        </Link>
      </div>
    </div>
  );
}
