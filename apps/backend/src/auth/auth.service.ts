import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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

  async googleAuth(googleData: { email: string; name: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleData.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleData.email,
          name: googleData.name,
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
