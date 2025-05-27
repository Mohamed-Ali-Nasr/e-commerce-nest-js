import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { CouponType } from './enum';
import { User } from 'src/user/user.schema';

export type couponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ type: String, required: true, unique: true })
  couponCode: string;

  @Prop({ type: Number, required: true })
  couponAmount: number;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(CouponType),
  })
  couponType: string;

  @Prop({ type: Boolean, default: true })
  isEnable: boolean;

  @Prop({
    type: [
      {
        userId: {
          type: MongooseSchema.Types.ObjectId,
          ref: User.name,
          required: true,
        },
        maxCount: { type: Number, required: true, default: 0 },
        usageCount: { type: Number, required: true, default: 0 },
        disabled: { type: Boolean, default: false },
      },
    ],
    required: true,
  })
  users: [
    {
      userId: MongooseSchema.Types.ObjectId;
      maxCount: number;
      usageCount: number;
      disabled: boolean;
    },
  ];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
