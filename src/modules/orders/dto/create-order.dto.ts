import { IsUUID, IsString, IsOptional, IsNotEmpty, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ description: 'ID du produit', example: 'e8faa8e6-39a7-4223-a249-023536cc01ea' })
  @IsUUID('4', { message: 'productId doit être un UUID valide' })
  @IsNotEmpty({ message: 'productId est requis' })
  productId: string;

  @ApiProperty({ description: 'Quantité du produit', example: 2, minimum: 1 })
  @IsNotEmpty({ message: 'quantity est requis' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ 
    description: 'ID de l\'adresse de livraison',
    example: 'e8faa8e6-39a7-4223-a249-023536cc01ea'
  })
  @IsUUID('4', { message: 'shippingAddressId doit être un UUID valide' })
  @IsNotEmpty({ message: 'shippingAddressId est requis' })
  shippingAddressId: string;

  @ApiProperty({ 
    type: [OrderItemDto],
    description: 'Liste des articles de la commande'
  })
  @IsArray({ message: 'items doit être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty({ message: 'items est requis et ne peut pas être vide' })
  items: OrderItemDto[];

  @ApiPropertyOptional({ 
    description: 'Notes additionnelles pour la commande',
    example: 'Livrer entre 9h et 12h'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}




