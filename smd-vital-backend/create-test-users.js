const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🌱 Creating test users...');

    // Crear algunos usuarios de prueba
    const users = [
      {
        email: 'test1@example.com',
        password: 'Test123!',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+573001111111',
        role: 'PATIENT',
        isActive: true,
        isVerified: true,
      },
      {
        email: 'test2@example.com',
        password: 'Test123!',
        firstName: 'María',
        lastName: 'García',
        phone: '+573002222222',
        role: 'DOCTOR',
        isActive: true,
        isVerified: true,
      },
      {
        email: 'test3@example.com',
        password: 'Test123!',
        firstName: 'Carlos',
        lastName: 'López',
        phone: '+573003333333',
        role: 'NURSE',
        isActive: true,
        isVerified: false,
      },
      {
        email: 'test4@example.com',
        password: 'Test123!',
        firstName: 'Ana',
        lastName: 'Martínez',
        phone: '+573004444444',
        role: 'PATIENT',
        isActive: false,
        isVerified: true,
      },
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📧 Test credentials:');
    console.log('test1@example.com / Test123! (Patient)');
    console.log('test2@example.com / Test123! (Doctor)');
    console.log('test3@example.com / Test123! (Nurse)');
    console.log('test4@example.com / Test123! (Patient - Inactive)');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
