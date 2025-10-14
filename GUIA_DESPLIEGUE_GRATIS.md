# 🚀 Guía Completa de Despliegue Gratis - SMD Vital

## 📋 Resumen del Proyecto
- **Frontend**: Astro (sitio web estático)
- **Panel Admin**: React + Vite
- **Backend**: Node.js + TypeScript + Prisma
- **Base de datos**: PostgreSQL
- **Cache**: Redis (opcional)

---

## 🎯 OPCIÓN RECOMENDADA: Vercel + Neon

### ✅ Ventajas
- **100% Gratis** para proyectos personales
- Despliegue automático desde GitHub
- CDN global incluido
- SSL automático
- Base de datos PostgreSQL gratis

---

## 📝 PASOS PARA DESPLEGAR

### **PASO 1: Preparar el Repositorio**

1. **Subir a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/smd-vital-2026.git
   git push -u origin main
   ```

### **PASO 2: Configurar Base de Datos (Neon)**

1. **Crear cuenta en Neon**
   - Ve a [neon.tech](https://neon.tech)
   - Regístrate con GitHub
   - Crea un nuevo proyecto

2. **Obtener URL de conexión**
   - Copia la `DATABASE_URL` de tu proyecto
   - Ejemplo: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### **PASO 3: Desplegar en Vercel**

1. **Crear cuenta en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Regístrate con GitHub

2. **Importar proyecto**
   - Click en "New Project"
   - Selecciona tu repositorio `smd-vital-2026`
   - Vercel detectará automáticamente que es un proyecto Astro

3. **Configurar variables de entorno**
   - Ve a Settings → Environment Variables
   - Agrega las siguientes variables:

   ```bash
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://tu-proyecto.vercel.app
   ADMIN_URL=https://tu-proyecto.vercel.app/admin
   NODE_ENV=production
   ```

4. **Configurar builds**
   - **Root Directory**: `/` (para Astro)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### **PASO 4: Desplegar Panel de Administración**

1. **Crear segundo proyecto en Vercel**
   - Click en "New Project"
   - Selecciona el mismo repositorio
   - **Root Directory**: `admin-panel-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

2. **Configurar dominio personalizado**
   - En el proyecto del panel admin
   - Settings → Domains
   - Agrega: `tu-dominio.vercel.app/admin`

### **PASO 5: Desplegar Backend (API)**

1. **Crear tercer proyecto en Vercel**
   - Click en "New Project"
   - Selecciona el mismo repositorio
   - **Root Directory**: `smd-vital-backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

2. **Configurar como API**
   - Vercel detectará automáticamente que es un proyecto Node.js
   - Las rutas de la API estarán disponibles en: `https://tu-api.vercel.app/api/`

### **PASO 6: Configurar Migraciones de Base de Datos**

1. **Ejecutar migraciones en Neon**
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

### **Configurar CORS**
Asegúrate de que tu backend permita las peticiones desde tu frontend:

```typescript
// En smd-vital-backend/src/index.ts
app.use(cors({
  origin: [
    'https://tu-frontend.vercel.app',
    'https://tu-admin.vercel.app'
  ],
  credentials: true
}));
```

### **Configurar Variables de Entorno en el Frontend**
En tu panel de administración, actualiza la URL de la API:

```typescript
// En admin-panel-frontend/src/services/api.ts
const API_BASE_URL = 'https://tu-api.vercel.app/api';
```

---

## 🌐 OPCIONES ALTERNATIVAS GRATIS

### **Opción 2: Netlify + Railway**
- **Frontend**: Netlify (gratis)
- **Backend**: Railway ($5/mes)
- **Base de datos**: Railway PostgreSQL (incluido)

### **Opción 3: Render (Todo Gratis)**
- **Frontend**: Render Static Site (gratis)
- **Backend**: Render Web Service (gratis con limitaciones)
- **Base de datos**: Render PostgreSQL (gratis)

### **Opción 4: Firebase + Vercel**
- **Frontend**: Vercel (gratis)
- **Backend**: Firebase Functions (gratis)
- **Base de datos**: Firestore (gratis)

---

## 📊 MONITOREO Y MANTENIMIENTO

### **Logs y Monitoreo**
- Vercel proporciona logs automáticos
- Puedes usar Vercel Analytics (gratis)
- Para monitoreo avanzado: Sentry (plan gratuito)

### **Backup de Base de Datos**
- Neon incluye backups automáticos
- Puedes exportar manualmente desde Prisma Studio

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### **Error de CORS**
```typescript
// Agregar en el backend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### **Error de Base de Datos**
- Verificar que `DATABASE_URL` esté correctamente configurada
- Ejecutar migraciones: `npx prisma migrate deploy`

### **Error de Build**
- Verificar que todas las dependencias estén en `package.json`
- Revisar logs de build en Vercel

---

## 🎉 ¡LISTO!

Una vez completados estos pasos, tu proyecto estará disponible en:
- **Sitio web**: `https://tu-proyecto.vercel.app`
- **Panel admin**: `https://tu-proyecto.vercel.app/admin`
- **API**: `https://tu-api.vercel.app/api`

### **Próximos Pasos**
1. Configurar dominio personalizado (opcional)
2. Configurar SSL (automático en Vercel)
3. Configurar monitoreo y analytics
4. Configurar backups automáticos

---

## 💡 CONSEJOS ADICIONALES

1. **Usa GitHub Actions** para CI/CD automático
2. **Configura webhooks** para despliegues automáticos
3. **Usa variables de entorno** para diferentes entornos
4. **Monitorea el uso** para evitar límites gratuitos
5. **Configura alertas** para errores críticos

¡Tu proyecto SMD Vital estará en línea y funcionando! 🚀
