const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de usuarios: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Verificado: ${user.isVerified ? '✅' : '❌'}`);
      console.log(`   Creado: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Verificar específicamente los admins
    const admins = users.filter(user => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    console.log(`👑 Administradores encontrados: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

