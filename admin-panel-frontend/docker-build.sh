#!/bin/bash
# Script para construir y ejecutar el panel de administración SMD Vital con Docker

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

print_info "Construyendo panel de administración SMD Vital..."

# Cargar variables de entorno si existe el archivo .env
if [ -f ".env" ]; then
    print_info "Cargando variables de entorno desde .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar que la red Docker existe
if ! docker network ls | grep -q "smdvital_network"; then
    print_warning "La red smdvital_network no existe. Creándola..."
    docker network create smdvital_network 2>/dev/null || true
fi

# Verificar que el backend esté corriendo
if ! docker ps | grep -q "smdvital-backend"; then
    print_warning "El backend no está corriendo. Asegúrate de que el backend esté iniciado."
    print_info "Ejecuta: cd ../smd-vital-backend && docker-compose up -d"
fi

# Construir imágenes
print_info "Construyendo imagen Docker..."
docker-compose build --no-cache

# Iniciar servicios
print_info "Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
print_info "Esperando a que los servicios estén listos..."
sleep 5

# Verificar estado de los servicios
print_info "Verificando estado de los servicios..."
docker-compose ps

# Mostrar logs
print_info "Mostrando logs (últimas 50 líneas)..."
docker-compose logs --tail=50

print_info "✅ Panel de administración construido y ejecutándose"
print_info "🌐 Panel Admin: http://localhost:${ADMIN_PANEL_PORT:-5174}"
print_info "📚 Backend API: http://localhost:3000"
print_info "📄 Swagger Docs: http://localhost:3000/api/docs"

print_info ""
print_info "Para ver logs en tiempo real: docker-compose logs -f"
print_info "Para detener servicios: docker-compose down"
print_info "Para reconstruir: ./docker-build.sh"

