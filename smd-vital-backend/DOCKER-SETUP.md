# 🐳 Configuración Docker - SMD Vital Backend

Esta guía explica cómo configurar y ejecutar el proyecto SMD Vital Backend con Docker sin conflictos con otros proyectos.

## 📋 Requisitos Previos

- Docker Desktop instalado y ejecutándose
- Docker Compose v3.8 o superior
- Al menos 4GB de RAM disponible
- Puertos libres (ver sección de puertos)

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

**Linux/macOS:**
```bash
chmod +x docker-build.sh
./docker-build.sh
```

**Windows:**
```bash
docker-build.bat
```

### Opción 2: Comandos Manuales

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## 🔧 Configuración de Puertos

Para evitar conflictos con otros proyectos Docker, los puertos por defecto son:

| Servicio | Puerto Interno | Puerto Externo | Configurable |
|----------|---------------|----------------|--------------|
| Backend API | 3000 | 3000 | ✅ Sí |
| PostgreSQL | 5432 | 5433 | ✅ Sí |
| Redis | 6379 | 6380 | ✅ Sí |
| Prisma Studio | 5555 | 5556 | ✅ Sí |
| Nginx HTTP | 80 | 8080 | ✅ Sí |
| Nginx HTTPS | 443 | 8443 | ✅ Sí |
| Prometheus | 9090 | 9091 | ✅ Sí |
| Grafana | 3000 | 3002 | ✅ Sí |
| Node Exporter | 9100 | 9101 | ✅ Sí |
| Redis Exporter | 9121 | 9122 | ✅ Sí |
| PostgreSQL Exporter | 9187 | 9188 | ✅ Sí |

### Cambiar Puertos

**Opción 1: Variables de entorno**
```bash
# Crear archivo .env.docker (o usar docker-compose.override.yml)
export BACKEND_PORT=3001
export POSTGRES_EXTERNAL_PORT=5434
export REDIS_EXTERNAL_PORT=6381
```

**Opción 2: docker-compose.override.yml**
```yaml
version: '3.8'
services:
  backend:
    ports:
      - "3001:3000"
  postgres:
    ports:
      - "5434:5432"
```

## 📁 Estructura de Archivos Docker

```
smd-vital-backend/
├── Dockerfile                 # Dockerfile para el backend
├── Dockerfile.prisma          # Dockerfile para Prisma Studio
├── docker-compose.yml         # Configuración principal
├── docker-compose.override.yml.example  # Ejemplo de override
├── .dockerignore             # Archivos a ignorar en el build
├── docker-build.sh           # Script de build (Linux/macOS)
├── docker-build.bat          # Script de build (Windows)
└── scripts/
    └── init-db.sh            # Script de inicialización de BD
```

## 🏷️ Nombres de Contenedores

Todos los contenedores usan el prefijo `smdvital-` para evitar conflictos:

- `smdvital-postgres`
- `smdvital-redis`
- `smdvital-backend`
- `smdvital-prisma-studio`
- `smdvital-nginx`
- `smdvital-prometheus`
- `smdvital-grafana`
- etc.

### Cambiar Prefijo

Edita la variable `CONTAINER_PREFIX` en `docker-compose.yml` o usa:
```bash
export CONTAINER_PREFIX=mi-proyecto
docker-compose up -d
```

## 🌐 Redes Docker

El proyecto usa una red Docker dedicada: `smdvital_network`

### Cambiar Nombre de Red

Edita la variable `NETWORK_NAME` en `docker-compose.yml` o usa:
```bash
export NETWORK_NAME=mi-red-docker
docker-compose up -d
```

## 💾 Volúmenes Docker

Los volúmenes usan el prefijo `smdvital_`:

- `smdvital_postgres_data`
- `smdvital_redis_data`
- `smdvital_prometheus_data`
- `smdvital_grafana_data`

### Cambiar Prefijo de Volúmenes

Edita la variable `VOLUME_PREFIX` en `docker-compose.yml` o usa:
```bash
export VOLUME_PREFIX=mi-proyecto
docker-compose up -d
```

## 🎯 Perfiles de Servicios

Algunos servicios usan perfiles para activarse solo cuando se necesitan:

### Desarrollo
```bash
# Incluye Prisma Studio
docker-compose --profile dev up -d
```

### Monitoreo
```bash
# Incluye Prometheus, Grafana y exporters
docker-compose --profile monitoring up -d
```

### Producción
```bash
# Incluye Nginx, Prometheus y Grafana
docker-compose --profile production up -d
```

### Todos los Servicios
```bash
docker-compose --profile dev --profile monitoring --profile production up -d
```

## 🔍 Verificación de Conflictos

### Verificar Puertos en Uso

**Linux/macOS:**
```bash
# Verificar puerto 3000
lsof -i :3000

# Verificar puerto 5433
lsof -i :5433
```

**Windows:**
```powershell
# Verificar puerto 3000
netstat -ano | findstr :3000

# Verificar puerto 5433
netstat -ano | findstr :5433
```

### Verificar Contenedores en Ejecución

```bash
# Ver todos los contenedores
docker ps -a

# Ver solo contenedores de SMD Vital
docker ps -a --filter "name=smdvital"
```

### Verificar Redes Docker

```bash
# Ver todas las redes
docker network ls

# Ver detalles de la red
docker network inspect smdvital_network
```

### Verificar Volúmenes

```bash
# Ver todos los volúmenes
docker volume ls

# Ver solo volúmenes de SMD Vital
docker volume ls --filter "name=smdvital"
```

## 🛠️ Comandos Útiles

### Construir y Ejecutar

```bash
# Construir sin cache
docker-compose build --no-cache

# Construir e iniciar
docker-compose up -d --build

# Reconstruir solo un servicio
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Ver últimas 100 líneas
docker-compose logs --tail=100
```

### Ejecutar Comandos en Contenedores

```bash
# Ejecutar comando en el backend
docker-compose exec backend sh

# Ejecutar migraciones de Prisma
docker-compose exec backend npx prisma migrate deploy

# Ejecutar seed de la base de datos
docker-compose exec backend npm run db:seed
```

### Detener y Limpiar

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Elimina datos)
docker-compose down -v

# Detener y eliminar imágenes
docker-compose down --rmi all
```

## 🔒 Seguridad

### Variables de Entorno Sensibles

**NUNCA** commits archivos `.env` con contraseñas reales. Usa:

1. **Archivo .env.local** (no versionado)
2. **Variables de entorno del sistema**
3. **Secrets de Docker Swarm/Kubernetes** (producción)

### Contraseñas por Defecto

Las contraseñas por defecto son solo para desarrollo. **Cámbialas en producción:**

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GRAFANA_ADMIN_PASSWORD`

## 🐛 Solución de Problemas

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Cambiar puerto en docker-compose.yml
# O matar el proceso que usa el puerto
```

### Contenedor no inicia

```bash
# Ver logs del contenedor
docker-compose logs backend

# Verificar health check
docker-compose ps

# Reiniciar contenedor
docker-compose restart backend
```

### Base de datos no conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar conexión
docker-compose exec postgres pg_isready -U smd_vital_user
```

### Redis no conecta

```bash
# Verificar que Redis esté corriendo
docker-compose ps redis

# Ver logs de Redis
docker-compose logs redis

# Probar conexión
docker-compose exec redis redis-cli -a smd_vital_redis_password ping
```

### Limpiar Todo y Empezar de Nuevo

```bash
# Detener y eliminar contenedores, redes y volúmenes
docker-compose down -v

# Eliminar imágenes
docker-compose down --rmi all

# Limpiar sistema Docker (¡CUIDADO! Elimina todo)
docker system prune -a --volumes

# Reconstruir desde cero
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoreo

### Health Checks

Todos los servicios tienen health checks configurados:

```bash
# Ver estado de health checks
docker-compose ps

# Ver detalles de health check
docker inspect smdvital-backend | grep -A 10 Health
```

### Métricas

- **Prometheus:** http://localhost:9091
- **Grafana:** http://localhost:3002
- **Node Exporter:** http://localhost:9101/metrics
- **Redis Exporter:** http://localhost:9122/metrics
- **PostgreSQL Exporter:** http://localhost:9188/metrics

## 🚀 Producción

### Recomendaciones para Producción

1. **Usar secrets de Docker** para contraseñas
2. **Configurar HTTPS** con certificados SSL
3. **Habilitar backups** automáticos de la base de datos
4. **Configurar monitoreo** con alertas
5. **Usar un reverse proxy** (Nginx/Traefik)
6. **Configurar rate limiting** a nivel de red
7. **Habilitar logs centralizados**
8. **Configurar auto-restart** policies

### Ejemplo de Despliegue en Producción

```bash
# Usar archivo de producción
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Con secrets
docker-compose --env-file .env.production up -d
```

## 📝 Notas Adicionales

- Los puertos externos son configurables mediante variables de entorno
- Los nombres de contenedores, redes y volúmenes son únicos
- Los servicios opcionales usan perfiles para no interferir
- Los health checks aseguran que los servicios estén listos
- Los volúmenes persisten los datos entre reinicios

## 🔗 Enlaces Útiles

- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/health
- **Prisma Studio:** http://localhost:5556 (perfil: dev)
- **Prometheus:** http://localhost:9091 (perfil: monitoring)
- **Grafana:** http://localhost:3002 (perfil: monitoring)

---

**Última actualización:** Enero 2026
**Versión:** 2.1.0

