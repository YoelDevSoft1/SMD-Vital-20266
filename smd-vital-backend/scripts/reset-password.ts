import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function resetPassword() {
  const newPassword = 'Omar2026!';
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  console.log('Nueva contraseña:', newPassword);
  console.log('Hash:', hashedPassword);

  const user = await prisma.user.update({
    where: { email: 'omar@smdvitalbogota.com' },
    data: { password: hashedPassword }
  });

  console.log('✓ Contraseña actualizada para:', user.email);
  process.exit(0);
}

resetPassword().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
