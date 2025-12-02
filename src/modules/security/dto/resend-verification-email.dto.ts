import { IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResendVerificationEmailDto {
  @ApiPropertyOptional({
    description: 'Email à vérifier (optionnel, utilise l\'email de l\'utilisateur connecté si non fourni)',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email?: string;
}



