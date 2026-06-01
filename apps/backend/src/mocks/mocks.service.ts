import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MocksService {
  constructor(private prisma: PrismaService) {}

  async logMock(userId: string, data: any) {
    const mock = await this.prisma.mockTest.create({
      data: {
        userId,
        platform: data.platform,
        date: data.date ? new Date(data.date) : new Date(),
        marks: parseFloat(data.marks),
        accuracy: parseFloat(data.accuracy),
        rank: data.rank ? parseInt(data.rank) : null,
        timeManagement: data.timeManagement || null,
        mistakeCategories: data.mistakeCategories || {},
        subjectPerformance: data.subjectPerformance || {},
        improvementAreas: data.improvementAreas || [],
      },
    });

    // Reward with +5 trust score
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (user) {
      await this.prisma.user.update({
        where: { userId },
        data: {
          trustScore: Math.min(100.0, user.trustScore + 5.0),
        },
      });
    }

    // Add to activity feed
    await this.prisma.activityFeed.create({
      data: {
        userId,
        activityType: 'MOCK_COMPLETE',
        description: `${user?.name} completed a mock test on ${mock.platform}! Score: ${mock.marks}/100, Accuracy: ${mock.accuracy}% 🎯`,
        metadata: JSON.stringify({ marks: mock.marks, accuracy: mock.accuracy, platform: mock.platform }),
      },
    });

    return mock;
  }

  async getHistory(userId: string) {
    return this.prisma.mockTest.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
    });
  }

  async getAnalysis(userId: string) {
    const mocks = await this.prisma.mockTest.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    if (mocks.length === 0) {
      return {
        avgMarks: 0,
        avgAccuracy: 0,
        totalMocks: 0,
        mistakeBreakdown: {},
        marksHistory: [],
      };
    }

    let totalMarks = 0;
    let totalAccuracy = 0;
    const mistakeBreakdown: Record<string, number> = {};

    const marksHistory = mocks.map((m) => {
      const parsedMistakes = m.mistakeCategories as any;
      for (const [cat, count] of Object.entries(parsedMistakes)) {
        const countNum = Number(count);
        mistakeBreakdown[cat] = (mistakeBreakdown[cat] || 0) + countNum;
      }

      totalMarks += m.marks;
      totalAccuracy += m.accuracy;

      return {
        mockId: m.mockId,
        date: m.date,
        marks: m.marks,
        accuracy: m.accuracy,
        platform: m.platform,
        rank: m.rank,
      };
    });

    return {
      avgMarks: Math.round((totalMarks / mocks.length) * 100) / 100,
      avgAccuracy: Math.round((totalAccuracy / mocks.length) * 100) / 100,
      totalMocks: mocks.length,
      mistakeBreakdown,
      marksHistory,
    };
  }
}
