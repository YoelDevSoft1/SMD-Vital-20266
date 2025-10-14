# 🌱 Instrucciones para Poblar la Base de Datos

## Script de Seed Creado

Se ha creado un script completo de seed que poblará tu base de datos con datos de prueba realistas.

## ✅ Qué se va a crear:

### **Usuarios (12 total)**
- ✅ 1 Super Admin (superadmin@smdvital.com)
- ✅ 1 Admin (admin@smdvital.com)
- ✅ 5 Doctores con diferentes especialidades
- ✅ 3 Pacientes

**Contraseña para todos los usuarios:** `Password123!`

### **Doctores y sus especialidades:**
1. Dra. María García - Medicina General (Lic: MED-001-2020)
2. Dr. Juan Martínez - Cardiología (Lic: MED-002-2018)
3. Dra. Ana López - Pediatría (Lic: MED-003-2019)
4. Dr. Carlos Hernández - Dermatología (Lic: MED-004-2017)
5. Dra. Laura Jiménez - Medicina Interna (Lic: MED-005-2016)

### **Otros datos:**
- ✅ 10 Servicios médicos
- ✅ 30+ Horarios médicos (lunes a sábado para cada doctor)
- ✅ 15+ Servicios médicos (vinculación doctor-servicio)
- ✅ 5 Citas programadas
- ✅ 5 Pagos
- ✅ 3-5 Reseñas
- ✅ 6-9 Historias médicas
- ✅ 3-6 Prescripciones
- ✅ 9+ Notificaciones
- ✅ 8 Configuraciones del sistema

## 📋 Pasos para ejecutar el seed:

### **Opción 1: Ejecutar directamente**

```bash
cd smd-vital-backend
npm run db:seed
```

### **Opción 2: Si necesitas reinstalar dependencias**

```bash
cd smd-vital-backend
npm install
npm run db:seed
```

### **Opción 3: Limpiar y volver a poblar**

El script ya incluye limpieza automática de datos existentes. Si quieres desactivar la limpieza, edita el archivo `prisma/seed.ts` y comenta las líneas de `deleteMany()`.

## ⚠️ IMPORTANTE:

1. **El script BORRARÁ todos los datos existentes** antes de crear los nuevos
2. Si quieres conservar algunos datos, comenta las líneas de limpieza en `prisma/seed.ts`
3. Asegúrate de que la base de datos esté corriendo
4. Verifica que las migraciones de Prisma estén actualizadas:

```bash
npx prisma migrate dev
```

## 🔐 Credenciales de acceso:

### **Super Admin:**
- Email: `superadmin@smdvital.com`
- Password: `Password123!`

### **Admin:**
- Email: `admin@smdvital.com`
- Password: `Password123!`

### **Doctores:**
- maria.garcia@smdvital.com
- juan.martinez@smdvital.com
- ana.lopez@smdvital.com
- carlos.hernandez@smdvital.com
- laura.jimenez@smdvital.com
- Password para todos: `Password123!`

### **Pacientes:**
- santiago.gomez@email.com
- valentina.rojas@email.com
- andres.castro@email.com
- Password para todos: `Password123!`

## 🎯 Después del seed:

1. **Accede al Admin Panel:**
   - Usa las credenciales de superadmin o admin
   - Navega a http://localhost:5555 (Admin Panel Frontend)

2. **Verifica los datos en Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   - Se abrirá en http://localhost:5555

3. **Prueba la API:**
   ```bash
   # Login como admin
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "superadmin@smdvital.com",
       "password": "Password123!"
     }'
   ```

## 🐛 Troubleshooting:

### Error: "Can't reach database server"
```bash
# Verifica que PostgreSQL esté corriendo
docker ps
# O inicia tu base de datos local
```

### Error: "ts-node not found"
```bash
npm install --save-dev ts-node typescript @types/node
```

### Error: "@prisma/client not found"
```bash
npx prisma generate
npm install @prisma/client
```

## 📊 Verificar que todo se creó correctamente:

```bash
# Abrir Prisma Studio
npx prisma studio
```

O ejecuta estas queries para verificar:

```sql
-- Contar usuarios
SELECT COUNT(*) FROM users;

-- Contar doctores
SELECT COUNT(*) FROM doctors;

-- Contar citas
SELECT COUNT(*) FROM appointments;

-- Ver todos los servicios
SELECT * FROM services;
```

## ✨ ¡Listo!

Ahora tu base de datos está completamente poblada con datos de prueba realistas. Puedes empezar a probar todas las funcionalidades del Admin Panel.
