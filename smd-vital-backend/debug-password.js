const bcrypt = require('bcryptjs');

async function debugPassword() {
  const password = 'Password123!';
  
  console.log('🔍 Debugging password hash...\n');
  
  // Hash con 10 rounds (como en el seed)
  const hash10 = await bcrypt.hash(password, 10);
  console.log('Hash con 10 rounds:', hash10);
  
  // Hash con 12 rounds (como en el servicio)
  const hash12 = await bcrypt.hash(password, 12);
  console.log('Hash con 12 rounds:', hash12);
  
  // Verificar con 10 rounds
  const isValid10 = await bcrypt.compare(password, hash10);
  console.log('Verificación con 10 rounds:', isValid10);
  
  // Verificar con 12 rounds
  const isValid12 = await bcrypt.compare(password, hash12);
  console.log('Verificación con 12 rounds:', isValid12);
  
  // Verificar cross-compatibility
  const crossCheck1 = await bcrypt.compare(password, hash10);
  const crossCheck2 = await bcrypt.compare(password, hash12);
  console.log('Cross-check 10->10:', crossCheck1);
  console.log('Cross-check 12->12:', crossCheck2);
}

debugPassword().catch(console.error);

