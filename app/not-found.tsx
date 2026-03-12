import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-serif text-6xl text-accent mb-4">404</h1>
        <p className="text-text text-xl mb-2">Wrong club</p>
        <p className="text-text-muted mb-8">
          This page doesn&apos;t exist... but the music does.
        </p>
        <Link
          href="/nyc"
          className="inline-block px-6 py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          Find live jazz
        </Link>
      </div>
    </div>
  );
}
