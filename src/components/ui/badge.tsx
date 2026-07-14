import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#1A1A1A] text-white border-[#1A1A1A]',
  secondary: 'bg-[#FAF9F6] text-[#1A1A1A]/70 border-[#1A1A1A]/10',
  destructive: 'bg-red-50 text-red-700 border-red-200',
  outline: 'bg-transparent text-[#1A1A1A]/50 border-[#1A1A1A]/20',
};

const Badge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold border rounded-full",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };
