@echo off
REM Script para construir y ejecutar el panel de administración SMD Vital con Docker en Windows

setlocal enabledelayedexpansion

echo [INFO] Construyendo panel de administración SMD Vital...

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

REM Cargar variables de entorno si existe el archivo .env
if exist ".env" (
    echo [INFO] Cargando variables de entorno desde .env
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

REM Verificar que la red Docker existe
docker network ls | findstr "smdvital_network" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] La red smdvital_network no existe. Creándola...
    docker network create smdvital_network 2>nul
)

REM Verificar que el backend esté corriendo
docker ps | findstr "smdvital-backend" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] El backend no está corriendo. Asegúrate de que el backend esté iniciado.
    echo [INFO] Ejecuta: cd ..\smd-vital-backend ^&^& docker-compose up -d
)

REM Construir imágenes
echo [INFO] Construyendo imagen Docker...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Error al construir la imagen Docker
    exit /b 1
)

REM Iniciar servicios
echo [INFO] Iniciando servicios...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Error al iniciar los servicios
    exit /b 1
)

REM Esperar a que los servicios estén listos
echo [INFO] Esperando a que los servicios estén listos...
timeout /t 5 /nobreak >nul

REM Verificar estado de los servicios
echo [INFO] Verificando estado de los servicios...
docker-compose ps

REM Mostrar logs
echo [INFO] Mostrando logs (últimas 50 líneas)...
docker-compose logs --tail=50

echo [INFO] Panel de administración construido y ejecutándose
echo [INFO] Panel Admin: http://localhost:5174
echo [INFO] Backend API: http://localhost:3000
echo [INFO] Swagger Docs: http://localhost:3000/api/docs
echo.
echo [INFO] Para ver logs en tiempo real: docker-compose logs -f
echo [INFO] Para detener servicios: docker-compose down
echo [INFO] Para reconstruir: docker-build.bat

endlocal

