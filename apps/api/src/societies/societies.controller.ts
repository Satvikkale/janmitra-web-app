import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformUserGuard } from '../auth/platform-user.guard';
import { Society } from './society.schema';
import { SocietyMembership } from './membership.schema';
import { User } from '../users/user.schema';

@UseGuards(JwtAuthGuard, PlatformUserGuard)
@Controller('societies')
export class SocietiesController {
  constructor(
    @InjectModel(Society.name) private soc: Model<Society>,
    @InjectModel(SocietyMembership.name) private mem: Model<SocietyMembership>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Get()
  async list(@Query('q') q?: string) {
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    return this.soc.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.soc.findById(id).lean(); }

  @Post()
  async create(@Req() req: any, @Body() body: { name: string }) {
    const s = await this.soc.create({ name: body.name, headUserSub: req.user.sub });
    await this.mem.create({ societyId: String(s._id), userSub: req.user.sub, role: 'society_head', status: 'approved' });
    return s;
  }

  @Post(':id/join')
  async requestJoin(@Req() req: any, @Param('id') id: string) {
    const existing = await this.mem.findOne({ societyId: id, userSub: req.user.sub });
    if (existing) return existing;
    return this.mem.create({ societyId: id, userSub: req.user.sub, role: 'resident', status: 'pending' });
  }

  @Get(':id/memberships')
  async listMembers(@Req() req: any, @Param('id') id: string, @Query('status') status?: string) {
    const q: any = { societyId: id };
    if (status) q.status = status;
    const memberships = await this.mem.find(q).sort({ createdAt: -1 }).lean();
    
    // Get all user IDs from memberships
    const userIds = memberships.map(m => {
      try {
        return new Types.ObjectId(m.userSub);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    // Fetch users in one query
    const users = await this.userModel.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));
    
    // Attach user info to memberships
    return memberships.map(m => ({
      ...m,
      userName: userMap.get(m.userSub)?.name || 'Unknown User',
      userEmail: userMap.get(m.userSub)?.email || null,
    }));
  }

  @Post(':id/memberships/:userSub/approve')
  async approve(@Req() req: any, @Param('id') id: string, @Param('userSub') userSub: string) {
    const soc = await this.soc.findById(id).lean();
    if (soc?.headUserSub !== req.user.sub) return { ok: false };
    const m = await this.mem.findOneAndUpdate({ societyId: id, userSub }, { status: 'approved' }, { new: true });
    return { ok: true, membership: m };
  }
}