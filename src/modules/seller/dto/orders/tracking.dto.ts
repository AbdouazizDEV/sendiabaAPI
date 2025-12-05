import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackingDto {
  @ApiProperty({
    description: 'Numéro de suivi de la commande',
    example: 'TRK123456789',
  })
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional({
    description: 'URL de suivi de la commande',
    example: 'https://tracking.example.com/TRK123456789',
  })
  @IsOptional()
  @IsUrl({}, { message: 'L\'URL de suivi doit être une URL valide' })
  trackingUrl?: string;

  @ApiPropertyOptional({
    description: 'Nom du transporteur',
    example: 'DHL Express',
  })
  @IsOptional()
  @IsString()
  carrier?: string;
}


