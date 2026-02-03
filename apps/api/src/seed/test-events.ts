import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Event } from '../events/event.schema';
import { Org } from '../orgs/orgs.schema';
import { Types } from 'mongoose';

async function createTestEvents() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const eventModel = app.get(getModelToken(Event.name));
  const orgModel = app.get(getModelToken(Org.name));

  try {
    // Check if test events already exist
    const existingEvents = await eventModel.countDocuments();
    if (existingEvents > 0) {
      console.log(`${existingEvents} events already exist in the database.`);
      return;
    }

    // Get NGOs to create events for
    const ngos = await orgModel.find({ type: 'NGO' }).limit(3);
    if (ngos.length === 0) {
      console.log('No NGOs found. Please create NGOs first using: pnpm run seed:ngos');
      return;
    }

    const testEvents: any[] = [];

    // Create events for each NGO
    for (const ngo of ngos) {
      const ngoEvents = [
        {
          title: `Health Awareness Camp - ${ngo.city}`,
          description: `Join us for a comprehensive health awareness camp in ${ngo.city}. We will provide free health check-ups, health education sessions, and distribute essential medicines to the community.`,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          location: `Community Center, ${ngo.city}`,
          ngoId: ngo._id as Types.ObjectId,
          status: 'upcoming',
          tags: ['health', 'community', 'awareness'],
          maxParticipants: 100,
          currentParticipants: 25,
          contactEmail: ngo.contactEmail || '',
          contactPhone: ngo.contactPhone || ''
        },
        {
          title: `${ngo.subtype} Fundraising Event`,
          description: `A special fundraising event to support our ongoing projects and initiatives. Your contribution will help us make a bigger impact in the community.`,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          location: `${ngo.name} Office, ${ngo.address}`,
          ngoId: ngo._id as Types.ObjectId,
          status: 'upcoming',
          tags: ['fundraising', 'support', 'community'],
          maxParticipants: 50,
          currentParticipants: 12,
          contactEmail: ngo.contactEmail || '',
          contactPhone: ngo.contactPhone || ''
        },
        {
          title: 'Volunteer Training Workshop',
          description: 'Comprehensive training session for new volunteers. Learn about our mission, projects, and how you can contribute effectively to our cause.',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          location: `Training Hall, ${ngo.city}`,
          ngoId: ngo._id as Types.ObjectId,
          status: 'completed',
          tags: ['training', 'volunteers', 'workshop'],
          maxParticipants: 30,
          currentParticipants: 28,
          contactEmail: ngo.contactEmail || '',
          contactPhone: ngo.contactPhone || ''
        },
        {
          title: 'Past Event - Auto Complete Demo',
          description: 'This event was scheduled in the past but marked as upcoming. It should automatically be marked as completed by the system.',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          location: `Demo Location, ${ngo.city}`,
          ngoId: ngo._id as Types.ObjectId,
          status: 'upcoming', // Will be auto-updated to completed
          tags: ['demo', 'auto-update'],
          maxParticipants: 20,
          currentParticipants: 15,
          contactEmail: ngo.contactEmail || '',
          contactPhone: ngo.contactPhone || ''
        }
      ];

      testEvents.push(...ngoEvents);
    }

    await eventModel.insertMany(testEvents);

    console.log('✅ Test events created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Created ${testEvents.length} test events for ${ngos.length} NGOs:`);
    
    for (const ngo of ngos) {
      console.log(`• ${(ngo as any).name}: 3 events`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 NGOs can now view and manage their events in the dashboard!');

  } catch (error) {
    console.error('❌ Error creating test events:', error);
  } finally {
    await app.close();
  }
}

createTestEvents();