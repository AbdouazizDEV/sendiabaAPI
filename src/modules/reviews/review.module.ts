import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './services/review.service';
import { PrismaService } from '../seller/services/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReviewController],
  providers: [ReviewService, PrismaService],
  exports: [ReviewService],
})
export class ReviewModule {}

