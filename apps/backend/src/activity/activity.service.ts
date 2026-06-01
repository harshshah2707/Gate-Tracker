import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async getPersonalFeed(userId: string) {
    // Return activities by user, or public activities (where groupId is null), or groups user is in
    const userGroups = await this.prisma.groupMembership.findMany({
      where: { userId },
      select: { groupId: true },
    });
    
    const groupIds = userGroups.map((g) => g.groupId);

    return this.prisma.activityFeed.findMany({
      where: {
        OR: [
          { groupId: { in: groupIds } },
          { groupId: null },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 30,
      include: {
        user: {
          select: { name: true },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });
  }

  async getGroupFeed(groupId: string) {
    return this.prisma.activityFeed.findMany({
      where: { groupId },
      orderBy: { timestamp: 'desc' },
      take: 30,
      include: {
        user: {
          select: { name: true },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });
  }

  async toggleReaction(userId: string, activityId: string, emoji: string) {
    const activity = await this.prisma.activityFeed.findUnique({
      where: { activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const existing = await this.prisma.activityReaction.findUnique({
      where: {
        activityId_userId_emoji: {
          activityId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Delete (toggle off)
      await this.prisma.activityReaction.delete({
        where: { reactionId: existing.reactionId },
      });
    } else {
      // Add
      await this.prisma.activityReaction.create({
        data: {
          activityId,
          userId,
          emoji,
        },
      });
    }

    // Return the updated reactions list
    const reactions = await this.prisma.activityReaction.findMany({
      where: { activityId },
      select: {
        emoji: true,
        userId: true,
      },
    });

    // Notify realtime
    const payload = { activityId, reactions };
    if (activity.groupId) {
      this.socketGateway.broadcastToGroup(activity.groupId, 'feed:reaction-updated', payload);
    } else {
      this.socketGateway.broadcastGlobal('feed:reaction-updated', payload);
    }

    return reactions;
  }
}
