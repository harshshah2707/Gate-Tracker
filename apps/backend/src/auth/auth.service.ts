import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; name: string; password?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        college: '',
        graduationYear: 0,
        currentYear: 0,
        targetRank: 0,
        targetScore: 0,
        currentPreparationLevel: '',
      },
    });

    return this.generateAuthResponse(user);
  }

  async login(email: string, password?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.passwordHash && password) {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (password) {
      throw new UnauthorizedException('Please login using Google OAuth');
    }

    return this.generateAuthResponse(user);
  }

  async googleAuth(googleData: { token: string }) {
    const token = googleData.token;
    if (!token) {
      throw new BadRequestException('Google ID token is required');
    }

    let email: string;
    let name: string;

    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }
      email = payload.email;
      name = payload.name || email.split('@')[0];
    } catch (err: any) {
      throw new UnauthorizedException(`Google authentication failed: ${err.message}`);
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          college: '',
          graduationYear: 0,
          currentYear: 0,
          targetRank: 0,
          targetScore: 0,
          currentPreparationLevel: '',
        },
      });
    }

    return this.generateAuthResponse(user);
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: any) {
    // Check if user has completed onboarding (e.g. college is filled out)
    const isOnboarded = !!user.college && user.targetRank > 0;

    const payload = { sub: user.userId, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        isOnboarded,
      },
    };
  }
}
