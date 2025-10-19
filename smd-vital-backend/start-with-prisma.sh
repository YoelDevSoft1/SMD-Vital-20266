#!/bin/bash

# Script para iniciar el backend con Prisma Studio
# Este script inicia tanto el servidor backend como Prisma Studio

echo "🚀 Iniciando SMD Vital Backend con Prisma Studio..."

# Función para manejar la terminación del script
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $PRISMA_PID 2>/dev/null
    exit 0
}

# Configurar trap para manejar Ctrl+C
trap cleanup SIGINT SIGTERM

# Verificar que la base de datos esté disponible
echo "🔍 Verificando conexión a la base de datos..."
npx prisma db push --accept-data-loss

# Iniciar el servidor backend en segundo plano
echo "🌐 Iniciando servidor backend en puerto 3000..."
node dist/index.js &
BACKEND_PID=$!

# Esperar un momento para que el backend se inicie
sleep 3

# Iniciar Prisma Studio en segundo plano
echo "🎨 Iniciando Prisma Studio en puerto 5555..."
npx prisma studio --port 5555 --browser none &
PRISMA_PID=$!

echo "✅ Servicios iniciados:"
echo "   - Backend API: http://localhost:3000"
echo "   - Prisma Studio: http://localhost:5555"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios"

# Esperar a que cualquiera de los procesos termine
wait





