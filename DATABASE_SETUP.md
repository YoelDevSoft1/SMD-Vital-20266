# 🗄️ Configuración de Base de Datos - SMD Vital

## Opción 1: Neon (PostgreSQL) - RECOMENDADA

### 1. Crear cuenta en Neon
- Ve a [neon.tech](https://neon.tech)
- Regístrate con GitHub
- Crea un nuevo proyecto

### 2. Obtener la URL de conexión
```bash
# Ejemplo de DATABASE_URL
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 3. Configurar en Vercel
- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Agrega: `DATABASE_URL` con el valor de Neon

---

## Opción 2: PlanetScale (MySQL)

### 1. Crear cuenta en PlanetScale
- Ve a [planetscale.com](https://planetscale.com)
- Regístrate con GitHub
- Crea una nueva base de datos

### 2. Obtener la URL de conexión
```bash
# Ejemplo de DATABASE_URL para MySQL
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict"
```

---

## Opción 3: Supabase (PostgreSQL)

### 1. Crear cuenta en Supabase
- Ve a [supabase.com](https://supabase.com)
- Regístrate con GitHub
- Crea un nuevo proyecto

### 2. Obtener la URL de conexión
```bash
# Ejemplo de DATABASE_URL
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

---

## Configuración de Redis (Opcional)

### Opción 1: Upstash (Gratis)
- Ve a [upstash.com](https://upstash.com)
- Crea una cuenta
- Crea una base de datos Redis
- Obtén la URL de conexión

### Opción 2: Redis Cloud
- Ve a [redis.com](https://redis.com)
- Crea una cuenta gratuita
- Crea una instancia Redis

---

## Variables de Entorno Necesarias

```bash
# Base de datos principal
DATABASE_URL="postgresql://..."

# Redis (opcional)
REDIS_URL="redis://..."

# JWT
JWT_SECRET="tu_jwt_secret_muy_seguro"
JWT_EXPIRES_IN="7d"

# URLs del frontend
FRONTEND_URL="https://tu-dominio.vercel.app"
ADMIN_URL="https://tu-dominio.vercel.app/admin"
```
