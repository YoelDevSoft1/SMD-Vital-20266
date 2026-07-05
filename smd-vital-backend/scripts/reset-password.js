const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const newPassword = 'Omar2026!';
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  console.log('Nueva contraseña: Omar2026!');
  console.log('Hash:', hashedPassword);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(
    `UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email`,
    [hashedPassword, 'omar@smdvitalbogota.com']
  );

  if (result.rowCount > 0) {
    console.log('✓ Contraseña actualizada para:', result.rows[0].email);
  } else {
    console.log('✗ Usuario no encontrado');
  }

  await client.end();
  process.exit(0);
}

resetPassword().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
