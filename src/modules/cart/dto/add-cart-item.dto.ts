import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID du produit à ajouter au panier',
    example: 'uuid-product-id',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantité du produit',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number = 1;
}


