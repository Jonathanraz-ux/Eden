import { cn } from '../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-sm bg-[#1A1A1A]/5", className)} />
  );
}


