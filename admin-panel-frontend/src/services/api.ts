import axios, { AxiosError } from 'axios';
import { REFRESH_TOKEN_KEY, useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1', // Usar variable de entorno o proxy de Vite
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Incluir cookies en las peticiones
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    // Solo mostrar logs en desarrollo
    if (import.meta.env.DEV) {
      console.log('API Request - Token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        url: config.url
      });
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Solo mostrar logs en desarrollo
      if (import.meta.env.DEV) {
        console.debug('API Request - Token being sent:', {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          url: config.url
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cola única de refresh para evitar multiples llamadas paralelas al endpoint /auth/refresh
// cuando varias requests fallan con 401 al mismo tiempo.
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Llamada directa con axios (sin nuestro interceptor) para evitar loop infinito.
  const response = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { withCredentials: true, timeout: 15000 },
  );

  const payload = response.data?.data ?? response.data;
  const newAccessToken: string | undefined = payload?.accessToken;
  const newRefreshToken: string | undefined = payload?.refreshToken;

  if (!newAccessToken) {
    throw new Error('Refresh response missing accessToken');
  }

  // Actualizamos el store si esta disponible (cliente), sino al menos al localStorage.
  try {
    useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
  } catch {
    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }
  }

  return newAccessToken;
}

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error('API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    const status = error.response?.status;
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    // Si el token expiro (401) y NO es la propia llamada de /auth/*,
    // intentamos refresh automatico antes de rendirnos.
    const isAuthEndpoint =
      typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Reusar la misma promesa si ya hay un refresh en curso.
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;

        // Reintentamos la request original con el nuevo token.
        originalRequest.headers ??= new axios.AxiosHeaders();
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh fallo -> cerrar sesion y mandar al login.
        try {
          useAuthStore.getState().logout();
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Mapea un error de axios (o desconocido) a un mensaje entendible en espanol.
 *
 * Reglas:
 *  - Si el backend ya mando un `message` util, lo respetamos.
 *  - Si no, mapeamos por status code a un mensaje claro para el usuario.
 *  - Casos tipicos del dominio SMD Vital contemplados.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Algo salio mal. Intentalo de nuevo.',
): string {
  if (!error) return fallback;

  // Axios error con respuesta del backend
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const serverMessage =
      axiosError.response?.data?.message || axiosError.response?.data?.error;

    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }

    const status = axiosError.response?.status;
    switch (status) {
      case 400:
        return 'La solicitud tiene datos invalidos. Revisa los campos.';
      case 401:
        return 'Tu sesion expiro. Vuelve a iniciar sesion.';
      case 403:
        return 'No tienes permiso para realizar esta accion.';
      case 404:
        return 'No encontramos el recurso solicitado.';
      case 409:
        return 'Conflicto con el estado actual. Es posible que la cita ya este procesada.';
      case 422:
        return 'Los datos enviados no cumplen los requisitos.';
      case 429:
        return 'Demasiadas solicitudes. Espera un momento antes de volver a intentar.';
      case 500:
        return 'Error interno del servidor. Intentalo de nuevo en un momento.';
      case 502:
      case 503:
      case 504:
        return 'El servicio no esta disponible en este momento. Intenta en unos minutos.';
      default:
        return fallback;
    }
  }

  // Error de red puro (sin response)
  if (error instanceof Error) {
    if (error.message === 'Network Error' || error.message.includes('Network')) {
      return 'Sin conexion. Verifica tu internet e intentalo de nuevo.';
    }
    return error.message || fallback;
  }

  return fallback;
}

export default api;
