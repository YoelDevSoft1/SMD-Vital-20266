# Docker con Prisma Studio - Guía de Uso

Esta guía explica cómo usar Prisma Studio en un **contenedor independiente** de Docker.

## 🚀 Inicio Rápido

### Opción 1: Todos los servicios (Recomendado)
```bash
# Construir y ejecutar todos los servicios incluyendo Prisma Studio
docker-compose --profile dev up --build

# Acceder a:
# - Backend API: http://localhost:3000
# - Prisma Studio: http://localhost:5555
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Opción 2: Solo Backend (Producción)
```bash
# Solo servicios principales (sin Prisma Studio)
docker-compose up postgres redis backend

# Acceder a:
# - Backend API: http://localhost:3000
```

### Opción 3: Solo Prisma Studio
```bash
# Solo Prisma Studio (requiere que postgres esté ejecutándose)
docker-compose up prisma-studio
```

## 📋 Comandos Útiles

### Gestión de Contenedores
```bash
# Iniciar todos los servicios (incluyendo Prisma Studio)
npm run docker:all

# Solo backend (producción)
npm run docker:backend

# Solo Prisma Studio
npm run docker:prisma

# Detener todos los servicios
npm run docker:down

# Ver logs de todos los servicios
npm run docker:logs

# Ver logs específicos
npm run docker:logs:backend
npm run docker:logs:prisma

# Acceder al shell del contenedor
npm run docker:shell          # Backend
npm run docker:shell:prisma   # Prisma Studio
```

### Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate dev

# Generar cliente Prisma
docker-compose exec backend npx prisma generate

# Ejecutar seed
docker-compose exec backend npm run db:seed

# Resetear base de datos
docker-compose exec backend npx prisma migrate reset
```

## 🔧 Configuración

### Variables de Entorno
El archivo `.env` se usa para configuración local. En Docker, las variables se definen en `docker-compose.yml`.

### Puertos
- **3000**: Backend API
- **5555**: Prisma Studio
- **5432**: PostgreSQL
- **6379**: Redis

## 🐛 Solución de Problemas

### Prisma Studio no se inicia
```bash
# Verificar que la base de datos esté funcionando
docker-compose exec backend npx prisma db push

# Verificar logs
docker-compose logs backend
```

### Puerto 5555 ocupado
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "5556:5555"  # Usar puerto 5556 en el host
```

### Problemas de permisos
```bash
# Reconstruir contenedor
docker-compose down
docker-compose up --build
```

## 📁 Estructura de Archivos

```
smd-vital-backend/
├── Dockerfile                # Dockerfile para Backend
├── Dockerfile.prisma         # Dockerfile para Prisma Studio
├── docker-compose.yml        # Orquestación principal
├── docker-compose.dev.yml    # Configuración de desarrollo
├── scripts/
│   ├── start-all.sh          # Script para todos los servicios
│   ├── start-backend.sh      # Script solo backend
│   └── start-prisma.sh       # Script solo Prisma Studio
└── DOCKER_PRISMA_GUIDE.md    # Esta guía
```

## 🎯 Casos de Uso

### Desarrollo
- Usa `docker-compose --profile dev up` para tener todo funcionando
- Accede a Prisma Studio en http://localhost:5555
- Modifica datos directamente desde la interfaz web
- Cada servicio tiene su propio contenedor independiente

### Producción
- Solo el backend se ejecuta (sin Prisma Studio)
- Prisma Studio solo para administración ocasional
- Usa `docker-compose up postgres redis backend`

### Debugging
- Usa `docker-compose exec backend sh` para acceder al contenedor backend
- Usa `docker-compose exec prisma-studio sh` para acceder al contenedor Prisma
- Ejecuta comandos Prisma directamente en cualquiera de los contenedores

## ⚠️ Notas Importantes

1. **Seguridad**: Prisma Studio no debe ejecutarse en producción
2. **Modularidad**: Cada servicio tiene su propio contenedor independiente
3. **Logs**: Usa `docker-compose logs -f` para ver logs de todos los servicios
4. **Datos**: Los datos persisten en volúmenes Docker
5. **Profiles**: Prisma Studio usa el profile `dev` para no ejecutarse en producción
