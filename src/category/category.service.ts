import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,
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

    const newCategory = await (
      await this.categoryModel.create({
        ...createCategoryDto,
        createdBy: payload._id,
      })
    ).populate('createdBy', '_id name email role');

    await newCategory.save();

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

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(
        id,
        { ...updateCategoryDto, updatedBy: payload._id },
        { new: true },
      )
      .select('-__v')
      .populate([
        { path: 'updatedBy', select: '_id name email role' },
        { path: 'createdBy', select: '_id name email role' },
      ]);

    return {
      status: 200,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(
    categoryId: string,
  ): Promise<{ status: number; message: string }> {
    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await Promise.all([
      this.categoryModel.deleteOne({ _id: categoryId }).exec(),
      this.subCategoryModel.deleteMany({ category: categoryId }).exec(),
    ]);

    return {
      status: 200,
      message: 'Category deleted successfully',
    };
  }
}
