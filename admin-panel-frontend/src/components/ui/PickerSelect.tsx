/**
 * PickerSelect — wrapper de BottomPicker con look & feel de <select>.
 *
 * Reemplaza los <select> nativos en mobile contexts (rompen el feel iOS)
 * y mantiene una API compatible con un select controlado.
 *
 * Diferencias con <select> nativo:
 *   - Mobile: abre bottom-sheet con buscador en lugar del picker del sistema
 *   - Desktop: abre modal centrado con la misma lista buscable
 *   - Mantiene contrato: `value` + `onChange(value)` + `options`
 *
 * Uso:
 *   <PickerSelect
 *     label="Rol"
 *     value={rol}
 *     onChange={setRol}
 *     options={OPCIONES_ROLES}
 *     required
 *   />
 */

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { BottomPicker, type BottomPickerItem } from '@/components/ui/BottomPicker';

export interface PickerSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  /** Texto extra para búsqueda (label + sublabel se incluyen automáticamente). */
  searchText?: string;
}

interface PickerSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PickerSelectOption[];
  /** Etiqueta visible arriba del trigger (opcional). */
  label?: string;
  /** Mensaje de error (muestra borde rojo + texto debajo). */
  error?: string;
  /** Texto de ayuda debajo del trigger. */
  helperText?: string;
  /** Placeholder cuando value está vacío. */
  placeholder?: string;
  /** Título del modal BottomPicker (default = label). */
  title?: string;
  /** Placeholder del input de búsqueda dentro del picker. */
  searchPlaceholder?: string;
  /** Mensaje cuando la búsqueda no devuelve resultados. */
  emptyText?: string;
  /** Deshabilita la interacción. */
  disabled?: boolean;
  /** Marca el campo como required (asterisco rojo en label). */
  required?: boolean;
  /** Variante visual: glass (translúcido) o solid (tarjeta). */
  variant?: 'glass' | 'solid';
  /** id para asociar con <label htmlFor>. */
  id?: string;
  className?: string;
}

export function PickerSelect({
  value,
  onChange,
  options,
  label,
  error,
  helperText,
  placeholder = 'Seleccionar...',
  title,
  searchPlaceholder = 'Buscar...',
  emptyText = 'Sin resultados',
  disabled = false,
  required = false,
  variant = 'solid',
  id,
  className,
}: PickerSelectProps) {
  const reactId = useId();
  const triggerId = id ?? reactId;
  const pickerTitle = title ?? label ?? 'Selecciona una opción';
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? '';

  const items: BottomPickerItem[] = options.map((option) => ({
    value: option.value,
    label: option.label,
    sublabel: option.sublabel,
    searchText: option.searchText,
  }));

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  // Estilo base del trigger — idéntico a Entrada/Seleccion para consistencia.
  const baseStyles = [
    'flex w-full items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-base',
    'min-h-[44px]',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'motion-safe:transition-all',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ];

  const variantStyles = {
    glass: cn(
      'bg-white/50 backdrop-blur-sm border border-slate-200/60 text-slate-900',
      'focus:bg-white/70 focus:border-blue-400/70 focus:ring-blue-400/50',
      'disabled:bg-slate-100/50 disabled:text-slate-400',
      'dark:bg-slate-900/40 dark:border-slate-700/60 dark:text-white',
      'dark:focus:bg-slate-900/60 dark:focus:border-blue-500/70 dark:focus:ring-blue-500/50',
    ),
    solid: cn(
      'bg-white border border-slate-300 text-slate-900',
      'focus:border-blue-500 focus:ring-blue-500/40',
      'disabled:bg-slate-100 disabled:text-slate-400',
      'dark:bg-slate-800/80 dark:border-slate-600/80 dark:text-white',
      'dark:focus:border-blue-500 dark:focus:ring-blue-500/40',
    ),
  };

  const errorStyles = error
    ? 'border-red-400/70 focus:border-red-500/70 focus:ring-red-500/50 dark:border-red-500/70 dark:focus:border-red-500/70 dark:focus:ring-red-500/50'
    : '';

  const triggerClasses = cn(
    baseStyles,
    variantStyles[variant],
    errorStyles,
    !selectedLabel && 'text-muted-foreground',
    className,
  );

  return (
    <div className="space-y-1.5">
      {label ? (
        <Etiqueta htmlFor={triggerId} required={required}>
          {label}
        </Etiqueta>
      ) : null}

      <button
        id={triggerId}
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={Boolean(error) || undefined}
        className={triggerClasses}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {error ? (
        <p className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
          <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}

      <BottomPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
        title={pickerTitle}
        items={items}
        selectedValue={value}
        placeholder={searchPlaceholder}
        emptyText={emptyText}
      />
    </div>
  );
}