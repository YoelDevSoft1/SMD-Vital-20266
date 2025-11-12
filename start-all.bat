@echo off
REM Script para iniciar todo el proyecto SMD Vital (Backend + Panel Admin) en Windows

echo [INFO] Iniciando SMD Vital - Sistema Completo
echo ==========================================

REM Verificar Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no está instalado. Por favor instala Docker primero.
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose no está instalado. Por favor instala Docker Compose primero.
    exit /b 1
)

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Crear red Docker si no existe
echo [INFO] Verificando red Docker...
docker network ls | findstr "smdvital_network" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Creando red smdvital_network...
    docker network create smdvital_network 2>nul
    echo [SUCCESS] Red creada
) else (
    echo [SUCCESS] Red ya existe
)

REM Construir e iniciar servicios
echo [INFO] Construyendo e iniciando servicios...
docker-compose -f docker-compose.full.yml up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Error al iniciar los servicios
    exit /b 1
)

REM Esperar a que los servicios estén listos
echo [INFO] Esperando a que los servicios estén listos...
timeout /t 10 /nobreak >nul

REM Verificar estado de los servicios
echo [INFO] Verificando estado de los servicios...
docker-compose -f docker-compose.full.yml ps

REM Mostrar logs iniciales
echo [INFO] Mostrando logs iniciales...
docker-compose -f docker-compose.full.yml logs --tail=20

echo.
echo [SUCCESS] Sistema SMD Vital iniciado correctamente
echo.
echo [INFO] Servicios disponibles:
echo    Panel Admin:     http://localhost:5174
echo    Backend API:     http://localhost:3000
echo    Swagger Docs:    http://localhost:3000/api/docs
echo    Health Check:    http://localhost:3000/health
echo    Prisma Studio:   http://localhost:5556 (perfil: dev)
echo.
echo [INFO] Comandos útiles:
echo    Ver logs:          docker-compose -f docker-compose.full.yml logs -f
echo    Detener servicios: docker-compose -f docker-compose.full.yml down
echo    Reiniciar:         docker-compose -f docker-compose.full.yml restart
echo.

endlocal

