import {
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
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
  /**
   * ID of an element inside the dialog that should receive initial focus
   * when the modal opens. Defaults to the dialog panel itself.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Disables the built-in accessibility wiring (role/aria-modal, ESC
   * handling, focus trap, scroll lock). Useful when wrapping this in
   * another component (e.g. `Modal`) that owns those concerns.
   */
  disableA11y?: boolean;
  /** id of the dialog title element, for `aria-labelledby`. */
  ariaLabelledBy?: string;
  /** id of the dialog description element, for `aria-describedby`. */
  ariaDescribedBy?: string;
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

// Module-scoped refcount so stacked modals (e.g. a confirm over a parent
// modal) don't fight over `document.body.style.overflow`. The body is only
// released once the *last* modal closes.
let scrollLockCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

export function ModalCristal({
  isOpen,
  onClose,
  children,
  variant = 'glass',
  size = 'md',
  containerClassName,
  overlayClassName,
  closeOnOverlayClick = true,
  withBlobs = true,
  initialFocusRef,
  disableA11y = false,
  ariaLabelledBy,
  ariaDescribedBy,
}: GlassModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // ESC, body scroll lock, focus management.
  useEffect(() => {
    if (!isOpen || disableA11y) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !onClose) return;
      // Only the top-most modal should react to ESC. The most recently
      // mounted listener wins because it was attached last, so we
      // stop propagation here to prevent ancestors from also closing.
      event.stopPropagation();
      event.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    lockBodyScroll();

    // Move focus into the dialog after the panel mounts. requestAnimationFrame
    // waits one paint so the panel is laid out (and `data-state="open"` would
    // be observable if consumers care).
    const focusTimer = requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? panelRef.current;
      target?.focus();
    });

    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      unlockBodyScroll();
      // Restore focus to the trigger element after the modal unmounts.
      const trigger = previouslyFocused.current;
      if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef, disableA11y]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  // IMPORTANT: render via createPortal al document.body para escapar del
  // stacking context de <main> (z-10). El header (z-30 backdrop-blur stacking
  // context) y el bottom-nav (z-30 backdrop-blur stacking context) viven como
  // hermanos de main en el h-dvh parent; por reglas CSS, un modal anidado en
  // main (z-10) NO puede superponerse al bottom-nav (z-30). Portalando al
  // body, el modal queda en root y z-[60] gana como debe.
  if (typeof document === 'undefined') return null;

  const portalRoot = document.body;

  // `role="presentation"` on the backdrop, `role="dialog"` on the panel.
  // The inner content of `Modal` will own its own `role` attributes when
  // it composes over us, so we leave aria attrs to the panel only.
  return createPortal(
    (
      <div
        className={cn(
          // Mobile: bottom-sheet edge-to-edge (items-end, sin padding).
          // Desktop: modal centrado con respiro (items-center, padding 24).
          'fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:justify-center',
          'bg-slate-950/80 backdrop-blur-xl',
          'dark:bg-slate-950/85',
          'p-0 sm:px-6 sm:py-6',
          'animate-[fadeIn_0.2s_ease-out]',
          overlayClassName
        )}
        onClick={handleOverlayClick}
        role="presentation"
      >
        <div
          ref={panelRef}
          // Make the panel focusable so we can move focus into it even when
          // there are no focusable descendants (e.g. a static message).
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cn(
            'relative flex w-full flex-col overflow-hidden outline-none',
            // Mobile: 100dvh = fullscreen real (respeta viewport dinámico iOS).
            // Desktop: 90vh con aire arriba/abajo para que se vea como modal.
            'max-h-[100dvh] sm:max-h-[90vh]',
            // Mobile: solo esquinas superiores redondeadas (bottom-sheet).
            // Desktop: esquinas completas.
            'rounded-t-2xl rounded-b-none sm:rounded-2xl',
            'animate-[slideUp_0.3s_ease-out]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/40',
            modalSizes[size],
            modalVariants[variant],
            containerClassName
          )}
          // Mobile: garantizar altura mínima para que el sheet siempre se vea como
          // bottom-sheet y los consumidores (BottomPicker, etc.) tengan espacio
          // suficiente para flex-layout. Sin esto, modales con poco contenido
          // pueden colapsar a 100-150px y parecer hojas de papel.
          style={{ minHeight: 'min(60dvh, 480px)' }}
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

          {/* Body con scroll. flex-1 para que ocupe el alto del contenedor flex-col
              y permita header/footer sticky en los consumidores (e.g. Modal.tsx).
              min-h-0 garantiza que el contenido flex-children (como BottomPicker) puedan
              hacer `flex-1` correctamente y no se desborden por overflow natural. */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </div>
    ),
    portalRoot,
  );
}