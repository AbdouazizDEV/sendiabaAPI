import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiPropertyOptional({
    description: "Libellé de l'adresse",
    example: 'Domicile',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    description: 'Nom du destinataire',
    example: 'Amadou Diallo',
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+221 77 123 45 67',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Adresse complète',
    example: '123 Rue de la République',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Ville',
    example: 'Dakar',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description:
      "Région/État/Province (peut être n'importe quelle région dans le monde)",
    example: 'Dakar',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Définir comme adresse par défaut',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
