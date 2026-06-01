import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OnboardingPayload, OnboardingResult, GATE_CSE_SYLLABUS } from '@gate-warroom/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        achievements: true,
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.user.update({
      where: { userId },
      data,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        college: true,
        graduationYear: true,
        currentYear: true,
        targetRank: true,
        targetScore: true,
        currentPreparationLevel: true,
        dailyStudyTarget: true,
        totalStudyHours: true,
        currentStreak: true,
        longestStreak: true,
        trustScore: true,
        accountabilityScore: true,
        readinessScore: true,
        estimatedRankMin: true,
        estimatedRankMax: true,
        createdAt: true,
        achievements: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getStats(userId: string) {
    const stats = await this.prisma.userStats.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 30, // Last 30 days
    });

    return stats;
  }

  async completeOnboarding(userId: string, payload: OnboardingPayload): Promise<OnboardingResult> {
    // 1. Calculate Readiness Score
    let prepLevelScore = 10;
    switch (payload.currentPreparationLevel) {
      case 'Not Started': prepLevelScore = 10; break;
      case 'Just Started': prepLevelScore = 30; break;
      case 'Halfway': prepLevelScore = 60; break;
      case 'Revision Phase': prepLevelScore = 85; break;
      case 'Ready': prepLevelScore = 100; break;
    }

    const availableHoursScore = Math.min(100, payload.dailyStudyTarget * 12.5); // 8 hours = 100%

    let targetRankScore = 50;
    if (payload.targetRank <= 100) targetRankScore = 100;
    else if (payload.targetRank <= 500) targetRankScore = 85;
    else if (payload.targetRank <= 1000) targetRankScore = 70;
    else if (payload.targetRank <= 2000) targetRankScore = 55;

    const readinessScore = Math.round((prepLevelScore * 0.6) + (availableHoursScore * 0.25) + (targetRankScore * 0.15));

    // 2. Rank Range Projection
    // Exp formulas to project ranks based on readiness score
    const estimatedRankMin = Math.max(1, Math.round(100000 * Math.exp(-0.08 * readinessScore)));
    const estimatedRankMax = Math.max(2, Math.round(150000 * Math.exp(-0.06 * readinessScore)));

    // 3. Suggested Daily Hours
    let suggestedDailyHours = 6.0;
    if (payload.targetRank <= 100) {
      if (prepLevelScore <= 30) suggestedDailyHours = 9.0;
      else if (prepLevelScore <= 60) suggestedDailyHours = 8.0;
      else suggestedDailyHours = 7.0;
    } else if (payload.targetRank <= 1000) {
      if (prepLevelScore <= 30) suggestedDailyHours = 7.5;
      else if (prepLevelScore <= 60) suggestedDailyHours = 6.5;
      else suggestedDailyHours = 5.5;
    }

    // 4. Preparation Gap Analysis
    let preparationGapAnalysis = '';
    const hoursDeficit = Math.round((suggestedDailyHours - payload.dailyStudyTarget) * 90);
    if (hoursDeficit > 0) {
      preparationGapAnalysis = `⚠️ CONSTRAINED TIMELINE: Your target rank is ${payload.targetRank}, which requires approximately ${suggestedDailyHours} hours daily. With your currently logged availability of ${payload.dailyStudyTarget} hours, you face a ${hoursDeficit}-hour preparation deficit over the next 90 days. We recommend dialing up your daily commitments by ${Math.round((suggestedDailyHours - payload.dailyStudyTarget) * 10) / 10} hours to stay on track.`;
    } else {
      preparationGapAnalysis = `✅ PATH TO DEVIATION: Your daily availability of ${payload.dailyStudyTarget} hours matches or exceeds our recommendation of ${suggestedDailyHours} hours for rank ${payload.targetRank}. With consistent execution and rigorous revision of your weak areas (${payload.weakSubjects.slice(0, 3).join(', ')}), you are positioned for a competitive score.`;
    }

    // 5. Personalized 90-day roadmap
    const roadmap90Days = [
      {
        phase: 'Phase 1: Foundations & Deficits',
        duration: 'Days 1 - 30',
        focus: `Resolve key conceptual weaknesses in: ${payload.weakSubjects.slice(0, 3).join(', ')}`,
        milestones: [
          `Log ${suggestedDailyHours} hours daily using verified focus timers`,
          `Complete 100% of basic questions in ${payload.weakSubjects[0] || 'your core subjects'}`,
          `Set up weekly accountability group study targets`,
        ],
      },
      {
        phase: 'Phase 2: PYQs and Subject-Wise Tests',
        duration: 'Days 31 - 60',
        focus: 'Integrate dynamic mock tests and spaced repetition schedules',
        milestones: [
          'Solve last 15 years PYQs for strong subjects',
          'Attempt at least 1 mock test per week and log mistake breakdowns',
          'Achieve a minimum trust score of 80% through verified logs',
        ],
      },
      {
        phase: 'Phase 3: High-Yield Revision & Full Length Mocks',
        duration: 'Days 61 - 90',
        focus: 'Maximize accuracy, time-management, and revision speed',
        milestones: [
          'Reduce conceptual mistakes by 50% using mock diagnostics tracker',
          'Complete 2 revisions of high-weightage syllabus topics',
          'Optimize exam strategy (Aptitude -> Tech Sec A -> Tech Sec B)',
        ],
      },
    ];

    // 6. Update User profile in DB
    await this.prisma.user.update({
      where: { userId },
      data: {
        college: payload.college,
        graduationYear: payload.graduationYear,
        currentYear: payload.currentYear,
        targetRank: payload.targetRank,
        targetScore: payload.targetScore,
        currentPreparationLevel: payload.currentPreparationLevel,
        dailyStudyTarget: payload.dailyStudyTarget,
        readinessScore,
        estimatedRankMin,
        estimatedRankMax,
      },
    });

    // 7. Initialize Syllabus Tracker data for this user
    await this.initializeUserSyllabus(userId, payload);

    return {
      readinessScore,
      estimatedRankMin,
      estimatedRankMax,
      suggestedDailyHours,
      preparationGapAnalysis,
      roadmap90Days,
    };
  }

  private async initializeUserSyllabus(userId: string, payload: OnboardingPayload) {
    const existing = await this.prisma.syllabusTracker.findFirst({
      where: { userId },
    });

    // If tracker is already set up, we don't recreate it
    if (existing) return;

    for (const subject of GATE_CSE_SYLLABUS) {
      const topicStatuses: Record<string, string> = {};
      const isWeak = payload.weakSubjects.includes(subject.name);
      const isStrong = payload.strongSubjects.includes(subject.name);

      const unitsProgress = subject.units.map((unit) => {
        const topics = unit.topics.map((t) => {
          let status = 'Not Started';
          if (isStrong) {
            status = 'Practiced';
          } else if (isWeak) {
            status = 'Not Started';
          } else if (payload.currentPreparationLevel === 'Halfway') {
            status = Math.random() > 0.5 ? 'Learning' : 'Not Started';
          }
          topicStatuses[t.id] = status;
          return {
            topicId: t.id,
            name: t.name,
            status,
          };
        });
        return {
          unitId: unit.id,
          unitName: unit.name,
          topics,
        };
      });

      await this.prisma.syllabusTracker.create({
        data: {
          userId,
          subjectName: subject.name,
          unitsProgress: unitsProgress as any,
          topicStatuses: topicStatuses as any,
          completionPercentage: isStrong ? 50 : 0,
          confidencePercentage: isStrong ? 45 : 0,
          masteryPercentage: isStrong ? 30 : 0,
        },
      });
    }
  }
}
