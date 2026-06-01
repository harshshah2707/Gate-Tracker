import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { RankProjectionService } from './rank-projection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Rank Projection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rank-projection')
export class RankProjectionController {
  constructor(private rankProjectionService: RankProjectionService) {}

  @Get('estimate')
  @ApiOperation({ summary: 'Get current user rank projection estimate' })
  async getEstimate(@Req() req: any) {
    return this.rankProjectionService.getEstimate(req.user.userId);
  }

  @Post('what-if')
  @ApiOperation({ summary: 'Simulate what-if changes to daily study, mock scores, and syllabus completion' })
  async calculateWhatIf(@Req() req: any, @Body() body: { dailyStudyHours: number; mockScore: number; syllabusCompletion: number }) {
    return this.rankProjectionService.calculateWhatIf(req.user.userId, body);
  }
}
