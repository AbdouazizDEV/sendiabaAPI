import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DirectContactDto {
  @ApiProperty({ 
    description: 'ID de la commande',
    example: 'e8faa8e6-39a7-4223-a249-023536cc01ea'
  })
  @IsString()
  @IsNotEmpty({ message: 'orderId est requis' })
  orderId: string;

  @ApiPropertyOptional({ 
    description: 'Email de contact',
    example: 'contact@example.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'email doit être une adresse email valide' })
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Numéro de téléphone de contact',
    example: '+221771234567'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Message ou notes',
    example: 'Je souhaite contacter directement l\'entreprise pour le paiement'
  })
  @IsOptional()
  @IsString()
  message?: string;
}




