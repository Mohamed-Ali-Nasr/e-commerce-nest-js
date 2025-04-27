import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role, UserStatus, UserGender } from './enum';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    min: [3, 'Name must be at least 3 characters'],
    max: [10, 'Name must be at most 10 characters'],
  })
  firstName?: string;

  @Prop({
    type: String,
    min: [3, 'Name must be at least 3 characters'],
    max: [10, 'Name must be at most 10 characters'],
  })
  lastName?: string;

  @Prop({
    type: String,
    min: [3, 'Name must be at least 3 characters'],
    max: [30, 'Name must be at most 30 characters'],
  })
  name?: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    min: [3, 'password must be at least 3 characters'],
    max: [20, 'password must be at most 20 characters'],
  })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.User,
  })
  role: string;

  @Prop({
    type: String,
  })
  avatar: string;

  @Prop({
    type: Number,
  })
  age: number;

  @Prop({
    type: String,
  })
  phoneNumber: string;

  @Prop({
    type: String,
  })
  address: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
  })
  status: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isEmailVerified: boolean;

  @Prop({
    type: String,
    enum: Object.values(UserGender),
  })
  gender: string;
}

const UserSchema = SchemaFactory.createForClass(User);

export const userSchemaFactory = (configService: ConfigService) => {
  const saltRounds = parseInt(
    configService.get<string>('SALT_ROUNDS', '12'),
    10,
  );

  // Apply document middleware to set name before save
  UserSchema.pre('save', function (next) {
    if (this.firstName || this.lastName) {
      this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
    } else {
      this.name = this.name;
    }
    next();
  });

  // Apply document middleware to hash password before save
  UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
      if (
        !this.password.startsWith(
          configService.get<string>('BCRYPT_HASH', '$2b$'),
        )
      ) {
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
      }

      next();
    } catch (error) {
      next(error as Error);
    }
  });

  // Apply document middleware to hash password before update
  UserSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate() as User;

    if (!update.password) return next();

    try {
      if (
        !update.password.startsWith(
          configService.get<string>('BCRYPT_HASH', '$2b$'),
        )
      ) {
        const salt = await bcrypt.genSalt(saltRounds);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
      }

      next();
    } catch (error) {
      next(error as Error);
    }
  });

  return UserSchema;
};
