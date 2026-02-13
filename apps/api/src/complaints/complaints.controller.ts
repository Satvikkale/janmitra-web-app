import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { AddCommentDto, AddProgressUpdateDto, AssignComplaintDto, CreateComplaintDto, ListQueryDto, UpdateStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformUserGuard } from '../auth/platform-user.guard';

@UseGuards(JwtAuthGuard, PlatformUserGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly svc: ComplaintsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateComplaintDto) {
    dto.reporterId = req.user.sub;
    return this.svc.create(dto);
  }

  @Get()
  list(@Query() q: ListQueryDto) { return this.svc.list(q); }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.get(id); }

  @Get(':id/events')
  events(@Param('id') id: string) { return this.svc.eventsFor(id); }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) { return this.svc.updateStatus(id, dto); }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignComplaintDto) { return this.svc.assign(id, dto); }

  @Post(':id/comment')
  comment(@Param('id') id: string, @Body() dto: AddCommentDto) { return this.svc.addComment(id, dto); }

  @Post(':id/progress')
  addProgress(@Req() req: any, @Param('id') id: string, @Body() dto: AddProgressUpdateDto) {
    dto.updatedBy = req.user.sub;
    dto.updatedByName = req.user.name || req.user.email;
    return this.svc.addProgressUpdate(id, dto);
  }

  @Get(':id/progress')
  getProgress(@Param('id') id: string) { return this.svc.getProgressUpdates(id); }
}