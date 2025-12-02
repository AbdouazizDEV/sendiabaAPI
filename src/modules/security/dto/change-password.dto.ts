import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
    example: 'CurrentPassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description:
      'Nouveau mot de passe (minimum 8 caractères, avec majuscule, minuscule et chiffre)',
    example: 'NewPassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  newPassword: string;
}



