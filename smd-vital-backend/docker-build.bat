@echo off
REM Script para construir y ejecutar el proyecto SMD Vital Backend con Docker en Windows
REM Este script evita conflictos con otros proyectos Docker

setlocal enabledelayedexpansion

echo [INFO] Construyendo proyecto SMD Vital Backend...

REM Verificar que Docker esté instalado
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no está instalado. Por favor instala Docker primero.
    exit /b 1
)

REM Verificar que Docker Compose esté instalado
where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose no está instalado. Por favor instala Docker Compose primero.
    exit /b 1
)

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Cargar variables de entorno si existe el archivo .env.docker
if exist ".env.docker" (
    echo [INFO] Cargando variables de entorno desde .env.docker
    for /f "usebackq tokens=1,* delims==" %%a in (".env.docker") do (
        set "%%a=%%b"
    )
)

REM Construir imágenes
echo [INFO] Construyendo imágenes Docker...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Error al construir las imágenes Docker
    exit /b 1
)

REM Crear red si no existe
echo [INFO] Creando red Docker...
docker network create smdvital_network 2>nul

REM Iniciar servicios
echo [INFO] Iniciando servicios...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Error al iniciar los servicios
    exit /b 1
)

REM Esperar a que los servicios estén listos
echo [INFO] Esperando a que los servicios estén listos...
timeout /t 10 /nobreak >nul

REM Verificar estado de los servicios
echo [INFO] Verificando estado de los servicios...
docker-compose ps

REM Mostrar logs
echo [INFO] Mostrando logs (últimas 50 líneas)...
docker-compose logs --tail=50

echo [INFO] Proyecto construido y ejecutándose
echo [INFO] Backend API: http://localhost:3000
echo [INFO] Swagger Docs: http://localhost:3000/api/docs
echo [INFO] Health Check: http://localhost:3000/health
echo [INFO] PostgreSQL: localhost:5433
echo [INFO] Redis: localhost:6380
echo [INFO] Prisma Studio: http://localhost:5556 (perfil: dev)
echo [INFO] Prometheus: http://localhost:9091 (perfil: monitoring)
echo [INFO] Grafana: http://localhost:3002 (perfil: monitoring)
echo.
echo [INFO] Para ver logs en tiempo real: docker-compose logs -f
echo [INFO] Para detener servicios: docker-compose down
echo [INFO] Para reconstruir: docker-build.bat

endlocal

