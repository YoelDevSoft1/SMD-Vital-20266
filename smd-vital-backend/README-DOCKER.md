# 🐳 Docker Setup - SMD Vital Backend

## ✅ Configuración Completa para Evitar Conflictos

El proyecto está configurado para evitar conflictos con otros proyectos Docker mediante:

1. **Puertos únicos y configurables**
2. **Nombres de contenedores con prefijo único** (`smdvital-`)
3. **Red Docker dedicada** (`smdvital_network`)
4. **Volúmenes con prefijo único** (`smdvital_`)
5. **Variables de entorno configurables**

## 🚀 Inicio Rápido

### Windows
```bash
docker-build.bat
```

### Linux/macOS
```bash
chmod +x docker-build.sh
./docker-build.sh
```

### Manual
```bash
docker-compose build
docker-compose up -d
```

## 🔧 Puertos Configurados (Sin Conflictos)

| Servicio | Puerto Externo | Puerto Interno |
|----------|----------------|----------------|
| Backend API | 3000 | 3000 |
| PostgreSQL | **5433** (no 5432) | 5432 |
| Redis | **6380** (no 6379) | 6379 |
| Prisma Studio | **5556** (no 5555) | 5555 |
| Nginx HTTP | **8080** (no 80) | 80 |
| Nginx HTTPS | **8443** (no 443) | 443 |
| Prometheus | **9091** (no 9090) | 9090 |
| Grafana | **3002** (no 3001) | 3000 |

## 📝 Cambiar Puertos

Crea un archivo `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  backend:
    ports:
      - "3001:3000"  # Cambia 3001 por el puerto que necesites
  postgres:
    ports:
      - "5434:5432"  # Cambia 5434 por el puerto que necesites
```

## 🏷️ Nombres Únicos

Todos los contenedores usan el prefijo `smdvital-`:
- `smdvital-postgres`
- `smdvital-redis`
- `smdvital-backend`
- `smdvital-prisma-studio`
- etc.

## 🌐 Red y Volúmenes Únicos

- **Red:** `smdvital_network`
- **Volúmenes:** `smdvital_postgres_data`, `smdvital_redis_data`, etc.

## 📚 Documentación Completa

Ver `DOCKER-SETUP.md` para documentación completa.

## ✅ Verificación

```bash
# Verificar que no hay conflictos
docker ps -a --filter "name=smdvital"

# Verificar red
docker network ls | grep smdvital

# Verificar volúmenes
docker volume ls | grep smdvital
```

## 🎯 Servicios Disponibles

- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/health
- **Prisma Studio:** http://localhost:5556 (perfil: dev)
- **Prometheus:** http://localhost:9091 (perfil: monitoring)
- **Grafana:** http://localhost:3002 (perfil: monitoring)

## 🔍 Solución de Problemas

Si hay conflictos de puertos:

1. Verifica qué puerto está en uso:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/macOS
   lsof -i :3000
   ```

2. Cambia el puerto en `docker-compose.override.yml`

3. Reconstruye:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## 📖 Más Información

Ver `DOCKER-SETUP.md` para:
- Configuración avanzada
- Solución de problemas
- Comandos útiles
- Configuración de producción

