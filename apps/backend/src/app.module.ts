import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { GroupsModule } from './groups/groups.module';
import { SyllabusModule } from './syllabus/syllabus.module';
import { RevisionsModule } from './revisions/revisions.module';
import { MocksModule } from './mocks/mocks.module';
import { ActivityModule } from './activity/activity.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SocketModule } from './socket/socket.module';
import { RankProjectionModule } from './rank-projection/rank-projection.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    SessionsModule,
    GroupsModule,
    SyllabusModule,
    RevisionsModule,
    MocksModule,
    ActivityModule,
    AnalyticsModule,
    SocketModule,
    RankProjectionModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
