import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type OrgType = 'Gov' | 'NGO' | 'Utility' | 'Private';
type GeoJsonMultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] };
type GeoJsonPolygon = { type: 'Polygon'; coordinates: number[][][] };
type GeoJson = GeoJsonPolygon | GeoJsonMultiPolygon;

@Schema({ timestamps: true })
export class Org extends Document {
  @Prop({ required: true }) 
  name!: string;
  
  @Prop({ required: true, enum: ['Gov','NGO','Utility','Private'] }) 
  type!: OrgType;
  
  @Prop() 
  subtype?: string; // e.g., 'Health NGO', 'Education NGO', 'Municipal Corporation', etc.
  
  @Prop() 
  city?: string;
  
  @Prop({ type: [String], default: [] }) 
  categories!: string[]; // handled categories or working areas
  
  @Prop({ type: Object }) 
  jurisdiction?: GeoJson; // optional GeoJSON area (2dsphere)
  
  // NGO specific fields
  @Prop() 
  contactPersonName?: string;
  
  @Prop() 
  contactEmail?: string;
  
  @Prop() 
  contactPhone?: string;
  
  @Prop() 
  address?: string;
  
  @Prop() 
  registrationNumber?: string;
  
  @Prop() 
  establishedYear?: number;
  
  @Prop() 
  website?: string;
  
  @Prop() 
  passwordHash?: string; // For NGO authentication
  
  @Prop({ default: false }) 
  isVerified?: boolean; // For NGO verification
  
  @Prop({ type: [String], default: [] }) 
  roles?: string[]; // For NGO roles
  
  // Organization general fields
  @Prop() 
  workingHours?: string;
  
  @Prop({ type: [String], default: [] }) 
  escalationContacts?: string[];
  
  @Prop() 
  description?: string;
  
  @Prop() 
  escalateToOrgId?: string; // optional cross-org escalation
}

export const OrgSchema = SchemaFactory.createForClass(Org);

// Create indexes
OrgSchema.index({ jurisdiction: '2dsphere' }); // Geospatial index (only if jurisdiction present)
OrgSchema.index({ city: 1, type: 1 });
OrgSchema.index({ categories: 1 });
OrgSchema.index({ type: 1 });
OrgSchema.index({ contactEmail: 1 }, { sparse: true });
OrgSchema.index({ contactPhone: 1 }, { sparse: true });
OrgSchema.index({ registrationNumber: 1 }, { sparse: true, unique: true });