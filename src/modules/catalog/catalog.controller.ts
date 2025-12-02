import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CatalogService } from './services/catalog.service';
import { FilterProductsDto } from './dto/filter-products.dto';
import { SearchProductsDto } from './dto/search-products.dto';

@ApiTags('📦 Catalogue & Recherche')
@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ============================================
  // Routes spécifiques AVANT les routes avec paramètres
  // ============================================

  @Get('categories')
  @ApiOperation({
    summary: 'Liste des catégories',
    description: 'Retourne toutes les catégories actives avec leurs sous-catégories',
  })
  @ApiResponse({
    status: 200,
    description: 'Catégories récupérées avec succès',
  })
  async getCategories() {
    const categories = await this.catalogService.getCategories();
    return {
      success: true,
      message: 'Catégories récupérées avec succès',
      data: categories,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Recherche textuelle de produits',
    description: 'Recherche des produits par nom, description, tags ou SKU',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Terme de recherche' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrer par catégorie' })
  @ApiResponse({
    status: 200,
    description: 'Résultats de recherche récupérés avec succès',
  })
  async search(@Query() searchDto: SearchProductsDto) {
    const result = await this.catalogService.search(searchDto);
    return {
      success: true,
      message: 'Recherche effectuée avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Produits mis en avant',
    description: 'Retourne les produits mis en avant/sponsorisés',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, default: 10 })
  @ApiResponse({
    status: 200,
    description: 'Produits mis en avant récupérés avec succès',
  })
  async getFeatured(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const products = await this.catalogService.getFeatured(limit);
    return {
      success: true,
      message: 'Produits mis en avant récupérés avec succès',
      data: products,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('promotion')
  @ApiOperation({
    summary: 'Produits en promotion',
    description: 'Retourne tous les produits actuellement en promotion',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrer par catégorie' })
  @ApiResponse({
    status: 200,
    description: 'Produits en promotion récupérés avec succès',
  })
  async getProductsOnPromotion(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
  ) {
    const result = await this.catalogService.getProductsOnPromotion(page, limit, categoryId);
    return {
      success: true,
      message: 'Produits en promotion récupérés avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('filter')
  @ApiOperation({
    summary: 'Filtrer les produits',
    description: 'Filtre les produits par catégorie, prix, localisation, disponibilité',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits filtrés récupérés avec succès',
  })
  async filterProducts(@Query() filterDto: FilterProductsDto) {
    const result = await this.catalogService.filterProducts(filterDto);
    return {
      success: true,
      message: 'Produits filtrés récupérés avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sort')
  @ApiOperation({
    summary: 'Trier les produits',
    description: 'Trie les produits par prix, pertinence, date d\'ajout',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits triés récupérés avec succès',
  })
  async sortProducts(@Query() filterDto: FilterProductsDto) {
    const result = await this.catalogService.sortProducts(filterDto);
    return {
      success: true,
      message: 'Produits triés récupérés avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('meilleursVente')
  @ApiOperation({
    summary: 'Meilleures ventes',
    description: 'Retourne les produits les mieux vendus',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, default: 20 })
  @ApiResponse({
    status: 200,
    description: 'Meilleures ventes récupérées avec succès',
  })
  async getBestSellers(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const products = await this.catalogService.getBestSellers(limit);
    return {
      success: true,
      message: 'Meilleures ventes récupérées avec succès',
      data: products,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // Routes avec paramètres (doivent venir APRÈS les routes spécifiques)
  // ============================================

  @Get()
  @ApiOperation({
    summary: 'Liste des produits',
    description: 'Retourne la liste paginée des produits avec filtres et tri',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits récupérée avec succès',
  })
  async findAll(@Query() filterDto: FilterProductsDto) {
    const result = await this.catalogService.findAll(filterDto);
    return {
      success: true,
      message: 'Produits récupérés avec succès',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détails d\'un produit',
    description: 'Retourne les détails complets d\'un produit spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Détails du produit récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.catalogService.findOne(id);
    return {
      success: true,
      message: 'Détails du produit récupérés avec succès',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }
}

