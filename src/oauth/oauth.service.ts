import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/user.schema';
import { ConfigService } from '@nestjs/config';
import { UserData } from './oauth.controller';

function generateRandomPassword() {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]\:;?><,./-=';
  let password = '';
  const passwordLength = Math.floor(Math.random() * (20 - 4 + 1)) + 4;

  for (let i = 0; i < passwordLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}

@Injectable()
export class OauthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(userData: UserData): Promise<{
    status: number;
    message: string;
    data: Partial<User>;
    access_token: string;
  }> {
    // business logic
    const user = await this.userModel.findOne({ email: userData.email });
    //sign-up=> if not, create a new user (create new token) (create new password)
    if (!user) {
      const newUser = await this.userModel.create({
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        password: generateRandomPassword(),
        role: 'user',
        isEmailVerified: true,
      });
      const payload = {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      };
      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SIGNIN'),
      });

      await newUser.save();

      return {
        status: 200,
        message: 'User created successfully',
        data: newUser,
        access_token: token,
      };
    }

    //sign-in=> check if user exists in the db (create new token)
    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SIGNIN'),
    });

    return {
      status: 200,
      message: 'User logged in successfully',
      data: user,
      access_token: token,
    };
  }
}
