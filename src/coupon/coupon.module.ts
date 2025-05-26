import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './coupon.schema';
import { AuditLog, AuditLogSchema } from 'src/audit-log/audit-log.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';
import { User, userSchemaFactory } from 'src/user/user.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
          userSchemaFactory(configService),
        inject: [ConfigService],
      },
    ]),

    PushNotificationModule,
  ],

  controllers: [CouponController],

  providers: [CouponService],
})
export class CouponModule {}
