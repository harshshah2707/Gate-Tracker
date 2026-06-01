-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN', 'CREATOR');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('PRIVATE', 'COLLEGE', 'PUBLIC', 'BATCH');

-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "currentYear" INTEGER NOT NULL,
    "targetRank" INTEGER NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "currentPreparationLevel" TEXT NOT NULL,
    "dailyStudyTarget" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "totalStudyHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "accountabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estimatedRankMin" INTEGER NOT NULL DEFAULT 5000,
    "estimatedRankMax" INTEGER NOT NULL DEFAULT 20000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "tags" TEXT[],
    "notes" TEXT,
    "focusScore" DOUBLE PRECISION NOT NULL,
    "productivityScore" DOUBLE PRECISION NOT NULL,
    "verificationLevel" INTEGER NOT NULL,
    "isManualLog" BOOLEAN NOT NULL DEFAULT false,
    "interruptions" INTEGER NOT NULL DEFAULT 0,
    "trustedSession" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "StudyGroup" (
    "groupId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "groupType" "GroupType" NOT NULL DEFAULT 'PUBLIC',
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "groupConsistency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("groupId")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "SyllabusTracker" (
    "subjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "unitsProgress" JSONB NOT NULL,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidencePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "masteryPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "topicStatuses" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyllabusTracker_pkey" PRIMARY KEY ("subjectId")
);

-- CreateTable
CREATE TABLE "RevisionQueue" (
    "revisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "nextRevisionDate" TIMESTAMP(3) NOT NULL,
    "interval" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "missedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RevisionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "RevisionQueue_pkey" PRIMARY KEY ("revisionId")
);

-- CreateTable
CREATE TABLE "MockTest" (
    "mockId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "timeManagement" JSONB,
    "mistakeCategories" JSONB NOT NULL,
    "subjectPerformance" JSONB NOT NULL,
    "improvementAreas" TEXT[],

    CONSTRAINT "MockTest_pkey" PRIMARY KEY ("mockId")
);

-- CreateTable
CREATE TABLE "PYQTracker" (
    "pYQId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION,
    "timeTaken" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "isMissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PYQTracker_pkey" PRIMARY KEY ("pYQId")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "statsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dailyStudyHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dailyDebt" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weeklyConsistency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "monthlyConsistency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalPYQsSolved" INTEGER NOT NULL DEFAULT 0,
    "revisionHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("statsId")
);

-- CreateTable
CREATE TABLE "ActivityFeed" (
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "ActivityReaction" (
    "reactionId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "ActivityReaction_pkey" PRIMARY KEY ("reactionId")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "achievementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementName" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievementCategory" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("achievementId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");

-- CreateIndex
CREATE INDEX "StudySession_createdAt_idx" ON "StudySession"("createdAt");

-- CreateIndex
CREATE INDEX "GroupMembership_userId_idx" ON "GroupMembership"("userId");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "SyllabusTracker_userId_idx" ON "SyllabusTracker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusTracker_userId_subjectName_key" ON "SyllabusTracker"("userId", "subjectName");

-- CreateIndex
CREATE INDEX "RevisionQueue_userId_idx" ON "RevisionQueue"("userId");

-- CreateIndex
CREATE INDEX "RevisionQueue_nextRevisionDate_idx" ON "RevisionQueue"("nextRevisionDate");

-- CreateIndex
CREATE INDEX "RevisionQueue_topicId_idx" ON "RevisionQueue"("topicId");

-- CreateIndex
CREATE INDEX "MockTest_userId_idx" ON "MockTest"("userId");

-- CreateIndex
CREATE INDEX "MockTest_date_idx" ON "MockTest"("date");

-- CreateIndex
CREATE INDEX "PYQTracker_userId_idx" ON "PYQTracker"("userId");

-- CreateIndex
CREATE INDEX "UserStats_userId_idx" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_date_idx" ON "UserStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_date_key" ON "UserStats"("userId", "date");

-- CreateIndex
CREATE INDEX "ActivityFeed_userId_idx" ON "ActivityFeed"("userId");

-- CreateIndex
CREATE INDEX "ActivityFeed_groupId_idx" ON "ActivityFeed"("groupId");

-- CreateIndex
CREATE INDEX "ActivityFeed_timestamp_idx" ON "ActivityFeed"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityReaction_activityId_idx" ON "ActivityReaction"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReaction_activityId_userId_emoji_key" ON "ActivityReaction"("activityId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusTracker" ADD CONSTRAINT "SyllabusTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionQueue" ADD CONSTRAINT "RevisionQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTest" ADD CONSTRAINT "MockTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PYQTracker" ADD CONSTRAINT "PYQTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityFeed"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
