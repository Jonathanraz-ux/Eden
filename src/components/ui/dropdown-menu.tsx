import { createContext, useContext, useState, useRef, useEffect, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdown(): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('useDropdown must be used within DropdownMenu');
  return ctx;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        contentRef.current && !contentRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <DropdownMenuContext value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </DropdownMenuContext>
  );
}

export function DropdownMenuTrigger({ children, className, ...props }: HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef } = useDropdown();
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className, align = 'end', ...props }: HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  const { open, contentRef } = useDropdown();
  if (!open) return null;
  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] bg-white border border-[#1A1A1A]/10 shadow-md py-1",
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDropdown();
  return (
    <div
      onClick={() => setOpen(false)}
      className={cn(
        "px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-medium text-[#1A1A1A]/60 hover:bg-[#FAF9F6] hover:text-[#1A1A1A] cursor-pointer transition-colors",
        className
      )}
      {...props}
    />
  );
}
