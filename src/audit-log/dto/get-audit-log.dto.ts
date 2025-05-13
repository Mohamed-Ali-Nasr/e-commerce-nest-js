import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  IsNumber,
  IsIn,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Action, EntityTye } from '../enum';

export class GetAuditLogsDto {
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort: 'asc' | 'desc' = 'desc'; // Default to descending order

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '_limit must be a number' })
  @Min(1)
  _limit: number = 10; // Default to 10 items per page

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'skip must be a number' })
  @Min(0)
  skip: number = 0; // Default to start from the beginning

  @IsOptional()
  @IsString()
  @IsEnum(Object.values(EntityTye), {
    message: 'entityType must be category, sub-category, brand or product',
  })
  entityType?: string;

  @IsOptional()
  @IsString()
  @IsEnum(Object.values(Action), {
    message: 'action must be create, update, or delete',
  })
  action?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid MongoDB ObjectId' })
  performedBy?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'startDate must be a valid ISO 8601 date string (e.g., 2025-05-13 or 2025-05-13T00:00:00.000Z)',
    },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'endDate must be a valid ISO 8601 date string (e.g., 2025-05-13 or 2025-05-13T23:59:59.999Z)',
    },
  )
  endDate?: string;
}
