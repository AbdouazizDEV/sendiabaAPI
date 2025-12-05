import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message à envoyer au client',
    example: 'Votre commande a été confirmée et sera expédiée sous 24h.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  message: string;
}


