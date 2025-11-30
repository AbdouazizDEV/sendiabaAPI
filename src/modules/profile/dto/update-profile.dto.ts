import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Prénom de l\'utilisateur',
    example: 'Amadou',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Nom de l\'utilisateur',
    example: 'Diallo',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone (format sénégalais)',
    example: '+221 77 123 45 67',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+221\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, {
    message: 'Le format du téléphone doit être +221 XX XXX XX XX',
  })
  phone?: string;
}
