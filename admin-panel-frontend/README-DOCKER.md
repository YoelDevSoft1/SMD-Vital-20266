# 🐳 Docker Setup - Panel de Administración SMD Vital

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

**Windows:**
```bash
docker-build.bat
```

**Linux/macOS:**
```bash
chmod +x docker-build.sh
./docker-build.sh
```

### Opción 2: Comandos Manuales

```bash
# Construir imagen
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## 📋 Requisitos Previos

- Docker Desktop instalado y ejecutándose
- Docker Compose v3.8 o superior
- Backend de SMD Vital corriendo (puerto 3000)
- Red Docker `smdvital_network` creada

## 🔧 Configuración

### Puertos

| Servicio | Puerto Externo | Puerto Interno |
|----------|----------------|----------------|
| Admin Panel | **5174** | 80 |

### Variables de Entorno

Crea un archivo `.env` en el directorio del panel:

```env
# Puerto del panel de administración
ADMIN_PANEL_PORT=5174

# URL del backend (opcional, se configura automáticamente)
VITE_API_URL=http://localhost:3000/api/v1
```

## 🏗️ Arquitectura

El panel de administración está construido con:

- **React 18** + **TypeScript**
- **Vite** para build rápido
- **Tailwind CSS** para estilos
- **React Query** para manejo de estado
- **Axios** para peticiones HTTP
- **Nginx** para servir archivos estáticos en producción

## 🔄 Integración con Backend

El panel se conecta al backend mediante:

1. **Proxy de Nginx** (producción): `/api` → `http://backend:3000/api`
2. **Proxy de Vite** (desarrollo): `/api` → `http://localhost:3000/api`
3. **Variable de entorno** (opcional): `VITE_API_URL`

## 📁 Estructura de Archivos

```
admin-panel-frontend/
├── Dockerfile                 # Dockerfile para producción
├── docker-compose.yml         # Configuración Docker
├── nginx.conf                 # Configuración de Nginx
├── .dockerignore             # Archivos a ignorar
├── docker-build.sh           # Script de build (Linux/macOS)
├── docker-build.bat          # Script de build (Windows)
└── src/
    ├── services/
    │   └── api.ts            # Configuración de Axios
    └── ...
```

## 🚀 Desarrollo Local (Sin Docker)

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El panel estará en http://localhost:5173
# El proxy redirige /api a http://localhost:3000
```

## 🐳 Producción con Docker

### Build y Ejecución

```bash
# Construir imagen
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f admin-panel
```

### Acceso

- **Panel Admin:** http://localhost:5174
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs

## 🔗 Integración Completa

Para ejecutar Backend + Panel Admin juntos:

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose.full.yml up -d
```

Esto iniciará:
- ✅ PostgreSQL
- ✅ Redis
- ✅ Backend API
- ✅ Panel de Administración
- ✅ Prisma Studio (perfil: dev)

## 🛠️ Comandos Útiles

### Ver logs
```bash
docker-compose logs -f admin-panel
```

### Reconstruir
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Acceder al contenedor
```bash
docker-compose exec admin-panel sh
```

### Verificar estado
```bash
docker-compose ps
```

## 🐛 Solución de Problemas

### El panel no se conecta al backend

1. Verificar que el backend esté corriendo:
   ```bash
   docker ps | grep smdvital-backend
   ```

2. Verificar la red Docker:
   ```bash
   docker network inspect smdvital_network
   ```

3. Verificar logs del panel:
   ```bash
   docker-compose logs admin-panel
   ```

### Error 502 Bad Gateway

- El backend no está respondiendo
- Verificar que el backend esté saludable:
  ```bash
  curl http://localhost:3000/health
  ```

### Error de CORS

- Verificar que `CORS_ORIGIN` en el backend incluya la URL del panel
- Verificar la configuración de Nginx

## 📚 Más Información

- **Documentación Backend:** Ver `smd-vital-backend/README.md`
- **Documentación Docker:** Ver `smd-vital-backend/DOCKER-SETUP.md`

---

**Última actualización:** Enero 2026
**Versión:** 2.1.0

