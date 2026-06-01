import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { MocksService } from './mocks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Mocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mocks')
export class MocksController {
  constructor(private mocksService: MocksService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new mock test result' })
  async logMock(@Req() req: any, @Body() body: any) {
    return this.mocksService.logMock(req.user.userId, body);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get list of completed mock tests' })
  async getHistory(@Req() req: any) {
    return this.mocksService.getHistory(req.user.userId);
  }

  @Get('analysis')
  @ApiOperation({ summary: 'Get aggregate mock performance analyses and weakness breakdowns' })
  async getAnalysis(@Req() req: any) {
    return this.mocksService.getAnalysis(req.user.userId);
  }
}
