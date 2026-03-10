import bcrypt from 'bcrypt';

const password = process.argv[2];
if (!password) {
  console.error('Usage: tsx src/scripts/hashPassword.ts <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
