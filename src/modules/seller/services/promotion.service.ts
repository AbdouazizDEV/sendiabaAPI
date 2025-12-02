import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { PromotionType } from '@prisma/client';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: string, createPromotionDto: CreatePromotionDto) {
    try {
      // Vérifier que le produit existe et appartient au vendeur
      const product = await this.prisma.product.findFirst({
        where: {
          id: createPromotionDto.productId,
          sellerId,
        },
      });

      if (!product) {
        throw new NotFoundException('Produit non trouvé ou ne vous appartient pas');
      }

      // Vérifier les dates
      const startDate = new Date(createPromotionDto.startDate);
      const endDate = new Date(createPromotionDto.endDate);
      const now = new Date();

      if (endDate <= startDate) {
        throw new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        );
      }

      // Vérifier la valeur de réduction
      if (
        createPromotionDto.discountType === PromotionType.PERCENTAGE &&
        (createPromotionDto.discountValue < 0 ||
          createPromotionDto.discountValue > 100)
      ) {
        throw new BadRequestException(
          'Le pourcentage de réduction doit être entre 0 et 100',
        );
      }

      if (
        createPromotionDto.discountType === PromotionType.FIXED_AMOUNT &&
        createPromotionDto.discountValue < 0
      ) {
        throw new BadRequestException(
          'Le montant de réduction doit être positif',
        );
      }

      // Vérifier qu'il n'y a pas de promotion active en conflit
      const conflictingPromotion = await this.prisma.productPromotion.findFirst({
        where: {
          productId: createPromotionDto.productId,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          ],
        },
      });

      if (conflictingPromotion) {
        throw new BadRequestException(
          'Une promotion active existe déjà pour ce produit sur cette période',
        );
      }

      const promotion = await this.prisma.productPromotion.create({
        data: {
          productId: createPromotionDto.productId,
          title: createPromotionDto.title,
          description: createPromotionDto.description,
          discountType: createPromotionDto.discountType,
          discountValue: createPromotionDto.discountValue,
          startDate,
          endDate,
          isActive: createPromotionDto.isActive ?? true,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });

      this.logger.log(
        `Promotion créée pour le produit ${product.name} par le vendeur ${sellerId}`,
      );

      return promotion;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Erreur lors de la création de la promotion:', error);
      throw new BadRequestException(
        `Erreur lors de la création de la promotion: ${error.message}`,
      );
    }
  }

  async findAll(sellerId: string, includeExpired: boolean = false) {
    const now = new Date();

    const where: any = {
      product: {
        sellerId,
      },
    };

    if (!includeExpired) {
      where.endDate = { gte: now };
    }

    const promotions = await this.prisma.productPromotion.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return promotions;
  }

  async findOne(sellerId: string, promotionId: string) {
    const promotion = await this.prisma.productPromotion.findFirst({
      where: {
        id: promotionId,
        product: {
          sellerId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion non trouvée');
    }

    return promotion;
  }

  async findByProduct(sellerId: string, productId: string) {
    // Vérifier que le produit appartient au vendeur
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé ou ne vous appartient pas');
    }

    const promotions = await this.prisma.productPromotion.findMany({
      where: {
        productId,
      },
      orderBy: { startDate: 'desc' },
    });

    return promotions;
  }

  async update(
    sellerId: string,
    promotionId: string,
    updatePromotionDto: UpdatePromotionDto,
  ) {
    const promotion = await this.findOne(sellerId, promotionId);

    // Vérifier les dates si elles sont fournies
    if (updatePromotionDto.startDate || updatePromotionDto.endDate) {
      const startDate = updatePromotionDto.startDate
        ? new Date(updatePromotionDto.startDate)
        : promotion.startDate;
      const endDate = updatePromotionDto.endDate
        ? new Date(updatePromotionDto.endDate)
        : promotion.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        );
      }

      // Vérifier les conflits avec d'autres promotions
      const conflictingPromotion = await this.prisma.productPromotion.findFirst({
        where: {
          productId: promotion.productId,
          id: { not: promotionId },
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          ],
        },
      });

      if (conflictingPromotion) {
        throw new BadRequestException(
          'Une promotion active existe déjà pour ce produit sur cette période',
        );
      }
    }

    // Vérifier la valeur de réduction
    if (updatePromotionDto.discountValue !== undefined) {
      const discountType =
        updatePromotionDto.discountType || promotion.discountType;

      if (
        discountType === PromotionType.PERCENTAGE &&
        (updatePromotionDto.discountValue < 0 ||
          updatePromotionDto.discountValue > 100)
      ) {
        throw new BadRequestException(
          'Le pourcentage de réduction doit être entre 0 et 100',
        );
      }

      if (
        discountType === PromotionType.FIXED_AMOUNT &&
        updatePromotionDto.discountValue < 0
      ) {
        throw new BadRequestException(
          'Le montant de réduction doit être positif',
        );
      }
    }

    const updatedPromotion = await this.prisma.productPromotion.update({
      where: { id: promotionId },
      data: {
        title: updatePromotionDto.title,
        description: updatePromotionDto.description,
        discountType: updatePromotionDto.discountType,
        discountValue: updatePromotionDto.discountValue,
        startDate: updatePromotionDto.startDate
          ? new Date(updatePromotionDto.startDate)
          : undefined,
        endDate: updatePromotionDto.endDate
          ? new Date(updatePromotionDto.endDate)
          : undefined,
        isActive: updatePromotionDto.isActive,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    this.logger.log(`Promotion ${promotionId} mise à jour`);
    return updatedPromotion;
  }

  async remove(sellerId: string, promotionId: string) {
    const promotion = await this.findOne(sellerId, promotionId);

    await this.prisma.productPromotion.delete({
      where: { id: promotionId },
    });

    this.logger.log(`Promotion ${promotionId} supprimée`);
    return { message: 'Promotion supprimée avec succès' };
  }

  async getActivePromotions(sellerId: string) {
    const now = new Date();

    const promotions = await this.prisma.productPromotion.findMany({
      where: {
        product: {
          sellerId,
        },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return promotions;
  }

  // Public methods for general users
  async getPublicProductsOnPromotion(
    page: number,
    limit: number,
    categoryId?: string,
  ) {
    const skip = (page - 1) * limit;
    const now = new Date();

    // D'abord, récupérer les promotions actives pour obtenir les productIds
    const activePromotions = await this.prisma.productPromotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        productId: true,
      },
      distinct: ['productId'],
    });

    const productIds = activePromotions.map((p) => p.productId);

    if (productIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Ensuite, récupérer les produits avec leurs promotions
    const where: any = {
      id: { in: productIds },
      status: { not: 'ARCHIVED' }, // Exclure seulement les produits archivés
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: {
              url: true,
              alt: true,
            },
          },
          stock: {
            select: {
              quantity: true,
            },
          },
          promotions: {
            where: {
              isActive: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
            orderBy: { discountValue: 'desc' },
            take: 1,
            select: {
              id: true,
              title: true,
              description: true,
              discountType: true,
              discountValue: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Calculer le prix avec promotion pour chaque produit
    const productsWithPromotion = products.map((product) => {
      const activePromotion = product.promotions[0];
      let finalPrice = Number(product.price);
      let discountAmount = 0;

      if (activePromotion) {
        if (activePromotion.discountType === 'PERCENTAGE') {
          discountAmount =
            (Number(product.price) * Number(activePromotion.discountValue)) /
            100;
          finalPrice = Number(product.price) - discountAmount;
        } else {
          // FIXED_AMOUNT
          discountAmount = Number(activePromotion.discountValue);
          finalPrice = Number(product.price) - discountAmount;
          if (finalPrice < 0) finalPrice = 0;
        }
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : null,
        finalPrice,
        discountAmount,
        promotion: activePromotion
          ? {
              id: activePromotion.id,
              title: activePromotion.title,
              description: activePromotion.description,
              discountType: activePromotion.discountType,
              discountValue: Number(activePromotion.discountValue),
              discountPercentage:
                activePromotion.discountType === 'PERCENTAGE'
                  ? Number(activePromotion.discountValue)
                  : (discountAmount / Number(product.price)) * 100,
              startDate: activePromotion.startDate,
              endDate: activePromotion.endDate,
            }
          : null,
        category: product.category,
        image: product.images[0]?.url || null,
        stock: product.stock
          ? {
              quantity: product.stock.quantity,
              inStock: product.stock.quantity > 0,
            }
          : null,
      };
    });

    return {
      data: productsWithPromotion,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

