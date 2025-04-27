import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ type: String, required: true })
  otp: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: Date })
  otpExpiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
