// Add admin user via direct DB connection
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function addAdmin() {
  try {
    const email = 'denvor2@gmail.com';
    const password = 'Admin123';
    
    // Create simple hash (Note: production should use bcrypt)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        passwordHash,
        role: 'admin'
      },
      create: {
        email,
        passwordHash,
        role: 'admin'
      }
    });
    
    console.log('✅ Админ добавлен успешно!');
    console.log('');
    console.log('📧 Email:    denvor2@gmail.com');
    console.log('🔐 Password: Admin123');
    console.log('👤 Role:     admin');
    console.log('');
    console.log('🌐 Откройте http://localhost:3456 и войдите');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addAdmin();
