const { Client } = require('pg');

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%user%'
  `);

  console.log('Tablas relacionadas con user:');
  result.rows.forEach(r => console.log(' -', r.table_name));

  await client.end();
  process.exit(0);
}

checkTables().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
