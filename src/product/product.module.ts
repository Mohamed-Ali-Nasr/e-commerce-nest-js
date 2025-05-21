import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema';
import { Category, CategorySchema } from 'src/category/category.schema';
import {
  SubCategory,
  SubCategorySchema,
} from 'src/sub-category/sub-category.schema';
import { AuditLog, AuditLogSchema } from 'src/audit-log/audit-log.schema';
import { Brand, BrandSchema } from 'src/brand/brand.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    PushNotificationModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
