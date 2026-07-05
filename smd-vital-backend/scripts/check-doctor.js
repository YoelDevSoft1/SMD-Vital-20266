const { Client } = require('pg');

async function checkDoctor() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // Buscar usuario Omar
  const user = await client.query(
    `SELECT id, email, "firstName", "lastName", role FROM users WHERE email = $1`,
    ['omar@smdvitalbogota.com']
  );

  if (user.rows.length === 0) {
    console.log('✗ Usuario no encontrado');
    await client.end();
    return;
  }

  console.log('Usuario:', user.rows[0]);

  // Buscar doctor asociado
  const doctor = await client.query(
    `SELECT id, "userId", specialty, "isAvailable" FROM doctors WHERE "userId" = $1`,
    [user.rows[0].id]
  );

  if (doctor.rows.length === 0) {
    console.log('✗ No hay registro de doctor para este usuario');
  } else {
    console.log('Doctor:', doctor.rows[0]);

    // Buscar disponibilidad para hoy
    const today = '2026-07-04';
    const availability = await client.query(
      `SELECT id, "doctorId", date, "startTime", "endTime", "isActive" 
       FROM doctor_availabilities 
       WHERE "doctorId" = $1 AND date::text LIKE $2`,
      [doctor.rows[0].id, today + '%']
    );

    console.log('\nDisponibilidad para', today + ':');
    if (availability.rows.length === 0) {
      console.log('  (ninguna)');
    } else {
      availability.rows.forEach(a => {
        console.log(`  - ${a.startTime} a ${a.endTime} (active: ${a.isActive})`);
      });
    }
  }

  await client.end();
  process.exit(0);
}

checkDoctor().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
