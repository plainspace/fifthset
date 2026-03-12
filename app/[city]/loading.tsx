import SkeletonCard from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="h-10 bg-surface rounded w-1/3 mb-3 animate-pulse" />
        <div className="h-4 bg-surface rounded w-1/4 animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
