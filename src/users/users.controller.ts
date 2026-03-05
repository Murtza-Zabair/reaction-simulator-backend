// users.controller.ts
import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/auth.dto';
import { JwtAuthGuard } from 'src/guard/jwt.guard';

@Controller('user')
export class UsersController {
  constructor(private authService: UsersService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.authService.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user);
  }
}