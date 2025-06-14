import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { OauthModule } from './oauth/oauth.module';
import { CategoryModule } from './category/category.module';
import { SubCategoryModule } from './sub-category/sub-category.module';
import { PushNotificationModule } from './push-notification/push-notification.module';
import { BrandModule } from './brand/brand.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ProductModule } from './product/product.module';
import { CouponModule } from './coupon/coupon.module';
import { UploadFilesModule } from './upload-files/upload-files.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SIGNIN'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
      global: true,
    }),

    UserModule,

    AuthModule,

    OauthModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          service: 'gmail',
          secure: false,
          ignoreTLS: true,
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          auth: {
            user: configService.get<string>('MAIL_USERNAME'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"Webmaster E-commerce" <no-reply${configService.get<string>('MAIL_USERNAME')}>`,
        },
      }),
      inject: [ConfigService],
    }),

    PushNotificationModule,

    CategoryModule,

    SubCategoryModule,

    BrandModule,

    AuditLogModule,

    ProductModule,

    CouponModule,

    UploadFilesModule,

    WishlistModule,
  ],
})
export class AppModule {}
