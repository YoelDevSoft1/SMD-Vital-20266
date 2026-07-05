/**
 * UpdatePrompt.tsx
 *
 * Prompt que aparece cuando el Service Worker detecta una nueva versión.
 * Usa workbox-window para escuchar 'waiting' y ofrece al usuario:
 *  - "Actualizar ahora" → skipWaiting() + reload
 *  - "Más tarde" → cierra el prompt (la próxima vez que cargue se actualizará)
 *
 * REGLA DURA PARA OPERACIONES EN CELULAR:
 *  - Si el SW nuevo está esperando y el usuario no interactúa en 5s, actualizamos
 *    automáticamente (sin esperar el click). Esto es crítico para que Jesmeiry/Omar
 *    en el celular SIEMPRE tengan la versión actual sin tocar nada.
 *  - Si el nuevo SW ya está controlando la página (skipWaiting+clientsClaim
 *    dispararon controllerchange), recargamos inmediatamente.
 */

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const updateSWRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  const autoUpdateTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_PWA !== 'false') {
      const loadRegister = new Function("return import('virtual:pwa-register')");
      loadRegister()
        .then(({ registerSW }: typeof import('virtual:pwa-register')) => {
          const updateSW = registerSW({
            immediate: true,
            onNeedRefresh() {
              setNeedRefresh(true);
              setCountdown(5);
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
          updateSWRef.current = updateSW;
          (window as any).__updateSW = updateSW;
        })
        .catch((error) => {
          console.warn('SW registration module unavailable:', error);
        });
    }

    // Cuando el SW nuevo toma control (skipWaiting+clientsClaim disparado),
    // recargamos la página para servir la versión actualizada.
    if ('serviceWorker' in navigator) {
      const onControllerChange = () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        window.setTimeout(() => window.location.reload(), 250);
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      // Forzar check de actualización cuando la página vuelve a primer plano.
      // Si el usuario dejó la app abierta mientras hacíamos push, detectamos el
      // SW nuevo sin necesidad de refresh manual.
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible' && navigator.serviceWorker.controller) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            reg?.update().catch(() => undefined);
          });
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      if (autoUpdateTimerRef.current) window.clearTimeout(autoUpdateTimerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Auto-update countdown: si hay SW nuevo y nadie toca en 5s, forzamos reload.
  useEffect(() => {
    if (!needRefresh) return;
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    autoUpdateTimerRef.current = window.setTimeout(() => {
      const updateSW = updateSWRef.current;
      if (updateSW) {
        void updateSW(true);
      } else {
        window.location.reload();
      }
    }, 5000);
    return () => {
      if (autoUpdateTimerRef.current) window.clearTimeout(autoUpdateTimerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, [needRefresh]);

  const handleUpdate = async () => {
    if (autoUpdateTimerRef.current) window.clearTimeout(autoUpdateTimerRef.current);
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    const updateSW = updateSWRef.current;
    if (updateSW) {
      await updateSW(true);
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (autoUpdateTimerRef.current) window.clearTimeout(autoUpdateTimerRef.current);
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    setNeedRefresh(false);
  };

  if (needRefresh) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[60] sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm',
          'flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl',
          'animate-in slide-in-from-bottom-4 fade-in duration-300',
          'dark:border-slate-700 dark:bg-slate-900/95'
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Actualizando en {countdown}s
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Nueva version lista. Toca Actualizar para aplicar ya.
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
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Esperar
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
          'fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-3 right-3 z-[60] sm:bottom-4 sm:left-auto sm:max-w-xs',
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
