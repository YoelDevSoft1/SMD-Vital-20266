#!/bin/bash

# Script para iniciar solo Prisma Studio en el contenedor
# Útil para desarrollo cuando el backend ya está ejecutándose

echo "🎨 Iniciando Prisma Studio en puerto 5555..."

# Verificar que la base de datos esté disponible
echo "🔍 Verificando conexión a la base de datos..."
npx prisma db push --accept-data-loss

# Iniciar Prisma Studio
echo "✅ Prisma Studio iniciado en http://localhost:5555"
npx prisma studio --port 5555 --browser none



