import { Module, forwardRef } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [forwardRef(() => SellerModule)],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

