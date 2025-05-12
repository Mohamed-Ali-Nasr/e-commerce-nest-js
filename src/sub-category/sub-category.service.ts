import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CategoryIdDto,
  CreateSubCategoryDto,
  SubCategoryPaginationDto,
} from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from 'src/category/category.schema';
import { Model } from 'mongoose';
import { SubCategory, SubCategoryDocument } from './sub-category.schema';
import { Request } from 'express';
import { PushNotificationService } from 'src/push-notification/push-notification.service';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,

    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    private pushNotificationService: PushNotificationService,
  ) {}

  async create(
    req: Request,
    createSubCategoryDto: CreateSubCategoryDto,
    categoryIdDto: CategoryIdDto,
  ): Promise<{ status: number; message: string; data: SubCategory }> {
    const payload = req['user'] as { _id: string };

    const subCategory = await this.subCategoryModel.findOne({
      name: createSubCategoryDto.name
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
    });

    if (subCategory) {
      throw new HttpException('Sub Category already exist', 400);
    }

    const category = await this.categoryModel.findById(
      categoryIdDto.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const newSubCategory = await (
      await this.subCategoryModel.create({
        ...createSubCategoryDto,
        createdBy: payload._id,
        category: categoryIdDto.categoryId,
      })
    ).populate([
      { path: 'category', select: '-__v' },
      { path: 'createdBy', select: '_id name email role' },
    ]);

    const savedSubCategory = await newSubCategory.save();

    // Send notification to all users
    await this.pushNotificationService.sendNotificationToAll(
      'New Sub Category Added!',
      `Check out our new sub category: ${savedSubCategory.name}`,
    );

    return {
      status: 200,
      message: 'Sub Category created successfully',
      data: newSubCategory,
    };
  }

  // Pagination
  async findAll(subCategoryPaginationDto: SubCategoryPaginationDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<SubCategory>[];
    page: number;
    totalPages: number;
  }> {
    const {
      _limit: limit,
      skip,
      sort,
      name,
      categoryId,
    } = subCategoryPaginationDto;

    // Build the filter query
    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    if (categoryId) filter.category = categoryId; // Filter by category ID if provided

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.subCategoryModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .exec(),

      this.subCategoryModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Sub Categories Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
  ): Promise<{ status: number; message: string; data: SubCategory }> {
    const subCategory = await this.subCategoryModel
      .findById(id)
      .select('-__v')
      .populate('category', '-__v');

    if (!subCategory) {
      throw new NotFoundException('Sub Category not found');
    }

    return {
      status: 200,
      message: 'Sub Category found',
      data: subCategory,
    };
  }

  async update(
    req: Request,
    id: string,
    updateCategoryDto: UpdateSubCategoryDto,
  ): Promise<{ status: number; message: string; data: SubCategory }> {
    const payload = req['user'] as { _id: string };

    const subCategory = await this.subCategoryModel.findById(id);
    if (!subCategory) {
      throw new NotFoundException('Sub Category not found');
    }

    const updatedSubCategory = await this.subCategoryModel
      .findByIdAndUpdate(
        id,
        { ...updateCategoryDto, updatedBy: payload._id },
        { new: true },
      )
      .select('-__v')
      .populate([
        { path: 'updatedBy', select: '_id name email role' },
        { path: 'createdBy', select: '_id name email role' },
        { path: 'category', select: '-__v' },
      ]);

    return {
      status: 200,
      message: 'Sub Category updated successfully',
      data: updatedSubCategory,
    };
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const subCategory = await this.subCategoryModel.findById(id);

    if (!subCategory) {
      throw new NotFoundException('Sub Category not found');
    }

    await this.subCategoryModel.findByIdAndDelete(id);

    return {
      status: 200,
      message: 'Sub Category deleted successfully',
    };
  }
}
