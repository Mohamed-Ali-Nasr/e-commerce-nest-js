import { IsMongoId } from 'class-validator';

export class ObjectIdDto {
  @IsMongoId({ message: 'Invalid MongoDB ObjectId' })
  id: string;
}
