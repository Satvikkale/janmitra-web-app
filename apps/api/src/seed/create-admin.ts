import * as argon2 from 'argon2';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/user.schema';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken(User.name));

  try {
    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ 
      email: 'admin@janmitra.com' 
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@janmitra.com');
      console.log('You can login with the existing credentials.');
      return;
    }

    // Create admin user
    const passwordHash = await argon2.hash('admin123');
    const adminUser = await userModel.create({
      name: 'Admin User',
      email: 'admin@janmitra.com',
      phone: '+1234567890',
      passwordHash,
      roles: ['platform_admin', 'admin']
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@janmitra.com');
    console.log('🔒 Password: admin123');
    console.log('👤 Roles: platform_admin, admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 You can now login to the admin dashboard!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await app.close();
  }
}

createAdminUser();