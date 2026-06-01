import { Controller, Get, Put, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and achievements' })
  async getMe(@Req() req: any) {
    return this.usersService.getMe(req.user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update profile details' })
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Run onboarding wizard computations and initialize syllabus tracker' })
  async completeOnboarding(@Req() req: any, @Body() body: any) {
    return this.usersService.completeOnboarding(req.user.userId, body);
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get details of a specific user profile' })
  async getProfile(@Param('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get daily stats history for chart rendering' })
  async getStats(@Param('userId') userId: string) {
    return this.usersService.getStats(userId);
  }
}
