"use client";

import Link from "next/link";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-text mb-4">Something went wrong</h1>
        <p className="text-text-muted mb-8">An unexpected error occurred. This is usually temporary.</p>
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
    </div>
  );
}
