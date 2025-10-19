import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Usar proxy de Vite
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('API Request - Token check:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      url: config.url
    });
    if (token) {
      // Debug logging
      console.debug('API Request - Token being sent:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        tokenEnd: '...' + token.substring(token.length - 20),
        isJWTFormat: token.split('.').length === 3,
        url: config.url
      });
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.error('API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    const originalRequest = error.config;

    // Si el token expiró (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Redirigir al login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
