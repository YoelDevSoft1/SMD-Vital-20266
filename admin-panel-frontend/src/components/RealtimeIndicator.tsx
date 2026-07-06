/**
 * RealtimeIndicator — pequeño badge "En vivo" que parpadea cuando llega
 * un evento Socket.IO. Se monta globalmente en App y se suscribe a un
 * CustomEvent disparado por realtime.service.ts.
 *
 * UX:
 *   - Aparece en el header global (esquina inferior derecha) por 4 segundos
 *     y se desvanece suavemente.
 *   - Si llegan múltiples eventos en rápida sucesión, se reinicia el timer.
 *   - role="status" + aria-live="polite" → anuncio no intrusivo a screen readers.
 */

import { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';
import { cn } from '@/utils/cn';

export const REALTIME_EVENT_NAME = 'smd:realtime-update';

interface RealtimeEvent extends CustomEvent {
  detail?: {
    appointmentId?: string;
    type?: string;
  };
}

export function RealtimeIndicator() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (_event: Event) => {
      setVisible(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setVisible(false);
        timerRef.current = null;
      }, 4000);
    };

    window.addEventListener(REALTIME_EVENT_NAME, handler as EventListener);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handler as EventListener);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] right-[calc(env(safe-area-inset-right,0px)+1rem)] z-[80]',
        'flex items-center gap-2 rounded-full px-3 py-1.5',
        'bg-success-muted text-success-muted-foreground ring-1 ring-success/30 shadow-soft-md',
        'motion-safe:transition-all motion-safe:duration-300',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <Radio className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="text-xs font-semibold">En vivo</span>
    </div>
  );
}