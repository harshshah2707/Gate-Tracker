import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Revisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('revisions')
export class RevisionsController {
  constructor(private revisionsService: RevisionsService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get current revision queue (overdue first)' })
  async getQueue(@Req() req: any) {
    return this.revisionsService.getQueue(req.user.userId);
  }

  @Post(':revisionId/complete')
  @ApiOperation({ summary: 'Mark revision card as completed and recalculate spaced interval' })
  async completeRevision(@Req() req: any, @Param('revisionId') revisionId: string) {
    return this.revisionsService.completeRevision(req.user.userId, revisionId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get revision health score (derived from number of overdue tasks)' })
  async getHealth(@Req() req: any) {
    return this.revisionsService.getHealthScore(req.user.userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add a topic to the revision queue manually' })
  async addToQueue(@Req() req: any, @Body() body: { topicId: string; subjectId: string }) {
    return this.revisionsService.addToQueue(req.user.userId, body);
  }
}
