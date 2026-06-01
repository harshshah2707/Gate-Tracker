import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GATE_CSE_SYLLABUS } from '@gate-warroom/shared';

@Injectable()
export class SyllabusService {
  constructor(private prisma: PrismaService) {}

  async getSubjects(userId: string) {
    const trackers = await this.prisma.syllabusTracker.findMany({
      where: { userId },
    });

    if (trackers.length === 0) {
      // If onboarding wasn't completed properly, return empty or static
      return GATE_CSE_SYLLABUS.map((s) => ({
        subjectName: s.name,
        completionPercentage: 0,
        confidencePercentage: 0,
        masteryPercentage: 0,
      }));
    }

    return trackers.map((t) => ({
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      completionPercentage: t.completionPercentage,
      confidencePercentage: t.confidencePercentage,
      masteryPercentage: t.masteryPercentage,
      lastUpdated: t.lastUpdated,
    }));
  }

  async getSubjectTopics(userId: string, subjectName: string) {
    const tracker = await this.prisma.syllabusTracker.findUnique({
      where: {
        userId_subjectName: { userId, subjectName },
      },
    });

    if (!tracker) {
      throw new NotFoundException('Syllabus subject progress not found');
    }

    return {
      subjectName: tracker.subjectName,
      unitsProgress: tracker.unitsProgress as any,
      topicStatuses: tracker.topicStatuses as any,
    };
  }

  async updateTopicStatus(userId: string, topicId: string, subjectName: string, status: string) {
    const tracker = await this.prisma.syllabusTracker.findUnique({
      where: {
        userId_subjectName: { userId, subjectName },
      },
    });

    if (!tracker) {
      throw new NotFoundException('Syllabus tracker not found');
    }

    const unitsProgress = tracker.unitsProgress as any;
    const topicStatuses = tracker.topicStatuses as any;

    let topicFound = false;
    for (const unit of unitsProgress) {
      for (const t of unit.topics) {
        if (t.topicId === topicId) {
          t.status = status;
          topicStatuses[topicId] = status;
          topicFound = true;
          break;
        }
      }
      if (topicFound) break;
    }

    if (!topicFound) {
      throw new NotFoundException('Topic not found in this subject');
    }

    // Recalculate percentages
    let completionWeightSum = 0;
    let totalTopics = 0;

    for (const unit of unitsProgress) {
      for (const t of unit.topics) {
        totalTopics++;
        const s = topicStatuses[t.topicId] || 'Not Started';
        let weight = 0;
        if (s === 'Learning') weight = 0.25;
        if (s === 'Practiced') weight = 0.50;
        if (s === 'Revised Once') weight = 0.75;
        if (s === 'Revised Twice') weight = 0.90;
        if (s === 'Mastered') weight = 1.00;
        completionWeightSum += weight;
      }
    }

    const completionPercentage = totalTopics > 0 ? (completionWeightSum / totalTopics) * 100 : 0;
    const confidencePercentage = completionPercentage * 0.9;
    const masteryPercentage = completionPercentage * 0.7;

    return this.prisma.syllabusTracker.update({
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

  async getOverallProgress(userId: string) {
    const trackers = await this.prisma.syllabusTracker.findMany({
      where: { userId },
    });

    if (trackers.length === 0) {
      return { completion: 0, confidence: 0, mastery: 0 };
    }

    const totalSubjects = trackers.length;
    const completionSum = trackers.reduce((acc, t) => acc + t.completionPercentage, 0);
    const confidenceSum = trackers.reduce((acc, t) => acc + t.confidencePercentage, 0);
    const masterySum = trackers.reduce((acc, t) => acc + t.masteryPercentage, 0);

    return {
      completion: Math.round(completionSum / totalSubjects),
      confidence: Math.round(confidenceSum / totalSubjects),
      mastery: Math.round(masterySum / totalSubjects),
    };
  }
}
