import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Coupon } from 'src/coupon/coupon.schema';
import { Product } from 'src/product/product.schema';
import { User } from 'src/user/user.schema';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: [
      {
        productId: {
          type: MongooseSchema.Types.ObjectId,
          require: true,
          ref: Product.name,
        },
        quantity: { type: Number, default: 1 },
        color: { type: String, default: '' },
      },
    ],
  })
  cartItems: [
    {
      productId: string;
      quantity: number;
      color: string;
    },
  ];

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({
    type: [
      {
        couponCode: { type: String },
        couponId: {
          type: MongooseSchema.Types.ObjectId,
          ref: Coupon.name,
        },
      },
    ],
  })
  coupons: [
    {
      couponCode: string;
      couponId: string;
    },
  ];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: MongooseSchema.Types.ObjectId;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
