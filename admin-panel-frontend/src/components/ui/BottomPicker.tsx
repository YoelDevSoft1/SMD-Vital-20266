/**
 * BottomPicker — iOS-style bottom-sheet picker.
 *
 * Reemplaza el <select> nativo para que en iOS Safari no aparezca el
 * picker del sistema (que rompe el feel "app nativa"). En Android y
 * desktop funciona igual — todos los items son tap-pad.
 *
 * Incluye búsqueda client-side sobre `searchText` (o `label` si falta).
 *
 * Props:
 *  - open        → controla visibilidad
 *  - onClose     → cerrar sin elegir (tap overlay / drag down / ESC)
 *  - onSelect    → elegir valor (cierra automáticamente)
 *  - items       → opciones { value, label, sublabel?, searchText? }
 *  - selectedValue → marca el item activo con check dorado
 *  - title       → encabezado del drawer
 *  - placeholder → texto del input de búsqueda
 *  - emptyText   → mensaje cuando no hay matches
 *
 * iOS-feel details:
 *  - Drag handle decorativo arriba (no se implementa drag real; es visual)
 *  - Tap fuera cierra (`closeOnOverlayClick`)
 *  - ESC cierra (vía ModalCristal)
 *  - Safe-area-inset-bottom respetado en el footer
 *  - Backdrop con blur (vía ModalCristal)
 *  - Lista con scroll suave + scroll-fade indicator
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ModalCristal } from '@/components/ui/ModalCristal';

export interface BottomPickerItem {
  value: string;
  label: string;
  sublabel?: string;
  /** Texto adicional para la búsqueda (incluye label automáticamente). */
  searchText?: string;
}

interface BottomPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  items: BottomPickerItem[];
  selectedValue?: string;
  placeholder?: string;
  emptyText?: string;
}

export function BottomPicker({
  open,
  onClose,
  onSelect,
  title,
  items,
  selectedValue,
  placeholder = 'Buscar...',
  emptyText = 'Sin resultados',
}: BottomPickerProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query cada vez que abre el picker.
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  // Foco automático en el input al abrir (iOS-feel: listo para teclear).
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.label} ${item.sublabel ?? ''} ${item.searchText ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  return (
    <ModalCristal
      isOpen={open}
      onClose={onClose}
      variant="elevated"
      size="full"
      closeOnOverlayClick
      withBlobs={false}
      containerClassName="max-h-[85dvh]"
    >
      {/* Drag handle decorativo — refuerza el feel bottom-sheet. */}
      <div className="flex justify-center pt-2">
        <div className="h-1 w-10 rounded-full bg-slate-300/80 dark:bg-slate-600/80" aria-hidden />
      </div>

      {/* Header sticky */}
      <header className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-border/60 bg-inherit px-5 py-3">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Buscador */}
      <div className="sticky top-[57px] z-[1] bg-inherit px-5 pb-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{emptyText}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prueba con otro término o cierra para cancelar.
            </p>
          </div>
        ) : (
          <ul role="listbox" aria-label={title} className="space-y-1 px-3 py-1">
            {filtered.map((item) => {
              const selected = item.value === selectedValue;
              return (
                <li key={item.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item.value);
                      onClose();
                    }}
                    className={cn(
                      'group flex w-full min-h-[52px] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                      'active:scale-[0.99]',
                      selected
                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100'
                        : 'text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800/60',
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('truncate text-sm font-medium', selected && 'font-semibold')}>
                        {item.label}
                      </span>
                      {item.sublabel ? (
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.sublabel}
                        </span>
                      ) : null}
                    </div>
                    {selected ? (
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModalCristal>
  );
}
