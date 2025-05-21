import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateProductDto,
  ProductPaginationDto,
} from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  SubCategory,
  SubCategoryDocument,
} from 'src/sub-category/sub-category.schema';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from 'src/category/category.schema';
import { AuditLog, AuditLogDocument } from 'src/audit-log/audit-log.schema';
import { PushNotificationService } from 'src/push-notification/push-notification.service';
import { Brand, BrandDocument } from 'src/brand/brand.schema';
import { Product, productDocument } from './product.schema';
import { Action, EntityTye } from 'src/audit-log/enum';
import { Request } from 'express';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<productDocument>,

    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,

    @InjectModel(Brand.name)
    private brandModel: Model<BrandDocument>,

    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,

    private pushNotificationService: PushNotificationService,
  ) {}

  async create(
    req: Request,
    createProductDto: CreateProductDto,
  ): Promise<{ status: number; message: string; data: Product }> {
    const payload = req['user'] as { _id: string };

    const product = await this.productModel.findOne({
      title: createProductDto.title
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
    });

    if (product) {
      throw new HttpException('Product already exist', 400);
    }

    const category = await this.categoryModel.findById(
      createProductDto.category,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (createProductDto.subCategory) {
      const subCategory = await this.subCategoryModel.findById(
        createProductDto.subCategory,
      );

      if (!subCategory) {
        throw new NotFoundException('Sub Category not found');
      }
    }

    if (createProductDto.brand) {
      const brand = await this.brandModel.findById(createProductDto.brand);

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    const priceAfterDiscount = createProductDto?.priceAfterDiscount || 0;
    if (createProductDto.price < priceAfterDiscount) {
      throw new HttpException(
        'Price after discount must be less than the original price',
        400,
      );
    }

    const newProduct = await (
      await this.productModel.create(createProductDto)
    ).populate('category subCategory brand', '-__v -createdAt -updatedAt');

    const savedProduct = await newProduct.save();

    // Send notification to all users
    await this.pushNotificationService.sendNotificationToAll(
      'New Product Added!',
      `Check out our new product: ${savedProduct.title}`,
    );

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Product,
      entityId: savedProduct._id,
      action: Action.Create,
      performedBy: payload._id,
      data: savedProduct.toObject(),
    });

    return {
      status: 200,
      message: 'Product created successfully',
      data: newProduct,
    };
  }

  // Pagination
  async findAll(productPaginationDto: ProductPaginationDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<Product>[];
    page: number;
    totalPages: number;
  }> {
    const {
      _limit: limit,
      skip,
      sort,
      title,
      description,
      category,
      subCategory,
      brand,
    } = productPaginationDto;

    // Build the filter query
    const filter: any = {};
    if (title) filter.title = { $regex: title, $options: 'i' }; // Case-insensitive search
    if (description)
      filter.description = { $regex: description, $options: 'i' }; // Case-insensitive search
    if (category) filter.category = category; // Filter by category ID if provided
    if (subCategory) filter.subCategory = subCategory; // Filter by subCategory ID if provided
    if (brand) filter.brand = brand; // Filter by brand ID if provided

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('category subCategory brand', '-__v -createdAt -updatedAt')
        .exec(),

      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Products Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
  ): Promise<{ status: number; message: string; data: Product }> {
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .populate('category subCategory brand', '-__v -createdAt -updatedAt');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      status: 200,
      message: 'Product found successfully',
      data: product,
    };
  }

  async update(
    req: Request,
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<{ status: number; message: string; data: Product }> {
    const payload = req['user'] as { _id: string };

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Procut Not Found');
    }

    // update the product title to be capitalized
    if (
      updateProductDto.title &&
      product.title !==
        updateProductDto.title
          .trim()
          .toLowerCase()
          .replace(/^\w|\s\w/g, (char) => char.toUpperCase())
    ) {
      const existingProduct = await this.productModel.findOne({
        title: updateProductDto.title
          .trim()
          .toLowerCase()
          .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
      });

      if (existingProduct) {
        throw new ConflictException('Product title already exists');
      }

      updateProductDto.title = updateProductDto.title
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase());
    }

    if (updateProductDto.category) {
      const category = await this.categoryModel.findById(
        updateProductDto.category,
      );

      if (!category) {
        throw new HttpException('This Category not Exist', 400);
      }
    }

    if (updateProductDto.subCategory) {
      const subCategory = await this.subCategoryModel.findById(
        updateProductDto.subCategory,
      );

      if (!subCategory) {
        throw new HttpException('This Sub Category not Exist', 400);
      }
    }

    if (updateProductDto.brand) {
      const brand = await this.brandModel.findById(updateProductDto.brand);

      if (!brand) {
        throw new HttpException('This Brand not Exist', 400);
      }
    }

    if (
      (updateProductDto.quantity && updateProductDto.quantity > product.sold) ||
      (updateProductDto.sold && updateProductDto.sold < product.quantity)
    ) {
      throw new HttpException(
        'The Quantity of Product must be less than the sold quantity',
        400,
      );
    }

    const price = updateProductDto?.price || product.price;
    const priceAfterDiscount =
      updateProductDto?.priceAfterDiscount || product.priceAfterDiscount;

    if (price < priceAfterDiscount) {
      throw new HttpException(
        'Price after discount must be less than the original price',
        400,
      );
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .select('-__v')
      .populate('category subCategory brand', '-__v -createdAt -updatedAt');

    if (!updatedProduct) {
      throw new InternalServerErrorException('Failed to update product');
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Product,
      entityId: id,
      action: Action.Update,
      performedBy: payload._id,
      data: updatedProduct.toObject(),
    });

    return {
      status: 200,
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  async remove(
    req: Request,
    id: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string };

    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('product not found');
    }

    await this.productModel.findByIdAndDelete(id);

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Product,
      entityId: id,
      action: Action.Delete,
      performedBy: payload._id,
      data: product.toObject(),
    });

    return {
      status: 200,
      message: 'Product deleted successfully',
    };
  }
}
