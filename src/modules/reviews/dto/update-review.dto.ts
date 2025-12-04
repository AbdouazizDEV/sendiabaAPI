import { IsInt, IsString, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Note du produit (de 1 à 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'La note doit être un nombre entier' })
  @Min(1, { message: 'La note doit être au moins 1' })
  @Max(5, { message: 'La note ne peut pas dépasser 5' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Titre de l\'avis',
    example: 'Bon produit avec quelques améliorations possibles',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Commentaire détaillé sur le produit',
    example: 'Le produit est globalement bon mais pourrait être amélioré sur certains points.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Publier ou masquer l\'avis',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

