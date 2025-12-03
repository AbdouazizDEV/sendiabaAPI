import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethodType {
  MOBILE_MONEY = 'MOBILE_MONEY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  DIRECT_CONTACT = 'DIRECT_CONTACT',
}

export class ProcessPaymentDto {
  @ApiProperty({ 
    enum: PaymentMethodType,
    description: 'Méthode de paiement',
    example: PaymentMethodType.MOBILE_MONEY
  })
  @IsEnum(PaymentMethodType, { message: 'method doit être une méthode de paiement valide' })
  @IsNotEmpty({ message: 'method est requis' })
  method: PaymentMethodType;

  @ApiPropertyOptional({ 
    description: 'Numéro de téléphone Mobile Money (requis pour MOBILE_MONEY)',
    example: '+221771234567'
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Fournisseur Mobile Money (requis pour MOBILE_MONEY)',
    example: 'ORANGE_MONEY'
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ 
    description: 'Email de contact (pour DIRECT_CONTACT)',
    example: 'contact@example.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Téléphone de contact (pour DIRECT_CONTACT)',
    example: '+221771234567'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Message ou notes',
    example: 'Notes additionnelles'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Message pour contact direct',
    example: 'Je souhaite contacter directement l\'entreprise'
  })
  @IsOptional()
  @IsString()
  message?: string;
}




