import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { HealthController } from './health.controller';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocietiesModule } from './societies/societies.module';

import { OrgsModule } from './orgs/orgs.module';
import { NgoUsersModule } from './ngo-users/ngo-users.module';
import { RoutingModule } from './routing/routing.module';

import { UploadsModule } from './uploads/uploads.module';
import { RealtimeModule } from './realtime/realtime.module';

import { ComplaintsModule } from './complaints/complaints.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    UsersModule,
    SocietiesModule,
    OrgsModule,
    NgoUsersModule,
    RoutingModule,
    UploadsModule,
    RealtimeModule,
    ComplaintsModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}