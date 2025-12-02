import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductService } from './services/product.service';
import { CategoryService } from './services/category.service';
import { PromotionService } from './services/promotion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { BulkUpdateStockDto } from './dto/bulk-update-stock.dto';
import { InventoryAlertSettingsDto } from './dto/inventory-alert-settings.dto';
import { UpdateImageOrderDto } from './dto/update-image-order.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@ApiTags('📦 Gestion des Produits (Vendeur)')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER, UserRole.ENTERPRISE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class SellerController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly promotionService: PromotionService,
  ) {}

  // ============================================
  // CRUD Produits
  // ============================================

  @Get('products')
  @ApiOperation({
    summary: 'Liste des produits du vendeur',
    description: 'Retourne la liste paginée des produits du vendeur connecté',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits récupérée avec succès',
  })
  async getProducts(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.productService.findAll(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      success: true,
      message: 'Produits récupérés avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un nouveau produit',
    description: 'Crée un nouveau produit pour le vendeur connecté',
  })
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Catégorie non trouvée' })
  async createProduct(
    @CurrentUser() user: User,
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.productService.create(user.id, createProductDto);
    return {
      success: true,
      message: 'Produit créé avec succès',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }

  // IMPORTANT: Ces routes doivent être AVANT 'products/:id' pour éviter les conflits de routing
  @Get('products/by-category')
  @ApiOperation({
    summary: 'Produits groupés par catégorie',
    description: 'Retourne les produits du vendeur groupés par catégorie',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits groupés récupérés avec succès',
  })
  async getProductsByCategory(@CurrentUser() user: User) {
    try {
      const grouped = await this.productService.getProductsByCategory(user.id);
      return {
        success: true,
        message: 'Produits groupés par catégorie récupérés avec succès',
        data: grouped,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Gestion des promotions (routes avant products/:id)
  // ============================================

  @Get('products/promotions')
  @ApiOperation({
    summary: 'Liste toutes les promotions',
    description: 'Retourne toutes les promotions des produits du vendeur',
  })
  @ApiQuery({
    name: 'includeExpired',
    required: false,
    type: Boolean,
    description: 'Inclure les promotions expirées',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des promotions récupérée avec succès',
  })
  async getAllPromotions(
    @CurrentUser() user: User,
    @Query('includeExpired') includeExpired?: string,
  ) {
    const promotions = await this.promotionService.findAll(
      user.id,
      includeExpired === 'true',
    );
    return {
      success: true,
      message: 'Promotions récupérées avec succès',
      data: promotions,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('products/promotions/active')
  @ApiOperation({
    summary: 'Liste des promotions actives',
    description: 'Retourne uniquement les promotions actuellement actives',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotions actives récupérées avec succès',
  })
  async getActivePromotions(@CurrentUser() user: User) {
    const promotions = await this.promotionService.getActivePromotions(user.id);
    return {
      success: true,
      message: 'Promotions actives récupérées avec succès',
      data: promotions,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('products/promotions/:id')
  @ApiOperation({
    summary: 'Détails d\'une promotion',
    description: 'Retourne les détails d\'une promotion spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID de la promotion' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la promotion récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Promotion non trouvée' })
  async getPromotion(
    @CurrentUser() user: User,
    @Param('id') promotionId: string,
  ) {
    const promotion = await this.promotionService.findOne(user.id, promotionId);
    return {
      success: true,
      message: 'Détails de la promotion récupérés avec succès',
      data: promotion,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('products/:id')
  @ApiOperation({
    summary: 'Détails d\'un produit spécifique',
    description: 'Retourne les détails complets d\'un produit du vendeur',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Détails du produit récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async getProduct(@CurrentUser() user: User, @Param('id') productId: string) {
    const product = await this.productService.findOne(user.id, productId);
    return {
      success: true,
      message: 'Produit récupéré avec succès',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modifier un produit existant',
    description: 'Met à jour les informations d\'un produit du vendeur',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit modifié avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async updateProduct(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productService.update(
      user.id,
      productId,
      updateProductDto,
    );
    return {
      success: true,
      message: 'Produit modifié avec succès',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un produit',
    description: 'Supprime définitivement un produit du vendeur',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async deleteProduct(@CurrentUser() user: User, @Param('id') productId: string) {
    const result = await this.productService.remove(user.id, productId);
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('products/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activer/désactiver un produit',
    description: 'Change le statut d\'un produit (DRAFT, ACTIVE, INACTIVE, etc.)',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Statut du produit mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async updateProductStatus(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    const product = await this.productService.updateStatus(
      user.id,
      productId,
      updateStatusDto,
    );
    return {
      success: true,
      message: 'Statut du produit mis à jour avec succès',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // Gestion des images produits
  // ============================================

  @Post('products/:id/images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Télécharger des images du produit',
    description: 'Upload une ou plusieurs images pour un produit. Utilisez le champ "images" pour envoyer les fichiers.',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Fichiers images à uploader (max 10)',
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploadées avec succès',
  })
  @ApiResponse({ status: 400, description: 'Aucun fichier fourni ou fichier invalide' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async uploadProductImages(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Aucun fichier fourni. Veuillez envoyer au moins une image dans le champ "images".',
      );
    }

    try {
      const images = await this.productService.uploadProductImages(
        user.id,
        productId,
        files,
      );
      return {
        success: true,
        message: `${images.length} image(s) uploadée(s) avec succès`,
        data: images,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete('products/:id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une image',
    description: 'Supprime une image d\'un produit',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiResponse({
    status: 200,
    description: 'Image supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Image non trouvée' })
  async deleteProductImage(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    const result = await this.productService.deleteProductImage(
      user.id,
      productId,
      imageId,
    );
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('products/:id/images/:imageId/order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réorganiser l\'ordre des images',
    description: 'Change l\'ordre d\'affichage d\'une image',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiResponse({
    status: 200,
    description: 'Ordre de l\'image mis à jour avec succès',
  })
  async updateImageOrder(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
    @Body() updateOrderDto: UpdateImageOrderDto,
  ) {
    const image = await this.productService.updateImageOrder(
      user.id,
      productId,
      imageId,
      updateOrderDto,
    );
    return {
      success: true,
      message: 'Ordre de l\'image mis à jour avec succès',
      data: image,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('products/:id/images/:imageId/primary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Définir image principale',
    description: 'Définit une image comme image principale du produit',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiResponse({
    status: 200,
    description: 'Image principale définie avec succès',
  })
  async setPrimaryImage(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    const image = await this.productService.setPrimaryImage(
      user.id,
      productId,
      imageId,
    );
    return {
      success: true,
      message: 'Image principale définie avec succès',
      data: image,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // Gestion des stocks
  // ============================================

  @Get('products/:id/stock')
  @ApiOperation({
    summary: 'Consulter le stock d\'un produit',
    description: 'Retourne les informations de stock d\'un produit',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Stock récupéré avec succès',
  })
  async getStock(@CurrentUser() user: User, @Param('id') productId: string) {
    const stock = await this.productService.getStock(user.id, productId);
    return {
      success: true,
      message: 'Stock récupéré avec succès',
      data: stock,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('products/:id/stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour la quantité disponible',
    description: 'Met à jour le stock d\'un produit',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Stock mis à jour avec succès',
  })
  async updateStock(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    const stock = await this.productService.updateStock(
      user.id,
      productId,
      updateStockDto,
    );
    return {
      success: true,
      message: 'Stock mis à jour avec succès',
      data: stock,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('inventory')
  @ApiOperation({
    summary: 'Vue d\'ensemble de l\'inventaire',
    description: 'Retourne une vue complète de l\'inventaire du vendeur',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventaire récupéré avec succès',
  })
  async getInventory(@CurrentUser() user: User) {
    const inventory = await this.productService.getInventory(user.id);
    return {
      success: true,
      message: 'Inventaire récupéré avec succès',
      data: inventory,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('inventory/bulk-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mise à jour en lot des stocks',
    description: 'Met à jour les stocks de plusieurs produits en une seule requête',
  })
  @ApiResponse({
    status: 200,
    description: 'Stocks mis à jour avec succès',
  })
  async bulkUpdateStock(
    @CurrentUser() user: User,
    @Body() bulkUpdateDto: BulkUpdateStockDto,
  ) {
    const results = await this.productService.bulkUpdateStock(
      user.id,
      bulkUpdateDto,
    );
    return {
      success: true,
      message: 'Mise à jour en lot effectuée',
      data: results,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('inventory/low-stock')
  @ApiOperation({
    summary: 'Produits en rupture ou stock faible',
    description: 'Retourne les produits avec stock faible ou en rupture',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits à stock faible récupérés avec succès',
  })
  async getLowStock(@CurrentUser() user: User) {
    const result = await this.productService.getLowStock(user.id);
    return {
      success: true,
      message: 'Produits à stock faible récupérés avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('products/:id/inventory-alert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Configurer alertes de stock',
    description: 'Configure les alertes de stock pour un produit',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 201,
    description: 'Alertes configurées avec succès',
  })
  async setInventoryAlert(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Body() alertSettingsDto: InventoryAlertSettingsDto,
  ) {
    const alert = await this.productService.setInventoryAlert(
      user.id,
      productId,
      alertSettingsDto,
    );
    return {
      success: true,
      message: 'Alertes configurées avec succès',
      data: alert,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // Catégories et classification
  // ============================================

  @Put('products/:id/category')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modifier la catégorie d\'un produit',
    description: 'Change la catégorie d\'un produit',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Catégorie du produit mise à jour avec succès',
  })
  async updateProductCategory(
    @CurrentUser() user: User,
    @Param('id') productId: string,
    @Body() updateCategoryDto: UpdateProductCategoryDto,
  ) {
    const product = await this.productService.updateProductCategory(
      user.id,
      productId,
      updateCategoryDto,
    );
    return {
      success: true,
      message: 'Catégorie du produit mise à jour avec succès',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // Gestion des promotions (suite)
  // ============================================

  @Post('products/promotions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une promotion pour un produit',
    description: 'Met un produit en promotion avec un pourcentage ou un montant fixe de réduction',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion créée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou promotion en conflit' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async createPromotion(
    @CurrentUser() user: User,
    @Body() createPromotionDto: CreatePromotionDto,
  ) {
    const promotion = await this.promotionService.create(
      user.id,
      createPromotionDto,
    );
    return {
      success: true,
      message: 'Promotion créée avec succès',
      data: promotion,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('products/:productId/promotions')
  @ApiOperation({
    summary: 'Promotions d\'un produit',
    description: 'Retourne toutes les promotions d\'un produit spécifique',
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Promotions du produit récupérées avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async getProductPromotions(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    const promotions = await this.promotionService.findByProduct(
      user.id,
      productId,
    );
    return {
      success: true,
      message: 'Promotions du produit récupérées avec succès',
      data: promotions,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('products/promotions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modifier une promotion',
    description: 'Met à jour les informations d\'une promotion (pourcentage, dates, etc.)',
  })
  @ApiParam({ name: 'id', description: 'ID de la promotion' })
  @ApiResponse({
    status: 200,
    description: 'Promotion modifiée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Promotion non trouvée' })
  async updatePromotion(
    @CurrentUser() user: User,
    @Param('id') promotionId: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    const promotion = await this.promotionService.update(
      user.id,
      promotionId,
      updatePromotionDto,
    );
    return {
      success: true,
      message: 'Promotion modifiée avec succès',
      data: promotion,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('products/promotions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirer une promotion',
    description: 'Supprime définitivement une promotion',
  })
  @ApiParam({ name: 'id', description: 'ID de la promotion' })
  @ApiResponse({
    status: 200,
    description: 'Promotion supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Promotion non trouvée' })
  async removePromotion(
    @CurrentUser() user: User,
    @Param('id') promotionId: string,
  ) {
    const result = await this.promotionService.remove(user.id, promotionId);
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }
}

