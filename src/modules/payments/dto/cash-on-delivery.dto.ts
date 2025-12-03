import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CashOnDeliveryDto {
  @ApiProperty({ 
    description: 'ID de la commande',
    example: 'e8faa8e6-39a7-4223-a249-023536cc01ea'
  })
  @IsString()
  @IsNotEmpty({ message: 'orderId est requis' })
  orderId: string;

  @ApiPropertyOptional({ 
    description: 'Notes pour la livraison',
    example: 'Préparer la monnaie'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}




