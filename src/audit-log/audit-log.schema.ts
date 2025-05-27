import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/user/user.schema';
import { Action, EntityTye } from './enum';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({
    type: String,
    enum: Object.values(EntityTye),
    required: true,
  })
  entityType: string;

  @Prop({ type: String, required: true })
  entityId: string;

  @Prop({
    type: String,
    enum: Object.values(Action),
    required: true,
  })
  action: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  performedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;

  @Prop({ type: String, required: true })
  description: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
