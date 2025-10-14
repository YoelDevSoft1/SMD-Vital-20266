# 🔐 Instrucciones de Registro - Panel de Administración SMD Vital

## ✅ ¡Sistema de Registro Implementado!

He agregado completamente la funcionalidad de registro al panel de administración. Ahora puedes crear cuentas de administrador y acceder al sistema.

## 🚀 Cómo Usar el Sistema de Registro

### 1. **Acceder al Registro**
- Ve a `http://localhost:5173/register`
- O haz clic en "Crear cuenta de administrador" en la página de login

### 2. **Completar el Formulario**
El formulario de registro incluye:
- **Nombre y Apellido**: Información personal
- **Email**: Debe ser único en el sistema
- **Teléfono**: Opcional, formato internacional
- **Rol**: 
  - `ADMIN`: Administrador normal
  - `SUPER_ADMIN`: Super administrador con permisos completos
- **Contraseña**: Mínimo 8 caracteres con:
  - Al menos una letra mayúscula
  - Al menos una letra minúscula  
  - Al menos un número
- **Confirmar Contraseña**: Debe coincidir

### 3. **Validaciones Implementadas**
- ✅ Email válido y único
- ✅ Contraseña segura (8+ caracteres, mayúscula, minúscula, número)
- ✅ Confirmación de contraseña
- ✅ Campos requeridos
- ✅ Formato de teléfono (opcional)

### 4. **Después del Registro**
- Se crea automáticamente la cuenta
- Se inicia sesión automáticamente
- Se redirige al dashboard principal
- Se muestra mensaje de bienvenida

## 🔧 Configuración Necesaria

### Variables de Entorno
Crea un archivo `.env` en la carpeta `admin-panel-frontend`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=SMD Vital Admin
VITE_APP_VERSION=1.0.0
```

### Backend
Asegúrate de que el backend esté ejecutándose en `http://localhost:3000` con:
- Base de datos PostgreSQL configurada
- Endpoint `/api/v1/auth/register` disponible
- Validaciones de registro activas

## 📋 Flujo de Usuario

1. **Primera vez**: Usuario va a `/register`
2. **Completa formulario**: Con datos válidos
3. **Registro exitoso**: Se crea cuenta y se inicia sesión
4. **Acceso al panel**: Dashboard principal disponible
5. **Sesiones futuras**: Usar `/login` con las credenciales creadas

## 🎨 Características del Formulario

### Diseño
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Validación en tiempo real
- ✅ Mensajes de error claros
- ✅ Estados de carga
- ✅ Enlace de regreso al login

### Seguridad
- ✅ Validación frontend y backend
- ✅ Contraseñas seguras requeridas
- ✅ Tokens JWT automáticos
- ✅ Sesión persistente

## 🔄 Navegación

### Rutas Disponibles
- `/login` - Iniciar sesión
- `/register` - Crear cuenta nueva
- `/` - Dashboard (requiere autenticación)
- `/users`, `/doctors`, etc. - Páginas del panel

### Enlaces
- Login → "Crear cuenta de administrador" → Register
- Register → "Iniciar sesión" → Login
- Cualquier página → Logout → Login

## 🐛 Solución de Problemas

### Error: "User with this email already exists"
- El email ya está registrado
- Usa otro email o ve a login

### Error: "Password must contain..."
- La contraseña no cumple los requisitos
- Usa al menos 8 caracteres con mayúscula, minúscula y número

### Error: "Network Error"
- El backend no está ejecutándose
- Verifica que esté en `http://localhost:3000`

### Error: "Invalid email format"
- El email no tiene formato válido
- Usa formato: `usuario@dominio.com`

## 🎯 Próximos Pasos

1. **Iniciar el backend**: `cd smd-vital-backend && npm run dev`
2. **Iniciar el frontend**: `cd admin-panel-frontend && npm run dev`
3. **Ir a registro**: `http://localhost:5173/register`
4. **Crear cuenta**: Completar formulario
5. **Explorar panel**: Dashboard y funcionalidades

## 📞 Soporte

Si tienes problemas:
1. Verifica que el backend esté ejecutándose
2. Revisa la consola del navegador para errores
3. Verifica las variables de entorno
4. Asegúrate de que la base de datos esté configurada

---

**¡El sistema de registro está listo para usar! 🎉**

Ahora puedes crear cuentas de administrador y acceder completamente al panel de administración de SMD Vital.
