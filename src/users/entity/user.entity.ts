// user.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ type: Date, default: null })     
  lastLogin: Date | null;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })     
  verificationToken: string | null;

  @Prop({ type: Date, default: null })
  verificationTokenExpiry: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);