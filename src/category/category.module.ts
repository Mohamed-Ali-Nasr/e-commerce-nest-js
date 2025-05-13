import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './category.schema';
import {
  SubCategory,
  SubCategorySchema,
} from 'src/sub-category/sub-category.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';
import { AuditLog, AuditLogSchema } from 'src/audit-log/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    PushNotificationModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
