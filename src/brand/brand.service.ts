import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BrandPaginationDto, CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { Model } from 'mongoose';
import { PushNotificationService } from 'src/push-notification/push-notification.service';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private brandModel: Model<BrandDocument>,

    private pushNotificationService: PushNotificationService,
  ) {}

  async create(
    req: Request,
    createBrandDto: CreateBrandDto,
  ): Promise<{ status: number; message: string; data: Brand }> {
    const payload = req['user'] as { _id: string };

    const brand = await this.brandModel.findOne({
      name: createBrandDto.name
        .trim()
        .toLowerCase()
        .replace(/^\w|\s\w/g, (char) => char.toUpperCase()),
    });

    if (brand) {
      throw new HttpException('Brand already exist', 400);
    }

    const newBrnad = await (
      await this.brandModel.create({
        ...createBrandDto,
        createdBy: payload._id,
      })
    ).populate('createdBy', '_id name email role');

    const savedBrand = await newBrnad.save();

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
    const payload = req['user'] as { _id: string };

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
      .findByIdAndUpdate(
        id,
        { ...updateBrandDto, updatedBy: payload._id },
        { new: true },
      )
      .select('-__v')
      .populate([
        { path: 'updatedBy', select: '_id name email role' },
        { path: 'createdBy', select: '_id name email role' },
      ]);

    return {
      status: 200,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const brand = await this.brandModel.findById(id);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    await this.brandModel.findByIdAndDelete(id);

    return {
      status: 200,
      message: 'brand deleted successfully',
    };
  }
}
