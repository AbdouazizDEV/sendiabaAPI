import { IsInt, IsString, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Note du produit (de 1 à 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'La note doit être un nombre entier' })
  @Min(1, { message: 'La note doit être au moins 1' })
  @Max(5, { message: 'La note ne peut pas dépasser 5' })
  @IsNotEmpty({ message: 'La note est requise' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Titre de l\'avis',
    example: 'Excellent produit, je recommande !',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Commentaire détaillé sur le produit',
    example: 'Le produit correspond parfaitement à la description. Livraison rapide et emballage soigné.',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

