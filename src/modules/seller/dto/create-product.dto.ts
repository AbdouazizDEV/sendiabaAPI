import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nom du produit',
    example: 'Téléphone Samsung Galaxy S21',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID de la catégorie',
    example: 'uuid-category-id',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Description complète du produit',
    example: 'Téléphone intelligent avec écran AMOLED 6.2 pouces...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Description courte du produit',
    example: 'Téléphone Samsung haut de gamme',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'SKU (Stock Keeping Unit) unique',
    example: 'SAMSUNG-GALAXY-S21-128GB',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Marque du produit',
    example: 'Samsung',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    description: 'Prix de vente',
    example: 450000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Prix de comparaison (prix barré)',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({
    description: 'Prix de revient',
    example: 350000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Poids en grammes',
    example: 169,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Longueur en centimètres',
    example: 15.1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({
    description: 'Largeur en centimètres',
    example: 7.1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({
    description: 'Hauteur en centimètres',
    example: 0.8,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({
    description: 'Tags pour la recherche',
    example: ['téléphone', 'samsung', 'smartphone'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Produit numérique (pas de livraison physique)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiPropertyOptional({
    description: 'Nécessite une livraison',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;

  @ApiPropertyOptional({
    description: 'Suivre l\'inventaire',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    description: 'Permettre les commandes en rupture de stock',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @ApiPropertyOptional({
    description: 'Statut du produit',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}



