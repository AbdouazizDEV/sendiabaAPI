import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MobileMoneyProvider {
  ORANGE_MONEY = 'ORANGE_MONEY',
  WAVE = 'WAVE',
  MTN = 'MTN',
  MOOV = 'MOOV',
  T_MONEY = 'T_MONEY',
}

export class MobileMoneyPaymentDto {
  @ApiProperty({ 
    description: 'ID de la commande',
    example: 'e8faa8e6-39a7-4223-a249-023536cc01ea'
  })
  @IsString()
  @IsNotEmpty({ message: 'orderId est requis' })
  orderId: string;

  @ApiProperty({ 
    enum: MobileMoneyProvider,
    description: 'Fournisseur de Mobile Money',
    example: MobileMoneyProvider.ORANGE_MONEY
  })
  @IsEnum(MobileMoneyProvider, { message: 'provider doit être un fournisseur valide' })
  @IsNotEmpty({ message: 'provider est requis' })
  provider: MobileMoneyProvider;

  @ApiProperty({ 
    description: 'Numéro de téléphone Mobile Money',
    example: '+221771234567'
  })
  @IsString()
  @IsNotEmpty({ message: 'phoneNumber est requis' })
  phoneNumber: string;

  @ApiPropertyOptional({ 
    description: 'Code de confirmation (si requis)',
    example: '1234'
  })
  @IsOptional()
  @IsString()
  confirmationCode?: string;
}




