import { Body, Controller, Post } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import * as webPush from 'web-push';

@Controller('push-notification')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post('subscribe')
  async subscribe(
    @Body() subscription: webPush.PushSubscription,
  ): Promise<void> {
    await this.pushNotificationService.storeSubscription(subscription);
  }
}
