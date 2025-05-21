import { Module } from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategory, SubCategorySchema } from './sub-category.schema';
import { Category, CategorySchema } from 'src/category/category.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';
import { AuditLog, AuditLogSchema } from 'src/audit-log/audit-log.schema';
import { Product, ProductSchema } from 'src/product/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    PushNotificationModule,
  ],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
})
export class SubCategoryModule {}
