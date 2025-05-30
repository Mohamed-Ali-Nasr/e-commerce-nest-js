import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController, UserMeController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchemaFactory } from './user.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) =>
          userSchemaFactory(configService),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserController, UserMeController],
  providers: [UserService],
})
export class UserModule {}
