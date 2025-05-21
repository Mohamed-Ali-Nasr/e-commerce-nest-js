import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryPaginationDto,
  CreateCategoryDto,
} from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './category.schema';
import { Model } from 'mongoose';
import { Request } from 'express';
import {
  SubCategory,
  SubCategoryDocument,
} from 'src/sub-category/sub-category.schema';
import { PushNotificationService } from 'src/push-notification/push-notification.service';
import { AuditLog, AuditLogDocument } from 'src/audit-log/audit-log.schema';
import { Action, EntityTye } from 'src/audit-log/enum';
import { Product, productDocument } from 'src/product/product.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,

    @InjectModel(Product.name)
    private productModel: Model<productDocument>,

    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,

    private pushNotificationService: PushNotificationService,
  ) {}

  async create(
    req: Request,
    createCategoryDto: CreateCategoryDto,
  ): Promise<{ status: number; message: string; data: Category }> {
    const payload = req['user'] as { _id: string };

    const category = await this.categoryModel.findOne({
      name: createCategoryDto.name
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
    });

    if (category) {
      throw new HttpException('Category already exist', 400);
    }

    const newCategory = await this.categoryModel.create(createCategoryDto);

    const savedCategory = await newCategory.save();

    // Send notification to all users
    try {
      await this.pushNotificationService.sendNotificationToAll(
        'New Category Added!',
        `Check out our new category: ${savedCategory.name}`,
      );
      console.log(`Notification sent for category: ${savedCategory.name}`);
    } catch (error) {
      console.error(
        `Failed to send notification for category ${savedCategory.name}:`,
        error,
      );
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Category,
      entityId: savedCategory._id,
      action: Action.Create,
      performedBy: payload._id,
      data: savedCategory.toObject(),
    });

    return {
      status: 200,
      message: 'Category created successfully',
      data: newCategory,
    };
  }

  // Pagination
  async findAll(categoryPaginationDto: CategoryPaginationDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<Category>[];
    page: number;
    totalPages: number;
  }> {
    const { _limit: limit, skip, sort, name } = categoryPaginationDto;

    // Build the filter query
    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .exec(),

      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Categories Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
  ): Promise<{ status: number; message: string; data: Category }> {
    const category = await this.categoryModel.findById(id).select('-__v');

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      status: 200,
      message: 'Category found',
      data: category,
    };
  }

  async update(
    req: Request,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ status: number; message: string; data: Category }> {
    const payload = req['user'] as { _id: string };

    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // update the category name to be capitalized
    if (
      updateCategoryDto.name &&
      category.name !==
        updateCategoryDto.name
          .trim()
          .toLowerCase()
          .replace(/^\w|\s\w/g, (char) => char.toUpperCase())
    ) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name
          .trim()
          .toLowerCase()
          .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
      });
      if (existingCategory) {
        throw new ConflictException('Category name already exists');
      }

      updateCategoryDto.name = updateCategoryDto.name
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase());
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .select('-__v');

    if (!updatedCategory) {
      throw new InternalServerErrorException('Failed to update category');
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Category,
      entityId: id,
      action: Action.Update,
      performedBy: payload._id,
      data: updatedCategory.toObject(),
    });

    return {
      status: 200,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(
    req: Request,
    categoryId: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string };

    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await Promise.all([
      this.categoryModel.deleteOne({ _id: categoryId }).exec(),
      this.subCategoryModel.deleteMany({ category: categoryId }).exec(),
      this.productModel.deleteMany({ category: categoryId }).exec(),
    ]);

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Category,
      entityId: categoryId,
      action: Action.Delete,
      performedBy: payload._id,
      data: category.toObject(),
    });

    return {
      status: 200,
      message: 'Category deleted successfully',
    };
  }
}
