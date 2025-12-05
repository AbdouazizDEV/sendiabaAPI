import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Type de notification (ORDER_UPDATE, PAYMENT_RECEIVED, SHIPMENT_TRACKING, etc.)',
    example: 'ORDER_UPDATE',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Titre de la notification',
    example: 'Votre commande a été confirmée',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Message de la notification',
    example: 'Votre commande CMD-123456789 a été confirmée et est en cours de préparation.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Données supplémentaires au format JSON (string)',
    example: '{"orderId": "uuid", "orderNumber": "CMD-123456789"}',
  })
  @IsOptional()
  @IsString()
  data?: string;
}

