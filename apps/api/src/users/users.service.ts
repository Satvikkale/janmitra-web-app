import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<User>) { }

  async findOrCreateBySub(sub: string, profile?: Partial<User>) {
    let u = await this.model.findOne({ auth0Sub: sub });
    if (!u) u = await this.model.create({ auth0Sub: sub, roles: ['resident'], ...profile });
    return u;
  }

  getMe(sub: string) { return this.model.findOne({ auth0Sub: sub }).lean(); }

  getById(id: string) { return this.model.findById(id).lean(); }
}