import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/user.schema';
import { RefreshTokenDto, ResetPasswordDto, SignInDto, SignUpDto } from './dto';
import { UserStatus, Role } from 'src/user/enum';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Otp, OtpDocument } from './otp.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
    private configService: ConfigService,
  ) {}

  async signup(
    signUpDto: SignUpDto,
    req: Request,
  ): Promise<{
    status: number;
    message: string;
  }> {
    const { email, password } = signUpDto;

    const isUserExist = await this.userModel.findOne({ email });

    if (isUserExist) {
      throw new HttpException('User already exist', 400);
    }

    const userCreated = {
      password,
      role: Role.User,
    };

    const newUser = await this.userModel.create({
      ...signUpDto,
      ...userCreated,
    });

    // Generate Token For New User =>
    const token = await this.jwtService.signAsync(
      { userId: newUser._id, email },
      {
        secret: this.configService.get<string>('JWT_VERIFIED_EMAIL'),
        expiresIn: '1h',
      },
    );

    // Generate Email Confirmation Link =>
    const confirmationLink = `${req.protocol === 'http' && this.configService.get<string>('NODE_ENV') === 'production' ? 'https' : req.protocol}://${req.headers.host}/api/v1/auth/verify-email/${token}`;

    // Sending Email To Verify If Email Is Valid =>
    try {
      const isEmailSent = await this.mailService.sendMail({
        to: email,
        subject: 'Welcome to E-commerce Webmaster App - Verify Your Email',
        text: `Hello,\n\nThank you for signing up with E-commerce App. To complete your registration, please verify your email address by visiting the following link:\n\n${confirmationLink}\n\nIf you didn’t request this, you can safely ignore this email.\n\nBest regards,\nE-commerce Webmaster App`,
        html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email Address</title>
          </head>

           <body>
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                  <tr>
                   <td align="center" bgcolor="#ffffff" style="padding: 40px 0 30px 0;">
                      <img src="[invalid url, do not cite] alt="E-commerce App Logo" width="150" height="50" style="display: block; border: 0px;" />
                    </td>
                  </tr>
                  <tr>
                   <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">Hello,</p>
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">Thank you for signing up with E-commerce App. To complete your registration, please verify your email address by clicking the button below.</p>
                     <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                        <tr>
                          <td align="center" style="border-radius: 5px;">
                            <a href="${confirmationLink}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Verify Email</a>
                          </td>
                        </tr>
                     </table>
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">If you didn’t request this, you can safely ignore this email.</p>
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">Best regards,<br>E-commerce Webmaster App</p>
                    </td>
                  </tr>
               </table>
           </body>
        </html>
      `,
      });

      if (isEmailSent.rejected.length) {
        throw new HttpException('Verification Email Sending Is Failed', 500);
      }
      if (!isEmailSent.accepted.includes(email)) {
        throw new HttpException('Email not accepted by SMTP server', 500);
      }
    } catch (error) {
      throw new HttpException(
        `Failed to send verification email: ${error.message}`,
        500,
      );
    }

    // save the user to the database
    await newUser.save();

    return {
      status: 200,
      message:
        'Signup successful! Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string): Promise<{
    status: number;
    message: string;
    data: Partial<User>;
  }> {
    try {
      // Verify Token Param To Get The data
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_VERIFIED_EMAIL'),
      });

      if (!payload.userId) {
        throw new UnauthorizedException('Invalid Token');
      }

      // Find The User Account And Update isEmailVerified State =>
      const confirmedUser = await this.userModel
        .findOneAndUpdate(
          { _id: payload.userId, isEmailVerified: false },
          { isEmailVerified: true, email: payload.email },
          { new: true },
        )
        .select('_id name email isEmailVerified');

      // Check If The User Account Not Exist =>
      if (!confirmedUser) {
        throw new NotFoundException('No Users Found By This Id');
      }

      return {
        status: 201,
        message: 'Email Verified Successfully',
        data: confirmedUser,
      };
    } catch (error) {
      throw new HttpException(`Failed to verify email: ${error.message}`, 500);
    }
  }

  async signIn(
    signInDto: SignInDto,
    req: Request,
  ): Promise<{
    status: number;
    message: string;
    data: Partial<User>;
    access_token: string;
    refresh_token: string;
  }> {
    // Find User By Email =>
    const user = await this.userModel
      .findOne({ email: signInDto.email })
      .select('-__v');
    if (!user) {
      throw new BadRequestException('Invalid Email Or Password');
    }

    // compare password =>
    const isMatch = await bcrypt.compare(signInDto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid Email Or Password');
    }

    // Ensure User Email Is Already Verified =>
    if (!user.isEmailVerified) {
      // Generate Token For New User =>
      const token = await this.jwtService.signAsync(
        { userId: user._id, email: user.email },
        {
          secret: this.configService.get<string>('JWT_VERIFIED_EMAIL'),
          expiresIn: '1h',
        },
      );

      // Generate Email Confirmation Link =>
      const confirmationLink = `${req.protocol === 'http' && this.configService.get<string>('NODE_ENV') === 'production' ? 'https' : req.protocol}://${req.headers.host}/api/v1/auth/verify-email/${token}`;

      // Sending Email To Verify If Email Is Valid =>
      try {
        const isEmailSent = await this.mailService.sendMail({
          to: user.email,
          subject: 'Welcome to E-commerce Webmaster App - Verify Your Email',
          text: `Hello,\n\nThank you for signing up with E-commerce App. To complete your registration, please verify your email address by visiting the following link:\n\n${confirmationLink}\n\nIf you didn’t request this, you can safely ignore this email.\n\nBest regards,\nE-commerce Webmaster App`,
          html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email Address</title>
          </head>

           <body>
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                  <tr>
                   <td align="center" bgcolor="#ffffff" style="padding: 40px 0 30px 0;">
                      <img src="[invalid url, do not cite] alt="E-commerce App Logo" width="150" height="50" style="display: block; border: 0px;" />
                    </td>
                  </tr>
                  <tr>
                   <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">Hello,</p>
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">Thank you for signing up with E-commerce App. To complete your registration, please verify your email address by clicking the button below.</p>
                     <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                        <tr>
                          <td align="center" style="border-radius: 5px;">
                            <a href="${confirmationLink}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Verify Email</a>
                          </td>
                        </tr>
                     </table>
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">If you didn’t request this, you can safely ignore this email.</p>
                      <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">Best regards,<br>E-commerce Webmaster App</p>
                    </td>
                  </tr>
               </table>
           </body>
        </html>
      `,
        });

        if (isEmailSent.rejected.length) {
          throw new HttpException('Verification Email Sending Is Failed', 500);
        }
        if (!isEmailSent.accepted.includes(user.email)) {
          throw new HttpException('Email not accepted by SMTP server', 500);
        }
      } catch (error) {
        throw new HttpException(
          `Failed to send verification email: ${error.message}`,
          500,
        );
      }

      throw new BadRequestException(
        'Your account is not verified yet, Please check your email to verify your account first and then login',
      );
    }

    // Generate Token For Existing User =>
    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // make the status active if the user is inactive
    if (user.status === UserStatus.Inactive || !user.status) {
      user.status = UserStatus.Active;
    }

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SIGNIN'),
    });

    // Generate Refresh Token For Existing User =>
    const refresh_token = await this.jwtService.signAsync(
      { ...payload, countEX: 5 },
      {
        secret: this.configService.get<string>('JWT_SECRET_REFRESHTOKEN'),
        expiresIn: '7d', // 7 days
      },
    );

    await user.save();

    return {
      status: 200,
      message: 'User logged in successfully',
      data: user,
      access_token: token,
      refresh_token,
    };
  }

  async forgetPassword(email: string): Promise<{
    status: number;
    message: string;
  }> {
    const user = await this.userModel.findOne({ email, isEmailVerified: true });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate OTP =>
    const otp = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');

    // Hashed Otp =>
    const hashedOtp = crypto
      .createHmac('sha256', this.configService.get<string>('OTP_SECRET'))
      .update(otp)
      .digest('hex');

    // Delete any existing OTP for the user
    await this.otpModel.deleteMany({ userId: user._id }).exec();

    // Save OTP To Database With Expiration Time =>
    await this.otpModel.create({
      otp: hashedOtp,
      userId: user._id,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP To User's Email =>
    try {
      const isEmailSent = await this.mailService.sendMail({
        to: email,
        subject: 'Your OTP Code For Password Reset (Valid for 10 minutes)',
        text: `Your OTP is ${otp}. Valid for 10 minutes.`,
        html: `
          <div style="font-family: Arial; text-align: center; padding: 20px;">
            <h2>Your Verification Code</h2>
            <p style="font-size: 24px; color: #2d3436; background: #dfe6e9; padding: 10px; display: inline-block;">
             ${otp}
            </p>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p style="color: #e74c3c;">⚠️ Don't share this code with anyone!</p>
          </div>`,
      });

      if (isEmailSent.rejected.length) {
        throw new HttpException('Verification Email Sending Is Failed', 500);
      }
      if (!isEmailSent.accepted.includes(email)) {
        throw new HttpException('Email not accepted by SMTP server', 500);
      }
    } catch (error) {
      throw new HttpException(
        `Failed to send verification email: ${error.message}`,
        500,
      );
    }

    return {
      status: 200,
      message: `OTP Sent To Your Email Successfully`,
    };
  }

  async verifyOtp(otp: string): Promise<{
    status: number;
    message: string;
  }> {
    // Verify Otp =>
    const hashedOtp = crypto
      .createHmac('sha256', this.configService.get<string>('OTP_SECRET'))
      .update(otp)
      .digest('hex');

    const otpRecord = await this.otpModel
      .findOne({ otp: hashedOtp, isUsed: false })
      .exec();

    if (!otpRecord) {
      throw new BadRequestException('nvalid OTP');
    }

    // Check If Otp Is Expired =>
    if (otpRecord.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Mark OTP As Used =>
    await this.otpModel.findByIdAndUpdate(otpRecord._id, { isUsed: true });

    return {
      status: 200,
      message: 'OTP verified successfully',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
    status: number;
    message: string;
  }> {
    const { email, newPassword } = resetPasswordDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // Check If Otp Is Used =>
    const otpRecord = await this.otpModel.findOne({
      userId: user._id,
      isUsed: true,
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP is not used or expired');
    }

    // update the password in the database
    user.password = newPassword;

    // save the new password to the database
    await user.save();

    return {
      status: 200,
      message: 'Password changed successfully, go to login',
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refresh_token,
        {
          secret: this.configService.get<string>('JWT_SECRET_REFRESHTOKEN'),
        },
      );

      if (!payload || payload.countEX <= 0) {
        throw new UnauthorizedException(
          'Invalid refresh token, please go to login again',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, ...newPayload } = payload;

      const newPayoadForAccessToken = {
        _id: newPayload._id,
        email: newPayload.email,
        role: newPayload.role,
      };

      // create access token
      const access_token = await this.jwtService.signAsync(
        newPayoadForAccessToken,
        { secret: this.configService.get<string>('JWT_SIGNIN') },
      );

      // create refresh token
      const refresh_token = await this.jwtService.signAsync(
        { ...newPayload, countEX: payload.countEX - 1 },
        {
          secret: this.configService.get<string>('JWT_SECRET_REFRESHTOKEN'),
          expiresIn: '7d',
        },
      );

      return {
        status: 200,
        message: 'Refresh Access token successfully',
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new HttpException(`Failed to refresh token: ${error.message}`, 401);
    }
  }
}
