import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: String, required: true })
  endpoint: string;

  @Prop({ type: Object, required: true })
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
