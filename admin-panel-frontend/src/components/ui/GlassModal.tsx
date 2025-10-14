import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GlassModalProps {
  isOpen: boolean;
  children: ReactNode;
  containerClassName?: string;
  overlayClassName?: string;
}

export function GlassModal({
  isOpen,
  children,
  containerClassName,
  overlayClassName,
}: GlassModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl px-4 py-6 sm:px-6',
        overlayClassName
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border border-white/25 bg-white/15 shadow-[0_30px_120px_-40px_rgba(15,118,230,0.65)] backdrop-blur-2xl',
          containerClassName
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        </div>
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}
