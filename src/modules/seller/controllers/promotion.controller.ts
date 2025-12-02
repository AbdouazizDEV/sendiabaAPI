import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PromotionService } from '../services/promotion.service';
import { PrismaService } from '../services/prisma.service';

@ApiTags('🎯 Promotions (Publiques)')
@Controller('promotions')
export class PromotionController {
  constructor(
    private readonly promotionService: PromotionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('products')
  @ApiOperation({
    summary: 'Liste des produits en promotion',
    description: 'Retourne tous les produits actuellement en promotion (route publique)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de produits par page',
    example: 20,
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filtrer par catégorie',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits en promotion récupérés avec succès',
  })
  async getProductsOnPromotion(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('categoryId') categoryId?: string,
  ) {
    const result = await this.promotionService.getPublicProductsOnPromotion(
      page,
      limit,
      categoryId,
    );
    return {
      success: true,
      message: 'Produits en promotion récupérés avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Détails des promotions d\'un produit',
    description: 'Retourne les promotions actives d\'un produit spécifique (route publique)',
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Promotions du produit récupérées avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async getProductPromotions(@Param('productId', ParseUUIDPipe) productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    const now = new Date();
    const promotions = await this.prisma.productPromotion.findMany({
      where: {
        productId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { discountValue: 'desc' },
    });

    // Calculer les prix avec promotion
    const promotionsWithPrice = promotions.map((promotion) => {
      let finalPrice = Number(product.price);
      let discountAmount = 0;

      if (promotion.discountType === 'PERCENTAGE') {
        discountAmount =
          (Number(product.price) * Number(promotion.discountValue)) / 100;
        finalPrice = Number(product.price) - discountAmount;
      } else {
        // FIXED_AMOUNT
        discountAmount = Number(promotion.discountValue);
        finalPrice = Number(product.price) - discountAmount;
        if (finalPrice < 0) finalPrice = 0;
      }

      return {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: Number(promotion.discountValue),
        discountPercentage:
          promotion.discountType === 'PERCENTAGE'
            ? Number(promotion.discountValue)
            : (discountAmount / Number(product.price)) * 100,
        originalPrice: Number(product.price),
        finalPrice,
        discountAmount,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
      };
    });

    return {
      success: true,
      message: 'Promotions du produit récupérées avec succès',
      data: {
        product: {
          id: product.id,
          name: product.name,
          originalPrice: Number(product.price),
        },
        promotions: promotionsWithPrice,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

