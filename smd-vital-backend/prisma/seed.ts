import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  console.log('🗑️  Limpiando datos existentes...');
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

  console.log('👤 Creando super admin...');

  await prisma.user.create({
    data: {
      email: 'superadmin@smdvital.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Administrador',
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

  console.log('✅ Super admin creado');

  // CREAR SERVICIOS
  console.log('🏥 Creando servicios...');

  const servicesData = [
    {
      name: 'Control de Signos Vitales',
      description: 'Medición de presión arterial, temperatura, pulso y saturación de oxígeno a domicilio',
      category: 'NURSING',
      basePrice: 100000,
      duration: 20,
    },
    {
      name: 'Inyectología',
      description: 'Administración de medicamentos inyectables (IM, IV, SC) en la comodidad del hogar',
      category: 'NURSING',
      basePrice: 95000,
      duration: 20,
    },
    {
      name: 'Lavado de Oídos',
      description: 'Irrigación y limpieza profesional de conductos auditivos',
      category: 'NURSING',
      basePrice: 140000,
      duration: 30,
    },
    {
      name: 'Cura de Heridas',
      description: 'Limpieza, desinfección y curación profesional de heridas y úlceras',
      category: 'NURSING',
      basePrice: 150000,
      duration: 30,
    },
    {
      name: 'Sutura',
      description: 'Cierre de heridas con sutura por médico especializado a domicilio',
      category: 'NURSING',
      basePrice: 150000,
      duration: 45,
    },
    {
      name: 'Retiro de Puntos',
      description: 'Retiro de puntos de sutura de forma segura y profesional',
      category: 'NURSING',
      basePrice: 100000,
      duration: 20,
    },
    {
      name: 'Sueroterapia',
      description: 'Administración de sueros y terapia intravenosa domiciliaria',
      category: 'NURSING',
      basePrice: 185000,
      duration: 45,
    },
    {
      name: 'Suero de Hidratación',
      description: 'Hidratación intravenosa para pacientes con deshidratación o debilidad',
      category: 'NURSING',
      basePrice: 150000,
      duration: 45,
    },
    {
      name: 'Terapia Respiratoria',
      description: 'Nebulizaciones y tratamiento domiciliario para afecciones respiratorias',
      category: 'THERAPY',
      basePrice: 115000,
      duration: 45,
    },
    {
      name: 'Cambio de Sonda',
      description: 'Cambio de sonda vesical o nasogástrica por personal médico calificado',
      category: 'NURSING',
      basePrice: 135000,
      duration: 30,
    },
    {
      name: 'Retiro de Sonda',
      description: 'Retiro seguro de sonda vesical o nasogástrica a domicilio',
      category: 'NURSING',
      basePrice: 120000,
      duration: 20,
    },
  ];

  const services = [];
  for (const serviceData of servicesData) {
    const service = await prisma.service.create({
      data: {
        ...serviceData,
        category: serviceData.category as any,
      },
    });
    services.push(service);
  }

  console.log(`✅ Creados ${services.length} servicios`);

  console.log('\n✨ ¡Seed completado exitosamente!\n');
  console.log('📊 Resumen:');
  console.log(`   👤 Usuario: superadmin@smdvital.com / Password123!`);
  console.log(`   🏥 Servicios: ${services.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
