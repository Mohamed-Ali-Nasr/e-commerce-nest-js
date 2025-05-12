import { Module } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationController } from './push-notification.controller';
import { Subscription, SubscriptionSchema } from './subscription.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],

  controllers: [PushNotificationController],

  providers: [PushNotificationService],

  exports: [PushNotificationService],
})
export class PushNotificationModule {}
