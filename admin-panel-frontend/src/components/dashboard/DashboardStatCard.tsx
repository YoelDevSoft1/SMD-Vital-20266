import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface DashboardStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accent?: 'blue' | 'green' | 'purple' | 'indigo' | 'emerald' | 'amber';
  change?: number;
  changeLabel?: string;
  helperText?: string;
}

const accentStyles: Record<
  NonNullable<DashboardStatCardProps['accent']>,
  { icon: string; chip: string; blob: string }
> = {
  blue: {
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20',
    chip: 'text-blue-600 dark:text-blue-400',
    blob: 'bg-blue-400/30 dark:bg-blue-500/20',
  },
  green: {
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20',
    chip: 'text-emerald-600 dark:text-emerald-400',
    blob: 'bg-emerald-400/30 dark:bg-emerald-500/20',
  },
  purple: {
    icon: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20',
    chip: 'text-purple-600 dark:text-purple-400',
    blob: 'bg-purple-400/30 dark:bg-purple-500/20',
  },
  indigo: {
    icon: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20',
    chip: 'text-indigo-600 dark:text-indigo-400',
    blob: 'bg-indigo-400/30 dark:bg-indigo-500/20',
  },
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20',
    chip: 'text-emerald-600 dark:text-emerald-400',
    blob: 'bg-emerald-400/30 dark:bg-emerald-500/20',
  },
  amber: {
    icon: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 dark:shadow-amber-500/20',
    chip: 'text-amber-600 dark:text-amber-400',
    blob: 'bg-amber-400/30 dark:bg-amber-500/20',
  },
};

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  accent = 'blue',
  change,
  changeLabel,
  helperText,
}: DashboardStatCardProps) {
  const changeColor =
    change === undefined
      ? 'text-slate-500 dark:text-slate-400'
      : change > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : change < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-500 dark:text-slate-400';

  const styles = accentStyles[accent] ?? accentStyles.blue;

  return (
    <Card
      variant="glass"
      className="group hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] hover:scale-[1.02] dark:hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={cn('absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl', styles.blob)} />
      </div>

      <CardContent className="relative flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
          </div>
          <div
            className={cn(
              'rounded-2xl p-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
              styles.icon
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={2.5} />
          </div>
        </div>
        {(change !== undefined || helperText) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {change !== undefined && (
              <span className={cn('inline-flex items-center gap-1 font-semibold', changeColor)}>
                <span className="text-xs">{change > 0 ? '↗' : change < 0 ? '↘' : '→'}</span>
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {changeLabel && <span className="text-slate-500 dark:text-slate-400">{changeLabel}</span>}
            {helperText && (
              <span className={cn('ml-auto text-xs font-semibold', styles.chip)}>
                {helperText}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
