/**
 * InstallBanner.tsx
 *
 * Banner nativo para "Agregar a pantalla de inicio" (A2HS — Add to Home Screen).
 * Captura el evento beforeinstallprompt y muestra un banner amigable en lugar
 * del prompt genérico del navegador.
 *
 * Comportamiento:
 *  - Aparece cuando el browser dispara 'beforeinstallprompt'
 *  - Si el usuario ya instaló, no aparece (window.matchMedia('(display-mode: standalone)'))
 *  - Si el usuario ya lo descartó, no aparece por 14 días (localStorage)
 *  - Al instalar, oculta y limpia
 *  - Al descartar, oculta y guarda timestamp
 */

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'smd-install-dismissed-at';
const DISMISS_DAYS = 14;
const STORAGE_KEY = 'smd-installed';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as any).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalada
    if (isStandalone() || localStorage.getItem(STORAGE_KEY) === '1') {
      setInstalled(true);
      return;
    }
    // No mostrar si fue descartada recientemente
    if (wasDismissedRecently()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Pequeño delay para que no aparezca apenas carga la app
      setTimeout(() => setVisible(true), 3000);
    };

    const onAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY, '1');
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEY, '1');
        setInstalled(true);
      }
    } finally {
      setInstalling(false);
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (installed || !visible || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar SMD Vital"
      className={cn(
        'fixed inset-x-3 bottom-20 z-40 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm',
        'rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        'dark:border-slate-700 dark:bg-slate-900/95'
      )}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Instala SMD Vital
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Acceso directo desde tu pantalla, sin navegador. Más rápido y funciona offline.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {installing ? 'Instalando…' : 'Instalar'}
        </button>
      </div>
    </div>
  );
}
