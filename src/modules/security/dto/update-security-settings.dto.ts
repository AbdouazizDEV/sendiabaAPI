import { IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({
    description: 'Visibilité du profil (public/privé)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  profileVisibility?: boolean;

  @ApiPropertyOptional({
    description: 'Afficher l\'email dans le profil',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Afficher le téléphone dans le profil',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @ApiPropertyOptional({
    description: 'Permettre les messages privés',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowMessages?: boolean;

  @ApiPropertyOptional({
    description: 'Activer l\'authentification à deux facteurs',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Notifications par email pour activités suspectes',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Alertes de connexion',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  loginAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Gestion des appareils',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  deviceManagement?: boolean;

  @ApiPropertyOptional({
    description: 'Timeout de session en minutes (5-1440)',
    default: 30,
    minimum: 5,
    maximum: 1440,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  sessionTimeout?: number;
}

