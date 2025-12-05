import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';

@Injectable()
export class FavoriteService {
  private readonly logger = new Logger(FavoriteService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convertir Decimal en Number
   */
  private toNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    try {
      return parseFloat(String(value));
    } catch {
      return null;
    }
  }

  /**
   * Récupère la liste des produits favoris d'un utilisateur
   */
  async getFavorites(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
              stock: true,
              promotions: {
                where: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() },
                },
                orderBy: { discountValue: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites: favorites.map((fav) => {
        const product = fav.product;
        const image = product.images[0]?.url || null;
        const promotion = product.promotions[0];
        
        let finalPrice = this.toNumber(product.price) || 0;
        let discountAmount = 0;
        let hasPromotion = false;

        if (promotion) {
          hasPromotion = true;
          if (promotion.discountType === 'PERCENTAGE') {
            const discountPercent = this.toNumber(promotion.discountValue) || 0;
            discountAmount = (finalPrice * discountPercent) / 100;
            finalPrice = finalPrice - discountAmount;
          } else if (promotion.discountType === 'FIXED_AMOUNT') {
            discountAmount = this.toNumber(promotion.discountValue) || 0;
            finalPrice = Math.max(0, finalPrice - discountAmount);
          }
        }

        return {
          id: fav.id,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.shortDescription || product.description.substring(0, 150),
            image,
            price: this.toNumber(product.price),
            compareAtPrice: this.toNumber(product.compareAtPrice),
            finalPrice,
            discountAmount: hasPromotion ? discountAmount : 0,
            hasPromotion,
            status: product.status,
            stock: product.stock
              ? {
                  quantity: product.stock.quantity,
                  available: product.stock.quantity - product.stock.reservedQuantity,
                }
              : null,
          },
          addedAt: fav.createdAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ajoute un produit aux favoris
   */
  async addFavorite(userId: string, productId: string) {
    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, status: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    if (product.status !== 'ACTIVE') {
      throw new ConflictException(
        'Ce produit n\'est pas disponible pour être ajouté aux favoris',
      );
    }

    // Vérifier si le produit est déjà dans les favoris
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Ce produit est déjà dans vos favoris');
    }

    // Ajouter aux favoris
    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    this.logger.log(
      `Produit ${productId} ajouté aux favoris pour l'utilisateur ${userId}`,
    );

    return {
      id: favorite.id,
      product: {
        id: favorite.product.id,
        name: favorite.product.name,
        slug: favorite.product.slug,
        image: favorite.product.images[0]?.url || null,
      },
      addedAt: favorite.createdAt,
      message: 'Produit ajouté aux favoris avec succès',
    };
  }

  /**
   * Retire un produit des favoris
   */
  async removeFavorite(userId: string, productId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException(
        'Ce produit n\'est pas dans vos favoris',
      );
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    this.logger.log(
      `Produit ${productId} retiré des favoris pour l'utilisateur ${userId}`,
    );

    return {
      productId: favorite.product.id,
      productName: favorite.product.name,
      message: 'Produit retiré des favoris avec succès',
    };
  }
}

