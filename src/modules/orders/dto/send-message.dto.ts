import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message à envoyer au vendeur',
    example: 'Merci pour votre message. J\'aimerais savoir quand ma commande sera expédiée.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  message: string;
}

