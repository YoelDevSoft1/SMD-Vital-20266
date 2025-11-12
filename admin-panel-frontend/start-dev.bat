@echo off
REM Script para iniciar el panel de administración en modo desarrollo (Windows)

echo [INFO] Iniciando panel de administración SMD Vital en modo desarrollo...

REM Verificar que Node.js esté instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado. Por favor instala Node.js 18+ primero.
    exit /b 1
)

REM Verificar que npm esté instalado
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm no está instalado. Por favor instala npm primero.
    exit /b 1
)

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar que las dependencias estén instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
)

REM Verificar que el backend esté corriendo
echo [INFO] Verificando conexión con el backend...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Backend está corriendo en http://localhost:3000
) else (
    echo [WARNING] Backend no está respondiendo en http://localhost:3000
    echo [WARNING] Asegúrate de que el backend esté corriendo antes de iniciar el panel
    echo [INFO] Ejecuta: cd ..\smd-vital-backend ^&^& npm run dev
)

REM Iniciar servidor de desarrollo
echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] Panel Admin: http://localhost:5173
echo [INFO] Backend API: http://localhost:3000
echo.
echo [INFO] Presiona Ctrl+C para detener el servidor
echo.

npm run dev

