import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CategoryPaginationDto,
  CreateCategoryDto,
} from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, categoryDocument } from './category.schema';
import { Model } from 'mongoose';
import { Request } from 'express';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<categoryDocument>,
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

    const newCategory = await this.categoryModel.create({
      ...createCategoryDto,
      createdBy: payload._id,
    });

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
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ status: number; message: string; data: Category }> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .select('-__v');

    return {
      status: 200,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryModel.findByIdAndDelete(id);

    return {
      status: 200,
      message: 'Category deleted successfully',
    };
  }
}
