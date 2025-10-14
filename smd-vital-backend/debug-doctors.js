const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDoctors() {
  try {
    console.log('🔍 Debugging doctors...');
    
    // Check if there are any doctors
    const doctorCount = await prisma.doctor.count();
    console.log('Total doctors in database:', doctorCount);
    
    if (doctorCount > 0) {
      // Get first doctor with user data
      const firstDoctor = await prisma.doctor.findFirst({
        include: {
          user: true,
          _count: {
            select: {
              appointments: true,
              reviews: true
            }
          }
        }
      });
      
      console.log('First doctor:', JSON.stringify(firstDoctor, null, 2));
    }
    
    // Check users with DOCTOR role
    const doctorUsers = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      take: 3
    });
    
    console.log('Doctor users:', JSON.stringify(doctorUsers, null, 2));
    
  } catch (error) {
    console.error('Error debugging doctors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDoctors();
