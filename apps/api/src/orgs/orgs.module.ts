import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrgsController } from './orgs.Controller';
import { OrgsService } from './orgs.service';
import { Org, OrgSchema } from './orgs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Org.name, schema: OrgSchema },
    ]),
  ],
  controllers: [OrgsController],
  providers: [OrgsService],
  exports: [OrgsService, MongooseModule],
})
export class OrgsModule {}