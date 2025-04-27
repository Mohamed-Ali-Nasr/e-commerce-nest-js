import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  // Name
  @IsString({ message: 'name must be a string' })
  @MinLength(3, { message: 'name must be at least 3 characters' })
  @MaxLength(30, { message: 'name must be at most 30 characters' })
  @IsNotEmpty({ message: 'name must not be empty' })
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
}

export class VerifyEmailDto {
  @IsNotEmpty({ message: 'token must not be empty' })
  token: string;
}

export class SignInDto {
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
}

export class ForgetPasswordDto {
  // Email
  @IsString({ message: 'email must be a string' })
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email must not be empty' })
  email: string;
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'code must not be empty' })
  @IsString({ message: 'code must be a string' })
  @Matches(/^\d{6}$/, {
    message: 'code must be a 6-digit number',
  })
  code: string;
}

export class ResetPasswordDto {
  // Email
  @IsString({ message: 'email must be a string' })
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email must not be empty' })
  email: string;

  // Password
  @IsString({ message: 'newPassword must be a string' })
  @MinLength(3, { message: 'newPassword must be at least 3 characters' })
  @MaxLength(20, { message: 'newPassword must be at most 20 characters' })
  @IsNotEmpty({ message: 'newPassword must not be empty' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;
}
