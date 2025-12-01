import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductCategoryDto {
  @ApiProperty({
    description: 'ID de la nouvelle catégorie',
    example: 'uuid-category-id',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

