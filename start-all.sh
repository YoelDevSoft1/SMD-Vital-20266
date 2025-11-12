#!/bin/bash
# Script para iniciar todo el proyecto SMD Vital (Backend + Panel Admin)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${BLUE}[SUCCESS]${NC} $1"
}

# Directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_info "🚀 Iniciando SMD Vital - Sistema Completo"
print_info "=========================================="

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Crear red Docker si no existe
print_info "🔧 Verificando red Docker..."
if ! docker network ls | grep -q "smdvital_network"; then
    print_info "Creando red smdvital_network..."
    docker network create smdvital_network 2>/dev/null || true
    print_success "Red creada"
else
    print_success "Red ya existe"
fi

# Construir e iniciar servicios
print_info "🏗️  Construyendo e iniciando servicios..."
docker-compose -f docker-compose.full.yml up -d --build

# Esperar a que los servicios estén listos
print_info "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
print_info "📊 Verificando estado de los servicios..."
docker-compose -f docker-compose.full.yml ps

# Mostrar logs iniciales
print_info "📋 Mostrando logs iniciales..."
docker-compose -f docker-compose.full.yml logs --tail=20

print_info ""
print_success "✅ Sistema SMD Vital iniciado correctamente"
print_info ""
print_info "🌐 Servicios disponibles:"
print_info "   📱 Panel Admin:     http://localhost:5174"
print_info "   🔌 Backend API:     http://localhost:3000"
print_info "   📚 Swagger Docs:    http://localhost:3000/api/docs"
print_info "   🏥 Health Check:    http://localhost:3000/health"
print_info "   🔧 Prisma Studio:   http://localhost:5556 (perfil: dev)"
print_info ""
print_info "📊 Comandos útiles:"
print_info "   Ver logs:          docker-compose -f docker-compose.full.yml logs -f"
print_info "   Detener servicios: docker-compose -f docker-compose.full.yml down"
print_info "   Reiniciar:         docker-compose -f docker-compose.full.yml restart"
print_info ""

