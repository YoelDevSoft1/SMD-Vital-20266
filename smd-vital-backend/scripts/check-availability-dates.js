const { Client } = require('pg');

async function checkAvailabilityDates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(
    `SELECT id, "doctorId", date, "startTime", "endTime", 
            date::text as date_raw,
            NOW() as now,
            NOW() at time zone 'America/Caracas' as now_local
     FROM doctor_availabilities 
     WHERE "doctorId" = 'cmr6n8ko10005d4buqy080fo1'
     ORDER BY date, "startTime"`
  );

  console.log('Disponibilidad del doctor Omar:');
  result.rows.forEach(r => {
    console.log(`  ID: ${r.id}`);
    console.log(`  date (raw): ${r.date_raw}`);
    console.log(`  date (parsed): ${r.date}`);
    console.log(`  Horario: ${r.startTime} - ${r.endTime}`);
    console.log('  ---');
  });

  console.log('\nZona horaria actual:', new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));
  console.log('UTC now:', new Date().toISOString());

  await client.end();
  process.exit(0);
}

checkAvailabilityDates().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
