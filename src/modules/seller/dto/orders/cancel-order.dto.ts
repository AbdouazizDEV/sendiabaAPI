import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Raison de l\'annulation de la commande',
    example: 'Produit indisponible en stock',
  })
  @IsString()
  @IsNotEmpty({ message: 'La raison de l\'annulation est requise' })
  reason: string;
}


