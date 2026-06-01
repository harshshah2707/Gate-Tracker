import { Module } from '@nestjs/common';
import { SyllabusService } from './syllabus.service';
import { SyllabusController } from './syllabus.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SyllabusController],
  providers: [SyllabusService, PrismaService],
  exports: [SyllabusService],
})
export class SyllabusModule {}
