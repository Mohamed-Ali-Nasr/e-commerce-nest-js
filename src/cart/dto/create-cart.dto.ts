import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateCartDto {
  @IsString({ message: 'productId must be a string' })
  @IsNotEmpty({ message: 'productId must not be empty' })
  @IsMongoId({ message: 'productId must be a valid mongo id' })
  productId: string;
}
