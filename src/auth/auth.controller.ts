import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgetPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
  VerifyOtpDto,
} from './dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   *  @docs    Sign Up User
   *  @Route   POST /api/v1/auth/signup
   *  @access  public
   */
  @Post('signup')
  create(@Body() signUpDto: SignUpDto, @Req() req: Request) {
    return this.authService.signup(signUpDto, req);
  }

  /**
   *  @docs    Verify Email Account
   *  @Route   GET /api/v1/auth/verify-email/:token
   *  @access  public
   */
  @Get('verify-email/:token')
  verifyEmail(@Param() params: VerifyEmailDto) {
    return this.authService.verifyEmail(params.token);
  }

  /**
   *  @docs    Sign In User
   *  @Route   POST /api/v1/auth/signin
   *  @access  public
   */
  @Post('signin')
  signIn(@Body() signInDto: SignInDto, @Req() req: Request) {
    return this.authService.signIn(signInDto, req);
  }

  /**
   *  @docs    Any User Can Forget Password By Email
   *  @Route   POST /api/v1/auth/forget-password
   *  @access  public
   */
  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  /**
   *  @docs    Any User Can Virify Code Sent To His Email
   *  @Route   POST /api/v1/auth/verify-otp
   *  @access  public
   */
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.code);
  }

  /**
   *  @docs    Any User Can Reset Password By Email
   *  @Route   POST /api/v1/auth/reset-password
   *  @access  public
   */
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   *  @docs    Any User Can loged can refresh token
   *  @Route   POST /api/v1/auth/refresh-token
   *  @access  public
   */
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
