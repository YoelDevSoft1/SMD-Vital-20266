#!/bin/bash

# Script para iniciar solo Prisma Studio
echo "🎨 Iniciando Prisma Studio..."

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose. Por favor inicia Docker Desktop."
    exit 1
fi

# Iniciar Prisma Studio
echo "🚀 Ejecutando: docker-compose up prisma-studio"
docker-compose up prisma-studio



