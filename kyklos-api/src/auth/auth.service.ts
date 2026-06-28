import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtpEmail(email: string, otp: string) {
    this.logger.log(`Sending OTP ${otp} to ${email}`);
    if (process.env.RESEND_API_KEY) {
      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Kyklos <onboarding@resend.dev>',
        to: email,
        subject: 'Kode Verifikasi Kyklos Anda',
        html: `<p>Kode verifikasi Anda adalah: <strong>${otp}</strong></p><p>Berlaku selama 5 menit.</p>`,
      });
    } else {
      this.logger.warn(`RESEND_API_KEY missing. OTP for ${email} is ${otp}`);
    }
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Register attempt: ${dto.email}`);
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`Register failed — email already exists: ${dto.email}`);
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOTP();
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, otp, emailVerified: false },
    });
    this.logger.log(`User registered: ${user.id} (${user.email})`);
    
    await this.sendOtpEmail(user.email, otp);
    return { requireOtp: true, email: user.email, message: 'OTP dikirim' };
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      this.logger.warn(`Login failed — user not found: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Login failed — wrong password: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      const otp = this.generateOTP();
      await this.prisma.user.update({ where: { id: user.id }, data: { otp } });
      await this.sendOtpEmail(user.email, otp);
      throw new UnauthorizedException('REQUIRE_OTP');
    }

    this.logger.log(`Login success: ${user.id} (${user.email})`);
    return this.sign(user);
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid user');
    if (user.otp !== otp) {
      throw new BadRequestException('Kode OTP salah');
    }
    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, otp: null },
    });
    return this.sign(verifiedUser);
  }

  async googleLogin(idToken: string) {
    this.logger.log('Google login attempt');
    if (!admin.apps.length) {
      this.logger.error('Firebase Admin not initialized — Google login disabled');
      throw new UnauthorizedException('Google login not configured');
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      this.logger.warn(`Google token verification failed: ${err}`);
      throw new UnauthorizedException('Invalid Google token');
    }

    const { email, name, picture } = decoded;
    if (!email) throw new UnauthorizedException('No email in Google token');

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name: name ?? email.split('@')[0], avatarUrl: picture ?? null, passwordHash: '', emailVerified: true },
      });
      this.logger.log(`New user created via Google: ${user.id} (${email})`);
    } else {
      if (!user.avatarUrl && picture) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl: picture } });
      }
      this.logger.log(`Existing user logged in via Google: ${user.id} (${email})`);
    }

    return this.sign(user);
  }

  async updateProfile(id: string, data: { name?: string; avatarUrl?: string }) {
    this.logger.log(`Profile update: user ${id}`);
    
    // Cegah error Prisma kalau payload data kosong
    if (!data || Object.keys(data).length === 0) {
      return this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, avatarUrl: true },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }

  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true, pin: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { pin, ...rest } = user;
    return { ...rest, hasPin: !!pin };
  }

  async setupPin(id: string, pin: string) {
    if (!/^\d{6}$/.test(pin)) {
      throw new UnauthorizedException('PIN must be exactly 6 digits');
    }
    await this.prisma.user.update({
      where: { id },
      data: { pin },
    });
    return { success: true };
  }

  async verifyPin(id: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { pin: true } });
    if (!user || user.pin !== pin) {
      throw new UnauthorizedException('PIN salah');
    }
    return { success: true };
  }

  private sign(user: { id: string; email: string; name: string | null }) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
