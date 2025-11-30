import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'user@example.com',
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  email: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'Password123',
  })
  @IsString()
  password: string;
}
