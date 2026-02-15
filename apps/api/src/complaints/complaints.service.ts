import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Complaint, ComplaintEvent } from './complaint.schema';
import { AddCommentDto, AddProgressUpdateDto, AssignComplaintDto, CreateComplaintDto, ListQueryDto, UpdateStatusDto } from './dto';
import { RoutingService } from '../routing/routing.service';
import { EventsGateway } from '../realtime/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<Complaint>,
    @InjectModel(ComplaintEvent.name) private eventModel: Model<ComplaintEvent>,
    private routing: RoutingService,
    private events: EventsGateway,
    private notifications: NotificationsService,
    private blockchain: BlockchainService,
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

    // Notify NGO when complaint is received
    if (doc.orgId) {
      const notification = await this.notifications.notifyNgoComplaintReceived(doc.orgId, doc);
      this.events.emitNgoNotification(doc.orgId, notification);
    }

    // Record complaint on blockchain (non-blocking)
    if (this.blockchain.isEnabled()) {
      const blockchainHash = this.blockchain.generateComplaintHash({
        category: doc.category,
        description: doc.description || '',
        reporterId: doc.reporterId,
        createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
      });
      this.blockchain.recordComplaintOnChain(String(doc._id), blockchainHash).then(async (txHash) => {
        if (txHash) {
          await this.complaintModel.findByIdAndUpdate(doc._id, { blockchainTxHash: txHash, blockchainHash });
        }
      });
    }

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

    // Record status change on blockchain (non-blocking)
    if (this.blockchain.isEnabled()) {
      this.blockchain.recordStatusUpdateOnChain(String(doc._id), dto.status as any).then(async (txHash) => {
        if (txHash) {
          await this.complaintModel.findByIdAndUpdate(doc._id, { blockchainTxHash: txHash });
        }
      });
    }

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

    // Notify NGO user when complaint is assigned to them
    if (dto.assignedTo) {
      const notification = await this.notifications.notifyNgoUserAssigned(
        dto.assignedTo,
        doc,
        dto.actorId
      );
      this.events.emitNgoUserNotification(dto.assignedTo, notification);
    }

    // Record assignment on blockchain (non-blocking)
    if (this.blockchain.isEnabled()) {
      this.blockchain.recordAssignmentOnChain(
        String(doc._id),
        doc.orgId || '',
        dto.assignedTo,
      ).then(async (txHash) => {
        if (txHash) {
          await this.complaintModel.findByIdAndUpdate(doc._id, { blockchainTxHash: txHash });
        }
      });
    }

    return doc;
  }

  async addProgressUpdate(id: string, dto: AddProgressUpdateDto) {
    const progressUpdate = {
      date: new Date(),
      description: dto.description,
      photos: dto.photos || [],
      updatedBy: dto.updatedBy ?? 'u-dev-1',
      updatedByName: dto.updatedByName,
    };

    const doc = await this.complaintModel.findByIdAndUpdate(
      id,
      { 
        $push: { progressUpdates: progressUpdate },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!doc) return null;

    await this.eventModel.create({
      complaintId: String(doc._id),
      type: 'note',
      actorId: dto.updatedBy ?? 'u-dev-1',
      payload: { 
        type: 'progress_update',
        description: dto.description,
        photos: dto.photos || [],
      }
    });

    this.events.emitComplaintUpdated(doc as any);
    return doc;
  }

  async getProgressUpdates(id: string) {
    const doc = await this.complaintModel.findById(id).select('progressUpdates').lean();
    if (!doc) return null;
    return doc.progressUpdates || [];
  }
}