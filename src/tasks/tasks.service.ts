import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';
import { Coupon, couponDocument } from 'src/coupon/coupon.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<couponDocument>,
  ) {}

  @Cron('0 59 23 * * *')
  async handleCron() {
    this.logger.debug(
      'cron job to disable coupons that have expired started at 23:59:00 every day',
    );

    const enableCoupons = await this.couponModel.find({ isEnable: true });

    if (enableCoupons.length) {
      for (const coupon of enableCoupons) {
        if (DateTime.now() > DateTime.fromJSDate(coupon.endDate)) {
          coupon.isEnable = false;
          await coupon.save();
        }
      }
    }
  }
}
