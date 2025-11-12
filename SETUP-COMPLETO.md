# 🚀 Setup Completo - SMD Vital

Guía completa para montar y ejecutar todo el proyecto SMD Vital (Backend + Panel de Administración).

## 📋 Requisitos Previos

- Docker Desktop instalado y ejecutándose
- Docker Compose v3.8 o superior
- Node.js 18+ (para desarrollo local)
- Al menos 4GB de RAM disponible
- Puertos libres: 3000, 5174, 5433, 6380

## 🎯 Opción 1: Docker Compose Completo (Recomendado)

### Inicio Rápido

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose.full.yml up -d --build
```

Esto iniciará:
- ✅ PostgreSQL (puerto 5433)
- ✅ Redis (puerto 6380)
- ✅ Backend API (puerto 3000)
- ✅ Panel de Administración (puerto 5174)

### Acceso a los Servicios

- **Panel Admin:** http://localhost:5174
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/health
- **Prisma Studio:** http://localhost:5556 (perfil: dev)

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose -f docker-compose.full.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.full.yml logs -f backend
docker-compose -f docker-compose.full.yml logs -f admin-panel

# Detener todos los servicios
docker-compose -f docker-compose.full.yml down

# Reconstruir servicios
docker-compose -f docker-compose.full.yml build --no-cache
docker-compose -f docker-compose.full.yml up -d
```

## 🎯 Opción 2: Desarrollo Local (Sin Docker)

### Backend

```bash
# Ir al directorio del backend
cd smd-vital-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Iniciar PostgreSQL y Redis (Docker)
docker-compose up -d postgres redis

# Ejecutar migraciones
npm run db:migrate

# Iniciar servidor de desarrollo
npm run dev
```

### Panel de Administración

```bash
# Ir al directorio del panel
cd admin-panel-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# O usar el script
./start-dev.sh  # Linux/macOS
start-dev.bat   # Windows
```

## 🎯 Opción 3: Backend Docker + Panel Local

### Backend con Docker

```bash
cd smd-vital-backend
docker-compose up -d
```

### Panel Local

```bash
cd admin-panel-frontend
npm install
npm run dev
```

## 🔧 Configuración de Variables de Entorno

### Backend (.env)

```env
DATABASE_URL=postgresql://smd_vital_user:smd_vital_password@localhost:5433/smd_vital_db
REDIS_URL=redis://:smd_vital_redis_password@localhost:6380
JWT_SECRET=tu-secret-jwt-aqui
JWT_REFRESH_SECRET=tu-refresh-secret-aqui
CORS_ORIGIN=http://localhost:5174
PORT=3000
```

### Panel Admin (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=SMD Vital Admin
VITE_APP_VERSION=1.0.0
```

## 📊 Verificación de Servicios

### Verificar Backend

```bash
# Health check
curl http://localhost:3000/health

# Swagger docs
curl http://localhost:3000/api/docs.json
```

### Verificar Panel Admin

```bash
# Abrir en navegador
http://localhost:5174
```

### Verificar Base de Datos

```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U smd_vital_user -d smd_vital_db
```

### Verificar Redis

```bash
# Conectar a Redis
docker-compose exec redis redis-cli -a smd_vital_redis_password
```

## 🔐 Primer Acceso

### Crear Usuario Administrador

1. **Opción 1: Script SQL**
   ```bash
   cd smd-vital-backend
   # Ejecutar script SQL para crear admin
   ```

2. **Opción 2: Registro en el Panel**
   - Ir a http://localhost:5174/register
   - Crear cuenta con rol ADMIN o SUPER_ADMIN

3. **Opción 3: Prisma Studio**
   - Ir a http://localhost:5556
   - Crear usuario manualmente

### Credenciales por Defecto

⚠️ **IMPORTANTE:** Cambia estas credenciales en producción

- **Email:** admin@smdvital.com
- **Password:** (configurar según tu setup)

## 🐛 Solución de Problemas

### Backend no inicia

```bash
# Ver logs
docker-compose logs backend

# Verificar base de datos
docker-compose logs postgres

# Verificar Redis
docker-compose logs redis
```

### Panel no se conecta al backend

1. Verificar que el backend esté corriendo:
   ```bash
   curl http://localhost:3000/health
   ```

2. Verificar CORS en el backend:
   - Asegurar que `CORS_ORIGIN` incluya `http://localhost:5174`

3. Verificar proxy de Nginx (producción):
   - Revisar `nginx.conf`
   - Verificar que el backend esté accesible

### Error de autenticación

1. Verificar que el token se esté enviando:
   - Abrir DevTools → Network
   - Verificar header `Authorization: Bearer ...`

2. Verificar que el backend esté recibiendo el token:
   - Ver logs del backend
   - Verificar middleware de autenticación

### Puerto en uso

```bash
# Verificar puertos en uso
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Cambiar puerto en docker-compose.yml o .env
```

## 📚 Documentación Adicional

- **Backend:** `smd-vital-backend/README.md`
- **Panel Admin:** `admin-panel-frontend/README.md`
- **Docker Backend:** `smd-vital-backend/DOCKER-SETUP.md`
- **Docker Panel:** `admin-panel-frontend/README-DOCKER.md`

## 🎉 Siguientes Pasos

1. ✅ Verificar que todos los servicios estén corriendo
2. ✅ Crear usuario administrador
3. ✅ Acceder al panel en http://localhost:5174
4. ✅ Configurar servicios y doctores
5. ✅ Probar funcionalidades del panel

## 🔗 Enlaces Útiles

- **Panel Admin:** http://localhost:5174
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/health
- **Prisma Studio:** http://localhost:5556 (dev)

---

**Última actualización:** Enero 2026
**Versión:** 2.1.0
**Status:** ✅ Listo para usar

