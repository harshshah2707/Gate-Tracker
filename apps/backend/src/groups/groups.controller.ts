import { Controller, Post, Get, Body, Param, Req, Query, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new study group' })
  async createGroup(@Req() req: any, @Body() body: any) {
    return this.groupsService.createGroup(req.user.userId, body);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get list of groups current user is a member of' })
  async getMyGroups(@Req() req: any) {
    return this.groupsService.getMyGroups(req.user.userId);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Get details of a study group, members, statuses, and scoped feeds' })
  async getGroupDetails(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupDetails(groupId);
  }

  @Post(':groupId/members')
  @ApiOperation({ summary: 'Join a study group' })
  async joinGroup(@Req() req: any, @Param('groupId') groupId: string) {
    return this.groupsService.joinGroup(req.user.userId, groupId);
  }

  @Get(':groupId/leaderboard')
  @ApiOperation({ summary: 'Get group leaderboard sorted by daily/weekly study hours or streaks' })
  @ApiQuery({ name: 'filter', enum: ['daily', 'weekly', 'streak'], required: false })
  async getLeaderboard(
    @Param('groupId') groupId: string,
    @Query('filter') filter: 'daily' | 'weekly' | 'streak' = 'weekly',
  ) {
    return this.groupsService.getLeaderboard(groupId, filter);
  }
}
