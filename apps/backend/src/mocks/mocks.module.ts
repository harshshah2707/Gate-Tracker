import { Module } from '@nestjs/common';
import { MocksService } from './mocks.service';
import { MocksController } from './mocks.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MocksController],
  providers: [MocksService, PrismaService],
  exports: [MocksService],
})
export class MocksModule {}
