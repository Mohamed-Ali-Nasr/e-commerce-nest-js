import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from './brand.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';
import { AuditLog, AuditLogSchema } from 'src/audit-log/audit-log.schema';
import { Product, ProductSchema } from 'src/product/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Brand.name, schema: BrandSchema },
      { name: Product.name, schema: ProductSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    PushNotificationModule,
  ],

  controllers: [BrandController],
  providers: [BrandService],
})
export class BrandModule {}
