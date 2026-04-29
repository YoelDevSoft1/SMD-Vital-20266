import { CheckCircle2, Download, Wifi, WifiOff } from 'lucide-react';
import { usePwaStatus } from '@/hooks/usePwaStatus';
import { cn } from '@/utils/cn';

type PwaStatusIndicatorProps = {
  className?: string;
};

export default function PwaStatusIndicator({ className }: PwaStatusIndicatorProps) {
  const { isOnline, isStandalone, canInstall, promptInstall } = usePwaStatus();

  if (!isOnline) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-2xl border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
          className
        )}
      >
        <WifiOff className="h-4 w-4" />
        Sin conexion
      </div>
    );
  }

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={() => void promptInstall()}
        className={cn(
          'inline-flex items-center gap-2 rounded-2xl border border-cyan-300/70 bg-cyan-50/90 px-3 py-2 text-xs font-semibold text-cyan-800 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20',
          className
        )}
      >
        <Download className="h-4 w-4" />
        Instalar PWA
      </button>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl border border-emerald-300/70 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200',
        className
      )}
    >
      {isStandalone ? <CheckCircle2 className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
      {isStandalone ? 'PWA activa' : 'En linea'}
    </div>
  );
}
