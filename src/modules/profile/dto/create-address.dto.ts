import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Libellé de l\'adresse (ex: "Domicile", "Bureau")',
    example: 'Domicile',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Nom du destinataire',
    example: 'Amadou Diallo',
  })
  @IsString()
  recipientName: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+221 77 123 45 67',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Adresse complète',
    example: '123 Rue de la République',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Ville',
    example: 'Dakar',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description:
      "Région/État/Province (peut être n'importe quelle région dans le monde)",
    example: 'Dakar',
  })
  @IsString()
  region: string;

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Définir comme adresse par défaut',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
