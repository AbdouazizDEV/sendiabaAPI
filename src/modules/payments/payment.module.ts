import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';
import { PayDunyaService } from './services/paydunya.service';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [HttpModule, SellerModule],
  controllers: [PaymentController],
  providers: [PaymentService, PayDunyaService],
  exports: [PaymentService, PayDunyaService],
})
export class PaymentModule {}




