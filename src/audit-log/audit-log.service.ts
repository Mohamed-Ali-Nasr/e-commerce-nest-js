import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import { Model } from 'mongoose';
import { GetAuditLogsDto } from './dto/get-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async findAll(query: GetAuditLogsDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<AuditLog>[];
    page: number;
    totalPages: number;
  }> {
    const {
      _limit: limit,
      entityType,
      action,
      performedBy,
      startDate,
      endDate,
      sort,
      skip,
    } = query;

    const filter: any = {};
    if (entityType) filter.entityType = entityType;
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('performedBy', '_id name email role')
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Audit Logs Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }
}
