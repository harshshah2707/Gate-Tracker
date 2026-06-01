import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardAnalytics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Today's sessions
    const todaysSessions = await this.prisma.studySession.findMany({
      where: {
        userId,
        startTime: { gte: startOfToday },
        endTime: { not: new Date(0) },
      },
    });

    const totalMinutesToday = todaysSessions.reduce((acc, s) => acc + s.duration, 0);
    const completedHoursToday = totalMinutesToday / 60;
    const dailyGoal = user.dailyStudyTarget;
    const dailyDebt = Math.max(0, dailyGoal - completedHoursToday);

    // 2. Accumulated Debt (sum of daily debts in UserStats)
    const statsHistory = await this.prisma.userStats.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const accumulatedDebt = statsHistory.reduce((acc, s) => acc + s.dailyDebt, 0) + dailyDebt;

    // 3. Weekly/Monthly consistency averages
    // Let's count how many days in the last 7 / 30 days the user studied >= 15 mins
    const last7Days = statsHistory.slice(0, 7);
    const daysStudied7 = last7Days.filter((s) => s.dailyStudyHours >= 0.25).length;
    const weeklyConsistency = last7Days.length > 0 ? (daysStudied7 / last7Days.length) * 100 : (completedHoursToday >= 0.25 ? 100 : 0);

    const daysStudied30 = statsHistory.filter((s) => s.dailyStudyHours >= 0.25).length;
    const monthlyConsistency = statsHistory.length > 0 ? (daysStudied30 / statsHistory.length) * 100 : (completedHoursToday >= 0.25 ? 100 : 0);

    // 4. Overdue revision tasks
    const overdueRevisions = await this.prisma.revisionQueue.count({
      where: { userId, status: 'OVERDUE' },
    });

    // 5. Syllabus tracker overview
    const syllabusTrackers = await this.prisma.syllabusTracker.findMany({
      where: { userId },
    });

    const subjectProgress = syllabusTrackers.map((t) => ({
      subjectName: t.subjectName,
      completion: t.completionPercentage,
      confidence: t.confidencePercentage,
    }));

    // Strong vs Weak subjects
    const sortedSubjects = [...subjectProgress].sort((a, b) => b.completion - a.completion);
    const strongSubjects = sortedSubjects.slice(0, 3);
    const weakSubjects = sortedSubjects.slice(-3).reverse();

    // 6. Last mock results
    const lastMocks = await this.prisma.mockTest.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 3,
    });

    // 7. Streak risk check (no session today and it is past 9 PM)
    const isStreakAtRisk = completedHoursToday < 0.25 && new Date().getHours() >= 21;

    return {
      userId: user.userId,
      name: user.name,
      estimatedRankMin: user.estimatedRankMin,
      estimatedRankMax: user.estimatedRankMax,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      trustScore: user.trustScore,
      accountabilityScore: user.accountabilityScore,
      completedHoursToday: Math.round(completedHoursToday * 100) / 100,
      dailyGoal,
      dailyDebt: Math.round(dailyDebt * 100) / 100,
      accumulatedDebt: Math.round(accumulatedDebt * 100) / 100,
      weeklyConsistency: Math.round(weeklyConsistency),
      monthlyConsistency: Math.round(monthlyConsistency),
      overdueRevisions,
      strongSubjects,
      weakSubjects,
      lastMocks,
      isStreakAtRisk,
    };
  }

  async getWeeklyReview(userId: string) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const stats = await this.prisma.userStats.findMany({
      where: {
        userId,
        date: { gte: startOfWeek },
      },
      orderBy: { date: 'asc' },
    });

    return stats;
  }

  async getMonthlyReview(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);

    const stats = await this.prisma.userStats.findMany({
      where: {
        userId,
        date: { gte: startOfMonth },
      },
      orderBy: { date: 'asc' },
    });

    return stats;
  }

  // Daily Cron Job at midnight to check streaks & accumulate debt
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyProcess() {
    this.logger.log('Executing daily study check and streak resets...');
    await this.processDailyReset();
  }

  async processDailyReset() {
    const users = await this.prisma.user.findMany();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    for (const user of users) {
      try {
        // 1. Calculate actual study hours logged yesterday
        const yesterdayEnd = new Date(yesterday.getTime() + 24 * 3600000 - 1);
        const sessions = await this.prisma.studySession.findMany({
          where: {
            userId: user.userId,
            startTime: { gte: yesterday, lte: yesterdayEnd },
            endTime: { not: new Date(0) },
          },
        });

        const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
        const actualHours = totalMinutes / 60;

        // 2. Calculate debt
        const target = user.dailyStudyTarget;
        const dailyDebt = Math.max(0, target - actualHours);

        // 3. No Zero Day Check: Did they study at least 15 minutes (0.25 hrs)?
        let currentStreak = user.currentStreak;
        if (actualHours < 0.25) {
          // Reset streak!
          currentStreak = 0;
          
          // Create Notification
          await this.prisma.notification.create({
            data: {
              userId: user.userId,
              type: 'STREAK_RESET',
              message: `🔥 STREAK RESET: Yesterday was a zero study day. Your streak has reset to 0. Log 15+ mins today to start a new streak!`,
            },
          });
        }

        // 4. Update Stats table
        const statsDate = new Date(yesterday);
        
        // Recalculate rolling 7-day consistency
        const prevStats = await this.prisma.userStats.findMany({
          where: { userId: user.userId },
          orderBy: { date: 'desc' },
          take: 30,
        });

        // insert yesterday's stats
        const yesterdayStats = await this.prisma.userStats.upsert({
          where: {
            userId_date: { userId: user.userId, date: statsDate },
          },
          update: {
            dailyStudyHours: actualHours,
            dailyDebt,
          },
          create: {
            userId: user.userId,
            date: statsDate,
            dailyStudyHours: actualHours,
            dailyDebt,
          },
        });

        const allStats = [yesterdayStats, ...prevStats];
        
        const daysStudied7 = allStats.slice(0, 7).filter((s) => s.dailyStudyHours >= 0.25).length;
        const weeklyConsistency = allStats.slice(0, 7).length > 0 ? (daysStudied7 / allStats.slice(0, 7).length) * 100 : 0;

        const daysStudied30 = allStats.slice(0, 30).filter((s) => s.dailyStudyHours >= 0.25).length;
        const monthlyConsistency = allStats.slice(0, 30).length > 0 ? (daysStudied30 / allStats.slice(0, 30).length) * 100 : 0;

        // Fetch overdue revisions
        const overdueCount = await this.prisma.revisionQueue.count({
          where: { userId: user.userId, status: 'OVERDUE' },
        });
        const revisionHealthScore = Math.max(0, 100 - overdueCount * 15);

        await this.prisma.userStats.update({
          where: { statsId: yesterdayStats.statsId },
          data: {
            weeklyConsistency,
            monthlyConsistency,
            revisionHealthScore,
          },
        });

        // 5. Recalculate user's Accountability Score (0-100)
        // Consistency yesterday: 30 pts (if studied yesterday >= 15 mins, else 0)
        const consistencyPoints = actualHours >= 0.25 ? 30 : 0;

        // Goal completion: 25 pts (ratio of actual to target)
        const goalPoints = Math.round(Math.min(1.0, actualHours / target) * 25);

        // Streak health: 20 pts (max 20, scaled)
        const streakPoints = Math.min(20, currentStreak * 1.5);

        // Revision status: 15 pts
        const revisionPoints = Math.round((revisionHealthScore / 100) * 15);

        // Mock test logged this week (7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const loggedMock = await this.prisma.mockTest.findFirst({
          where: {
            userId: user.userId,
            date: { gte: weekAgo },
          },
        });
        const mockPoints = loggedMock ? 10 : 0;

        const accountabilityScore = Math.round(consistencyPoints + goalPoints + streakPoints + revisionPoints + mockPoints);

        // 6. Save updated user streaks and scores
        await this.prisma.user.update({
          where: { userId: user.userId },
          data: {
            currentStreak,
            accountabilityScore: Math.min(100, accountabilityScore),
          },
        });

        this.logger.log(`Processed user ${user.name}: Streak=${currentStreak}, AccScore=${accountabilityScore}`);
      } catch (err) {
        this.logger.error(`Error processing user stats for ${user.userId}:`, err);
      }
    }
  }
}
