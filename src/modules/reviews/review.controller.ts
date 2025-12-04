import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './services/review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ParseUUIDPipe } from '@nestjs/common/pipes';

@ApiTags('⭐ Avis Produits')
@Controller('products')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':productId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un avis sur un produit',
    description: 'Permet à un client authentifié d\'ajouter un avis et une note (1-5) sur un produit',
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiResponse({
    status: 201,
    description: 'Avis créé avec succès',
    schema: {
      example: {
        success: true,
        message: 'Avis créé avec succès',
        data: {
          id: 'uuid',
          rating: 5,
          title: 'Excellent produit',
          comment: 'Très satisfait de mon achat',
          isVerified: true,
          helpfulCount: 0,
          createdAt: '2025-12-03T10:00:00.000Z',
          user: {
            id: 'uuid',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: 'https://...',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou avis déjà existant' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async create(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const review = await this.reviewService.create(user.id, productId, createReviewDto);
    return {
      success: true,
      message: 'Avis créé avec succès',
      data: review,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':productId/reviews')
  @ApiOperation({
    summary: 'Récupérer les avis d\'un produit',
    description: 'Retourne la liste paginée des avis publiés pour un produit spécifique',
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des avis récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.reviewService.findByProduct(productId, page, limit);
    return {
      success: true,
      message: 'Avis récupérés avec succès',
      data: result.reviews,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('reviews/:reviewId')
  @ApiOperation({
    summary: 'Récupérer un avis spécifique',
    description: 'Retourne les détails d\'un avis spécifique',
  })
  @ApiParam({ name: 'reviewId', description: 'ID de l\'avis' })
  @ApiResponse({
    status: 200,
    description: 'Avis récupéré avec succès',
  })
  @ApiResponse({ status: 404, description: 'Avis non trouvé' })
  async findOne(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const review = await this.reviewService.findOne(reviewId);
    return {
      success: true,
      message: 'Avis récupéré avec succès',
      data: review,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modifier un avis',
    description: 'Permet à un client de modifier son propre avis',
  })
  @ApiParam({ name: 'reviewId', description: 'ID de l\'avis' })
  @ApiResponse({
    status: 200,
    description: 'Avis modifié avec succès',
  })
  @ApiResponse({ status: 403, description: 'Non autorisé à modifier cet avis' })
  @ApiResponse({ status: 404, description: 'Avis non trouvé' })
  async update(
    @CurrentUser() user: User,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.reviewService.update(user.id, reviewId, updateReviewDto);
    return {
      success: true,
      message: 'Avis modifié avec succès',
      data: review,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un avis',
    description: 'Permet à un client de supprimer son propre avis',
  })
  @ApiParam({ name: 'reviewId', description: 'ID de l\'avis' })
  @ApiResponse({
    status: 200,
    description: 'Avis supprimé avec succès',
  })
  @ApiResponse({ status: 403, description: 'Non autorisé à supprimer cet avis' })
  @ApiResponse({ status: 404, description: 'Avis non trouvé' })
  async remove(@CurrentUser() user: User, @Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const result = await this.reviewService.remove(user.id, reviewId);
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reviews/:reviewId/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer un avis comme utile',
    description: 'Permet d\'incrémenter le compteur "utile" d\'un avis',
  })
  @ApiParam({ name: 'reviewId', description: 'ID de l\'avis' })
  @ApiResponse({
    status: 200,
    description: 'Avis marqué comme utile',
  })
  @ApiResponse({ status: 404, description: 'Avis non trouvé' })
  async markHelpful(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const result = await this.reviewService.markHelpful(reviewId);
    return {
      success: true,
      message: 'Avis marqué comme utile',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':productId/reviews/stats')
  @ApiOperation({
    summary: 'Statistiques des notes d\'un produit',
    description: 'Retourne la moyenne des notes, le nombre total d\'avis et la distribution des notes',
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
    schema: {
      example: {
        success: true,
        message: 'Statistiques récupérées avec succès',
        data: {
          averageRating: 4.5,
          totalReviews: 42,
          ratingDistribution: {
            5: 20,
            4: 15,
            3: 5,
            2: 1,
            1: 1,
          },
        },
      },
    },
  })
  async getRatingStats(@Param('productId', ParseUUIDPipe) productId: string) {
    const stats = await this.reviewService.getProductRatingStats(productId);
    return {
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }
}

