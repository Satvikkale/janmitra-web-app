import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Org } from './orgs.schema';

@Injectable()
export class OrgsService {
  constructor(
    @InjectModel(Org.name) private orgModel: Model<Org>,
  ) {}

  async createNgo(ngoData: any) {
    // Check if NGO already exists
    const existingNgo = await this.orgModel.findOne({
      $or: [
        { name: ngoData.name, type: 'NGO' },
        { contactEmail: ngoData.contactEmail },
        { contactPhone: ngoData.contactPhone }
      ]
    });

    if (existingNgo) {
      throw new BadRequestException('NGO already exists with this name, email, or phone');
    }

    const ngo = await this.orgModel.create(ngoData);
    return ngo;
  }

  async findNgoByIdentifier(identifier: string) {
    return this.orgModel.findOne({
      type: 'NGO',
      $or: [
        { contactEmail: identifier },
        { contactPhone: identifier }
      ]
    });
  }

  async getAllNgos() {
    return this.orgModel.find({ type: 'NGO' }).sort({ createdAt: -1 });
  }

  async getPendingNgos() {
    return this.orgModel.find({ 
      type: 'NGO',
      isVerified: false 
    }).sort({ createdAt: -1 });
  }

  async getVerifiedNgos() {
    return this.orgModel.find({ 
      type: 'NGO',
      isVerified: true 
    }).sort({ createdAt: -1 });
  }

  async verifyNgo(ngoId: string) {
    const ngo = await this.orgModel.findById(ngoId);
    if (!ngo || ngo.type !== 'NGO') {
      throw new NotFoundException('NGO not found');
    }

    await this.orgModel.findByIdAndUpdate(ngoId, {
      isVerified: true
    });

    return { message: 'NGO verified successfully' };
  }

  async rejectNgo(ngoId: string) {
    const ngo = await this.orgModel.findById(ngoId);
    if (!ngo || ngo.type !== 'NGO') {
      throw new NotFoundException('NGO not found');
    }

    await this.orgModel.findByIdAndDelete(ngoId);
    return { message: 'NGO application rejected and removed' };
  }

  async findById(id: string) {
    return this.orgModel.findById(id);
  }

  async updateNgo(id: string, updateData: any) {
    return this.orgModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async resolveByCategoryAndLocation(
    category: string, 
    location?: { lat: number; lng: number }, 
    preferTypes?: string[]
  ) {
    const query: any = {
      categories: category
    };

    // If location is provided, add geospatial query
    if (location) {
      query.jurisdiction = {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          }
        }
      };
    }

    // Build type preference query
    let typeQuery = {};
    if (preferTypes && preferTypes.length > 0) {
      typeQuery = { type: { $in: preferTypes } };
    }

    const finalQuery = { ...query, ...typeQuery };

    // Try to find with location first, then fallback to category only
    let org = await this.orgModel.findOne(finalQuery);

    // If no org found with location, try without location constraint
    if (!org && location) {
      const fallbackQuery = {
        categories: category,
        ...typeQuery
      };
      org = await this.orgModel.findOne(fallbackQuery);
    }

    // If still no org found and we have type preferences, try without type constraint
    if (!org && preferTypes && preferTypes.length > 0) {
      org = await this.orgModel.findOne({ categories: category });
    }

    return org;
  }
}