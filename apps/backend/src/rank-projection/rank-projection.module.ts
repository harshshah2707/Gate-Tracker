import { Module } from '@nestjs/common';
import { RankProjectionService } from './rank-projection.service';
import { RankProjectionController } from './rank-projection.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RankProjectionController],
  providers: [RankProjectionService, PrismaService],
  exports: [RankProjectionService],
})
export class RankProjectionModule {}
