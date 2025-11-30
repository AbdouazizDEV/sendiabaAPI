import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPublicDto {
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 8 caractères, avec majuscule, minuscule et chiffre)',
    example: 'Password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  password: string;

  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'Amadou',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Nom de l\'utilisateur',
    example: 'Diallo',
  })
  @IsString()
  lastName: string;

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


