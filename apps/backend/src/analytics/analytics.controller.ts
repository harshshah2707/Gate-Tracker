import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard overview statistics (Streaks, Debt, Consistency, Weaknesses)' })
  async getDashboardAnalytics(@Req() req: any) {
    return this.analyticsService.getDashboardAnalytics(req.user.userId);
  }

  @Get('weekly-review')
  @ApiOperation({ summary: "Get past week's daily consistency stats" })
  async getWeeklyReview(@Req() req: any) {
    return this.analyticsService.getWeeklyReview(req.user.userId);
  }

  @Get('monthly-review')
  @ApiOperation({ summary: "Get past 30 days' daily consistency stats" })
  async getMonthlyReview(@Req() req: any) {
    return this.analyticsService.getMonthlyReview(req.user.userId);
  }

  @Post('trigger-reset')
  @ApiOperation({ summary: 'Manually trigger daily cron calculations (for evaluation/demoing)' })
  async triggerReset() {
    await this.analyticsService.processDailyReset();
    return { success: true, message: 'Daily stats check and zero-day streak resets completed.' };
  }
}
