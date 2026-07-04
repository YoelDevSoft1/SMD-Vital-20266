/**
 * Modal — accessible dialog wrapper around ModalCristal.
 *
 * Adds:
 *   - title + description as proper ARIA-labelled parts
 *   - role="dialog" + aria-modal="true"
 *   - Focus trap (Tab/Shift+Tab cycles within the dialog)
 *   - Save & restore focus (focus returns to the trigger on close)
 *   - ESC handling + scroll lock (delegated to ModalCristal)
 *   - Optional footer slot for action buttons
 *
 * ModalCristal is preserved for backward compatibility; new code should prefer Modal.
 */

import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ModalCristal } from './ModalCristal';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'glass' | 'solid' | 'elevated';
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  hideCloseButton?: boolean;
  /** Disable the inner content scroll; useful for short forms. */
  noScroll?: boolean;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'glass',
  footer,
  closeOnOverlayClick = true,
  hideCloseButton = false,
  noScroll = false,
  children,
  className,
}: ModalProps) {
  const baseId = useId().replace(/:/g, '');
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Save & restore focus
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Move focus into dialog on open + trap Tab
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey && (active === first || !root.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <ModalCristal
      isOpen={open}
      onClose={onClose}
      variant={variant}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      withBlobs={variant === 'glass'}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        aria-describedby={description ? `${baseId}-desc` : undefined}
        onKeyDown={handleKeyDown}
        className={cn('flex h-full flex-col', className)}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id={`${baseId}-title`}
              className="truncate text-base font-semibold text-foreground sm:text-lg"
            >
              {title}
            </h2>
            {description ? (
              <div
                id={`${baseId}-desc`}
                className="mt-1 text-sm text-muted-foreground"
              >
                {description}
              </div>
            ) : null}
          </div>
          {!hideCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={cn(
                'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md',
                'text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </header>

        {/* Body */}
        <div
          className={cn(
            'flex-1 px-5 py-4 sm:px-6',
            !noScroll && 'overflow-y-auto',
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <footer
            className={cn(
              'flex flex-col-reverse items-stretch gap-2 border-t border-border/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6',
            )}
          >
            {Children.map(footer, (child) =>
              isValidElement(child) ? cloneElement(child as ReactElement) : child,
            )}
          </footer>
        ) : null}
      </div>
    </ModalCristal>
  );
}