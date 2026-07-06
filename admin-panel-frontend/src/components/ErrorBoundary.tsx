/**
 * ErrorBoundary — captura excepciones en el árbol React y muestra un fallback
 * seguro en lugar de la pantalla en blanco.
 *
 * Características:
 *   - Detecta errores en render, lifecycle y constructores de hijos.
 *   - Muestra UI de fallback con detalle del error y acciones (Recargar / Inicio).
 *   - Loguea a la consola para diagnóstico (en producción podría enviar a Sentry/etc.).
 *   - Mensaje copy en español; usa tokens semánticos del design system.
 *
 * Uso:
 *   <ErrorBoundary> ... tree ... </ErrorBoundary>
 *
 * Notas:
 *   - Solo captura errores en componentes hijos. Errores en event handlers /
 *     código asíncrono deben usar try/catch + toast.error (no se capturan aquí).
 *   - Para aislar fallos por sección, envolvé sub-árboles con su propio boundary.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  children: ReactNode;
  /** UI custom para el fallback. Si no se provee, se usa el fallback por defecto. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Callback opcional para reportar el error a un servicio externo. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log a consola para diagnóstico. En producción reemplazar por Sentry/LogRocket.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError || !error) {
      return <>{children}</>;
    }

    if (fallback) {
      return fallback(error, this.reset);
    }

    return <DefaultErrorFallback error={error} onReset={this.reset} />;
  }
}

interface FallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: FallbackProps) {
  const handleReload = () => {
    // Preferimos reset del estado para mantener SPA, pero dejamos escape con full reload.
    onReset();
    // Si el error persiste, el usuario verá el mismo fallback y podrá hacer reload duro.
  };

  const handleHardReload = () => {
    window.location.reload();
  };

  const handleHome = () => {
    window.location.href = '/login';
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex min-h-[100dvh] w-full flex-col items-center justify-center',
        'bg-background px-6 py-12 text-foreground',
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-md flex-col items-center gap-4',
          'rounded-2xl bg-card p-6 shadow-soft-lg ring-1 ring-border',
          'text-center sm:p-8',
        )}
      >
        <div
          className={cn(
            'inline-flex h-14 w-14 items-center justify-center rounded-full',
            'bg-danger-muted text-danger-muted-foreground ring-1 ring-danger/20',
          )}
        >
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold sm:text-xl">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            La aplicación encontró un error inesperado. Puedes intentar continuar o volver al inicio.
          </p>
        </div>

        {import.meta.env.DEV ? (
          <details
            className={cn(
              'w-full rounded-lg bg-muted/60 p-3 text-left text-xs',
              'ring-1 ring-border',
            )}
          >
            <summary className="cursor-pointer font-medium text-foreground">
              Detalle del error (solo dev)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
              {error.name}: {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        ) : null}

        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleHome}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4',
              'bg-card text-foreground ring-1 ring-border',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'motion-safe:transition-all',
            )}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Ir al inicio
          </button>
          <button
            type="button"
            onClick={handleReload}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4',
              'bg-card text-foreground ring-1 ring-border',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'motion-safe:transition-all',
            )}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
          <button
            type="button"
            onClick={handleHardReload}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4',
              'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft-md',
              'hover:from-brand-600 hover:to-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2',
              'motion-safe:transition-all',
            )}
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  );
}