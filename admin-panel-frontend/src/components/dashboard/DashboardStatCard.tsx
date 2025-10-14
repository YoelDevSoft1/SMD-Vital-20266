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
  { icon: string; chip: string }
> = {
  blue: {
    icon: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    chip: 'text-blue-600 dark:text-blue-300',
  },
  green: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    chip: 'text-emerald-600 dark:text-emerald-300',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300',
    chip: 'text-purple-600 dark:text-purple-300',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',
    chip: 'text-indigo-600 dark:text-indigo-300',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    chip: 'text-emerald-600 dark:text-emerald-300',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    chip: 'text-amber-600 dark:text-amber-300',
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
      ? 'text-gray-500 dark:text-gray-400'
      : change > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : change < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-gray-400';

  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div
            className={cn(
              'rounded-xl p-3',
              accentStyles[accent]?.icon ?? accentStyles.blue.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {(change !== undefined || helperText) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {change !== undefined && (
              <span className={cn('inline-flex items-center font-medium', changeColor)}>
                {change > 0 ? '▲' : change < 0 ? '▼' : '—'}{' '}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {changeLabel && <span className="text-gray-500 dark:text-gray-400">{changeLabel}</span>}
            {helperText && (
              <span className={cn('ml-auto text-xs font-medium', accentStyles[accent]?.chip)}>
                {helperText}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
