import { IsArray, ValidateNested, IsString, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StockUpdateItem {
  @ApiProperty({ description: 'ID du produit', example: 'uuid-product-id' })
  @IsUUID('4', { message: 'productId doit être un UUID valide' })
  productId: string;

  @ApiProperty({ description: 'Nouvelle quantité', example: 50 })
  @IsNumber({}, { message: 'quantity doit être un nombre' })
  @Min(0, { message: 'quantity doit être supérieur ou égal à 0' })
  quantity: number;
}

export class BulkUpdateStockDto {
  @ApiProperty({
    description: 'Liste des mises à jour de stock',
    type: [StockUpdateItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockUpdateItem)
  updates: StockUpdateItem[];
}

