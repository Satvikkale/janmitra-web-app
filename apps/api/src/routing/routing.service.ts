import { Injectable } from '@nestjs/common';
import { OrgsService } from '../orgs/orgs.service';

@Injectable()
export class RoutingService {
  constructor(private orgs: OrgsService) {}

  // Rules: category + optional location → org
  async pickOrg(params: { category: string; location?: { lat: number; lng: number } }) {
    const preferTypes = ['Gov','Utility','NGO']; // order of preference
    const org = await this.orgs.resolveByCategoryAndLocation(params.category, params.location, preferTypes);
    return org || null; // null => society head must assign manually
  }
}