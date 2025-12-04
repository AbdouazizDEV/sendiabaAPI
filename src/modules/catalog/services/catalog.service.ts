import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';
import { FilterProductsDto, SortField, SortOrder } from '../dto/filter-products.dto';
import { SearchProductsDto } from '../dto/search-products.dto';
import { ProductStatus, Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Convertir Decimal en Number pour la sérialisation JSON
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

  // Calculer le prix avec promotion
  private calculatePriceWithPromotion(product: any): {
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    discountPercentage: number | null;
    hasPromotion: boolean;
  } {
    const originalPrice = this.toNumber(product.price) || 0;
    let finalPrice = originalPrice;
    let discountAmount = 0;
    let discountPercentage: number | null = null;
    let hasPromotion = false;

    if (product.promotions && product.promotions.length > 0) {
      const activePromotion = product.promotions[0]; // Prendre la première promotion active
      hasPromotion = true;

      if (activePromotion.discountType === 'PERCENTAGE') {
        discountPercentage = this.toNumber(activePromotion.discountValue);
        discountAmount = (originalPrice * (discountPercentage || 0)) / 100;
        finalPrice = originalPrice - discountAmount;
      } else {
        // FIXED_AMOUNT
        discountAmount = this.toNumber(activePromotion.discountValue) || 0;
        finalPrice = originalPrice - discountAmount;
        if (finalPrice < 0) finalPrice = 0;
        discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
      }
    }

    return {
      originalPrice,
      finalPrice,
      discountAmount,
      discountPercentage,
      hasPromotion,
    };
  }

  // Formater un produit pour la réponse publique
  private formatProduct(product: any, stats?: any) {
    const pricing = this.calculatePriceWithPromotion(product);

    // Formater les avis
    const reviews = (product.reviews || []).map((review: any) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      user: review.user
        ? {
            id: review.user.id,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            profilePicture: review.user.profilePicture,
          }
        : null,
    }));

    // Formater le seller avec les informations de l'entreprise si disponible
    let sellerInfo: any = null;
    if (product.seller) {
      const seller = product.seller as any;
      sellerInfo = {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        phone: seller.phone,
        role: seller.role,
        hasCompany: !!seller.company,
        company: seller.company
          ? {
              id: seller.company.id,
              name: seller.company.name,
              legalName: seller.company.legalName,
              email: seller.company.email,
              phone: seller.company.phone,
              address: seller.company.address,
              city: seller.company.city,
              region: seller.company.region,
              country: seller.company.country,
              website: seller.company.website,
              logo: seller.company.logo,
              description: seller.company.description,
            }
          : null,
      };
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      sku: product.sku,
      brand: product.brand,
      status: product.status,
      price: pricing.originalPrice,
      finalPrice: pricing.finalPrice,
      discountAmount: pricing.discountAmount,
      discountPercentage: pricing.discountPercentage,
      hasPromotion: pricing.hasPromotion,
      compareAtPrice: this.toNumber(product.compareAtPrice),
      weight: this.toNumber(product.weight),
      length: this.toNumber(product.length),
      width: this.toNumber(product.width),
      height: this.toNumber(product.height),
      tags: product.tags || [],
      isDigital: product.isDigital,
      requiresShipping: product.requiresShipping,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description,
          }
        : null,
      images: (product.images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
        isPrimary: img.isPrimary,
      })),
      stock: product.stock
        ? {
            quantity: product.stock.quantity,
            reservedQuantity: product.stock.reservedQuantity,
            inStock: product.stock.quantity > 0,
            location: product.stock.location,
          }
        : null,
      seller: sellerInfo,
      reviews: {
        items: reviews,
        stats: stats || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        },
      },
      statistics: stats || {
        totalSales: 0,
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      },
    };
  }

  // Liste des produits avec pagination, filtres et tri
  async findAll(filterDto: FilterProductsDto) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      minPrice,
      maxPrice,
      location,
      region,
      inStock,
      status,
      sortBy = SortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      tags,
      minDiscountPercentage,
      brand,
      sellerId,
    } = filterDto;

    const skip = (page - 1) * limit;

    // Construire les conditions WHERE
    const where: Prisma.ProductWhereInput = {
      status: status || { not: 'ARCHIVED' }, // Par défaut, exclure les produits archivés
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (tags && tags.length > 0) {
      where.tags = { hasEvery: tags };
    }

    // Filtrer par marque
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    // Filtrer par vendeur
    if (sellerId) {
      where.sellerId = sellerId;
    }

    // Filtrer par stock et localisation
    if (inStock === true || location || region) {
      const stockConditions: any = {};
      
      if (inStock === true) {
        stockConditions.quantity = { gt: 0 };
      }

      if (location || region) {
        const locationConditions: any[] = [];
        if (location) {
          locationConditions.push({ location: { contains: location, mode: 'insensitive' } });
        }
        if (region) {
          locationConditions.push({ location: { contains: region, mode: 'insensitive' } });
        }
        if (locationConditions.length > 0) {
          stockConditions.OR = locationConditions;
        }
      }

      where.stock = stockConditions;
    }

    // Construire l'ordre de tri
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === SortField.PRICE) {
      orderBy = { price: sortOrder };
    } else if (sortBy === SortField.NAME) {
      orderBy = { name: sortOrder };
    } else if (sortBy === SortField.CREATED_AT) {
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const now = new Date();

    // Filtrer par pourcentage de promotion minimum
    if (minDiscountPercentage !== undefined) {
      // Récupérer les promotions actives avec leurs produits
      const promotionsWithProducts = await this.prisma.productPromotion.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: {
          product: {
            select: {
              id: true,
              price: true,
            },
          },
        },
      });

      // Filtrer les produits qui ont une promotion >= minDiscountPercentage
      const productIdsWithPromotion: string[] = [];
      
      for (const promo of promotionsWithProducts) {
        let discountPercentage = 0;
        
        if (promo.discountType === 'PERCENTAGE') {
          discountPercentage = this.toNumber(promo.discountValue) || 0;
        } else {
          // Pour FIXED_AMOUNT, calculer le pourcentage
          const price = this.toNumber(promo.product.price) || 0;
          if (price > 0) {
            const discountAmount = this.toNumber(promo.discountValue) || 0;
            discountPercentage = (discountAmount / price) * 100;
          }
        }
        
        if (discountPercentage >= minDiscountPercentage) {
          productIdsWithPromotion.push(promo.productId);
        }
      }

      if (productIdsWithPromotion.length > 0) {
        where.id = { in: productIdsWithPromotion };
      } else {
        // Aucun produit ne correspond, retourner une liste vide
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
    }

    // Récupérer les produits
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 5, // Limiter à 5 images
          },
          stock: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Formater les produits
    const formattedProducts = products.map((product) => this.formatProduct(product));

    return {
      data: formattedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Détails d'un produit spécifique
  async findOne(id: string) {
    const now = new Date();

    // Récupérer les avis séparément pour éviter les problèmes de relation
    const [product, reviews] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
          },
          stock: true,
          seller: {
            include: {
              company: true,
            },
          },
          promotions: {
            where: {
              isActive: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
            orderBy: { discountValue: 'desc' },
          },
        },
      }),
      this.prisma.productReview.findMany({
        where: {
          productId: id,
          isPublished: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    // Ajouter les avis au produit
    if (product) {
      (product as any).reviews = reviews;
    }

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Vérifier que le produit n'est pas archivé
    if (product.status === 'ARCHIVED') {
      throw new NotFoundException('Produit non trouvé');
    }

    // Calculer les statistiques de notes
    const ratingStats = await this.getProductRatingStats(id);

    // Calculer les statistiques du produit
    const [totalSales, totalReviews] = await Promise.all([
      this.prisma.orderItem.count({
        where: { productId: id },
      }),
      this.prisma.productReview.count({
        where: {
          productId: id,
          isPublished: true,
        },
      }),
    ]);

    const productStats = {
      totalSales,
      ...ratingStats,
      totalReviews, // Surcharger totalReviews de ratingStats avec le count exact
    };

    return this.formatProduct(product, productStats);
  }

  // Calculer les statistiques de notes pour un produit
  private async getProductRatingStats(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        isPublished: true,
      },
      select: {
        rating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }

  // Liste des catégories
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                status: { not: 'ARCHIVED' },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parent: cat.parent,
      children: cat.children,
      productCount: cat._count.products,
    }));
  }

  // Recherche textuelle de produits
  async search(searchDto: SearchProductsDto) {
    const { query, page = 1, limit = 20, categoryId } = searchDto;

    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Le terme de recherche ne peut pas être vide');
    }

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: { not: 'ARCHIVED' },
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const now = new Date();

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 5,
          },
          stock: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
          },
        },
        skip,
        take: limit,
        orderBy: [
          { name: 'asc' }, // Trier par pertinence (nom)
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((product) => this.formatProduct(product));

    return {
      data: formattedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query,
      },
    };
  }

  // Produits mis en avant/sponsorisés
  async getFeatured(limit: number = 10) {
    const now = new Date();

    // Produits avec promotions actives ou produits récents populaires
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            promotions: {
              some: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
              },
            },
          },
          {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Derniers 30 jours
            },
          },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 5,
        },
        stock: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        },
      },
      orderBy: [
        { createdAt: 'desc' }, // Produits récents en premier
      ],
      take: limit,
    });

    return products.map((product) => this.formatProduct(product));
  }

  // Produits en promotion
  async getProductsOnPromotion(page: number = 1, limit: number = 20, categoryId?: string) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.ProductWhereInput = {
      status: { not: 'ARCHIVED' },
      promotions: {
        some: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
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
              description: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 5,
          },
          stock: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((product) => this.formatProduct(product));

    return {
      data: formattedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Meilleures ventes (pour l'instant, on retourne les produits les plus récents avec stock)
  // TODO: Implémenter avec un système de commandes réel
  async getBestSellers(limit: number = 20) {
    const now = new Date();

    // Pour l'instant, retourner les produits actifs avec stock, triés par date de création
    // Dans le futur, cela devrait être basé sur les commandes réelles
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock: {
          quantity: { gt: 0 },
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 5,
        },
        stock: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return products.map((product) => this.formatProduct(product));
  }

  // Filtrer les produits (alias pour findAll avec filtres spécifiques)
  async filterProducts(filterDto: FilterProductsDto) {
    return this.findAll(filterDto);
  }

  // Trier les produits (alias pour findAll avec tri spécifique)
  async sortProducts(filterDto: FilterProductsDto) {
    return this.findAll(filterDto);
  }
}

