import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CouponPaginationDto, CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PushNotificationService } from 'src/push-notification/push-notification.service';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog, AuditLogDocument } from 'src/audit-log/audit-log.schema';
import { Model, Types } from 'mongoose';
import { Coupon, couponDocument } from './coupon.schema';
import { Action, EntityTye } from 'src/audit-log/enum';
import { User, UserDocument } from 'src/user/user.schema';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<couponDocument>,

    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private pushNotificationService: PushNotificationService,
  ) {}

  async create(
    req: Request,
    createCouponDto: CreateCouponDto,
  ): Promise<{ status: number; message: string; data: Coupon }> {
    const payload = req['user'] as { _id: string; name: string };

    const coupon = await this.couponModel.findOne({
      couponCode: createCouponDto.couponCode,
    });
    if (coupon) {
      throw new HttpException('Coupon already exist', 400);
    }

    // check if userIds in users list are include in user model
    const userIds = createCouponDto.users.map((u) => u.userId);
    const validUsers = await this.userModel.find({ _id: { $in: userIds } });
    if (userIds.length !== validUsers.length) {
      throw new HttpException('Some user IDs are invalid or do not exist', 400);
    }

    const newCoupon = await this.couponModel.create(createCouponDto);

    if (!newCoupon) {
      throw new HttpException('Failed to create coupon', 500);
    }

    // Send notification to all users
    await this.pushNotificationService.sendNotificationToAll(
      'New Coupon Available for You',
      `A new coupon with code ${newCoupon.couponCode} has been created and is available for use.`,
      undefined,
      userIds, // Send to all specified user IDs
    );

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Coupon,
      entityId: newCoupon._id,
      action: Action.Create,
      performedBy: payload._id,
      data: newCoupon.toObject(),
      description: `Coupon ${newCoupon.couponCode} created by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'Coupon created successfully',
      data: newCoupon,
    };
  }

  // Pagination
  async findAll(couponPaginationDto: CouponPaginationDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<Coupon>[];
    page: number;
    totalPages: number;
  }> {
    const { _limit: limit, skip, sort, isEnable } = couponPaginationDto;

    // Build the filter query
    const filter: any = {};
    if (isEnable) filter.isEnable = isEnable === 'true' ? true : false;

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .exec(),

      this.couponModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Coupon Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
  ): Promise<{ status: number; message: string; data: Coupon }> {
    const coupon = await this.couponModel.findById(id).select('-__v');

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      status: 200,
      message: 'Coupon found',
      data: coupon,
    };
  }

  async update(
    req: Request,
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<{ status: number; message: string; data: Coupon }> {
    const payload = req['user'] as { _id: string; name: string };

    const coupon = await this.couponModel.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updatedCoupon = await this.couponModel.findByIdAndUpdate(
      id,
      updateCouponDto,
      {
        new: true,
      },
    );

    if (!updatedCoupon) {
      throw new InternalServerErrorException('Failed to update coupon');
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Coupon,
      entityId: id,
      action: Action.Update,
      performedBy: payload._id,
      data: updatedCoupon.toObject(),
      description: `Coupon ${updatedCoupon.couponCode} updated by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    };
  }

  async remove(
    req: Request,
    id: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string; name: string };

    const coupon = await this.couponModel.findOne({ _id: id, isEnable: false });

    if (!coupon) {
      throw new NotFoundException('coupon not found');
    }

    await this.couponModel.findByIdAndDelete(id);

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Coupon,
      entityId: id,
      action: Action.Delete,
      performedBy: payload._id,
      data: coupon.toObject(),
      description: `Coupon ${coupon.couponCode} deleted by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'Coupon deleted successfully',
    };
  }

  async disableCoupon(
    req: Request,
    id: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string; name: string };

    const coupon = await this.couponModel.findOne({ _id: id, isEnable: true });

    if (!coupon) {
      throw new NotFoundException('coupon not found');
    }

    const updatedCoupon = await this.couponModel.findByIdAndUpdate(
      id,
      { isEnable: false },
      { new: true },
    );

    if (!updatedCoupon) {
      throw new InternalServerErrorException('Failed to disable coupon');
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Coupon,
      entityId: id,
      action: Action.Update,
      performedBy: payload._id,
      data: updatedCoupon.toObject(),
      description: `Coupon ${updatedCoupon.couponCode} disabled by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'Coupon disabled successfully',
    };
  }

  async removeUserFromCoupon(
    req: Request,
    id: string,
    userId: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string; name: string };

    const coupon = await this.couponModel.findOne({
      _id: id,
      isEnable: true,
      'users.userId': new Types.ObjectId(userId),
    });

    if (!coupon) {
      throw new NotFoundException('coupon of user not found');
    }

    const updatedCoupon = await this.couponModel.findByIdAndUpdate(
      id,
      { $pull: { users: { userId } } },
      { new: true },
    );

    if (!updatedCoupon) {
      throw new InternalServerErrorException(
        'Failed to remove user from coupon',
      );
    }

    // Log the action in the audit log
    await this.auditLogModel.create({
      entityType: EntityTye.Coupon,
      entityId: id,
      action: Action.Update,
      performedBy: payload._id,
      data: updatedCoupon.toObject(),
      description: `User ${userId} removed from coupon ${updatedCoupon.couponCode} by admin ${payload.name}`,
    });

    return {
      status: 200,
      message: 'User Coupon removed successfully',
    };
  }
}
