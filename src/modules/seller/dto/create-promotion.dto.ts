import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({
    description: 'ID du produit à mettre en promotion',
    example: 'uuid-product-id',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({
    description: 'Titre de la promotion',
    example: 'Promotion Flash -50%',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description de la promotion',
    example: 'Profitez de cette offre exceptionnelle !',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type de réduction',
    enum: PromotionType,
    example: PromotionType.PERCENTAGE,
  })
  @IsEnum(PromotionType)
  discountType: PromotionType;

  @ApiProperty({
    description: 'Valeur de la réduction (pourcentage ou montant fixe)',
    example: 25,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discountType === PromotionType.PERCENTAGE)
  @Max(100)
  discountValue: number;

  @ApiProperty({
    description: 'Date de début de la promotion (ISO 8601)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Date de fin de la promotion (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Promotion active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



