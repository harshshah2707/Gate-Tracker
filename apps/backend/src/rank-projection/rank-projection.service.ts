import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RankProjectionService {
  constructor(private prisma: PrismaService) {}

  async getEstimate(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.userId,
      name: user.name,
      readinessScore: user.readinessScore,
      estimatedRankMin: user.estimatedRankMin,
      estimatedRankMax: user.estimatedRankMax,
      targetRank: user.targetRank,
      targetScore: user.targetScore,
    };
  }

  async calculateWhatIf(userId: string, data: { dailyStudyHours: number; mockScore: number; syllabusCompletion: number }) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // What-If readiness score formula:
    // study hours max weight: 8 hours = 100% -> contribution = min(100, hours * 12.5) * 0.25
    // syllabus completion contribution = completion * 0.45
    // mock score contribution = score * 0.3
    const hoursScore = Math.min(100, data.dailyStudyHours * 12.5);
    const mockScoreContribution = data.mockScore; // assumed out of 100
    const syllabusContribution = data.syllabusCompletion; // assumed percentage

    const simulatedReadiness = Math.round(
      (hoursScore * 0.25) + (syllabusContribution * 0.45) + (mockScoreContribution * 0.3)
    );

    // Rank projections matching the readiness score
    const estimatedRankMin = Math.max(1, Math.round(100000 * Math.exp(-0.08 * simulatedReadiness)));
    const estimatedRankMax = Math.max(2, Math.round(150000 * Math.exp(-0.06 * simulatedReadiness)));

    let analysis = '';
    const currentReadiness = user.readinessScore;

    if (simulatedReadiness > currentReadiness) {
      analysis = `📈 Simulating growth: Increasing daily study to ${data.dailyStudyHours}h, completing ${data.syllabusCompletion}% of the syllabus, and scoring ${data.mockScore}/100 raises your readiness to ${simulatedReadiness}% (up from ${currentReadiness}%). This could propel you to a projected rank of AIR ${estimatedRankMin} - ${estimatedRankMax}.`;
    } else {
      analysis = `📉 Simulating reduction: Lowering daily study to ${data.dailyStudyHours}h, completing ${data.syllabusCompletion}% of the syllabus, and scoring ${data.mockScore}/100 drops your readiness to ${simulatedReadiness}% (down from ${currentReadiness}%). This could slide your projected rank to AIR ${estimatedRankMin} - ${estimatedRankMax}.`;
    }

    return {
      simulatedReadiness,
      estimatedRankMin,
      estimatedRankMax,
      analysis,
    };
  }
}
