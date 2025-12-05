import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FavoriteService } from './services/favorite.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ParseUUIDPipe } from '@nestjs/common/pipes';

@ApiTags('⭐ Favoris')
@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
@ApiBearerAuth('JWT-auth')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste des produits favoris',
    description: `
    **Récupère la liste de tous les produits favoris de l'utilisateur connecté**
    
    Cet endpoint permet au client de consulter tous ses produits favoris avec pagination.
    
    **Fonctionnalités :**
    - Liste paginée de tous les produits favoris
    - Informations complètes sur chaque produit (nom, prix, image, promotions)
    - Calcul automatique des prix avec promotions
    - Informations de stock disponibles
    - Tri par date d'ajout (plus récents en premier)
    
    **Utilisation :** Idéal pour afficher la page "Mes favoris" dans l'application.
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'éléments par page (défaut: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des favoris récupérée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Liste des favoris récupérée avec succès',
        data: {
          favorites: [
            {
              id: 'favorite-uuid',
              product: {
                id: 'product-uuid',
                name: 'Produit exemple',
                slug: 'produit-exemple',
                description: 'Description courte du produit...',
                image: 'https://example.com/image.jpg',
                price: 50000,
                compareAtPrice: 60000,
                finalPrice: 45000,
                discountAmount: 5000,
                hasPromotion: true,
                status: 'ACTIVE',
                stock: {
                  quantity: 10,
                  available: 8,
                },
              },
              addedAt: '2025-12-04T10:00:00.000Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 5,
            totalPages: 1,
          },
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  async getFavorites(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.favoriteService.getFavorites(
      req.user.id,
      page,
      limit,
    );
    return {
      success: true,
      message: 'Liste des favoris récupérée avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un produit aux favoris',
    description: `
    **Ajoute un produit à la liste des favoris de l'utilisateur**
    
    Cet endpoint permet au client d'ajouter un produit à ses favoris pour le retrouver facilement plus tard.
    
    **Fonctionnalités :**
    - Vérifie que le produit existe et est actif
    - Empêche les doublons (un produit ne peut être ajouté qu'une seule fois)
    - Retourne les informations du produit ajouté
    
    **Prérequis :**
    - Le produit doit exister
    - Le produit doit être en statut ACTIVE
    - Le produit ne doit pas déjà être dans les favoris
    
    **Utilisation :** À appeler lorsque l'utilisateur clique sur le bouton "Ajouter aux favoris".
    `,
  })
  @ApiBody({
    type: AddFavoriteDto,
    description: 'UUID du produit à ajouter aux favoris',
  })
  @ApiResponse({
    status: 201,
    description: 'Produit ajouté aux favoris avec succès',
    schema: {
      example: {
        success: true,
        message: 'Produit ajouté aux favoris avec succès',
        data: {
          id: 'favorite-uuid',
          product: {
            id: 'product-uuid',
            name: 'Produit exemple',
            slug: 'produit-exemple',
            image: 'https://example.com/image.jpg',
          },
          addedAt: '2025-12-04T12:00:00.000Z',
          message: 'Produit ajouté aux favoris avec succès',
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Le produit est déjà dans les favoris ou n\'est pas disponible',
  })
  async addFavorite(@Request() req, @Body() addFavoriteDto: AddFavoriteDto) {
    const result = await this.favoriteService.addFavorite(
      req.user.id,
      addFavoriteDto.productId,
    );
    return {
      success: true,
      message: 'Produit ajouté aux favoris avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirer un produit des favoris',
    description: `
    **Retire un produit de la liste des favoris de l'utilisateur**
    
    Cet endpoint permet au client de retirer un produit de ses favoris.
    
    **Fonctionnalités :**
    - Vérifie que le produit est bien dans les favoris
    - Supprime le produit des favoris
    - Retourne une confirmation de suppression
    
    **Note :** Si le produit n'est pas dans les favoris, une erreur 404 sera retournée.
    
    **Utilisation :** À appeler lorsque l'utilisateur clique sur le bouton "Retirer des favoris".
    `,
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID du produit à retirer des favoris',
    type: String,
    example: 'e8faa8e6-39a7-4223-a249-023536cc01ea',
  })
  @ApiResponse({
    status: 200,
    description: 'Produit retiré des favoris avec succès',
    schema: {
      example: {
        success: true,
        message: 'Produit retiré des favoris avec succès',
        data: {
          productId: 'product-uuid',
          productName: 'Produit exemple',
          message: 'Produit retiré des favoris avec succès',
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Le produit n\'est pas dans les favoris',
  })
  async removeFavorite(
    @Request() req,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const result = await this.favoriteService.removeFavorite(
      req.user.id,
      productId,
    );
    return {
      success: true,
      message: 'Produit retiré des favoris avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

