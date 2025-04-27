import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role, UserGender, UserStatus } from '../enum';

export class CreateUserDto {
  // FirstName
  @IsString({ message: 'firstName must be a string' })
  @MinLength(3, { message: 'firstName must be at least 3 characters long' })
  @MaxLength(10, { message: 'firstName must be at most 10 characters long' })
  @IsOptional()
  firstName: string;

  // LastName
  @IsString({ message: 'lastName must be a string' })
  @MinLength(3, { message: 'lastName must be at least 3 characters long' })
  @MaxLength(10, { message: 'lastName must be at most 10 characters long' })
  @IsOptional()
  lastName: string;

  // Name
  @IsString({ message: 'name must be a string' })
  @MinLength(3, { message: 'name must be at least 3 characters long' })
  @MaxLength(30, { message: 'name must be at most 30 characters long' })
  @IsOptional()
  name: string;

  // Email
  @IsString({ message: 'email must be a string' })
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email must not be empty' })
  email: string;

  // Password
  @IsString({ message: 'password must be a string' })
  @MinLength(3, { message: 'password must be at least 3 characters' })
  @MaxLength(20, { message: 'password must be at most 20 characters' })
  @IsNotEmpty({ message: 'password must not be empty' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  // Role
  @IsEnum(Object.values(Role), { message: 'role must be user or admin' })
  @IsOptional()
  role: string;

  // Avatar
  @IsString({ message: 'avatar must be a string' })
  @IsUrl({}, { message: 'avatar must be a valid URL' })
  @IsOptional()
  avatar: string;

  // Age
  @IsNumber({}, { message: 'age must be a number' })
  @IsOptional()
  age: number;

  // PhoneNumber
  @IsString({ message: 'phoneNumber must be a string' })
  @IsPhoneNumber('EG', {
    message: 'phoneNumber must be a Egyptian phone number',
  })
  @IsOptional()
  phoneNumber: string;

  // Address
  @IsString({ message: 'address must be a string' })
  @IsOptional()
  address: string;

  // Status
  @IsString({ message: 'status must be a string' })
  @IsEnum(Object.values(UserStatus), {
    message: 'status must be active or inactive',
  })
  @IsOptional()
  status: string;

  // Gender
  @IsEnum(Object.values(UserGender), {
    message: 'gender must be male or female',
  })
  @IsOptional()
  gender: string;
}
