import { AlertTriangle, X } from 'lucide-react';
import { Boton } from './Boton';
import { ModalCristal } from './ModalCristal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  /** When true the backdrop click is ignored (e.g. mid-submission). */
  closeOnOverlayClick?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DialogoConfirmacion({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDanger = false,
  isLoading = false,
  closeOnOverlayClick = true,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  // z-[70] para apilar limpiamente sobre ModalCristal (z-[60]) cuando el
  // confirm se abre encima de un modal padre (p.ej. un formulario abierto).
  // rounded-xl anula las clases de bottom-sheet de ModalCristal para que el
  // confirm se vea como un dialogo compacto en cualquier viewport.
  return (
    <ModalCristal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onCancel}
      size="sm"
      variant="elevated"
      overlayClassName="z-[70] bg-slate-950/70 dark:bg-slate-950/80"
      containerClassName="rounded-xl"
      closeOnOverlayClick={closeOnOverlayClick && !isLoading}
      ariaLabelledBy="dialogo-confirmacion-title"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={
                isDanger
                  ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                  : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
              }
            >
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="dialogo-confirmacion-title"
                className="text-base font-semibold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Cerrar confirmacion"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Boton>
          <Boton
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Boton>
        </div>
      </div>
    </ModalCristal>
  );
}