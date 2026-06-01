import { Module } from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { RevisionsController } from './revisions.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RevisionsController],
  providers: [RevisionsService, PrismaService],
  exports: [RevisionsService],
})
export class RevisionsModule {}
