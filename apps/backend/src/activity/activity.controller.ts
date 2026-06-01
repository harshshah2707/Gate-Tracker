import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Activity Feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feed')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('personal')
  @ApiOperation({ summary: 'Get current user personal and public activity feed' })
  async getPersonalFeed(@Req() req: any) {
    return this.activityService.getPersonalFeed(req.user.userId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get activity feed scoped to a specific group' })
  async getGroupFeed(@Param('groupId') groupId: string) {
    return this.activityService.getGroupFeed(groupId);
  }

  @Post(':activityId/react')
  @ApiOperation({ summary: 'Toggle emoji reaction (🔥, ⚡, 🚀, etc.) on feed activity' })
  async toggleReaction(
    @Req() req: any,
    @Param('activityId') activityId: string,
    @Body() body: { emoji: string },
  ) {
    return this.activityService.toggleReaction(req.user.userId, activityId, body.emoji);
  }
}
