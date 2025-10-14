@echo off
echo 🚀 Iniciando despliegue en Render...

echo 📋 Preparando archivos para producción...

REM Crear directorio de producción
if not exist "production" mkdir production
if not exist "production-admin" mkdir production-admin

echo 📦 Copiando backend...
xcopy "smd-vital-backend\*" "production\" /E /I /Y
copy "render-backend\package.json" "production\"
copy "render-backend\render.yaml" "production\"
copy "render-backend\Dockerfile" "production\"
copy "render-backend\env.production" "production\"

echo 📦 Copiando panel de administración...
xcopy "admin-panel-frontend\*" "production-admin\" /E /I /Y
copy "render-admin\package.json" "production-admin\"
copy "render-admin\render.yaml" "production-admin\"
copy "render-admin\env.production" "production-admin\"

echo ✅ Archivos preparados para producción
echo 📁 Directorios creados:
echo    - production\ (backend)
echo    - production-admin\ (panel admin)

echo 🎉 ¡Listo para subir a Render!
echo 📝 Próximos pasos:
echo    1. Subir 'production\' como Web Service en Render
echo    2. Subir 'production-admin\' como Static Site en Render
echo    3. Crear base de datos PostgreSQL en Render
echo    4. Crear Redis en Render
echo    5. Configurar variables de entorno

echo 🚀 ¡Despliegue completado!
pause
