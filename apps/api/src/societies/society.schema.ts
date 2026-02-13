import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: true })
export class Society {
  @Prop({ required: true }) name!: string;
  @Prop({ type: { lat: Number, lng: Number } })
  location: { lat: number; lng: number };
  @Prop({ index: true }) headUserSub?: string;
  @Prop({ default: false }) isVerified: boolean;
  @Prop() address?: string;
  @Prop() contactPerson?: string;
  @Prop() contactPhone?: string;
  @Prop() description?: string;
}
export const SocietySchema = SchemaFactory.createForClass(Society);