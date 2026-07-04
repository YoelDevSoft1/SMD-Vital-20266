import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * SMD Vital — Billing Core Seed
 *
 * Reglas:
 *  - 11 servicios médicos con sus 3 montos exactos (lo que diste en la primera tabla)
 *  - 10 servicios de enfermería con regla 30/70 del margen (lo que validaste)
 *  - Usuarios seed: superadmin, 1 doctor, 1 enfermera, 1 agente, 1 paciente
 *
 * 30/70 del margen:
 *    PVP - enfermera = margen
 *    agente = 30% × margen
 *    plataforma = 70% × margen
 */

const MEDICAL_SERVICES = [
  // { name, category, basePrice, duration, professional, agent, smdVital, requiredRole }
  { name: 'Control de Signos Vitales',   category: 'NURSING',    basePrice: 100000, duration: 20, professional: 55000,  agent: 10000, smdVital: 35000, requiredRole: 'NURSE',  description: 'Medición de presión arterial, temperatura, pulso y saturación de oxígeno a domicilio' },
  { name: 'Inyectología',                category: 'NURSING',    basePrice: 95000,  duration: 20, professional: 50000,  agent: 10000, smdVital: 35000, requiredRole: 'NURSE',  description: 'Administración de medicamentos inyectables (IM, IV, SC) en la comodidad del hogar' },
  { name: 'Lavado de Oídos',             category: 'NURSING',    basePrice: 140000, duration: 30, professional: 82500,  agent: 12500, smdVital: 45000, requiredRole: 'NURSE',  description: 'Irrigación y limpieza profesional de conductos auditivos' },
  { name: 'Cura de Heridas',             category: 'NURSING',    basePrice: 150000, duration: 30, professional: 92500,  agent: 12500, smdVital: 45000, requiredRole: 'NURSE',  description: 'Limpieza, desinfección y curación profesional de heridas y úlceras' },
  { name: 'Sutura',                      category: 'SPECIALIST', basePrice: 150000, duration: 45, professional: 102500, agent: 12500, smdVital: 35000, requiredRole: 'DOCTOR', description: 'Cierre de heridas con sutura por médico especializado a domicilio' },
  { name: 'Retiro de Puntos',            category: 'NURSING',    basePrice: 100000, duration: 20, professional: 55000,  agent: 10000, smdVital: 35000, requiredRole: 'NURSE',  description: 'Retiro de puntos de sutura de forma segura y profesional' },
  { name: 'Sueroterapia',                category: 'NURSING',    basePrice: 185000, duration: 45, professional: 127500, agent: 12500, smdVital: 45000, requiredRole: 'NURSE',  description: 'Administración de sueros y terapia intravenosa domiciliaria' },
  { name: 'Suero de Hidratación',        category: 'NURSING',    basePrice: 150000, duration: 45, professional: 92500,  agent: 12500, smdVital: 45000, requiredRole: 'NURSE',  description: 'Hidratación intravenosa para pacientes con deshidratación o debilidad' },
  { name: 'Terapia Respiratoria',        category: 'THERAPY',    basePrice: 115000, duration: 45, professional: 70000,  agent: 10000, smdVital: 35000, requiredRole: 'NURSE',  description: 'Nebulizaciones y tratamiento domiciliario para afecciones respiratorias' },
  { name: 'Cambio de Sonda',             category: 'NURSING',    basePrice: 135000, duration: 30, professional: 90000,  agent: 10000, smdVital: 35000, requiredRole: 'NURSE',  description: 'Cambio de sonda vesical o nasogástrica por personal médico calificado' },
  { name: 'Retiro de Sonda',             category: 'NURSING',    basePrice: 120000, duration: 20, professional: 62500,  agent: 12500, smdVital: 45000, requiredRole: 'NURSE',  description: 'Retiro seguro de sonda vesical o nasogástrica a domicilio' },
];

// Servicios de enfermería con regla 30/70 del margen
// professional = neto que la enfermera le cobra a SMD Vital
// agent = 30% del margen (PVP - professional)
// smdVital = 70% del margen
const NURSING_SERVICES = [
  { name: 'Acompañamiento a Citas (1h)', category: 'NURSING', basePrice: 20000,  duration: 60,  professional: 10000, requiredRole: 'NURSE', description: 'Acompañamiento del paciente a citas médicas por 1 hora' },
  { name: 'Turno de Enfermería 4h',      category: 'NURSING', basePrice: 80000,  duration: 240, professional: 40000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 4 horas estándar' },
  { name: 'Turno de Enfermería 6h',      category: 'NURSING', basePrice: 115000, duration: 360, professional: 60000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 6 horas' },
  { name: 'Turno de Enfermería 8h Diurno',     category: 'NURSING', basePrice: 145000, duration: 480, professional: 90000,  requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 8 horas diurnas' },
  { name: 'Turno de Enfermería 12h Diurno',    category: 'NURSING', basePrice: 180000, duration: 720, professional: 110000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 12 horas diurnas' },
  { name: 'Turno de Enfermería 12h Nocturno',  category: 'NURSING', basePrice: 210000, duration: 720, professional: 140000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 12 horas nocturnas' },
  { name: 'Turno de Enfermería 24h',           category: 'NURSING', basePrice: 360000, duration: 1440, professional: 240000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 24 horas' },
  { name: 'Turno de Enfermería 8h Festivo',    category: 'NURSING', basePrice: 190000, duration: 480, professional: 90000,  requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 8 horas en día festivo' },
  { name: 'Turno de Enfermería 12h Festivo',   category: 'NURSING', basePrice: 250000, duration: 720, professional: 110000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 12 horas en día festivo' },
  { name: 'Turno de Enfermería 24h Festivo',   category: 'NURSING', basePrice: 460000, duration: 1440, professional: 240000, requiredRole: 'NURSE', description: 'Turno de enfermería domiciliario de 24 horas en día festivo' },
];

/** Calcula el split para los servicios de enfermería. */
function nursingSplit(basePrice: number, professional: number) {
  const margen = basePrice - professional;
  const agent = Math.round(margen * 0.30);
  const smdVital = margen - agent; // el resto va a plataforma
  return { agent, smdVital };
}

async function main() {
  console.log('🌱 Iniciando seed SMD Vital (Billing Core)...\n');

  // 1) Limpieza
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.payoutBatchItem.deleteMany();
  await prisma.payoutBatch.deleteMany();
  await prisma.paymentAcknowledgement.deleteMany();
  await prisma.marginSnapshot.deleteMany();
  await prisma.serviceMarginRule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorService.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 2) Super Admin
  console.log('👤 Creando super admin...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@smdvital.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Administrador',
      phone: '+573001234567',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      admin: { create: { level: 'SUPER_ADMIN' } },
    },
  });
  console.log(`   ✓ ${superAdmin.email}`);

  // 3) Admin operativo (para liquidaciones)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@smdvital.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Operativo',
      phone: '+573001234568',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      admin: { create: { level: 'ADMIN' } },
    },
  });

  // 4) Doctor seed
  console.log('👨‍⚕️ Creando doctor seed...');
  const doctorUser = await prisma.user.create({
    data: {
      email: 'doctor@smdvital.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Pérez',
      phone: '+573001234569',
      role: 'DOCTOR',
      isActive: true,
      isVerified: true,
      doctor: {
        create: {
          licenseNumber: 'MP-12345',
          specialty: 'Medicina General',
          experience: 10,
          consultationFee: 80000,
          isAvailable: true,
        },
      },
    },
  });

  // 5) Enfermera seed
  console.log('👩‍⚕️ Creando enfermera seed...');
  const nurseUser = await prisma.user.create({
    data: {
      email: 'enfermera@smdvital.com',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'López',
      phone: '+573001234570',
      role: 'NURSE',
      isActive: true,
      isVerified: true,
    },
  });

  // 6) Agente / Call Center seed
  console.log('📞 Creando agente call center...');
  const agentUser = await prisma.user.create({
    data: {
      email: 'agente@smdvital.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'Castillo',
      phone: '+573001234571',
      role: 'AGENT',
      isActive: true,
      isVerified: true,
    },
  });

  // 7) Paciente seed
  const patientUser = await prisma.user.create({
    data: {
      email: 'paciente@smdvital.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Rodríguez',
      phone: '+573001234572',
      role: 'PATIENT',
      isActive: true,
      isVerified: true,
      patient: { create: { address: 'Calle 100 #15-20', city: 'Bogotá' } },
    },
  });

  // 8) Servicios médicos (11)
  console.log('🏥 Creando 11 servicios médicos con margen...');
  for (const s of MEDICAL_SERVICES) {
    await prisma.service.create({
      data: {
        name: s.name,
        description: s.description,
        category: s.category as ServiceCategory,
        basePrice: s.basePrice,
        duration: s.duration,
        requiredRole: s.requiredRole as UserRole,
        marginRule: {
          create: {
            professionalAmount: s.professional,
            agentAmount: s.agent,
            smdVitalAmount: s.smdVital,
            requiredRole: s.requiredRole as UserRole,
            createdById: superAdmin.id,
          },
        },
      },
    });
  }
  console.log(`   ✓ 11 servicios médicos creados`);

  // 9) Servicios de enfermería (10) con split 30/70
  console.log('🩺 Creando 10 servicios de enfermería (regla 30/70 del margen)...');
  for (const s of NURSING_SERVICES) {
    const split = nursingSplit(s.basePrice, s.professional);
    await prisma.service.create({
      data: {
        name: s.name,
        description: s.description,
        category: s.category as ServiceCategory,
        basePrice: s.basePrice,
        duration: s.duration,
        requiredRole: s.requiredRole as UserRole,
        marginRule: {
          create: {
            professionalAmount: s.professional,
            agentAmount: split.agent,
            smdVitalAmount: split.smdVital,
            requiredRole: s.requiredRole as UserRole,
            createdById: superAdmin.id,
          },
        },
      },
    });
  }
  console.log(`   ✓ 10 servicios de enfermería creados`);

  // 10) Resumen
  const totalServices = await prisma.service.count();
  const totalRules = await prisma.serviceMarginRule.count();

  console.log('\n✨ ¡Seed completado!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen:');
  console.log(`   👥 Usuarios: 6 (superadmin, admin, doctor, enfermera, agente, paciente)`);
  console.log(`   🏥 Servicios: ${totalServices}`);
  console.log(`   💰 Reglas de margen: ${totalRules}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Credenciales (password: Password123!):');
  console.log('   • superadmin@smdvital.com  → SUPER_ADMIN');
  console.log('   • admin@smdvital.com       → ADMIN');
  console.log('   • doctor@smdvital.com      → DOCTOR');
  console.log('   • enfermera@smdvital.com   → NURSE');
  console.log('   • agente@smdvital.com      → AGENT');
  console.log('   • paciente@smdvital.com    → PATIENT');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
