#!/bin/bash
# Script para iniciar el panel de administración en modo desarrollo

set -e

echo "🚀 Iniciando panel de administración SMD Vital en modo desarrollo..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar que el backend esté corriendo
echo "🔍 Verificando conexión con el backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend está corriendo en http://localhost:3000"
else
    echo "⚠️  Backend no está respondiendo en http://localhost:3000"
    echo "⚠️  Asegúrate de que el backend esté corriendo antes de iniciar el panel"
    echo "⚠️  Ejecuta: cd ../smd-vital-backend && npm run dev"
fi

# Iniciar servidor de desarrollo
echo "🚀 Iniciando servidor de desarrollo..."
echo "📍 Panel Admin: http://localhost:5173"
echo "📚 Backend API: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

npm run dev

