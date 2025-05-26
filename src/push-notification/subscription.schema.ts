import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Role } from 'src/user/enum';
import { User } from 'src/user/user.schema';

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

  @Prop({ type: String, required: true, enum: Object.values(Role) })
  role: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId: MongooseSchema.Types.ObjectId;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
