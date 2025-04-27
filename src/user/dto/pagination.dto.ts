import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  Min,
  IsIn,
  IsString,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Role } from '../enum';

export class PaginationDto {
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
  name?: string;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'email is not valid' })
  email?: string;

  @IsOptional()
  @IsEnum(Object.values(Role), { message: 'role must be user or admin' })
  role?: string;
}
