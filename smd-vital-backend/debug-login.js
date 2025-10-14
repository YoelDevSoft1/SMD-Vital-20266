const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    const email = 'admin@smdvital.com';
    const password = 'Password123!';
    
    console.log('🔍 Debugging login process...\n');
    
    // 1. Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Activo: ${user.isActive}`);
    console.log(`   Verificado: ${user.isVerified}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    
    // 2. Verificar si está activo
    if (!user.isActive) {
      console.log('❌ Usuario inactivo');
      return;
    }
    
    // 3. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`\n🔐 Verificación de contraseña: ${isPasswordValid ? '✅' : '❌'}`);
    
    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta');
      
      // Debug adicional
      const testHash = await bcrypt.hash(password, 10);
      const testCompare = await bcrypt.compare(password, testHash);
      console.log(`Test hash: ${testHash.substring(0, 20)}...`);
      console.log(`Test compare: ${testCompare}`);
    } else {
      console.log('✅ Login exitoso');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();

