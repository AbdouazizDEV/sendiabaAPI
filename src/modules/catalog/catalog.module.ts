import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './services/catalog.service';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [SellerModule], // Importer SellerModule pour accéder à PrismaService
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

