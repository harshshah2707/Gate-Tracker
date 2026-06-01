import { PrismaClient, Role, GroupType, RevisionStatus } from '@prisma/client';
import { GATE_CSE_SYLLABUS } from '@gate-warroom/shared';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.activityReaction.deleteMany({});
  await prisma.activityFeed.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.userStats.deleteMany({});
  await prisma.pYQTracker.deleteMany({});
  await prisma.mockTest.deleteMany({});
  await prisma.revisionQueue.deleteMany({});
  await prisma.syllabusTracker.deleteMany({});
  await prisma.studySession.deleteMany({});
  await prisma.groupMembership.deleteMany({});
  await prisma.studyGroup.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Creating password hash...');
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Seeding users...');
  
  // 1. Core Users
  const userHarsh = await prisma.user.create({
    data: {
      email: 'harsh@gate.com',
      passwordHash,
      name: 'Harsh Vardhan',
      college: 'IIT Bombay',
      graduationYear: 2027,
      currentYear: 3,
      targetRank: 50,
      targetScore: 920,
      currentPreparationLevel: 'Halfway',
      dailyStudyTarget: 6.0,
      totalStudyHours: 42.5,
      currentStreak: 12,
      longestStreak: 28,
      trustScore: 88,
      accountabilityScore: 92,
      readinessScore: 78,
      estimatedRankMin: 150,
      estimatedRankMax: 650,
    },
  });

  const userAman = await prisma.user.create({
    data: {
      email: 'aman@gate.com',
      passwordHash,
      name: 'Aman Sharma',
      college: 'BITS Pilani',
      graduationYear: 2026,
      currentYear: 4,
      targetRank: 100,
      targetScore: 880,
      currentPreparationLevel: 'Revision Phase',
      dailyStudyTarget: 8.0,
      totalStudyHours: 120.0,
      currentStreak: 19,
      longestStreak: 35,
      trustScore: 94,
      accountabilityScore: 97,
      readinessScore: 89,
      estimatedRankMin: 50,
      estimatedRankMax: 250,
    },
  });

  const userPriya = await prisma.user.create({
    data: {
      email: 'priya@gate.com',
      passwordHash,
      name: 'Priya Nair',
      college: 'DTU',
      graduationYear: 2026,
      currentYear: 4,
      targetRank: 20,
      targetScore: 980,
      currentPreparationLevel: 'Revision Phase',
      dailyStudyTarget: 7.0,
      totalStudyHours: 145.0,
      currentStreak: 24,
      longestStreak: 45,
      trustScore: 98,
      accountabilityScore: 99,
      readinessScore: 94,
      estimatedRankMin: 10,
      estimatedRankMax: 90,
    },
  });

  const userRahul = await prisma.user.create({
    data: {
      email: 'rahul@gate.com',
      passwordHash,
      name: 'Rahul Gupta',
      college: 'VIT Vellore',
      graduationYear: 2027,
      currentYear: 3,
      targetRank: 500,
      targetScore: 750,
      currentPreparationLevel: 'Just Started',
      dailyStudyTarget: 5.0,
      totalStudyHours: 15.5,
      currentStreak: 2,
      longestStreak: 5,
      trustScore: 55,
      accountabilityScore: 35,
      readinessScore: 40,
      estimatedRankMin: 2500,
      estimatedRankMax: 8000,
    },
  });

  const users = [userHarsh, userAman, userPriya, userRahul];

  console.log('Seeding syllabus tracker for each user...');
  for (const user of users) {
    for (const subject of GATE_CSE_SYLLABUS) {
      // Map topic status
      const topicStatuses: Record<string, string> = {};
      let completionWeightSum = 0;
      let totalTopics = 0;

      const unitsProgress = subject.units.map((unit) => {
        const unitTopics = unit.topics.map((t) => {
          totalTopics++;
          // Give users some progress
          let status = 'Not Started';
          if (user.currentPreparationLevel === 'Revision Phase' || user.currentPreparationLevel === 'Ready') {
            const rand = Math.random();
            status = rand > 0.6 ? 'Mastered' : rand > 0.3 ? 'Revised Once' : 'Practiced';
          } else if (user.currentPreparationLevel === 'Halfway') {
            const rand = Math.random();
            status = rand > 0.7 ? 'Mastered' : rand > 0.4 ? 'Learning' : 'Not Started';
          } else {
            status = Math.random() > 0.8 ? 'Learning' : 'Not Started';
          }

          topicStatuses[t.id] = status;

          let completionWeight = 0;
          if (status === 'Learning') completionWeight = 0.25;
          if (status === 'Practiced') completionWeight = 0.50;
          if (status === 'Revised Once') completionWeight = 0.75;
          if (status === 'Revised Twice') completionWeight = 0.90;
          if (status === 'Mastered') completionWeight = 1.00;
          completionWeightSum += completionWeight;

          return {
            topicId: t.id,
            name: t.name,
            status,
          };
        });

        return {
          unitId: unit.id,
          unitName: unit.name,
          topics: unitTopics,
        };
      });

      const completionPercentage = totalTopics > 0 ? (completionWeightSum / totalTopics) * 100 : 0;
      const confidencePercentage = completionPercentage * 0.9;
      const masteryPercentage = completionPercentage * 0.7;

      await prisma.syllabusTracker.create({
        data: {
          userId: user.userId,
          subjectName: subject.name,
          unitsProgress: unitsProgress as any,
          topicStatuses: topicStatuses as any,
          completionPercentage: Math.round(completionPercentage),
          confidencePercentage: Math.round(confidencePercentage),
          masteryPercentage: Math.round(masteryPercentage),
        },
      });
    }
  }

  console.log('Seeding study sessions...');
  // Add some sessions for Harsh (Active today & past)
  await prisma.studySession.createMany({
    data: [
      {
        userId: userHarsh.userId,
        startTime: new Date(Date.now() - 4 * 3600000), // 4 hours ago
        endTime: new Date(Date.now() - 1.5 * 3600000), // 1.5 hours ago
        duration: 150, // 2.5 hours
        subject: 'Databases',
        topic: 'ER-Model, Relational Algebra, and SQL',
        tags: ['SQL', 'Joins'],
        notes: 'Revised SQL joins and nested queries. Solved 15 PYQs.',
        focusScore: 8.5,
        productivityScore: 8.0,
        verificationLevel: 2, // Focus timer
        isManualLog: false,
        interruptions: 2,
        trustedSession: true,
      },
      {
        userId: userHarsh.userId,
        startTime: new Date(Date.now() - 28 * 3600000),
        endTime: new Date(Date.now() - 26 * 3600000),
        duration: 120,
        subject: 'Algorithms',
        topic: 'Searching, Sorting and Hashing',
        tags: ['Sorting', 'Heaps'],
        notes: 'Constructed min heaps and practiced heap sort.',
        focusScore: 9.0,
        productivityScore: 9.0,
        verificationLevel: 3, // Browser checks verified
        isManualLog: false,
        interruptions: 0,
        trustedSession: true,
      },
    ],
  });

  // Aman sessions
  await prisma.studySession.createMany({
    data: [
      {
        userId: userAman.userId,
        startTime: new Date(Date.now() - 2 * 3600000),
        endTime: new Date(Date.now() - 0.25 * 3600000),
        duration: 105,
        subject: 'Computer Organization and Architecture',
        topic: 'Memory Hierarchy: Cache, Main, and Secondary',
        tags: ['Cache Mapping'],
        notes: 'Solved set-associative cache placement questions.',
        focusScore: 9.5,
        productivityScore: 9.5,
        verificationLevel: 4, // Webcam verified
        isManualLog: false,
        interruptions: 1,
        trustedSession: true,
      },
    ],
  });

  // Priya sessions
  await prisma.studySession.createMany({
    data: [
      {
        userId: userPriya.userId,
        startTime: new Date(Date.now() - 1 * 3600000),
        endTime: new Date(),
        duration: 60,
        subject: 'Theory of Computation',
        topic: 'Regular Expressions and Finite Automata',
        tags: ['DFA Minimization'],
        notes: 'Pumping lemma proofs and DFA minimization.',
        focusScore: 9.8,
        productivityScore: 9.8,
        verificationLevel: 2,
        isManualLog: false,
        interruptions: 0,
        trustedSession: true,
      },
    ],
  });

  console.log('Seeding study groups...');
  const group = await prisma.studyGroup.create({
    data: {
      groupName: 'AIR < 100 WARRIORS',
      creatorId: userHarsh.userId,
      groupType: GroupType.PUBLIC,
      memberCount: 4,
      currentStreak: 18,
      longestStreak: 45,
      groupConsistency: 92.5,
    },
  });

  console.log('Seeding group memberships...');
  await prisma.groupMembership.createMany({
    data: [
      { groupId: group.groupId, userId: userHarsh.userId, isAdmin: true, role: Role.CREATOR },
      { groupId: group.groupId, userId: userAman.userId, isAdmin: true, role: Role.ADMIN },
      { groupId: group.groupId, userId: userPriya.userId, isAdmin: false, role: Role.MEMBER },
      { groupId: group.groupId, userId: userRahul.userId, isAdmin: false, role: Role.MEMBER },
    ],
  });

  console.log('Seeding revision queues...');
  await prisma.revisionQueue.createMany({
    data: [
      {
        userId: userHarsh.userId,
        topicId: 'boolean-algebra',
        subjectId: 'digital-logic',
        nextRevisionDate: new Date(Date.now() - 24 * 3600000), // Overdue by 1 day
        interval: 3,
        completedCount: 1,
        missedCount: 0,
        status: RevisionStatus.OVERDUE,
      },
      {
        userId: userHarsh.userId,
        topicId: 'logic-prop',
        subjectId: 'discrete-maths',
        nextRevisionDate: new Date(), // Due today
        interval: 7,
        completedCount: 2,
        missedCount: 0,
        status: RevisionStatus.PENDING,
      },
      {
        userId: userHarsh.userId,
        topicId: 'cpu-scheduling',
        subjectId: 'os',
        nextRevisionDate: new Date(Date.now() + 3 * 24 * 3600000), // Due in 3 days
        interval: 15,
        completedCount: 4,
        missedCount: 1,
        status: RevisionStatus.PENDING,
      },
    ],
  });

  console.log('Seeding mock tests...');
  await prisma.mockTest.createMany({
    data: [
      {
        userId: userHarsh.userId,
        platform: 'MadeEasy',
        date: new Date(Date.now() - 5 * 24 * 3600000),
        marks: 68.5,
        accuracy: 82.4,
        rank: 312,
        timeManagement: { math: 30, technical: 120, aptitude: 30 },
        mistakeCategories: {
          'Calculation Errors': 4,
          'Conceptual Gaps': 3,
          'Silly Mistake': 2,
        },
        subjectPerformance: {
          'Engineering Mathematics': 12,
          Databases: 8,
          Algorithms: 10,
        },
        improvementAreas: ['Nested SQL Queries', 'Asymptotic Complexity Bounds'],
      },
      {
        userId: userPriya.userId,
        platform: 'Ace Academy',
        date: new Date(Date.now() - 3 * 24 * 3600000),
        marks: 84.0,
        accuracy: 91.2,
        rank: 18,
        mistakeCategories: { 'Conceptual Gaps': 1 },
        subjectPerformance: { TOC: 15, DBMS: 12 },
        improvementAreas: ['Turing machines undecidability proofs'],
      },
    ],
  });

  console.log('Seeding PYQ tracker...');
  await prisma.pYQTracker.createMany({
    data: [
      {
        userId: userHarsh.userId,
        subject: 'Databases',
        year: 2024,
        difficulty: 'Medium',
        solved: true,
        accuracy: 100.0,
        timeTaken: 12,
        category: 'SQL Joins',
        isMissed: false,
      },
      {
        userId: userHarsh.userId,
        subject: 'Algorithms',
        year: 2023,
        difficulty: 'Hard',
        solved: true,
        accuracy: 50.0,
        timeTaken: 25,
        category: 'Dynamic Programming',
        isMissed: true,
      },
    ],
  });

  console.log('Seeding achievements...');
  await prisma.achievement.createMany({
    data: [
      { userId: userHarsh.userId, achievementName: 'First Step: Start a Session', achievementCategory: 'Session' },
      { userId: userHarsh.userId, achievementName: 'Fire Starter: 7-Day Streak', achievementCategory: 'Streak' },
      { userId: userAman.userId, achievementName: 'Beast Mode: Study 8+ hours', achievementCategory: 'Duration' },
      { userId: userPriya.userId, achievementName: 'Flawless: 100% Mock Accuracy', achievementCategory: 'Mock' },
    ],
  });

  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: userHarsh.userId, type: 'Streak', message: 'Your study streak is at 12 days! Keep it up!' },
      { userId: userHarsh.userId, type: 'Revision', message: 'Revision overdue: Matrices and Determinants.' },
    ],
  });

  console.log('Seeding user stats...');
  await prisma.userStats.createMany({
    data: [
      {
        userId: userHarsh.userId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        dailyStudyHours: 2.5,
        dailyDebt: 3.5, // 6.0 target - 2.5 actual
        weeklyConsistency: 85.0,
        monthlyConsistency: 80.0,
        totalPYQsSolved: 32,
        revisionHealthScore: 82.0,
      },
      {
        userId: userAman.userId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        dailyStudyHours: 1.75,
        dailyDebt: 6.25,
        weeklyConsistency: 95.0,
        monthlyConsistency: 92.0,
        totalPYQsSolved: 145,
        revisionHealthScore: 94.0,
      },
    ],
  });

  console.log('Seeding activity feeds...');
  const act1 = await prisma.activityFeed.create({
    data: {
      userId: userPriya.userId,
      groupId: group.groupId,
      activityType: 'SESSION_COMPLETE',
      description: 'Priya Nair completed a 60m verified session in TOC: DFA Minimization 🔥',
      metadata: { duration: 60, focusScore: 9.8 },
    },
  });

  const act2 = await prisma.activityFeed.create({
    data: {
      userId: userAman.userId,
      groupId: group.groupId,
      activityType: 'SESSION_COMPLETE',
      description: 'Aman Sharma completed a 1h 45m verified session in COA: Cache Mapping ⚡',
      metadata: { duration: 105, focusScore: 9.5 },
    },
  });

  const act3 = await prisma.activityFeed.create({
    data: {
      userId: userHarsh.userId,
      groupId: group.groupId,
      activityType: 'PYQ_COMPLETE',
      description: 'Harsh Vardhan solved GATE 2024 SQL Joins PYQ! 🚀',
      metadata: { solved: true },
    },
  });

  console.log('Seeding reactions...');
  await prisma.activityReaction.createMany({
    data: [
      { activityId: act1.activityId, userId: userHarsh.userId, emoji: '🔥' },
      { activityId: act1.activityId, userId: userAman.userId, emoji: '🚀' },
      { activityId: act2.activityId, userId: userHarsh.userId, emoji: '⚡' },
      { activityId: act3.activityId, userId: userPriya.userId, emoji: '🫡' },
    ],
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
