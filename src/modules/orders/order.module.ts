import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './services/order.service';
import { SellerModule } from '../seller/seller.module';
import { PaymentModule } from '../payments/payment.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [SellerModule, PaymentModule, ProfileModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

