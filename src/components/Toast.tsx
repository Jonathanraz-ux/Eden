import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToastData {
  message: string;
  visible: boolean;
}

let showToastFn: (msg: string) => void;

export function triggerToast(message: string) {
  if (showToastFn) showToastFn(message);
}

export function Toast() {
  const [toast, setToast] = useState<ToastData>({ message: '', visible: false });

  const show = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3500);
  }, []);

  useEffect(() => {
    showToastFn = show;
    return () => { showToastFn = undefined; };
  }, [show]);

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-400',
        toast.visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-3 px-5 py-3 bg-[#1A1A1A] text-white shadow-lg border border-white/10">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
