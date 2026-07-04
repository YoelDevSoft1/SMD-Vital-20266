/**
 * UpdatePrompt.tsx
 *
 * Prompt que aparece cuando el Service Worker detecta una nueva versión.
 * Usa workbox-window para escuchar 'waiting' y ofrece al usuario:
 *  - "Actualizar ahora" → skipWaiting() + reload
 *  - "Más tarde" → cierra el prompt (la próxima vez que cargue se actualizará)
 *
 * Solo funciona en producción (vite-plugin-pwa registerType: 'autoUpdate'
 * pone el SW en waiting hasta que el usuario acepte).
 */

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => {
    // Solo intentar registrar en producción cuando PWA esté activada explícitamente.
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_PWA === 'true') {
      const loadRegister = new Function("return import('virtual:pwa-register')");
      loadRegister().then(({ registerSW }: typeof import('virtual:pwa-register')) => {
        const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          setOfflineReady(true);
          setShowOfflineReady(true);
          setTimeout(() => setShowOfflineReady(false), 4000);
        },
        onRegisterError(error) {
          console.warn('SW registration error:', error);
        },
      });

        // Exponer para debug
        (window as any).__updateSW = updateSW;
      }).catch((error) => {
        console.warn('SW registration module unavailable:', error);
      });
    }
  }, []);

  const handleUpdate = async () => {
    const updateSW = (window as any).__updateSW;
    if (updateSW) {
      await updateSW(true);
      // El SW activa y recarga
    }
  };

  if (needRefresh) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed inset-x-3 bottom-20 z-50 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm',
          'flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl',
          'animate-in slide-in-from-bottom-4 fade-in duration-300',
          'dark:border-slate-700 dark:bg-slate-900/95'
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
          <RefreshCw className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Nueva versión disponible
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Hay mejoras listas. Recarga para aplicar.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Luego
          </button>
        </div>
      </div>
    );
  }

  if (showOfflineReady && offlineReady) {
    return (
      <div
        role="status"
        className={cn(
          'fixed bottom-20 left-3 right-3 z-50 sm:bottom-4 sm:left-auto sm:max-w-xs',
          'flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 shadow-lg',
          'animate-in slide-in-from-bottom-4 fade-in duration-300',
          'dark:border-emerald-700 dark:bg-emerald-900/40'
        )}
      >
        <span className="text-sm">📦</span>
        <p className="flex-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          App lista para usar sin conexión
        </p>
        <button
          type="button"
          onClick={() => setShowOfflineReady(false)}
          className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
