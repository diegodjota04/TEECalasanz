import bcrypt from 'bcryptjs';

const password = 'Tribunal2026!Master';
const hash = bcrypt.hashSync(password, 10);
const match = bcrypt.compareSync(password, hash);

console.log('--- TEST BCRYPT ---');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('Match:', match ? '✅ ÉXITO (COINCIDE)' : '❌ ERROR (NO COINCIDE)');

const tablePass = 'Mesa1#SumaMish';
const hashTable = bcrypt.hashSync(tablePass, 10);
const matchTable = bcrypt.compareSync(tablePass, hashTable);
console.log('Table Password:', tablePass);
console.log('Table Hash:', hashTable);
console.log('Table Match:', matchTable ? '✅ ÉXITO' : '❌ ERROR');
