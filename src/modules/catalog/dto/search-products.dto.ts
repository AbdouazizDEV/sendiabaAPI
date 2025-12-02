import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SearchProductsDto {
  @ApiProperty({ description: 'Terme de recherche', example: 'smartphone' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Numéro de page', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre de produits par page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'ID de la catégorie pour filtrer la recherche' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

