import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({
    description: 'UUID du produit à ajouter aux favoris',
    example: 'e8faa8e6-39a7-4223-a249-023536cc01ea',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}

