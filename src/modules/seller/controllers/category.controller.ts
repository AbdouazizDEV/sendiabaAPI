import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';

@ApiTags('📂 Catégories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste des catégories disponibles',
    description: 'Retourne toutes les catégories actives avec leurs sous-catégories',
  })
  @ApiResponse({
    status: 200,
    description: 'Catégories récupérées avec succès',
  })
  async findAll() {
    const categories = await this.categoryService.findAll();
    return {
      success: true,
      message: 'Catégories récupérées avec succès',
      data: categories,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détails d\'une catégorie',
    description: 'Retourne les détails d\'une catégorie avec ses produits',
  })
  @ApiParam({ name: 'id', description: 'ID de la catégorie' })
  @ApiResponse({
    status: 200,
    description: 'Catégorie récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Catégorie non trouvée' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoryService.findOne(id);
    return {
      success: true,
      message: 'Catégorie récupérée avec succès',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }
}



