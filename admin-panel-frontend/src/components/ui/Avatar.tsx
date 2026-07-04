/**
 * Avatar — initials fallback with deterministic gradient color from name.
 *
 * Avoids the dozens of ad-hoc avatar blocks (`bg-gradient-to-br from-blue-500...`)
 * scattered across pages. Color is computed from a stable hash of the name so the
 * same person always gets the same gradient across the app.
 *
 * Sizes: xs (24px) for chips, sm (32px) for lists, md (40px) for cards,
 * lg (56px) for headers, xl (80px) for profile pages.
 */

import { cn } from '@/utils/cn';
import { inicialesDeNombre } from '@/utils/formato';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  /** "auto" picks a deterministic gradient from the name. */
  colorScheme?: 'auto' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  /** Accessible label override (defaults to name). */
  alt?: string;
}

const sizeMap: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: 'h-6 w-6',  text: 'text-[10px]' },
  sm: { box: 'h-8 w-8',  text: 'text-xs' },
  md: { box: 'h-10 w-10', text: 'text-sm' },
  lg: { box: 'h-14 w-14', text: 'text-base' },
  xl: { box: 'h-20 w-20', text: 'text-2xl' },
};

const schemes = [
  'from-brand-500 to-brand-700',
  'from-role-doctor to-emerald-700',
  'from-role-nurse to-rose-700',
  'from-role-super to-violet-700',
  'from-info to-cyan-700',
  'from-warning to-orange-700',
  'from-role-patient to-amber-700',
  'from-role-agent to-cyan-700',
] as const;

/** Deterministic 0-7 from a string. */
function hashIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % schemes.length;
}

export function Avatar({
  name,
  src,
  size = 'md',
  colorScheme = 'auto',
  className,
  alt,
}: AvatarProps) {
  const s = sizeMap[size];
  const fallbackName = name?.trim() || '?';
  const initials = inicialesDeNombre(fallbackName);
  const gradient =
    colorScheme === 'auto'
      ? schemes[hashIndex(fallbackName)]
      : schemes[hashIndex(colorScheme)];

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? fallbackName}
        loading="lazy"
        className={cn(
          'inline-block flex-shrink-0 rounded-full object-cover ring-1 ring-border',
          s.box,
          className,
        )}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt ?? fallbackName}
      className={cn(
        'inline-flex flex-shrink-0 items-center justify-center rounded-full',
        'bg-gradient-to-br font-semibold text-white shadow-inner ring-1 ring-white/20',
        gradient,
        s.box,
        s.text,
        className,
      )}
    >
      {initials}
    </span>
  );
}