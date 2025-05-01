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

// Reusable function for password hashing with try-catch
const hashPassword = async (
  doc: User,
  configService: ConfigService,
  saltRounds: number = 10,
): Promise<void> => {
  try {
    // Ensure password exists
    if (!doc.password) return;

    // Skip if password is already hashed
    const bcryptHashPrefix = configService.get<string>('BCRYPT_HASH', '$2b$');

    if (doc.password.startsWith(bcryptHashPrefix)) return;

    // Hash the password
    const salt = await bcrypt.genSalt(saltRounds);
    doc.password = await bcrypt.hash(doc.password, salt);
  } catch (error) {
    throw new Error(`Failed to hash password: ${error.message}`);
  }
};

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
    // Skip if password is not modified
    if (!this.isModified('password')) return next();

    await hashPassword(this, configService, saltRounds);

    next();
  });

  // Apply document middleware to hash password before update
  UserSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate() as User;
    // Skip if password is not in the update
    if (!update.password) return next();

    await hashPassword(update, configService, saltRounds);

    next();
  });

  return UserSchema;
};
