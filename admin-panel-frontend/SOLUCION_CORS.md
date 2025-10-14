# 🔧 Solución de Problema CORS - SMD Vital Admin Panel

## 🚨 Problema Identificado

El backend está configurado para permitir solo `http://localhost:4322` pero tu frontend está ejecutándose en `http://localhost:5173`, causando errores de CORS.

## ✅ Soluciones Implementadas

### 1. **React Router Warnings Solucionados**
- ✅ Agregadas future flags para eliminar warnings
- ✅ `v7_startTransition: true`
- ✅ `v7_relativeSplatPath: true`

### 2. **Solución de CORS - Opción 1: Actualizar Backend (Recomendada)**

Crea un archivo `.env` en la carpeta `smd-vital-backend` con el siguiente contenido:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/smd_vital_db"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="dev-jwt-secret-key-that-is-at-least-32-characters-long-for-development"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="dev-refresh-secret-key-that-is-at-least-32-characters-long-for-development"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"
API_VERSION="v1"

# CORS Configuration - Updated for admin panel frontend
CORS_ORIGIN="http://localhost:5173"
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET="dev-session-secret-that-is-at-least-32-characters-long-for-development"
```

**Pasos:**
1. Ve a la carpeta `smd-vital-backend`
2. Crea el archivo `.env` con el contenido de arriba
3. Reinicia el backend: `npm run dev`

### 3. **Solución de CORS - Opción 2: Múltiples Orígenes (Alternativa)**

Si quieres permitir múltiples orígenes, actualiza el archivo `.env` del backend:

```env
# CORS Configuration - Multiple origins
CORS_ORIGIN="http://localhost:4322,http://localhost:5173,http://localhost:3000"
CORS_CREDENTIALS=true
```

### 4. **Solución de CORS - Opción 3: Desarrollo Local (Temporal)**

Para desarrollo local, puedes usar el proxy de Vite que ya está configurado. Asegúrate de que tu `vite.config.ts` tenga:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

## 🚀 Pasos para Solucionar

### Método 1: Actualizar Backend (Recomendado)

1. **Crear archivo .env en backend:**
   ```bash
   cd smd-vital-backend
   # Copia el contenido del .env de arriba
   ```

2. **Reiniciar backend:**
   ```bash
   npm run dev
   ```

3. **Verificar que funciona:**
   - Ve a `http://localhost:5173/login`
   - Intenta hacer login o registro
   - No debería haber errores de CORS

### Método 2: Usar Proxy de Vite

1. **Asegúrate de que el proxy esté configurado** (ya está en tu `vite.config.ts`)

2. **Cambia la URL de la API en el frontend:**
   ```typescript
   // En src/services/api.ts
   const api = axios.create({
     baseURL: '/api/v1', // Sin http://localhost:3000
     timeout: 30000,
   });
   ```

3. **Reinicia el frontend:**
   ```bash
   npm run dev
   ```

## 🔍 Verificación

Después de aplicar la solución:

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña Network**
3. **Intenta hacer login o registro**
4. **Verifica que:**
   - No hay errores de CORS
   - Las peticiones se envían correctamente
   - Recibes respuestas del backend

## 🐛 Solución de Problemas

### Error: "CORS policy: Response to preflight request doesn't pass"
- **Causa:** El backend no permite el origen del frontend
- **Solución:** Actualiza `CORS_ORIGIN` en el `.env` del backend

### Error: "net::ERR_FAILED"
- **Causa:** El backend no está ejecutándose
- **Solución:** Ejecuta `npm run dev` en la carpeta del backend

### Error: "Access-Control-Allow-Origin header"
- **Causa:** Configuración de CORS incorrecta
- **Solución:** Verifica que `CORS_ORIGIN` coincida con tu URL del frontend

## 📋 Checklist de Verificación

- [ ] Archivo `.env` creado en `smd-vital-backend`
- [ ] `CORS_ORIGIN="http://localhost:5173"` configurado
- [ ] Backend reiniciado
- [ ] Frontend ejecutándose en puerto 5173
- [ ] No hay errores de CORS en la consola
- [ ] Login y registro funcionan correctamente

## 🎯 Resultado Esperado

Después de aplicar la solución:
- ✅ No más errores de CORS
- ✅ Login y registro funcionan
- ✅ No más warnings de React Router
- ✅ Comunicación frontend-backend exitosa

---

**¡El problema de CORS estará solucionado! 🎉**

Sigue los pasos de arriba y tu panel de administración funcionará perfectamente.
