#!/bin/sh
# Script de inicialización de la base de datos PostgreSQL
# Este script se ejecuta automáticamente cuando se crea el contenedor por primera vez

set -e

echo "🚀 Inicializando base de datos SMD Vital..."

# Esperar a que PostgreSQL esté listo
until pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"; do
  echo "⏳ Esperando a que PostgreSQL esté listo..."
  sleep 2
done

echo "✅ PostgreSQL está listo"

# Crear extensiones si es necesario
echo "📦 Creando extensiones de PostgreSQL..."
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
    -- Habilitar extensiones útiles
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    
    -- Configurar timezone
    SET timezone = 'America/Bogota';
EOSQL

echo "✅ Extensiones creadas"

# Ejecutar migraciones de Prisma si existen
if [ -f "/app/prisma/migrations" ]; then
    echo "🔄 Ejecutando migraciones de Prisma..."
    npx prisma migrate deploy
    echo "✅ Migraciones ejecutadas"
fi

echo "🎉 Inicialización de la base de datos completada"

