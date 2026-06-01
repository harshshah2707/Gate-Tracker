import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async startSession(userId: string, data: any) {
    // End any currently running session (just in case)
    const running = await this.prisma.studySession.findFirst({
      where: {
        userId,
        endTime: { equals: new Date(0) }, // placeholder for ongoing session
      },
    });

    if (running) {
      // Auto-stop it
      await this.stopSession(userId, running.sessionId, {
        duration: Math.round((Date.now() - running.startTime.getTime()) / 60000),
        interruptions: 5,
        notes: 'Auto-closed by starting a new session',
        productivityScore: 5.0,
      });
    }

    const session = await this.prisma.studySession.create({
      data: {
        userId,
        startTime: new Date(),
        endTime: new Date(0), // Placeholder
        duration: data.duration || 25, // planned duration
        subject: data.subject,
        topic: data.topic,
        tags: data.tags || [],
        notes: data.notes || '',
        focusScore: 10.0, // default
        productivityScore: 10.0,
        verificationLevel: data.verificationLevel || 2, // default to Level 2 (focus timer)
        isManualLog: data.isManualLog || false,
        interruptions: 0,
        trustedSession: true,
      },
    });

    // Broadcast to user's groups
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId },
    });

    for (const member of memberships) {
      this.socketGateway.broadcastToGroup(member.groupId, 'session:started', {
        userName: (await this.prisma.user.findUnique({ where: { userId } }))?.name,
        subject: session.subject,
        topic: session.topic,
      });
    }

    return session;
  }

  async stopSession(userId: string, sessionId: string, data: any) {
    const session = await this.prisma.studySession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const endTime = new Date();
    const duration = data.duration || Math.round((endTime.getTime() - session.startTime.getTime()) / 60000);
    const interruptions = data.interruptions || 0;
    const isManualLog = session.isManualLog;

    // Focus score calculation
    // base 10. -1.5 per interruption, -2.5 if manual log. Min 1.0.
    const focusScore = Math.max(
      1.0,
      Math.min(
        10.0,
        10.0 - interruptions * 1.5 - (isManualLog ? 2.5 : 0.0) + (duration >= 90 ? 0.5 : duration >= 50 ? 0.2 : 0.0)
      )
    );

    const productivityScore = data.productivityScore || focusScore;

    // Update study session
    const updatedSession = await this.prisma.studySession.update({
      where: { sessionId },
      data: {
        endTime,
        duration,
        interruptions,
        focusScore,
        productivityScore,
        notes: data.notes || session.notes,
        trustedSession: !isManualLog && interruptions < 4,
      },
    });

    // Fetch user
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new BadRequestException('User not found');

    // 1. Update user total hours & trust score
    let trustScoreDiff = 0;
    if (updatedSession.trustedSession) {
      // verified sessions: +1 trust score
      trustScoreDiff = 1;
    } else if (isManualLog) {
      // manual session: contributes less or reduces trust score if suspicious
      trustScoreDiff = -0.5;
    }

    const updatedUser = await this.prisma.user.update({
      where: { userId },
      data: {
        totalStudyHours: user.totalStudyHours + duration / 60,
        trustScore: Math.max(0.0, Math.min(100.0, user.trustScore + trustScoreDiff)),
      },
    });

    // 2. Update Syllabus Tracker
    await this.updateSyllabusTopic(userId, session.subject, session.topic, focusScore);

    // 3. Update Streaks (No Zero Day check: did they study >= 15 mins today?)
    // Get total duration studied today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysSessions = await this.prisma.studySession.findMany({
      where: {
        userId,
        startTime: { gte: startOfToday },
        endTime: { not: new Date(0) },
      },
    });

    const totalMinutesToday = todaysSessions.reduce((acc, s) => acc + s.duration, 0);
    
    let streakUpdated = false;
    let newStreak = user.currentStreak;
    if (totalMinutesToday >= 15 && user.currentStreak === 0) {
      // If they had 0 streak and just crossed the 15-min mark, set streak to 1
      newStreak = 1;
      streakUpdated = true;
    } else if (totalMinutesToday >= 15 && user.currentStreak > 0) {
      // If they studied 15 mins, ensure streak isn't reset. If this is the first session crossing 15 mins today,
      // and they studied yesterday as well, streak continues.
      // For simplicity, we can let our midnight cron handle resets, and we increment streak if yesterday had study.
      // Let's increment streak if they haven't logged today yet.
      // Check if they studied yesterday
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 3600000);
      const endOfYesterday = new Date(startOfToday.getTime() - 1);
      const yesterdaySessions = await this.prisma.studySession.findMany({
        where: {
          userId,
          startTime: { gte: startOfYesterday, lte: endOfYesterday },
          endTime: { not: new Date(0) },
        },
      });

      const yesterdayMinutes = yesterdaySessions.reduce((acc, s) => acc + s.duration, 0);

      // If yesterday was consistent (>=15m) and we haven't already marked today as done
      const previouslyStudiedToday = totalMinutesToday - duration;
      if (yesterdayMinutes >= 15 && previouslyStudiedToday < 15 && totalMinutesToday >= 15) {
        newStreak = user.currentStreak + 1;
        streakUpdated = true;
      } else if (yesterdayMinutes < 15 && previouslyStudiedToday < 15 && totalMinutesToday >= 15) {
        newStreak = 1; // start new streak
        streakUpdated = true;
      }
    }

    if (streakUpdated) {
      const longestStreak = Math.max(user.longestStreak, newStreak);
      await this.prisma.user.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak,
        },
      });
      this.socketGateway.sendToUser(userId, 'streak:updated', { currentStreak: newStreak, longestStreak });
    }

    // 4. Create Activity Feed
    const minutesString = duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`;
    const description = `${user.name} completed a ${minutesString} ${isManualLog ? 'manual' : 'verified'} session in ${session.subject}: ${session.topic} (Focus: ${focusScore.toFixed(1)}/10) 🚀`;
    
    const feed = await this.prisma.activityFeed.create({
      data: {
        userId,
        activityType: 'SESSION_COMPLETE',
        description,
        metadata: {
          duration,
          focusScore,
          subject: session.subject,
          topic: session.topic,
          verificationLevel: updatedSession.verificationLevel,
        },
      },
    });

    // Broadcast activity to user's groups
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId },
    });

    for (const member of memberships) {
      await this.prisma.activityFeed.update({
        where: { activityId: feed.activityId },
        data: { groupId: member.groupId },
      });
      this.socketGateway.broadcastToGroup(member.groupId, 'feed:new-activity', {
        ...feed,
        user: { name: user.name },
        reactions: [],
      });
    }

    return updatedSession;
  }

  async getTodayStats(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.studySession.findMany({
      where: {
        userId,
        startTime: { gte: startOfToday },
        endTime: { not: new Date(0) },
      },
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      hoursCompleted: Math.round((totalMinutes / 60) * 100) / 100,
      sessionsCount: sessions.length,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.studySession.findMany({
      where: {
        userId,
        endTime: { not: new Date(0) },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    });
  }

  private async updateSyllabusTopic(userId: string, subjectName: string, topicName: string, focusScore: number) {
    const tracker = await this.prisma.syllabusTracker.findUnique({
      where: {
        userId_subjectName: { userId, subjectName },
      },
    });

    if (!tracker) return;

    const unitsProgress = tracker.unitsProgress as any;
    const topicStatuses = tracker.topicStatuses as any;

    // Find topic id matching name or fallback
    let topicId = '';
    let found = false;

    for (const unit of unitsProgress) {
      for (const t of unit.topics) {
        if (t.name === topicName) {
          topicId = t.topicId;
          // Upgrade status based on focus
          let currentStatus = topicStatuses[topicId] || 'Not Started';
          let nextStatus = currentStatus;

          if (currentStatus === 'Not Started') {
            nextStatus = 'Learning';
          } else if (currentStatus === 'Learning' && focusScore >= 7.0) {
            nextStatus = 'Practiced';
          } else if (currentStatus === 'Practiced' && focusScore >= 8.0) {
            nextStatus = 'Revised Once';
          } else if (currentStatus === 'Revised Once' && focusScore >= 8.5) {
            nextStatus = 'Revised Twice';
          } else if (currentStatus === 'Revised Twice' && focusScore >= 9.0) {
            nextStatus = 'Mastered';
          }

          topicStatuses[topicId] = nextStatus;
          t.status = nextStatus;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) return; // If topic wasn't found in lists

    // Recalculate metrics
    let completionWeightSum = 0;
    let totalTopics = 0;

    for (const unit of unitsProgress) {
      for (const t of unit.topics) {
        totalTopics++;
        const status = topicStatuses[t.topicId] || 'Not Started';
        let weight = 0;
        if (status === 'Learning') weight = 0.25;
        if (status === 'Practiced') weight = 0.50;
        if (status === 'Revised Once') weight = 0.75;
        if (status === 'Revised Twice') weight = 0.90;
        if (status === 'Mastered') weight = 1.00;
        completionWeightSum += weight;
      }
    }

    const completionPercentage = totalTopics > 0 ? (completionWeightSum / totalTopics) * 100 : 0;
    const confidencePercentage = completionPercentage * 0.9;
    const masteryPercentage = completionPercentage * 0.7;

    await this.prisma.syllabusTracker.update({
      where: {
        userId_subjectName: { userId, subjectName },
      },
      data: {
        unitsProgress: unitsProgress as any,
        topicStatuses: topicStatuses as any,
        completionPercentage: Math.round(completionPercentage),
        confidencePercentage: Math.round(confidencePercentage),
        masteryPercentage: Math.round(masteryPercentage),
      },
    });
  }
}
