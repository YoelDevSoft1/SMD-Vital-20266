#!/bin/bash

# Script para iniciar solo el backend (sin Prisma Studio)
echo "🌐 Iniciando Backend API..."

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose. Por favor inicia Docker Desktop."
    exit 1
fi

# Iniciar servicios principales (sin Prisma Studio)
echo "🚀 Ejecutando: docker-compose up postgres redis backend"
docker-compose up postgres redis backend

