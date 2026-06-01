import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role, GroupType } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, data: any) {
    const group = await this.prisma.studyGroup.create({
      data: {
        groupName: data.groupName,
        creatorId: userId,
        groupType: data.groupType || GroupType.PUBLIC,
        memberCount: 1,
        currentStreak: 0,
        longestStreak: 0,
        groupConsistency: 0.0,
      },
    });

    await this.prisma.groupMembership.create({
      data: {
        groupId: group.groupId,
        userId,
        isAdmin: true,
        role: Role.CREATOR,
      },
    });

    return group;
  }

  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: true,
      },
    });

    return memberships.map((m) => m.group);
  }

  async getGroupDetails(groupId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                userId: true,
                name: true,
                email: true,
                college: true,
                currentStreak: true,
                totalStudyHours: true,
                trustScore: true,
                accountabilityScore: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Process member statuses
    const processedMembers: any[] = [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600000);

    for (const membership of group.members) {
      const lastSession = await this.prisma.studySession.findFirst({
        where: { userId: membership.userId, endTime: { not: new Date(0) } },
        orderBy: { startTime: 'desc' },
      });

      let status = 'Offline';
      if (lastSession) {
        if (lastSession.startTime >= startOfToday) {
          status = 'Active Today';
        } else if (lastSession.startTime >= threeDaysAgo) {
          status = 'Missing';
        } else {
          status = 'Ghosting';
        }
      } else {
        status = 'Ghosting'; // No sessions recorded ever
      }

      processedMembers.push({
        ...membership,
        status,
        lastActive: lastSession ? lastSession.startTime : null,
      });
    }

    // Fetch scoped group activity feed
    const activities = await this.prisma.activityFeed.findMany({
      where: { groupId },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        user: {
          select: { name: true },
        },
        reactions: true,
      },
    });

    return {
      ...group,
      members: processedMembers,
      activities,
    };
  }

  async joinGroup(userId: string, groupId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existing = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (existing) {
      throw new BadRequestException('Already a member of this group');
    }

    const membership = await this.prisma.groupMembership.create({
      data: {
        groupId,
        userId,
        role: Role.MEMBER,
      },
    });

    // Increment count
    await this.prisma.studyGroup.update({
      where: { groupId },
      data: {
        memberCount: { increment: 1 },
      },
    });

    // Log activity
    const user = await this.prisma.user.findUnique({ where: { userId } });
    await this.prisma.activityFeed.create({
      data: {
        userId,
        groupId,
        activityType: 'GROUP_JOIN',
        description: `${user?.name} joined the group ${group.groupName}! 🤝`,
        metadata: JSON.stringify({ groupId }),
      },
    });

    return membership;
  }

  async getLeaderboard(groupId: string, filter: 'daily' | 'weekly' | 'streak') {
    const group = await this.prisma.studyGroup.findUnique({
      where: { groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                userId: true,
                name: true,
                college: true,
                currentStreak: true,
                totalStudyHours: true,
                accountabilityScore: true,
                trustScore: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const leaderboard: any[] = [];

    for (const membership of group.members) {
      const u = membership.user;
      
      // Calculate daily study hours
      const dailySessions = await this.prisma.studySession.findMany({
        where: {
          userId: u.userId,
          startTime: { gte: startOfToday },
          endTime: { not: new Date(0) },
        },
      });
      const dailyHours = dailySessions.reduce((acc, s) => acc + s.duration, 0) / 60;

      // Calculate weekly study hours
      const weeklySessions = await this.prisma.studySession.findMany({
        where: {
          userId: u.userId,
          startTime: { gte: startOfWeek },
          endTime: { not: new Date(0) },
        },
      });
      const weeklyHours = weeklySessions.reduce((acc, s) => acc + s.duration, 0) / 60;

      leaderboard.push({
        userId: u.userId,
        name: u.name,
        college: u.college,
        currentStreak: u.currentStreak,
        dailyHours: Math.round(dailyHours * 100) / 100,
        weeklyHours: Math.round(weeklyHours * 100) / 100,
        accountabilityScore: u.accountabilityScore,
        trustScore: u.trustScore,
      });
    }

    // Sort accordingly
    if (filter === 'daily') {
      leaderboard.sort((a, b) => b.dailyHours - a.dailyHours);
    } else if (filter === 'weekly') {
      leaderboard.sort((a, b) => b.weeklyHours - a.weeklyHours);
    } else {
      leaderboard.sort((a, b) => b.currentStreak - a.currentStreak);
    }

    return leaderboard;
  }
}
