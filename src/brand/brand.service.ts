import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BrandPaginationDto, CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { Model } from 'mongoose';
import { PushNotificationService } from 'src/push-notification/push-notification.service';
import { AuditLog, AuditLogDocument } from 'src/audit-log/audit-log.schema';
import { Action, EntityTye } from 'src/audit-log/enum';
import { Product, productDocument } from 'src/product/product.schema';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private brandModel: Model<BrandDocument>,

    @InjectModel(Product.name)
    private productModel: Model<productDocument>,

    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,

    private pushNotificationService: PushNotificationService,
  ) {}

  async create(
    req: Request,
    createBrandDto: CreateBrandDto,
  ): Promise<{ status: number; message: string; data: Brand }> {
    const payload = req['user'] as { _id: string; name: string };

    const brand = await this.brandModel.findOne({
      name: createBrandDto.name
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
    });

    if (brand) {
      throw new HttpException('Brand already exist', 400);
    }

    const newBrnad = await this.brandModel.create(createBrandDto);

    const savedBrand = await newBrnad.save();

    if (!savedBrand) {
      throw new InternalServerErrorException('Failed to create brand');
    }

    // Send notification to all users
    try {
      await this.pushNotificationService.sendNotificationToAll(
        'New Brand Added!',
        `Check out our new brand: ${savedBrand.name}`,
      );
      console.log(`Notification sent for Brnad: ${savedBrand.name}`);
    } catch (error) {
      console.error(
        `Failed to send notification for Brnad ${savedBrand.name}:`,
        error,
      );
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Brand,
      entityId: savedBrand._id,
      action: Action.Create,
      performedBy: payload._id,
      data: savedBrand.toObject(),
      description: `Brand ${savedBrand.name} created by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'Brnad created successfully',
      data: newBrnad,
    };
  }

  // Pagination
  async findAll(brandPaginationDto: BrandPaginationDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<Brand>[];
    page: number;
    totalPages: number;
  }> {
    const { _limit: limit, skip, sort, name } = brandPaginationDto;

    // Build the filter query
    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .exec(),

      this.brandModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Brands Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
  ): Promise<{ status: number; message: string; data: Brand }> {
    const brand = await this.brandModel.findById(id).select('-__v');

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      status: 200,
      message: 'Brand found',
      data: brand,
    };
  }

  async update(
    req: Request,
    id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<{ status: number; message: string; data: Brand }> {
    const payload = req['user'] as { _id: string; name: string };

    const brand = await this.brandModel.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // update the brand name to be capitalized
    if (
      updateBrandDto.name &&
      brand.name !==
        updateBrandDto.name
          .trim()
          .toLowerCase()
          .replace(/^\w|\s\w/g, (char) => char.toUpperCase())
    ) {
      const existingBrand = await this.brandModel.findOne({
        name: updateBrandDto.name
          .trim()
          .toLowerCase()
          .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
      });
      if (existingBrand) {
        throw new ConflictException('Brand name already exists');
      }

      updateBrandDto.name = updateBrandDto.name
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase());
    }

    const updatedBrand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, { new: true })
      .select('-__v');

    if (!updatedBrand) {
      throw new InternalServerErrorException('Failed to update brand');
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Brand,
      entityId: id,
      action: Action.Update,
      performedBy: payload._id,
      data: updatedBrand.toObject(),
      description: `Brand ${updatedBrand.name} updated by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  async remove(
    req: Request,
    id: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string; name: string };

    const brand = await this.brandModel.findById(id);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    await Promise.all([
      this.brandModel.deleteOne({ _id: id }).exec(),
      this.productModel.deleteMany({ brand: id }).exec(),
    ]);

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Brand,
      entityId: id,
      action: Action.Delete,
      performedBy: payload._id,
      data: brand.toObject(),
      description: `Brand ${brand.name} deleted by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'brand deleted successfully',
    };
  }
}
