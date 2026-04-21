import { PrismaClient, ServiceCategory } from '@prisma/client';

const prisma = new PrismaClient();

const localUsers = [
  {
    email: 'superadmin@smdvital.com',
    phone: '+573001234567',
    password: '$2a$10$bwWZtSfkQ0hFs91Mi0x4XuGrjMrvRCegmAZzEIdsjP5WIqCHdUZIq',
    firstName: 'Super',
    lastName: 'Administrador',
    role: 'SUPER_ADMIN' as const,
    isActive: true,
    isVerified: true,
    isPlaceholder: false,
    admin: { level: 'SUPER_ADMIN' as const },
  },
  {
    email: 'omar@smdvitalbogota.com',
    phone: '+573026638454',
    password: '$2a$12$7Ydc3dK3T6475tLU/DQEGeCCMSwPXusbOCE9Ih92B0oycHVoCObN.',
    firstName: 'Omar',
    lastName: 'Laya',
    role: 'DOCTOR' as const,
    isActive: true,
    isVerified: true,
    isPlaceholder: false,
    doctor: {
      licenseNumber: 'C.P 6284028',
      specialty: 'Medicina General',
      experience: 5,
      rating: 0,
      totalReviews: 0,
      isAvailable: true,
      consultationFee: 0,
      bio: '',
      education: null,
      certifications: null,
      languages: [] as string[],
      serviceAreas: [] as string[],
      logoPath: null,
      signaturePath: null,
    },
  },
  {
    email: '1022366124@paciente.smdvital.temp',
    phone: '+573125290625',
    password: '$2a$12$iYswWFuTC1.sOHc7cZEMyOSh0a1PoJJ4Y0ts5A/7BuFUCnOIKZF2S',
    firstName: 'Cesar Felipe',
    lastName: 'Fajardo Ortiz',
    role: 'PATIENT' as const,
    isActive: true,
    isVerified: true,
    isPlaceholder: true,
    patient: {
      dateOfBirth: null,
      gender: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      emergencyContact: null,
      emergencyPhone: null,
      medicalHistory: null,
      allergies: null,
      medications: null,
      insuranceNumber: '1022366124',
      insuranceProvider: null,
    },
  },
];

const localServices = [
  {
    name: 'Cambio de Sonda',
    description: 'Cambio de sonda vesical o nasogástrica por personal médico calificado',
    category: 'NURSING' as ServiceCategory,
    basePrice: 135000,
    duration: 30,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Control de Signos Vitales',
    description: 'Medición de presión arterial, temperatura, pulso y saturación de oxígeno a domicilio',
    category: 'NURSING' as ServiceCategory,
    basePrice: 100000,
    duration: 20,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Cura de Heridas',
    description: 'Limpieza, desinfección y curación profesional de heridas y úlceras',
    category: 'NURSING' as ServiceCategory,
    basePrice: 150000,
    duration: 30,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Inyectología',
    description: 'Administración de medicamentos inyectables (IM, IV, SC) en la comodidad del hogar',
    category: 'NURSING' as ServiceCategory,
    basePrice: 95000,
    duration: 20,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Lavado de Oídos',
    description: 'Irrigación y limpieza profesional de conductos auditivos',
    category: 'NURSING' as ServiceCategory,
    basePrice: 140000,
    duration: 30,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Retiro de Puntos',
    description: 'Retiro de puntos de sutura de forma segura y profesional',
    category: 'NURSING' as ServiceCategory,
    basePrice: 100000,
    duration: 20,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Retiro de Sonda',
    description: 'Retiro seguro de sonda vesical o nasogástrica a domicilio',
    category: 'NURSING' as ServiceCategory,
    basePrice: 120000,
    duration: 20,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Suero de Hidratación',
    description: 'Hidratación intravenosa para pacientes con deshidratación o debilidad',
    category: 'NURSING' as ServiceCategory,
    basePrice: 150000,
    duration: 45,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Sueroterapia',
    description: 'Administración de sueros y terapia intravenosa domiciliaria',
    category: 'NURSING' as ServiceCategory,
    basePrice: 185000,
    duration: 45,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Sutura',
    description: 'Cierre de heridas con sutura por médico especializado a domicilio',
    category: 'NURSING' as ServiceCategory,
    basePrice: 150000,
    duration: 45,
    isActive: true,
    requirements: null,
  },
  {
    name: 'Terapia Respiratoria',
    description: 'Nebulizaciones y tratamiento domiciliario para afecciones respiratorias',
    category: 'THERAPY' as ServiceCategory,
    basePrice: 115000,
    duration: 45,
    isActive: true,
    requirements: null,
  },
];

async function ensureUsers() {
  for (const localUser of localUsers) {
    const user = await prisma.user.upsert({
      where: { email: localUser.email },
      update: {
        phone: localUser.phone,
        password: localUser.password,
        firstName: localUser.firstName,
        lastName: localUser.lastName,
        role: localUser.role,
        isActive: localUser.isActive,
        isVerified: localUser.isVerified,
        isPlaceholder: localUser.isPlaceholder,
      },
      create: {
        email: localUser.email,
        phone: localUser.phone,
        password: localUser.password,
        firstName: localUser.firstName,
        lastName: localUser.lastName,
        role: localUser.role,
        isActive: localUser.isActive,
        isVerified: localUser.isVerified,
        isPlaceholder: localUser.isPlaceholder,
      },
    });

    if ('admin' in localUser && localUser.admin) {
      await prisma.admin.upsert({
        where: { userId: user.id },
        update: { level: localUser.admin.level },
        create: { userId: user.id, level: localUser.admin.level },
      });
    }

    if ('doctor' in localUser && localUser.doctor) {
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: localUser.doctor,
        create: {
          userId: user.id,
          ...localUser.doctor,
        },
      });
    }

    if ('patient' in localUser && localUser.patient) {
      await prisma.patient.upsert({
        where: { userId: user.id },
        update: localUser.patient,
        create: {
          userId: user.id,
          ...localUser.patient,
        },
      });
    }
  }
}

async function ensureServices() {
  for (const localService of localServices) {
    const existing = await prisma.service.findFirst({ where: { name: localService.name } });
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: localService,
      });
      continue;
    }

    await prisma.service.create({ data: localService });
  }
}

async function ensureDoctorAvailability() {
  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: 'omar@smdvitalbogota.com' } },
  });

  if (!doctor) {
    throw new Error('Doctor Omar Laya was not created');
  }

  const date = new Date('2026-04-21T00:00:00.000Z');
  const existing = await prisma.doctorAvailability.findFirst({
    where: {
      doctorId: doctor.id,
      date,
      startTime: '14:00',
      endTime: '20:00',
    },
  });

  if (existing) {
    await prisma.doctorAvailability.update({
      where: { id: existing.id },
      data: { isActive: true, notes: null },
    });
    return;
  }

  await prisma.doctorAvailability.create({
    data: {
      doctorId: doctor.id,
      date,
      startTime: '14:00',
      endTime: '20:00',
      isActive: true,
      notes: null,
    },
  });
}

async function ensureAppointment() {
  const patient = await prisma.patient.findFirst({
    where: { user: { email: '1022366124@paciente.smdvital.temp' } },
  });
  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: 'omar@smdvitalbogota.com' } },
  });
  const service = await prisma.service.findFirst({
    where: { name: 'Lavado de Oídos' },
  });

  if (!patient || !doctor || !service) {
    throw new Error('Missing patient, doctor, or service for seeded appointment');
  }

  await prisma.appointment.upsert({
    where: { id: 'cmo8sl1du0001ohdnjhhbqztg' },
    update: {
      patientId: patient.id,
      doctorId: doctor.id,
      serviceId: service.id,
      status: 'PENDING',
      scheduledAt: new Date('2026-04-21T20:30:00.000Z'),
      duration: 30,
      notes: '',
      diagnosis: '',
      prescription: '',
      totalPrice: 140000,
      address: 'Cra. 67 #65-49',
      city: 'Ciudad Bolívar',
      coordinates: {
        lat: 4.5894563,
        lng: -74.1573449,
      },
      assignedNurseId: null,
      finishedAt: null,
      finishedById: null,
    },
    create: {
      id: 'cmo8sl1du0001ohdnjhhbqztg',
      patientId: patient.id,
      doctorId: doctor.id,
      serviceId: service.id,
      status: 'PENDING',
      scheduledAt: new Date('2026-04-21T20:30:00.000Z'),
      duration: 30,
      notes: '',
      diagnosis: '',
      prescription: '',
      totalPrice: 140000,
      address: 'Cra. 67 #65-49',
      city: 'Ciudad Bolívar',
      coordinates: {
        lat: 4.5894563,
        lng: -74.1573449,
      },
      assignedNurseId: null,
      finishedAt: null,
      finishedById: null,
    },
  });
}

async function main() {
  await ensureUsers();
  await ensureServices();
  await ensureDoctorAvailability();
  await ensureAppointment();

  console.log('Production seed ensured from current local data');
}

main()
  .catch((error) => {
    console.error('Failed to ensure production seed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
