import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de la commande',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus, { message: 'Le statut doit être une valeur valide de OrderStatus' })
  status: OrderStatus;

  @ApiPropertyOptional({
    description: 'Raison de l\'annulation (requis si statut = CANCELLED)',
    example: 'Produit indisponible',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}


