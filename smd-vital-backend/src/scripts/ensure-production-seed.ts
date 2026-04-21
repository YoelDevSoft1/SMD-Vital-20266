import { PrismaClient, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const defaultPassword = 'Password123!';

async function ensureAdminUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  level: 'ADMIN' | 'SUPER_ADMIN';
  password: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.level === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      role: params.level === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.admin.upsert({
    where: { userId: user.id },
    update: { level: params.level },
    create: { userId: user.id, level: params.level },
  });

  return user;
}

async function ensureDoctorUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      role: 'DOCTOR',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      role: 'DOCTOR',
      isActive: true,
      isVerified: true,
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: user.id },
    update: {
      specialty: 'Medicina General',
      isAvailable: true,
      consultationFee: 80000,
    },
    create: {
      userId: user.id,
      licenseNumber: 'MED-001-2020',
      specialty: 'Medicina General',
      experience: 8,
      rating: 4.8,
      totalReviews: 0,
      isAvailable: true,
      consultationFee: 80000,
      bio: 'Medica general con experiencia en atencion domiciliaria.',
      education: 'Universidad Nacional de Colombia',
      certifications: 'Atencion domiciliaria, RCP avanzado',
      languages: ['Espanol'],
      serviceAreas: ['Bogota', 'Suba', 'Usaquen', 'Chapinero'],
    },
  });

  return doctor;
}

async function ensurePatient(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      role: 'PATIENT',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      role: 'PATIENT',
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.patient.upsert({
    where: { userId: user.id },
    update: {
      address: 'Calle 127 #45-23',
      city: 'Bogota',
      state: 'Cundinamarca',
    },
    create: {
      userId: user.id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE',
      address: 'Calle 127 #45-23',
      city: 'Bogota',
      state: 'Cundinamarca',
      emergencyContact: 'Contacto familiar',
      emergencyPhone: '+573209999999',
      allergies: 'Ninguna conocida',
      insuranceProvider: 'Particular',
    },
  });
}

async function ensureService(params: {
  name: string;
  description: string;
  category: ServiceCategory;
  basePrice: number;
  duration: number;
}) {
  const existing = await prisma.service.findFirst({ where: { name: params.name } });
  if (existing) {
    return prisma.service.update({
      where: { id: existing.id },
      data: {
        description: params.description,
        category: params.category,
        basePrice: params.basePrice,
        duration: params.duration,
        isActive: true,
      },
    });
  }

  return prisma.service.create({
    data: {
      name: params.name,
      description: params.description,
      category: params.category,
      basePrice: params.basePrice,
      duration: params.duration,
      isActive: true,
    },
  });
}

async function main() {
  const password = await bcrypt.hash(defaultPassword, 10);

  await ensureAdminUser({
    email: 'superadmin@smdvital.com',
    firstName: 'Super',
    lastName: 'Administrador',
    phone: '+573001234567',
    level: 'SUPER_ADMIN',
    password,
  });

  await ensureAdminUser({
    email: 'asistente@smdvital.com',
    firstName: 'Asistente',
    lastName: 'Agenda',
    phone: '+573000000001',
    level: 'ADMIN',
    password,
  });

  const doctor = await ensureDoctorUser({
    email: 'maria.garcia@smdvital.com',
    firstName: 'Maria',
    lastName: 'Garcia',
    phone: '+573101234567',
    password,
  });

  await ensurePatient({
    email: 'santiago.gomez@email.com',
    firstName: 'Santiago',
    lastName: 'Gomez',
    phone: '+573201234567',
    password,
  });

  const services = await Promise.all([
    ensureService({
      name: 'Control de Signos Vitales',
      description: 'Medicion de presion arterial, temperatura, pulso y saturacion de oxigeno a domicilio',
      category: 'NURSING',
      basePrice: 100000,
      duration: 20,
    }),
    ensureService({
      name: 'Cura de Heridas',
      description: 'Limpieza, desinfeccion y curacion profesional de heridas y ulceras',
      category: 'NURSING',
      basePrice: 150000,
      duration: 30,
    }),
    ensureService({
      name: 'Terapia Respiratoria',
      description: 'Nebulizaciones y tratamiento domiciliario para afecciones respiratorias',
      category: 'THERAPY',
      basePrice: 115000,
      duration: 45,
    }),
  ]);

  for (const service of services) {
    await prisma.doctorService.upsert({
      where: {
        doctorId_serviceId: {
          doctorId: doctor.id,
          serviceId: service.id,
        },
      },
      update: {
        price: service.basePrice,
        isActive: true,
      },
      create: {
        doctorId: doctor.id,
        serviceId: service.id,
        price: service.basePrice,
        isActive: true,
      },
    });
  }

  console.log('Production seed ensured');
}

main()
  .catch((error) => {
    console.error('Failed to ensure production seed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
