/**
 * ConnectivityIndicator.tsx
 *
 * Indicador de conectividad online/offline con detección en tiempo real.
 * - Banner sutil arriba cuando se pierde/recupera la conexión
 * - Auto-dismiss después de 4s cuando vuelve online
 * - Si la app estaba offline y la query falla, dispara re-sync al recuperar
 * - Diferencia entre "no hay red" y "no hay internet" con un solo estado
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useQueryClient } from '@tanstack/react-query';

export default function ConnectivityIndicator() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Re-sincronizar queries críticas en background
      queryClient.invalidateQueries();
      // Mostrar banner verde solo si estuvimos offline
      if (wasOffline) {
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 4000);
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setOnline(false);
      setWasOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, wasOffline]);

  // Banner full-width cuando hay change de estado
  if (showBanner) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium shadow-md transition-all',
          online
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-500 text-white'
        )}
      >
        {online ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Conexión recuperada — sincronizando formData</span>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Sin conexión — mostrando formData en caché</span>
          </>
        )}
      </div>
    );
  }

  // Indicador compacto permanente en el header (solo si está offline)
  if (!online) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700"
      >
        <WifiOff className="h-3 w-3" />
        <span className="hidden sm:inline">Sin conexión</span>
      </div>
    );
  }

  return null;
}
