import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get('ngos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async getAllNgos() {
    const ngos = await this.orgsService.getAllNgos();
    const pending = ngos.filter(ngo => !ngo.isVerified);
    const verified = ngos.filter(ngo => ngo.isVerified);

    return {
      pending: pending.map(ngo => this.transformNgoForAdmin(ngo)),
      verified: verified.map(ngo => this.transformNgoForAdmin(ngo))
    };
  }

  @Post('verify-ngo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async verifyNgo(@Body() { ngoId }: { ngoId: string }) {
    return this.orgsService.verifyNgo(ngoId);
  }

  @Post('reject-ngo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async rejectNgo(@Body() { ngoId }: { ngoId: string }) {
    return this.orgsService.rejectNgo(ngoId);
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo')
  async getMyProfile(@Request() req: any) {
    const ngo = await this.orgsService.findById(req.user.sub);
    if (!ngo) {
      throw new NotFoundException('NGO profile not found');
    }
    return this.transformNgoProfile(ngo);
  }

  @Put('my-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo')
  async updateMyProfile(@Request() req: any, @Body() updateData: any) {
    // Remove sensitive fields that shouldn't be updated
    const { passwordHash, isVerified, roles, ...allowedUpdates } = updateData;
    
    const updatedNgo = await this.orgsService.updateNgo(req.user.sub, allowedUpdates);
    if (!updatedNgo) {
      throw new NotFoundException('NGO profile not found');
    }
    return this.transformNgoProfile(updatedNgo);
  }

  private transformNgoForAdmin(ngo: any) {
    return {
      _id: ngo._id,
      ngoName: ngo.name,
      email: ngo.contactEmail || '',
      registrationNumber: ngo.registrationNumber || '',
      address: ngo.address || '',
      contactPerson: ngo.contactPersonName || '',
      contactPhone: ngo.contactPhone || '',
      description: ngo.description || '',
      isVerified: ngo.isVerified || false,
      createdAt: ngo.createdAt || new Date(),
      subtype: ngo.subtype || '',
      city: ngo.city || '',
      categories: ngo.categories || [],
      establishedYear: ngo.establishedYear || '',
      website: ngo.website || ''
    };
  }

  private transformNgoProfile(ngo: any) {
    return {
      _id: ngo._id,
      name: ngo.name,
      subtype: ngo.subtype || '',
      city: ngo.city || '',
      categories: ngo.categories || [],
      contactPersonName: ngo.contactPersonName || '',
      contactEmail: ngo.contactEmail || '',
      contactPhone: ngo.contactPhone || '',
      address: ngo.address || '',
      registrationNumber: ngo.registrationNumber || '',
      establishedYear: ngo.establishedYear || '',
      website: ngo.website || '',
      description: ngo.description || '',
      isVerified: ngo.isVerified || false,
      createdAt: ngo.createdAt || new Date(),
      updatedAt: ngo.updatedAt || new Date()
    };
  }
}