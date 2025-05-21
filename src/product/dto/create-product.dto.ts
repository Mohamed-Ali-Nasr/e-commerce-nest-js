import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Title Must be a String' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @IsNotEmpty({ message: 'Title must not be empty' })
  title: string;

  @IsString({ message: 'Description Must be a String' })
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @IsNotEmpty({ message: 'Description must not be empty' })
  description: string;

  @IsNumber({}, { message: 'quantity Must be a Number' })
  @Min(1, { message: 'quantity must be at least 1 characters' })
  @IsNotEmpty({ message: 'quantity must not be empty' })
  quantity: number;

  @IsString({ message: 'imageCover Must be a String' })
  @IsUrl({}, { message: 'imageCover Must be a URL' })
  @IsNotEmpty({ message: 'imageCover must not be empty' })
  imageCover: string;

  @IsArray({ message: 'Images Must be an array' })
  @IsOptional()
  images: string[];

  @IsNumber({}, { message: 'sold Must be a Number' })
  @IsOptional()
  sold: number;

  @IsNumber({}, { message: 'Price Must be a Number' })
  @Min(1, { message: 'price must be at least 1 L.E' })
  @Max(20000, { message: 'price must be at max 20000 L.E' })
  @IsNotEmpty({ message: 'price must not be empty' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'priceAfterDiscount Must be a Number' })
  @Min(1, { message: 'priceAfterDiscount must be at least 1 L.E' })
  @Max(20000, { message: 'priceAfterDiscount must be at max 20000 L.E' })
  priceAfterDiscount: number;

  @IsOptional()
  @IsArray({ message: 'Images Must be an array' })
  colors: string[];

  @IsString({ message: 'category Must be a String' })
  @IsMongoId({ message: 'category Must be MongoId' })
  @IsNotEmpty({ message: 'category must not be empty' })
  category: string;

  @IsOptional()
  @IsString({ message: 'subCategory Must be a String' })
  @IsMongoId({ message: 'subCategory Must be MongoId' })
  subCategory: string;

  @IsOptional()
  @IsString({ message: 'brand Must be a String' })
  @IsMongoId({ message: 'brand Must be MongoId' })
  brand: string;
}

export class ProductPaginationDto {
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
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({ message: 'category must be a string' })
  @IsMongoId({ message: 'category must be a valid mongo id' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'subCategory must be a string' })
  @IsMongoId({ message: 'subCategory must be a valid mongo id' })
  subCategory?: string;

  @IsOptional()
  @IsString({ message: 'brand must be a string' })
  @IsMongoId({ message: 'brand must be a valid mongo id' })
  brand?: string;
}
