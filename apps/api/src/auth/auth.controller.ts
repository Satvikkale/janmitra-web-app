import { Body, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto, NgoRegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('register-ngo-user')
  registerNgoUser(@Body() dto: {
    ngoName: string;
    name: string;
    position: string;
    mobileNo: string;
    password: string;
  }) {
    return this.auth.registerNgoUser(dto);
  }

  @Post('register-ngo')
  registerNgo(@Body() dto: NgoRegisterDto) {
    return this.auth.registerNgo(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto & { ngoName?: string }) {
    return this.auth.login(dto.identifier, dto.password, dto.userType, dto.ngoName);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('available-ngos')
  getAvailableNgos() {
    return this.auth.getAvailableNgos();
  }
}