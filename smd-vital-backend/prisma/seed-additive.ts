/**
 * seed-additive.ts
 *
 * Script ADITIVO para producción: NO borra datos existentes.
 * Solo añade lo nuevo:
 *  - SUPER_ADMIN si no existe
 *  - requiredRole en los 11 servicios médicos existentes
 *  - ServiceMarginRule para los 11 servicios médicos (con los 3 montos exactos)
 *  - 10 servicios de enfermería nuevos (con sus reglas 30/70)
 *  - 1 usuario AGENT de prueba
 *
 * USO:
 *   npx ts-node prisma/seed-additive.ts
 *
 * Idempotente: se puede correr varias veces sin duplicar.
 */

import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MEDICAL_RULES = [
  { name: 'Control de Signos Vitales',  requiredRole: 'NURSE'  as UserRole, professional: 55000,  agent: 10000, smdVital: 35000 },
  { name: 'Inyectología',               requiredRole: 'NURSE'  as UserRole, professional: 50000,  agent: 10000, smdVital: 35000 },
  { name: 'Lavado de Oídos',            requiredRole: 'NURSE'  as UserRole, professional: 82500,  agent: 12500, smdVital: 45000 },
  { name: 'Cura de Heridas',            requiredRole: 'NURSE'  as UserRole, professional: 92500,  agent: 12500, smdVital: 45000 },
  { name: 'Sutura',                     requiredRole: 'DOCTOR' as UserRole, professional: 102500, agent: 12500, smdVital: 35000 },
  { name: 'Retiro de Puntos',           requiredRole: 'NURSE'  as UserRole, professional: 55000,  agent: 10000, smdVital: 35000 },
  { name: 'Sueroterapia',               requiredRole: 'NURSE'  as UserRole, professional: 127500, agent: 12500, smdVital: 45000 },
  { name: 'Suero de Hidratación',       requiredRole: 'NURSE'  as UserRole, professional: 92500,  agent: 12500, smdVital: 45000 },
  { name: 'Terapia Respiratoria',       requiredRole: 'NURSE'  as UserRole, professional: 70000,  agent: 10000, smdVital: 35000 },
  { name: 'Cambio de Sonda',            requiredRole: 'NURSE'  as UserRole, professional: 90000,  agent: 10000, smdVital: 35000 },
  { name: 'Retiro de Sonda',            requiredRole: 'NURSE'  as UserRole, professional: 62500,  agent: 12500, smdVital: 45000 },
];

const NURSING_SERVICES_NEW = [
  { name: 'Acompañamiento a Citas (1h)', basePrice: 20000,  duration: 60,   professional: 10000,  category: 'NURSING' as ServiceCategory, description: 'Acompañamiento del paciente a citas médicas por 1 hora' },
  { name: 'Turno de Enfermería 4h',      basePrice: 80000,  duration: 240,  professional: 40000,  category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 4 horas estándar' },
  { name: 'Turno de Enfermería 6h',      basePrice: 115000, duration: 360,  professional: 60000,  category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 6 horas' },
  { name: 'Turno de Enfermería 8h Diurno',     basePrice: 145000, duration: 480,  professional: 90000,  category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 8 horas diurnas' },
  { name: 'Turno de Enfermería 12h Diurno',    basePrice: 180000, duration: 720,  professional: 110000, category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 12 horas diurnas' },
  { name: 'Turno de Enfermería 12h Nocturno',  basePrice: 210000, duration: 720,  professional: 140000, category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 12 horas nocturnas' },
  { name: 'Turno de Enfermería 24h',           basePrice: 360000, duration: 1440, professional: 240000, category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 24 horas' },
  { name: 'Turno de Enfermería 8h Festivo',    basePrice: 190000, duration: 480,  professional: 90000,  category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 8 horas en día festivo' },
  { name: 'Turno de Enfermería 12h Festivo',   basePrice: 250000, duration: 720,  professional: 110000, category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 12 horas en día festivo' },
  { name: 'Turno de Enfermería 24h Festivo',   basePrice: 460000, duration: 1440, professional: 240000, category: 'NURSING' as ServiceCategory, description: 'Turno de enfermería domiciliario de 24 horas en día festivo' },
];

function nursingSplit(basePrice: number, professional: number) {
  const margen = basePrice - professional;
  const agent = Math.round(margen * 0.30);
  const smdVital = margen - agent;
  return { agent, smdVital };
}

async function main() {
  console.log('🌱 Seed ADITIVO (no destructivo) para producción...\n');

  // 1) SUPER_ADMIN si no existe
  console.log('👤 Verificando SUPER_ADMIN...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  let superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
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
    console.log(`   ✓ Creado: ${superAdmin.email}`);
  } else {
    console.log(`   ✓ Ya existe: ${superAdmin.email}`);
  }

  // 2) AGENT de prueba si no existe
  console.log('📞 Verificando AGENT de prueba...');
  const existingAgent = await prisma.user.findUnique({ where: { email: 'agente@smdvital.com' } });
  if (!existingAgent) {
    await prisma.user.create({
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
    console.log(`   ✓ Agente creado: agente@smdvital.com`);
  } else {
    console.log(`   ✓ Ya existe: agente@smdvital.com`);
  }

  // 3) Reglas para los 11 servicios médicos existentes
  console.log('\n🏥 Sincronizando reglas de servicios médicos...');
  let medCreated = 0;
  let medUpdated = 0;
  for (const rule of MEDICAL_RULES) {
    const service = await prisma.service.findFirst({ where: { name: rule.name } });
    if (!service) {
      console.log(`   ⚠️  Servicio "${rule.name}" no existe, saltando...`);
      continue;
    }

    // Update requiredRole (default DOCTOR, ahora explícito)
    if (!service.requiredRole || service.requiredRole !== rule.requiredRole) {
      await prisma.service.update({
        where: { id: service.id },
        data: { requiredRole: rule.requiredRole },
      });
    }

    // Upsert de la regla
    const existingRule = await prisma.serviceMarginRule.findUnique({
      where: { serviceId: service.id },
    });

    if (!existingRule) {
      await prisma.serviceMarginRule.create({
        data: {
          serviceId: service.id,
          professionalAmount: rule.professional,
          agentAmount: rule.agent,
          smdVitalAmount: rule.smdVital,
          requiredRole: rule.requiredRole,
          createdById: superAdmin.id,
        },
      });
      medCreated++;
    } else {
      await prisma.serviceMarginRule.update({
        where: { serviceId: service.id },
        data: {
          professionalAmount: rule.professional,
          agentAmount: rule.agent,
          smdVitalAmount: rule.smdVital,
          requiredRole: rule.requiredRole,
        },
      });
      medUpdated++;
    }
  }
  console.log(`   ✓ ${medCreated} reglas creadas, ${medUpdated} actualizadas`);

  // 4) 10 servicios de enfermería nuevos (idempotente)
  console.log('\n🩺 Creando 10 servicios de enfermería (si no existen)...');
  let nursCreated = 0;
  let nursSkipped = 0;
  for (const s of NURSING_SERVICES_NEW) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) {
      nursSkipped++;
      continue;
    }
    const split = nursingSplit(s.basePrice, s.professional);
    await prisma.service.create({
      data: {
        name: s.name,
        description: s.description,
        category: s.category,
        basePrice: s.basePrice,
        duration: s.duration,
        requiredRole: 'NURSE',
        marginRule: {
          create: {
            professionalAmount: s.professional,
            agentAmount: split.agent,
            smdVitalAmount: split.smdVital,
            requiredRole: 'NURSE',
            createdById: superAdmin.id,
          },
        },
      },
    });
    nursCreated++;
  }
  console.log(`   ✓ ${nursCreated} servicios creados, ${nursSkipped} ya existían`);

  // 5) Resumen final
  const totalServices = await prisma.service.count();
  const totalRules = await prisma.serviceMarginRule.count();
  const totalAgents = await prisma.user.count({ where: { role: 'AGENT' } });

  console.log('\n✨ ¡Seed aditivo completado!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen final de la BD:');
  console.log(`   🏥 Servicios totales: ${totalServices}`);
  console.log(`   💰 Reglas de margen: ${totalRules}`);
  console.log(`   📞 Agentes: ${totalAgents}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  IMPORTANTE: este script no aplicó la migration.');
  console.log('   Si las tablas nuevas no existen, ejecuta primero:');
  console.log('   npx prisma migrate deploy');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed aditivo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
