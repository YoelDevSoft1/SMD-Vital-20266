#!/bin/bash

# Script para iniciar todos los servicios incluyendo Prisma Studio
echo "🚀 Iniciando todos los servicios de SMD Vital..."

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose. Por favor inicia Docker Desktop."
    exit 1
fi

# Iniciar todos los servicios
echo "🌐 Iniciando: PostgreSQL, Redis, Backend, Nginx, Prometheus, Grafana y Prisma Studio"
docker-compose --profile dev up

