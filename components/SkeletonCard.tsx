export default function SkeletonCard() {
  return (
    <div className="bg-surface rounded-lg p-5 animate-pulse">
      <div className="h-5 bg-surface-hover rounded w-3/4 mb-3" />
      <div className="h-3 bg-surface-hover rounded w-1/2 mb-2" />
      <div className="h-3 bg-surface-hover rounded w-1/3 mb-4" />
      <div className="flex gap-4">
        <div className="h-3 bg-surface-hover rounded w-16" />
        <div className="h-3 bg-surface-hover rounded w-20" />
      </div>
    </div>
  );
}
