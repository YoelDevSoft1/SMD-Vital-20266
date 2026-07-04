/**
 * Encabezado — consistent page title block with optional actions.
 *
 * Mobile-first: stacks vertically on small screens, side-by-side on sm+.
 * Accepts actions as ReactNode so callers can pass any combination of Buttons.
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string; // alias of subtitle, kept for future use
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export function Encabezado({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 pb-2',
        'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumbs.map((crumb, idx) => (
                <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-foreground/80">{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 ? (
                    <span aria-hidden="true" className="text-muted-foreground/50">/</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}