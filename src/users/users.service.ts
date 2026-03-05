// users.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserDocument, UserRole } from './entity/user.entity';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role ?? UserRole.STUDENT,
      verificationToken,
      verificationTokenExpiry,
    });

    await this.sendVerificationEmail(dto.email, dto.name, verificationToken);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userModel.findOne({
      verificationToken: dto.token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) throw new BadRequestException('Invalid or expired verification token');

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    const token = this.signToken(user);

    return {
      message: 'Email verified successfully',
      data: { token },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.signToken(user);

    return {
      message: 'Login successful',
      data: { token },
    };
  }

  logout() {
    return { message: 'Logged out successfully' };
  }

  getMe(user: UserDocument) {
    return {
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
      },
    };
  }

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  }

  private async sendVerificationEmail(email: string, name: string, token: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${name}, welcome!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verify Email
          </a>
          <p>Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
    });
  }
}