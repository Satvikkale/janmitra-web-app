import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NgoInfo extends Document {
  @Prop({ required: true }) 
  userId!: string; // Reference to User document

  @Prop({ required: true }) 
  organizationName!: string;

  @Prop({ required: true }) 
  registrationNumber!: string;

  @Prop({ required: true }) 
  officialEmail!: string;

  @Prop({ required: true }) 
  contactPhone!: string;

  @Prop({ required: true }) 
  address!: string;

  @Prop({ required: true }) 
  city!: string;

  @Prop({ required: true }) 
  state!: string;

  @Prop({ required: true }) 
  pincode!: string;

  @Prop({ required: true }) 
  establishedYear!: number;

  @Prop() 
  description?: string;

  @Prop({ type: [String], default: [] }) 
  workingAreas!: string[]; // Areas of work like health, education, etc.

  @Prop() 
  website?: string;

  @Prop({ default: false }) 
  isVerified!: boolean;

  @Prop({ default: 'pending' }) 
  verificationStatus!: 'pending' | 'verified' | 'rejected';

  @Prop() 
  verificationNotes?: string;
}

export const NgoInfoSchema = SchemaFactory.createForClass(NgoInfo);

// Create indexes
NgoInfoSchema.index({ userId: 1 });
NgoInfoSchema.index({ registrationNumber: 1 }, { unique: true });
NgoInfoSchema.index({ officialEmail: 1 }, { unique: true });