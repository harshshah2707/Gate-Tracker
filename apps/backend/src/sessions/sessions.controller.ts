import { Controller, Post, Patch, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new study focus session' })
  async startSession(@Req() req: any, @Body() body: any) {
    return this.sessionsService.startSession(req.user.userId, body);
  }

  @Patch(':sessionId/pause')
  @ApiOperation({ summary: 'Stub endpoint for pausing a session' })
  async pauseSession(@Param('sessionId') sessionId: string) {
    return { status: 'paused', sessionId };
  }

  @Patch(':sessionId/stop')
  @ApiOperation({ summary: 'Stop and save study focus session stats' })
  async stopSession(@Req() req: any, @Param('sessionId') sessionId: string, @Body() body: any) {
    return this.sessionsService.stopSession(req.user.userId, sessionId, body);
  }

  @Get('today')
  @ApiOperation({ summary: "Get total study hours completed today vs goal" })
  async getTodayStats(@Req() req: any) {
    return this.sessionsService.getTodayStats(req.user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get study session log history' })
  async getHistory(@Req() req: any) {
    return this.sessionsService.getHistory(req.user.userId);
  }
}
