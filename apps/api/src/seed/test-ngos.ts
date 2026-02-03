import * as argon2 from 'argon2';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Org } from '../orgs/orgs.schema';

async function createTestNGOs() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const orgModel = app.get(getModelToken(Org.name));

  try {
    // Check if test NGOs already exist
    const existingNGOs = await orgModel.find({ type: 'NGO' });
    if (existingNGOs.length > 0) {
      console.log(`${existingNGOs.length} NGOs already exist in the database.`);
      return;
    }

    const passwordHash = await argon2.hash('ngo123');

    const testNGOs = [
      {
        name: 'Hope Foundation',
        type: 'NGO',
        subtype: 'Health NGO',
        city: 'Mumbai',
        categories: ['Healthcare', 'Emergency Response'],
        contactPersonName: 'Dr. Rajesh Kumar',
        contactEmail: 'contact@hopefoundation.org',
        contactPhone: '+91-9876543210',
        address: '123 Health Street, Mumbai, Maharashtra',
        registrationNumber: 'NGO001',
        establishedYear: 2015,
        website: 'https://hopefoundation.org',
        passwordHash,
        isVerified: false,
        roles: ['ngo'],
        description: 'We provide healthcare services to underprivileged communities and respond to medical emergencies.',
      },
      {
        name: 'Education First NGO',
        type: 'NGO',
        subtype: 'Education NGO',
        city: 'Delhi',
        categories: ['Education', 'Child Welfare'],
        contactPersonName: 'Ms. Priya Sharma',
        contactEmail: 'info@educationfirst.org',
        contactPhone: '+91-9876543211',
        address: '456 Learning Avenue, Delhi',
        registrationNumber: 'NGO002',
        establishedYear: 2018,
        website: 'https://educationfirst.org',
        passwordHash,
        isVerified: true,
        roles: ['ngo'],
        description: 'Dedicated to providing quality education and supporting child welfare programs.',
      },
      {
        name: 'Green Earth Initiative',
        type: 'NGO',
        subtype: 'Environmental NGO',
        city: 'Bangalore',
        categories: ['Environment', 'Sustainability'],
        contactPersonName: 'Mr. Arjun Patel',
        contactEmail: 'contact@greenearth.org',
        contactPhone: '+91-9876543212',
        address: '789 Eco Park, Bangalore, Karnataka',
        registrationNumber: 'NGO003',
        establishedYear: 2020,
        website: 'https://greenearth.org',
        passwordHash,
        isVerified: false,
        roles: ['ngo'],
        description: 'Working towards environmental conservation and promoting sustainable practices.',
      },
      {
        name: 'Women Empowerment Society',
        type: 'NGO',
        subtype: 'Women Rights NGO',
        city: 'Chennai',
        categories: ['Women Rights', 'Skill Development'],
        contactPersonName: 'Ms. Kavitha Nair',
        contactEmail: 'support@womenempowerment.org',
        contactPhone: '+91-9876543213',
        address: '321 Empowerment Road, Chennai, Tamil Nadu',
        registrationNumber: 'NGO004',
        establishedYear: 2017,
        website: 'https://womenempowerment.org',
        passwordHash,
        isVerified: true,
        roles: ['ngo'],
        description: 'Empowering women through skill development and advocating for women rights.',
      },
      {
        name: 'Rural Development Trust',
        type: 'NGO',
        subtype: 'Rural Development NGO',
        city: 'Pune',
        categories: ['Rural Development', 'Agriculture'],
        contactPersonName: 'Mr. Suresh Patil',
        contactEmail: 'info@ruraldevtrust.org',
        contactPhone: '+91-9876543214',
        address: '654 Village Connect, Pune, Maharashtra',
        registrationNumber: 'NGO005',
        establishedYear: 2019,
        passwordHash,
        isVerified: false,
        roles: ['ngo'],
        description: 'Supporting rural communities through agricultural development and infrastructure improvement.',
      }
    ];

    await orgModel.insertMany(testNGOs);

    console.log('✅ Test NGOs created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Created ${testNGOs.length} test NGOs:`);
    testNGOs.forEach((ngo, index) => {
      console.log(`${index + 1}. ${ngo.name} (${ngo.city}) - ${ngo.isVerified ? 'Verified' : 'Pending'}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 NGO Login credentials: ngo123 (password for all test NGOs)');
    console.log('📧 Use the contact email to login as NGO');

  } catch (error) {
    console.error('❌ Error creating test NGOs:', error);
  } finally {
    await app.close();
  }
}

createTestNGOs();