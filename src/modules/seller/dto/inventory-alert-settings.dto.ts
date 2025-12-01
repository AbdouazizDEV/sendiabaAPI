import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryAlertSettingsDto {
  @ApiProperty({
    description: 'Seuil d\'alerte',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  threshold: number;

  @ApiPropertyOptional({
    description: 'Activer l\'alerte',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Notifier par email',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Notifier par SMS',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifySms?: boolean;
}

