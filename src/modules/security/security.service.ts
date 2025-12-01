import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuthRepository } from '../auth/auth.repository';
import { User } from '../auth/entities/user.entity';
import { SecurityRepository } from './security.repository';
import { UserSecuritySettings } from './entities/user-security-settings.entity';
import { LoginActivity } from './entities/login-activity.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly saltRounds: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly securityRepository: SecurityRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'),
      10,
    );
  }

  // Changement de mot de passe
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      this.saltRounds,
    );

    await this.authRepository.update(userId, {
      password: hashedNewPassword,
    });

    this.logger.log(`Password changed for user ${userId}`);
  }

  // Vérification d'email
  async verifyEmail(userId: string, verifyEmailDto: VerifyEmailDto): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email déjà vérifié');
    }

    if (
      !user.emailVerificationToken ||
      user.emailVerificationToken !== verifyEmailDto.token
    ) {
      throw new UnauthorizedException('Token de vérification invalide');
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Token de vérification expiré');
    }

    await this.authRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    this.logger.log(`Email verified for user ${userId}`);
  }

  // Renvoyer l'email de vérification
  async resendVerificationEmail(
    userId: string,
    resendDto?: ResendVerificationEmailDto,
  ): Promise<void> {
    const email = resendDto?.email;
    const user = email
      ? await this.authRepository.findByEmail(email)
      : await this.authRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email déjà vérifié');
    }

    // Générer un nouveau token
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 heures

    await this.authRepository.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expiresAt,
    });

    // Envoyer l'email de vérification
    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.firstName,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'email de vérification: ${error.message}`,
      );
      throw new BadRequestException(
        "Erreur lors de l'envoi de l'email de vérification",
      );
    }

    this.logger.log(`Verification email resent for user ${user.id}`);
  }

  // Obtenir les paramètres de sécurité
  async getSecuritySettings(
    userId: string,
  ): Promise<UserSecuritySettings> {
    let settings = await this.securityRepository.findSecuritySettingsByUserId(
      userId,
    );

    if (!settings) {
      settings = await this.securityRepository.createSecuritySettings(userId);
    }

    return settings;
  }

  // Mettre à jour les paramètres de sécurité
  async updateSecuritySettings(
    userId: string,
    updateDto: UpdateSecuritySettingsDto,
  ): Promise<UserSecuritySettings> {
    let settings = await this.securityRepository.findSecuritySettingsByUserId(
      userId,
    );

    if (!settings) {
      settings = await this.securityRepository.createSecuritySettings(userId);
    }

    return this.securityRepository.updateSecuritySettings(userId, updateDto);
  }

  // Enregistrer une activité de connexion
  async logLoginActivity(
    userId: string,
    request: Request,
    success: boolean,
    failureReason?: string,
  ): Promise<LoginActivity> {
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    const userAgent = request.headers['user-agent'] || null;

    // Détecter le device et le navigateur (simplifié)
    let device = 'Unknown';
    let browser = 'Unknown';

    if (userAgent) {
      if (userAgent.includes('Mobile')) {
        device = 'Mobile';
      } else if (userAgent.includes('Tablet')) {
        device = 'Tablet';
      } else {
        device = 'Desktop';
      }

      if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
      } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
      }
    }

    return this.securityRepository.createLoginActivity({
      userId,
      ipAddress,
      userAgent,
      device,
      browser,
      success,
      failureReason: success ? null : failureReason,
    });
  }

  // Obtenir l'historique de connexion
  async getLoginHistory(
    userId: string,
    limit: number = 50,
  ): Promise<LoginActivity[]> {
    return this.securityRepository.findUserLoginActivities(userId, limit);
  }

  // Désactiver le compte
  async deactivateAccount(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.authRepository.update(userId, {
      isActive: false,
      refreshToken: null, // Invalider tous les tokens
    });

    this.logger.log(`Account deactivated for user ${userId}`);
  }

  // Réactiver le compte
  async reactivateAccount(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.authRepository.update(userId, {
      isActive: true,
    });

    this.logger.log(`Account reactivated for user ${userId}`);
  }

  // Supprimer le compte (soft delete)
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Soft delete : désactiver le compte et supprimer les données sensibles
    await this.authRepository.update(userId, {
      isActive: false,
      email: `deleted_${user.id}@deleted.com`,
      refreshToken: null,
      passwordResetToken: null,
      emailVerificationToken: null,
    });

    this.logger.log(`Account deleted (soft) for user ${userId}`);
  }
}

