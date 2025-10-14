#!/bin/bash

# Script de despliegue para Render - SMD Vital
echo "🚀 Iniciando despliegue en Render..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Preparando archivos para producción...${NC}"

# Crear directorio de producción
mkdir -p production

# Copiar backend
echo -e "${YELLOW}📦 Copiando backend...${NC}"
cp -r smd-vital-backend/* production/
cp render-backend/package.json production/
cp render-backend/render.yaml production/
cp render-backend/Dockerfile production/

# Copiar panel admin
echo -e "${YELLOW}📦 Copiando panel de administración...${NC}"
mkdir -p production-admin
cp -r admin-panel-frontend/* production-admin/
cp render-admin/package.json production-admin/
cp render-admin/render.yaml production-admin/

echo -e "${GREEN}✅ Archivos preparados para producción${NC}"
echo -e "${YELLOW}📁 Directorios creados:${NC}"
echo "   - production/ (backend)"
echo "   - production-admin/ (panel admin)"

echo -e "${GREEN}🎉 ¡Listo para subir a Render!${NC}"
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "   1. Subir 'production/' como Web Service en Render"
echo "   2. Subir 'production-admin/' como Static Site en Render"
echo "   3. Crear base de datos PostgreSQL en Render"
echo "   4. Crear Redis en Render"
echo "   5. Configurar variables de entorno"

echo -e "${GREEN}🚀 ¡Despliegue completado!${NC}"
