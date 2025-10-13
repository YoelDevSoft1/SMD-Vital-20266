# 🔐 Crear Usuario Administrador

## Opción 1: Script de Seed (Recomendado)

### Crear archivo de seed:

**`prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smdvital.com' },
    update: {},
    create: {
      email: 'admin@smdvital.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'SMD Vital',
      phone: '+573001234567',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      admin: {
        create: {
          level: 'SUPER_ADMIN',
        },
      },
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Crear otro admin de prueba
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@smdvital.com' },
    update: {},
    create: {
      email: 'admin2@smdvital.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      phone: '+573009876543',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      admin: {
        create: {
          level: 'ADMIN',
        },
      },
    },
  });

  console.log('✅ Second admin created:', admin2.email);

  // Crear algunos doctores de ejemplo
  const doctor1Password = await bcrypt.hash('Doctor123!', 12);

  const doctor1User = await prisma.user.upsert({
    where: { email: 'doctor1@smdvital.com' },
    update: {},
    create: {
      email: 'doctor1@smdvital.com',
      password: doctor1Password,
      firstName: 'María',
      lastName: 'García',
      phone: '+573001111111',
      role: 'DOCTOR',
      isActive: true,
      isVerified: true,
      doctor: {
        create: {
          licenseNumber: 'MD-001',
          specialty: 'Medicina General',
          experience: 8,
          rating: 4.8,
          totalReviews: 50,
          isAvailable: true,
          consultationFee: 80000,
          bio: 'Doctora con 8 años de experiencia en medicina general',
          languages: ['Español', 'Inglés'],
          serviceAreas: ['Usaquén', 'Chapinero', 'Santa Fe'],
        },
      },
    },
  });

  console.log('✅ Doctor 1 created:', doctor1User.email);

  // Crear algunos pacientes de ejemplo
  const patientPassword = await bcrypt.hash('Patient123!', 12);

  const patient1User = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      password: patientPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+573002222222',
      role: 'PATIENT',
      isActive: true,
      isVerified: true,
      patient: {
        create: {
          dateOfBirth: new Date('1990-05-15'),
          gender: 'MALE',
          address: 'Calle 123 #45-67',
          city: 'Bogotá',
          state: 'Cundinamarca',
          zipCode: '110111',
          emergencyContact: 'María Pérez',
          emergencyPhone: '+573003333333',
        },
      },
    },
  });

  console.log('✅ Patient 1 created:', patient1User.email);

  // Crear servicios de ejemplo
  const services = [
    {
      name: 'Consulta Médica General',
      description: 'Consulta médica general a domicilio con doctor certificado',
      category: 'CONSULTATION',
      basePrice: 80000,
      duration: 60,
      isActive: true,
    },
    {
      name: 'Urgencias 24/7',
      description: 'Atención de urgencias médicas a domicilio las 24 horas',
      category: 'EMERGENCY',
      basePrice: 150000,
      duration: 90,
      isActive: true,
    },
    {
      name: 'Toma de Muestras',
      description: 'Toma de muestras de laboratorio a domicilio',
      category: 'LABORATORY',
      basePrice: 40000,
      duration: 30,
      isActive: true,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  console.log('✅ Services created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('Super Admin: admin@smdvital.com / Admin123!');
  console.log('Admin: admin2@smdvital.com / Admin123!');
  console.log('Doctor: doctor1@smdvital.com / Doctor123!');
  console.log('Patient: patient1@example.com / Patient123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Ejecutar el seed:

```bash
cd smd-vital-backend

# Instalar ts-node si no lo tienes
npm install -D ts-node

# Ejecutar el seed
npx ts-node prisma/seed.ts
```

---

## Opción 2: Usando Prisma Studio (Visual)

```bash
cd smd-vital-backend

# Abrir Prisma Studio
npx prisma studio
```

Esto abre una interfaz web en `http://localhost:5555` donde puedes crear usuarios manualmente.

**Importante:** La contraseña debe estar hasheada con bcrypt.

---

## Opción 3: Script Quick & Dirty

**`smd-vital-backend/create-admin.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@smdvital.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'SMD Vital',
        phone: '+573001234567',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        admin: {
          create: {
            level: 'SUPER_ADMIN',
          },
        },
      },
    });

    console.log('✅ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: Admin123!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
```

**Ejecutar:**

```bash
cd smd-vital-backend
node create-admin.js
```

---

## Opción 4: Endpoint de Registro (Solo Desarrollo)

Agregar temporalmente en `src/index.ts`:

```typescript
// TEMPORAL: Solo para desarrollo
app.post('/api/v1/create-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@smdvital.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'SMD Vital',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        admin: {
          create: {
            level: 'SUPER_ADMIN',
          },
        },
      },
    });

    res.json({ success: true, email: admin.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

Luego hacer:

```bash
curl -X POST http://localhost:3000/api/v1/create-admin
```

**⚠️ IMPORTANTE:** Eliminar este endpoint después de crear el admin!

---

## 📋 Credenciales Creadas

Después de ejecutar el seed (Opción 1), tendrás:

### Super Admin:
- **Email:** admin@smdvital.com
- **Password:** Admin123!
- **Rol:** SUPER_ADMIN

### Admin Regular:
- **Email:** admin2@smdvital.com
- **Password:** Admin123!
- **Rol:** ADMIN

### Doctor de Prueba:
- **Email:** doctor1@smdvital.com
- **Password:** Doctor123!
- **Rol:** DOCTOR

### Paciente de Prueba:
- **Email:** patient1@example.com
- **Password:** Patient123!
- **Rol:** PATIENT

---

## 🎯 Pasos Completos

### 1. Crear el seed file:

```bash
cd smd-vital-backend
```

Crea el archivo `prisma/seed.ts` con el código de arriba.

### 2. Agregar script en package.json:

```json
{
  "scripts": {
    "db:seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 3. Ejecutar seed:

```bash
npm run db:seed
```

### 4. Verificar:

```bash
# Ver usuarios creados
npx prisma studio
```

### 5. Probar login en el frontend:

```
Email: admin@smdvital.com
Password: Admin123!
```

---

## 🔒 Seguridad

**Para producción:**
- Cambia las contraseñas por defecto
- Usa variables de entorno para credenciales
- Nunca commites contraseñas al repo
- Usa contraseñas fuertes (mínimo 12 caracteres)

---

## 🐛 Troubleshooting

### Error: User already exists
```bash
# Eliminar y recrear usuario
npx prisma studio
# Eliminar el usuario manualmente y ejecutar seed de nuevo
```

### Error: bcrypt not found
```bash
npm install bcryptjs @types/bcryptjs
```

### Error: Prisma client not generated
```bash
npx prisma generate
```

---

¡Ahora ya puedes hacer login en el panel de administración! 🎉
