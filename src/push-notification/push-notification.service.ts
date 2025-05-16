import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from './subscription.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';

@Injectable()
export class PushNotificationService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT');

    if (!publicKey || !privateKey || !subject) {
      throw new Error('VAPID keys or subject not configured');
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);
  }

  // Store a new subscription
  async storeSubscription(
    subscription: webPush.PushSubscription,
    role: string,
  ): Promise<SubscriptionDocument> {
    const existingSubscription = await this.subscriptionModel.findOne({
      endpoint: subscription.endpoint,
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const newSubscription = new this.subscriptionModel({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      role,
    });

    return newSubscription.save();
  }

  // Send notification to all subscribers
  async sendNotificationToAll(
    title: string,
    body: string,
    targetRole?: string,
  ): Promise<void> {
    const query = targetRole ? { role: targetRole } : {};

    const subscriptions = await this.subscriptionModel.find(query).exec();

    if (subscriptions.length === 0) {
      console.warn(
        'PushNotificationService: No subscriptions to send notifications to for role:',
        targetRole || 'all',
      );
      return;
    }

    const payload = JSON.stringify({
      notification: {
        title,
        body,
      },
    });

    const options = {
      TTL: 10000, // Time to live in seconds
    };

    const sendPromises = subscriptions.map((subscription) =>
      webPush
        .sendNotification(subscription, payload, options)
        .then(() =>
          console.log(
            `Notification sent successfully to ${subscription.endpoint}`,
          ),
        )
        .catch(async (error) => {
          console.error(`Error sending to ${subscription.endpoint}:`, error);
          // Optionally remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(
              `Removing expired subscription: ${subscription.endpoint}`,
            );
            await this.subscriptionModel
              .deleteOne({ endpoint: subscription.endpoint })
              .exec();
          }
        }),
    );

    try {
      await Promise.all(sendPromises);
      console.log('All notification attempts completed');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }
}
