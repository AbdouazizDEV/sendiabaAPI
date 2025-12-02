import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token de vérification reçu par email',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}



