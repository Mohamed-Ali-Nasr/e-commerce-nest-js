import { Module } from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategory, subCategorySchema } from './sub-category.schema';
import { Category, CategorySchema } from 'src/category/category.schema';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: subCategorySchema },
      { name: Category.name, schema: CategorySchema },
    ]),

    PushNotificationModule,
  ],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
})
export class SubCategoryModule {}
