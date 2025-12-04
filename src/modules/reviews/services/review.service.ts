import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un nouvel avis pour un produit
   */
  async create(userId: string, productId: string, createReviewDto: CreateReviewDto) {
    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Vérifier que le produit n'est pas archivé
    if (product.status === 'ARCHIVED') {
      throw new NotFoundException('Produit non trouvé');
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
    const existingReview = await this.prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('Vous avez déjà laissé un avis pour ce produit. Vous pouvez le modifier.');
    }

    // Vérifier si l'utilisateur a acheté le produit (pour marquer comme vérifié)
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
      },
    });

    // Créer l'avis
    const review = await this.prisma.productReview.create({
      data: {
        productId,
        userId,
        rating: createReviewDto.rating,
        title: createReviewDto.title,
        comment: createReviewDto.comment,
        isVerified: !!hasPurchased,
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
    });

    return this.formatReview(review);
  }

  /**
   * Récupérer tous les avis d'un produit avec pagination
   */
  async findByProduct(productId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: {
          productId,
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
        skip,
        take: limit,
      }),
      this.prisma.productReview.count({
        where: {
          productId,
          isPublished: true,
        },
      }),
    ]);

    return {
      reviews: reviews.map((review) => this.formatReview(review)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un avis spécifique
   */
  async findOne(reviewId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    return this.formatReview(review);
  }

  /**
   * Mettre à jour un avis
   */
  async update(userId: string, reviewId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    // Vérifier que l'utilisateur est le propriétaire de l'avis
    if (review.userId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cet avis');
    }

    const updatedReview = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: updateReviewDto,
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
    });

    return this.formatReview(updatedReview);
  }

  /**
   * Supprimer un avis
   */
  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    // Vérifier que l'utilisateur est le propriétaire de l'avis
    if (review.userId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cet avis');
    }

    await this.prisma.productReview.delete({
      where: { id: reviewId },
    });

    return { message: 'Avis supprimé avec succès' };
  }

  /**
   * Marquer un avis comme utile
   */
  async markHelpful(reviewId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    const updatedReview = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });

    return { helpfulCount: updatedReview.helpfulCount };
  }

  /**
   * Calculer les statistiques de notes pour un produit
   */
  async getProductRatingStats(productId: string) {
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
      averageRating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }

  /**
   * Formater un avis pour la réponse
   */
  private formatReview(review: any) {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user
        ? {
            id: review.user.id,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            profilePicture: review.user.profilePicture,
          }
        : null,
      product: review.product
        ? {
            id: review.product.id,
            name: review.product.name,
            slug: review.product.slug,
          }
        : null,
    };
  }
}

