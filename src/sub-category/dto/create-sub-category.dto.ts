import {
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubCategoryDto {
  @IsString({ message: 'name must be a string' })
  @MinLength(3, { message: 'name must be at least 3 characters' })
  @MaxLength(30, { message: 'name must be at most 30 characters' })
  name: string;
}

export class CategoryIdDto {
  @IsString({ message: 'categoryId must be a string' })
  @IsMongoId({ message: 'categoryId must be a valid mongo id' })
  categoryId: string;
}

export class SubCategoryPaginationDto {
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
  @IsString({ message: 'categoryId must be a string' })
  @IsMongoId({ message: 'categoryId must be a valid mongo id' })
  categoryId: string;
}
