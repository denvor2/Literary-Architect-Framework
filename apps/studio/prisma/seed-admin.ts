import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'denvor2@gmail.com';
  const password = '127273';
  
  // Simple hash (in production use bcrypt)
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
  // Create or update user
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', passwordHash },
    create: {
      email,
      passwordHash,
      role: 'admin'
    }
  });
  
  console.log('✓ Админ:', user.email, '(role: admin)');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
