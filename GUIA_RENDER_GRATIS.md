# 🚀 Guía Completa de Despliegue GRATIS en Render - SMD Vital

## 📋 Resumen
- **Backend**: Node.js + TypeScript + Prisma + PostgreSQL + Redis
- **Panel Admin**: React + Vite
- **Costo**: 100% GRATIS 🆓
- **Tiempo de despliegue**: 15-20 minutos

---

## 🎯 ¿Por qué Render?

### ✅ Ventajas
- **100% Gratis** para proyectos personales
- PostgreSQL y Redis incluidos
- Despliegue automático desde GitHub
- SSL automático
- CDN incluido
- Sin configuración compleja

### ⚠️ Limitaciones del Plan Gratuito
- Backend se "duerme" después de 15 minutos de inactividad
- Tiempo de arranque: 30-60 segundos
- 750 horas/mes de uso

---

## 📁 Estructura de Archivos Creados

```
render-backend/
├── package.json          # Dependencias del backend
├── render.yaml           # Configuración de Render
├── Dockerfile           # Contenedor Docker
└── env.production       # Variables de entorno

render-admin/
├── package.json          # Dependencias del panel admin
├── render.yaml           # Configuración de Render
└── env.production        # Variables de entorno

deploy-render.sh          # Script de despliegue
```

---

## 🚀 PASOS PARA DESPLEGAR

### **PASO 1: Preparar el Repositorio**

1. **Subir a GitHub** (si no lo has hecho)
   ```bash
   git init
   git add .
   git commit -m "Add Render deployment files"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/smd-vital-2026.git
   git push -u origin main
   ```

### **PASO 2: Crear Cuenta en Render**

1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub
3. Conecta tu cuenta de GitHub

### **PASO 3: Desplegar Base de Datos PostgreSQL**

1. **Crear PostgreSQL**
   - Click en "New +" → "PostgreSQL"
   - **Name**: `smd-vital-db`
   - **Database**: `smd_vital`
   - **User**: `smd_vital_user`
   - **Region**: Oregon (US West)
   - **Plan**: Free
   - Click "Create Database"

2. **Anotar la información de conexión**
   - Host, Port, Database, Username, Password
   - Se usará automáticamente en el backend

### **PASO 4: Desplegar Redis (Opcional)**

1. **Crear Redis**
   - Click en "New +" → "Redis"
   - **Name**: `smd-vital-redis`
   - **Region**: Oregon (US West)
   - **Plan**: Free
   - Click "Create Redis"

### **PASO 5: Desplegar Backend**

1. **Crear Web Service**
   - Click en "New +" → "Web Service"
   - **Connect Repository**: Selecciona tu repositorio
   - **Root Directory**: `render-backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

2. **Configurar Variables de Entorno**
   - **NODE_ENV**: `production`
   - **PORT**: `10000`
   - **DATABASE_URL**: (se conecta automáticamente)
   - **REDIS_URL**: (se conecta automáticamente)
   - **JWT_SECRET**: `tu_jwt_secret_muy_seguro`
   - **JWT_EXPIRES_IN**: `7d`
   - **FRONTEND_URL**: `https://smd-vital-admin.onrender.com`
   - **ADMIN_URL**: `https://smd-vital-admin.onrender.com`

3. **Conectar Base de Datos**
   - En "Environment", click "Link Database"
   - Selecciona `smd-vital-db`

4. **Conectar Redis**
   - En "Environment", click "Link Redis"
   - Selecciona `smd-vital-redis`

5. **Desplegar**
   - Click "Create Web Service"
   - Esperar 5-10 minutos para el despliegue

### **PASO 6: Desplegar Panel de Administración**

1. **Crear Static Site**
   - Click en "New +" → "Static Site"
   - **Connect Repository**: Selecciona tu repositorio
   - **Root Directory**: `render-admin`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `admin-panel-frontend/dist`

2. **Configurar Variables de Entorno**
   - **VITE_API_URL**: `https://tu-backend.onrender.com/api`
   - **VITE_APP_NAME**: `SMD Vital Admin`

3. **Desplegar**
   - Click "Create Static Site"
   - Esperar 3-5 minutos para el despliegue

### **PASO 7: Configurar Migraciones de Base de Datos**

1. **Conectar a la base de datos**
   ```bash
   # En tu máquina local
   cd smd-vital-backend
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **O usar Prisma Studio**
   ```bash
   npx prisma studio
   ```

---

## 🔧 CONFIGURACIÓN ADICIONAL

### **Configurar CORS en el Backend**

Asegúrate de que tu backend permita peticiones desde el panel admin:

```typescript
// En tu archivo de configuración CORS
app.use(cors({
  origin: [
    'https://smd-vital-admin.onrender.com',
    'http://localhost:3000' // Para desarrollo local
  ],
  credentials: true
}));
```

### **Configurar URLs en el Panel Admin**

Actualiza la URL de la API en tu panel de administración:

```typescript
// En admin-panel-frontend/src/services/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'https://tu-backend.onrender.com/api';
```

---

## 🌐 URLs Finales

Una vez desplegado, tendrás:

- **Backend API**: `https://smd-vital-backend.onrender.com`
- **Panel Admin**: `https://smd-vital-admin.onrender.com`
- **Base de datos**: PostgreSQL en Render
- **Cache**: Redis en Render

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Error: "Service is sleeping"**
- **Causa**: El plan gratuito duerme el servicio después de 15 min de inactividad
- **Solución**: La primera petición tardará 30-60 segundos en responder

### **Error de CORS**
```typescript
// Agregar en el backend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### **Error de Base de Datos**
- Verificar que `DATABASE_URL` esté configurada
- Ejecutar migraciones: `npx prisma migrate deploy`

### **Error de Build**
- Verificar que todas las dependencias estén en `package.json`
- Revisar logs de build en Render

---

## 📊 MONITOREO

### **Logs en Tiempo Real**
- Ve a tu servicio en Render
- Click en "Logs" para ver logs en tiempo real

### **Métricas**
- Render proporciona métricas básicas
- Para monitoreo avanzado: Sentry (plan gratuito)

---

## 💡 CONSEJOS ADICIONALES

1. **Usa GitHub Actions** para CI/CD automático
2. **Configura webhooks** para despliegues automáticos
3. **Monitorea el uso** para evitar límites gratuitos
4. **Configura alertas** para errores críticos
5. **Usa variables de entorno** para diferentes configuraciones

---

## 🎉 ¡LISTO!

Tu proyecto SMD Vital estará disponible en:
- **Backend**: `https://smd-vital-backend.onrender.com`
- **Panel Admin**: `https://smd-vital-admin.onrender.com`

### **Próximos Pasos**
1. Configurar dominio personalizado (opcional)
2. Configurar SSL (automático en Render)
3. Configurar monitoreo y analytics
4. Configurar backups automáticos

¡Tu proyecto estará en línea y funcionando! 🚀
