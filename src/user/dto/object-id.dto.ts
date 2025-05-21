import { IsMongoId, IsString } from 'class-validator';

export class ObjectIdDto {
  @IsMongoId({ message: 'Invalid MongoDB ObjectId' })
  @IsString({ message: 'ObjectId must be a string' })
  id: string;
}
