import { PrismaClient } from '@prisma/client';

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
  console.log('Database cleared successfully. Ready for clean user registration.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
