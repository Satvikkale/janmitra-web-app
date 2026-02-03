import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Complaint, ComplaintEvent } from './complaint.schema';
import { AddCommentDto, AssignComplaintDto, CreateComplaintDto, ListQueryDto, UpdateStatusDto } from './dto';
import { RoutingService } from '../routing/routing.service';
import { EventsGateway } from '../realtime/events.gateway';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<Complaint>,
    @InjectModel(ComplaintEvent.name) private eventModel: Model<ComplaintEvent>,
    private routing: RoutingService,
    private events: EventsGateway,
  ) {}

  async create(dto: CreateComplaintDto) {
    const reporterId = dto.reporterId ?? 'u-dev-1';
    const targetOrg = await this.routing.pickOrg({ category: dto.category, location: dto.location });
    const doc = await this.complaintModel.create({
      reporterId,
      societyId: dto.societyId,
      orgId: targetOrg?._id?.toString(),
      category: dto.category,
      subcategory: dto.subcategory,
      description: dto.description,
      media: dto.media,
      location: dto.location,
      status: 'open',
      priority: 'med',
    });
    await this.eventModel.create({
      complaintId: String(doc._id),
      type: 'created',
      actorId: reporterId,
      payload: { category: doc.category, orgId: doc.orgId || null },
    });
    this.events.emitComplaintCreated(doc as any);
    return doc;
  }

  async list(q: ListQueryDto) {
    const filter: any = {};
    if (q.id) filter._id = q.id;
    if (q.societyId) filter.societyId = q.societyId;
    if (q.orgId) filter.orgId = q.orgId;
    if (q.status) filter.status = q.status;
    if (q.assignedTo) filter.assignedTo = q.assignedTo;
    return this.complaintModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  }

  async get(id: string) { return this.complaintModel.findById(id).lean(); }

  async eventsFor(id: string) { return this.eventModel.find({ complaintId: id }).sort({ createdAt: 1 }).lean(); }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const doc = await this.complaintModel.findByIdAndUpdate(id, { status: dto.status, updatedAt: new Date() }, { new: true });
    if (!doc) return null;
    await this.eventModel.create({ complaintId: String(doc._id), type: 'status_changed', actorId: dto.actorId ?? 'u-dev-1', payload: { status: dto.status, note: dto.note } });
    this.events.emitComplaintUpdated(doc as any);
    return doc;
  }

  async addComment(id: string, dto: AddCommentDto) {
    const doc = await this.complaintModel.findById(id);
    if (!doc) return null;
    await this.eventModel.create({ complaintId: String(doc._id), type: 'comment', actorId: dto.actorId ?? 'u-dev-1', payload: { message: dto.message, visibility: dto.visibility } });
    this.events.emitComplaintUpdated(doc as any);
    return { ok: true };
  }

  async assign(id: string, dto: AssignComplaintDto) {
    const doc = await this.complaintModel.findByIdAndUpdate(
      id,
      { assignedTo: dto.assignedTo, status: 'assigned', updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return null;
    await this.eventModel.create({
      complaintId: String(doc._id),
      type: 'assigned',
      actorId: dto.actorId ?? 'u-dev-1',
      payload: { assignedTo: dto.assignedTo }
    });
    this.events.emitComplaintUpdated(doc as any);
    return doc;
  }
}