import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { CouponType } from '../enum';
import { Type } from 'class-transformer';

export class UsersDto {
  @IsMongoId({ message: 'userId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'userId must not be empty' })
  userId: string;

  @IsNumber({}, { message: 'maxCount must be a number' })
  @IsNotEmpty({ message: 'maxCount must not be empty' })
  maxCount: number;

  @IsNumber({}, { message: 'usageCount must be a number' })
  @IsNotEmpty({ message: 'usageCount must not be empty' })
  usageCount: number;
}

export class CreateCouponDto {
  @IsString({ message: 'couponCode must be a string' })
  @IsNotEmpty({ message: 'couponCode must not be empty' })
  @Matches(/^\d{6}$/, {
    message: 'couponCode must be a 6-digit number',
  })
  couponCode: string;

  @IsNotEmpty({ message: 'couponAmount must not be empty' })
  @IsNumber({}, { message: 'couponAmount must be a number' })
  couponAmount: number;

  @IsNotEmpty({ message: 'startDate must not be empty' })
  @IsDateString(
    {},
    {
      message:
        'startDate must be a valid ISO 8601 date string (e.g., 2025-05-13 or 2025-05-13T00:00:00.000Z)',
    },
  )
  startDate: string;

  @IsNotEmpty({ message: 'endDate must not be empty' })
  @IsDateString(
    {},
    {
      message:
        'endDate must be a valid ISO 8601 date string (e.g., 2025-05-13 or 2025-05-13T23:59:59.999Z)',
    },
  )
  endDate: string;

  @IsNotEmpty({ message: 'couponType must not be empty' })
  @IsString()
  @IsEnum(Object.values(CouponType), {
    message: 'couponType must be amount or precentage',
  })
  couponType: string;

  @IsArray({ message: 'users must be an array' })
  @ValidateNested({ each: true })
  @IsNotEmpty({ message: 'users must not be empty' })
  @Type(() => UsersDto)
  users: UsersDto[];
}

export class CouponPaginationDto {
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
  @IsIn(['asc', 'desc'])
  sort: 'asc' | 'desc' = 'desc'; // Default to descending order

  @IsOptional()
  @IsString()
  isEnable: string;
}
