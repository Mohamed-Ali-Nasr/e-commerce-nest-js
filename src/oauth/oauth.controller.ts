import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OauthService } from './oauth.service';
import { Request } from 'express';

export type UserData = {
  userId: string;
  email: string;
  name: string;
  avatar: string;
};

@Controller('auth')
export class OauthController {
  constructor(private readonly authService: OauthService) {}

  @Get('google/signin')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    return { msg: 'Google Authentication' };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: Request) {
    const { userId, email, name, avatar } = req['user'];

    const user = {
      userId,
      email,
      name,
      avatar,
    };
    return await this.callbackSign(user);
  }

  @Post('callback/signin')
  async callbackSign(user: UserData) {
    return await this.authService.validateUser(user);
  }
}
