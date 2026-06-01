import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RevisionStatus } from '@prisma/client';

@Injectable()
export class RevisionsService {
  constructor(private prisma: PrismaService) {}

  async getQueue(userId: string) {
    // Dynamically mark overdue items
    const now = new Date();
    await this.prisma.revisionQueue.updateMany({
      where: {
        userId,
        nextRevisionDate: { lt: now },
        status: RevisionStatus.PENDING,
      },
      data: {
        status: RevisionStatus.OVERDUE,
      },
    });

    const queue = await this.prisma.revisionQueue.findMany({
      where: { userId },
      orderBy: [
        { status: 'desc' }, // OVERDUE first (in alpha: PENDING < OVERDUE is false, actually Enum sorting: let's sort status explicitly or pull and sort)
        { nextRevisionDate: 'asc' },
      ],
    });

    // Custom sorting: OVERDUE -> PENDING -> COMPLETED
    return queue.sort((a, b) => {
      const order = { OVERDUE: 1, PENDING: 2, COMPLETED: 3 };
      return order[a.status] - order[b.status] || a.nextRevisionDate.getTime() - b.nextRevisionDate.getTime();
    });
  }

  async completeRevision(userId: string, revisionId: string) {
    const revision = await this.prisma.revisionQueue.findUnique({
      where: { revisionId },
    });

    if (!revision || revision.userId !== userId) {
      throw new NotFoundException('Revision card not found');
    }

    // Spaced repetition interval progression: 1 -> 3 -> 7 -> 15 -> 30
    const intervals = [1, 3, 7, 15, 30];
    const currentIndex = intervals.indexOf(revision.interval);
    const nextInterval = currentIndex < intervals.length - 1 ? intervals[currentIndex + 1] : 30;

    const nextRevisionDate = new Date();
    nextRevisionDate.setDate(nextRevisionDate.getDate() + nextInterval);

    return this.prisma.revisionQueue.update({
      where: { revisionId },
      data: {
        completedCount: { increment: 1 },
        interval: nextInterval,
        nextRevisionDate,
        status: RevisionStatus.PENDING,
      },
    });
  }

  async getHealthScore(userId: string) {
    // Sync statuses
    const now = new Date();
    await this.prisma.revisionQueue.updateMany({
      where: {
        userId,
        nextRevisionDate: { lt: now },
        status: RevisionStatus.PENDING,
      },
      data: {
        status: RevisionStatus.OVERDUE,
      },
    });

    const overdueCount = await this.prisma.revisionQueue.count({
      where: { userId, status: RevisionStatus.OVERDUE },
    });

    const healthScore = Math.max(0, 100 - overdueCount * 15);
    return {
      revisionHealthScore: healthScore,
      overdueCount,
    };
  }

  async addToQueue(userId: string, data: { topicId: string; subjectId: string }) {
    // Schedule initial revision in 1 day
    const nextRevisionDate = new Date();
    nextRevisionDate.setDate(nextRevisionDate.getDate() + 1);

    return this.prisma.revisionQueue.create({
      data: {
        userId,
        topicId: data.topicId,
        subjectId: data.subjectId,
        nextRevisionDate,
        interval: 1,
        status: RevisionStatus.PENDING,
      },
    });
  }
}
