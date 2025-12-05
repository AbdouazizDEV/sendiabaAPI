import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundOrderDto {
  @ApiPropertyOptional({
    description: 'Raison du remboursement',
    example: 'Produit défectueux',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}


