import { IsNumber, IsOptional, Min, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({
    description: 'Quantité disponible',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Quantité réservée',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedQuantity?: number;

  @ApiPropertyOptional({
    description: 'Seuil d\'alerte de stock faible',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    description: 'Emplacement du stock (entrepôt)',
    example: 'Entrepôt Principal - Dakar',
  })
  @IsOptional()
  @IsString()
  location?: string;
}


