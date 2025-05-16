import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/user/enum';

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

  @Prop({ type: String, srequired: true, enum: Object.values(Role) })
  role: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
