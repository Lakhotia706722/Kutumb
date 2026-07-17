/**
 * Skeleton loading card — used while vault and feed data loads.
 * Keeps layout stable so there's no jarring shift.
 */
export default function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="w-12 h-5 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}
