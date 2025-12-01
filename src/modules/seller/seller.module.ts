import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SellerController } from './seller.controller';
import { CategoryController } from './controllers/category.controller';
import { ProductService } from './services/product.service';
import { CategoryService } from './services/category.service';
import { PrismaService } from './services/prisma.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, CloudinaryModule, AuthModule],
  controllers: [SellerController, CategoryController],
  providers: [ProductService, CategoryService, PrismaService],
  exports: [ProductService, CategoryService, PrismaService],
})
export class SellerModule {}

