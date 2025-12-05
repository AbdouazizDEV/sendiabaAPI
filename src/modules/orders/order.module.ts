import { Module, forwardRef } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './services/order.service';
import { SellerModule } from '../seller/seller.module';
import { PaymentModule } from '../payments/payment.module';
import { ProfileModule } from '../profile/profile.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [SellerModule, PaymentModule, ProfileModule, forwardRef(() => NotificationModule)],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

