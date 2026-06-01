import { Controller, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { SyllabusService } from './syllabus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Syllabus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('syllabus')
export class SyllabusController {
  constructor(private syllabusService: SyllabusService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'Get list of subjects with completion statistics' })
  async getSubjects(@Req() req: any) {
    return this.syllabusService.getSubjects(req.user.userId);
  }

  @Get('subject/:subjectName/topics')
  @ApiOperation({ summary: 'Get units and topics for a specific subject' })
  async getSubjectTopics(@Req() req: any, @Param('subjectName') subjectName: string) {
    return this.syllabusService.getSubjectTopics(req.user.userId, subjectName);
  }

  @Patch(':topicId/status')
  @ApiOperation({ summary: 'Update the status of a syllabus topic' })
  async updateTopicStatus(
    @Req() req: any,
    @Param('topicId') topicId: string,
    @Body() body: { subjectName: string; status: string },
  ) {
    return this.syllabusService.updateTopicStatus(
      req.user.userId,
      topicId,
      body.subjectName,
      body.status,
    );
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get overall syllabus completion percentage' })
  async getOverallProgress(@Req() req: any) {
    return this.syllabusService.getOverallProgress(req.user.userId);
  }
}
