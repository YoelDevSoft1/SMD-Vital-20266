import { type ReactNode, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface GlassModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  variant?: 'glass' | 'solid' | 'elevated';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  containerClassName?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  withBlobs?: boolean;
}

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-7xl',
};

const modalVariants = {
  glass: cn(
    'bg-white/15 backdrop-blur-2xl',
    'border border-white/25',
    'shadow-[0_30px_120px_-40px_rgba(15,118,230,0.65)]',
    'dark:bg-slate-900/30 dark:border-white/10',
    'dark:shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)]'
  ),
  solid: cn(
    'bg-white',
    'border border-slate-200',
    'shadow-2xl',
    'dark:bg-slate-800',
    'dark:border-slate-700'
  ),
  elevated: cn(
    'bg-white/80 backdrop-blur-lg',
    'border border-white/50',
    'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)]',
    'dark:bg-slate-900/80',
    'dark:border-white/20',
    'dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]'
  ),
};

export function GlassModal({
  isOpen,
  onClose,
  children,
  variant = 'glass',
  size = 'md',
  containerClassName,
  overlayClassName,
  closeOnOverlayClick = true,
  withBlobs = true,
}: GlassModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-slate-950/80 backdrop-blur-xl',
        'px-4 py-6 sm:px-6',
        'animate-[fadeIn_0.2s_ease-out]',
        overlayClassName
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl',
          'animate-[slideUp_0.3s_ease-out]',
          modalSizes[size],
          modalVariants[variant],
          containerClassName
        )}
      >
        {/* Animated blobs for glass variant */}
        {withBlobs && variant === 'glass' && (
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="glass-blob absolute -left-24 top-6 h-56 w-56 rounded-full bg-cyan-400/30 blur-3xl" />
            <div className="glass-blob glass-blob--reverse absolute right-0 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          </div>
        )}

        {/* Gradient overlay for elevated variant */}
        {variant === 'elevated' && (
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 dark:from-white/10 dark:via-transparent dark:to-white/5" />
          </div>
        )}

        <div className="relative h-full max-h-[90vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
