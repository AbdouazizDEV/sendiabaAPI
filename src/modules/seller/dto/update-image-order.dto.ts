import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateImageOrderDto {
  @ApiProperty({
    description: 'Nouvel ordre de l\'image',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  order: number;
}

