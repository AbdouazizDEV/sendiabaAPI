import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType } from '@prisma/client';

export class UpdatePromotionDto {
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

  @ApiPropertyOptional({
    description: 'Type de réduction',
    enum: PromotionType,
  })
  @IsOptional()
  @IsEnum(PromotionType)
  discountType?: PromotionType;

  @ApiPropertyOptional({
    description: 'Valeur de la réduction (pourcentage ou montant fixe)',
    example: 25,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discountType === PromotionType.PERCENTAGE)
  @Max(100)
  discountValue?: number;

  @ApiPropertyOptional({
    description: 'Date de début de la promotion (ISO 8601)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date de fin de la promotion (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Promotion active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


