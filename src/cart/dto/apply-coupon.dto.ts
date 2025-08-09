import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ApplyCouponDto {
  @IsString({ message: 'couponCode must be a string' })
  @IsNotEmpty({ message: 'couponCode must not be empty' })
  @Matches(/^\d{6}$/, {
    message: 'couponCode must be a 6-digit number',
  })
  couponCode: string;
}
