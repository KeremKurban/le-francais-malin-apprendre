import { cn } from '@/lib/utils';

type SkeletonCardVariant = 'exercise' | 'stat' | 'list-item';

interface SkeletonCardProps {
  variant?: SkeletonCardVariant;
  className?: string;
}

/**
 * Animated shimmer skeleton used for loading states.
 * Variants:
 *   - "exercise"  → tall card matching the AI exercise layout
 *   - "stat"      → small stat box (grid of 4)
 *   - "list-item" → compact horizontal row
 */
export function SkeletonCard({ variant = 'exercise', className }: SkeletonCardProps) {
  if (variant === 'stat') {
    return (
      <div className={cn('rounded-xl border border-gray-100 bg-white p-6 shadow-md animate-pulse', className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-7 w-12 rounded bg-gray-300" />
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  if (variant === 'list-item') {
    return (
      <div className={cn('rounded-lg border border-gray-100 bg-white p-4 flex items-center gap-3 animate-pulse', className)}>
        <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
        </div>
        <div className="h-8 w-16 rounded bg-gray-200 shrink-0" />
      </div>
    );
  }

  // Default: "exercise" — tall card
  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white shadow-md animate-pulse', className)}>
      {/* Card header */}
      <div className="p-6 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-8 w-8 rounded bg-gray-200" />
        </div>
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
      </div>
      {/* Card body */}
      <div className="p-6 space-y-4">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
        <div className="h-4 w-3/5 rounded bg-gray-200" />
        <div className="mt-4 h-28 rounded-lg bg-gray-100" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-20 rounded bg-gray-100" />
          <div className="h-9 w-28 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
