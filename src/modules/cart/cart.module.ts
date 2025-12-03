import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './services/cart.service';
import { SellerModule } from '../seller/seller.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SellerModule, AuthModule], // Importer SellerModule pour PrismaService
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}





