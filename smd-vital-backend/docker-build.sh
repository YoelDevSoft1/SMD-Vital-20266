#!/bin/bash
# Script para construir y ejecutar el proyecto SMD Vital Backend con Docker
# Este script evita conflictos con otros proyectos Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_info "Construyendo proyecto SMD Vital Backend..."

# Cargar variables de entorno si existe el archivo .env.docker
if [ -f ".env.docker" ]; then
    print_info "Cargando variables de entorno desde .env.docker"
    export $(cat .env.docker | grep -v '^#' | xargs)
fi

# Verificar puertos en uso
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Puerto $port está en uso. Esto puede causar conflictos."
        print_warning "Considera cambiar el puerto en docker-compose.yml o .env.docker"
    fi
}

# Verificar puertos comunes
print_info "Verificando puertos..."
check_port 3000 "Backend"
check_port 5433 "PostgreSQL"
check_port 6380 "Redis"
check_port 5556 "Prisma Studio"
check_port 9091 "Prometheus"
check_port 3002 "Grafana"

# Construir imágenes
print_info "Construyendo imágenes Docker..."
docker-compose build --no-cache

# Crear red si no existe
print_info "Creando red Docker..."
docker network create ${NETWORK_NAME:-smdvital_network} 2>/dev/null || true

# Iniciar servicios
print_info "Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
print_info "Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
print_info "Verificando estado de los servicios..."
docker-compose ps

# Mostrar logs
print_info "Mostrando logs (últimas 50 líneas)..."
docker-compose logs --tail=50

print_info "✅ Proyecto construido y ejecutándose"
print_info "📚 Backend API: http://localhost:${BACKEND_PORT:-3000}"
print_info "📄 Swagger Docs: http://localhost:${BACKEND_PORT:-3000}/api/docs"
print_info "🏥 Health Check: http://localhost:${BACKEND_PORT:-3000}/health"
print_info "🗄️  PostgreSQL: localhost:${POSTGRES_EXTERNAL_PORT:-5433}"
print_info "🔴 Redis: localhost:${REDIS_EXTERNAL_PORT:-6380}"
print_info "🔧 Prisma Studio: http://localhost:${PRISMA_STUDIO_EXTERNAL_PORT:-5556} (perfil: dev)"
print_info "📊 Prometheus: http://localhost:${PROMETHEUS_EXTERNAL_PORT:-9091} (perfil: monitoring)"
print_info "📈 Grafana: http://localhost:${GRAFANA_EXTERNAL_PORT:-3002} (perfil: monitoring)"

print_info ""
print_info "Para ver logs en tiempo real: docker-compose logs -f"
print_info "Para detener servicios: docker-compose down"
print_info "Para reconstruir: ./docker-build.sh"

