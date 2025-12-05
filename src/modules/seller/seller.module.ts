import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SellerController } from './seller.controller';
import { CategoryController } from './controllers/category.controller';
import { PromotionController } from './controllers/promotion.controller';
import { SellerOrderController } from './controllers/seller-order.controller';
import { ProductService } from './services/product.service';
import { CategoryService } from './services/category.service';
import { PromotionService } from './services/promotion.service';
import { SellerOrderService } from './services/orders/seller-order.service';
import { PrismaService } from './services/prisma.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [ConfigModule, CloudinaryModule, AuthModule, InvoiceModule, MailModule, forwardRef(() => NotificationModule)],
  controllers: [SellerController, CategoryController, PromotionController, SellerOrderController],
  providers: [ProductService, CategoryService, PromotionService, SellerOrderService, PrismaService],
  exports: [ProductService, CategoryService, PromotionService, SellerOrderService, PrismaService],
})
export class SellerModule {}

