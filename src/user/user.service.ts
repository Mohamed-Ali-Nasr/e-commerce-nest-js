import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto';
import { User, UserDocument } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, UserStatus } from './enum';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
    private configService: ConfigService,
  ) {}

  // ===================== For Admin Only =====================

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ status: number; message: string; data: User }> {
    const { email, password, role } = createUserDto;

    const isEmailExist = await this.userModel.findOne({ email });

    // If User Exist
    if (isEmailExist) {
      throw new HttpException('User already exist', 409); // 'User already exist'
    }

    // Create New User
    const user = {
      password,
      role: role ?? Role.User,
      isEmailVerified: true,
    };
    const newUser = await this.userModel.create({
      ...createUserDto,
      ...user,
    });

    await newUser.save();

    return {
      status: 200,
      message: 'User Created Successfully',
      data: newUser,
    };
  }

  // Pagination
  async findAll(dto: PaginationDto): Promise<{
    status: number;
    message: string;
    total: number;
    data: Partial<User>[];
    page: number;
    totalPages: number;
  }> {
    const { _limit: limit, skip, sort, name, email, role } = dto;

    // Build the filter query
    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (role) filter.role = role;

    // Determine sort order (default: sort by `createdAt` in descending order)
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      status: 200,
      message: 'Users Found Successfully',
      total,
      data,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<{ status: number; data: User }> {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: 200,
      data: user,
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{
    status: number;
    message: string;
    data: User;
  }> {
    const userExist = await this.userModel
      .findById(id)
      .select('-password -__v');
    if (!userExist) {
      throw new NotFoundException('User not found');
    }

    const user = {
      ...updateUserDto,
    };

    return {
      status: 200,
      message: 'User Updated Successfully',
      data: await this.userModel.findByIdAndUpdate(id, user, {
        new: true,
      }),
    };
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndDelete(id);

    return {
      status: 200,
      message: 'User Deleted Successfully',
    };
  }

  // ===================== For User Only =====================
  // User Can Get Data
  async getMe(payload: { _id: string }): Promise<{
    status: number;
    message: string;
    data: User;
  }> {
    if (!payload._id) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      status: 200,
      message: 'User Found Successfully',
      data: user,
    };
  }

  // User Can Update Data
  async updateMe(
    req: Request,
    updateUserDto: UpdateUserDto,
  ): Promise<{
    status: number;
    message: string;
    data?: User;
  }> {
    const payload = req['user'] as { _id: string; role: string };

    if (!payload._id) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = {
      ...updateUserDto,
    };

    if (updateUserDto.role && payload.role === Role.User) {
      throw new HttpException('You are not authorized to change role', 403);
    }

    // update email address and send verification email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const isEmailExist = await this.userModel.findOne({
        email: updateUserDto.email,
      });
      if (isEmailExist) {
        throw new HttpException('Email already exist', 409); // 'User already exist'
      }

      // Change Email verification Of Account  =>
      user.isEmailVerified = false;
      await user.save();

      // Generate Token For Updated User Account =>
      const token = await this.jwtService.signAsync(
        { userId: user._id, email: updateUserDto.email },
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
          to: updateUserDto.email,
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
        if (!isEmailSent.accepted.includes(updateUserDto.email)) {
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
        message:
          'You May Want To Update Your Email Address Please Verify It First And Then Login Again',
      };
    }

    return {
      status: 200,
      message: 'User Updated Successfully',
      data: await this.userModel
        .findByIdAndUpdate(payload._id, updatedUser, {
          new: true,
        })
        .select('-password -__v'),
    };
  }

  // User Can unActive Account
  async deleteMe(payload: { _id: string }): Promise<{
    status: number;
    message: string;
  }> {
    if (!payload._id) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndUpdate(payload._id, {
      status: UserStatus.Inactive,
    });

    return {
      status: 200,
      message: 'user soft deleted successfully',
    };
  }
}
