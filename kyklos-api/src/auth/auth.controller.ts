import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBody({ schema: { type: 'object', example: { email: 'test@example.com', otp: '123456' } } })
  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.auth.verifyOtp(body.email, body.otp);
  }

  @ApiBody({ schema: { type: 'object', example: { idToken: 'eyJhbGciOiJSUzI...' } } })
  @Post('google')
  googleLogin(@Body('idToken') idToken: string) {
    return this.auth.googleLogin(idToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.auth.getMe(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { name: 'John Doe', avatarUrl: 'https://example.com/avatar.jpg' } } })
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() body: { name?: string; avatarUrl?: string }) {
    return this.auth.updateProfile(req.user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { pin: '123456' } } })
  @Post('setup-pin')
  setupPin(@Request() req: any, @Body('pin') pin: string) {
    return this.auth.setupPin(req.user.id, pin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { pin: '123456' } } })
  @Post('verify-pin')
  verifyPin(@Request() req: any, @Body('pin') pin: string) {
    return this.auth.verifyPin(req.user.id, pin);
  }
}
