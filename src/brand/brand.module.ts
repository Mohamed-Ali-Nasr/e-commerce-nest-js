import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from './brand.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),

    PushNotificationModule,
  ],

  controllers: [BrandController],
  providers: [BrandService],
})
export class BrandModule {}
