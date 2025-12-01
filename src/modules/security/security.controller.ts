import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { Request } from 'express';

@ApiTags('🔒 Sécurité et Confidentialité')
@Controller('security')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description: 'Permet à un utilisateur authentifié de changer son mot de passe',
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe changé avec succès',
  })
  @ApiResponse({ status: 401, description: 'Mot de passe actuel incorrect' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.securityService.changePassword(user.id, changePasswordDto);
    return {
      success: true,
      message: 'Mot de passe changé avec succès',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vérifier l\'adresse email',
    description: 'Vérifie l\'adresse email de l\'utilisateur avec un token',
  })
  @ApiResponse({
    status: 200,
    description: 'Email vérifié avec succès',
  })
  @ApiResponse({ status: 400, description: 'Email déjà vérifié ou token expiré' })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async verifyEmail(
    @CurrentUser() user: User,
    @Body() verifyEmailDto: VerifyEmailDto,
  ) {
    await this.securityService.verifyEmail(user.id, verifyEmailDto);
    return {
      success: true,
      message: 'Email vérifié avec succès',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('resend-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renvoyer l\'email de vérification',
    description: 'Renvoye un email de vérification à l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Email de vérification renvoyé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Email déjà vérifié' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async resendVerificationEmail(
    @CurrentUser() user: User,
    @Body() resendDto?: ResendVerificationEmailDto,
  ) {
    await this.securityService.resendVerificationEmail(user.id, resendDto);
    return {
      success: true,
      message: 'Email de vérification renvoyé avec succès',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('settings')
  @ApiOperation({
    summary: 'Récupérer les paramètres de sécurité',
    description: 'Retourne les paramètres de sécurité et confidentialité de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres de sécurité récupérés avec succès',
  })
  async getSecuritySettings(@CurrentUser() user: User) {
    const settings = await this.securityService.getSecuritySettings(user.id);
    return {
      success: true,
      message: 'Paramètres de sécurité récupérés avec succès',
      data: settings,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour les paramètres de sécurité',
    description: 'Met à jour les paramètres de sécurité et confidentialité de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres de sécurité mis à jour avec succès',
  })
  async updateSecuritySettings(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateSecuritySettingsDto,
  ) {
    const settings = await this.securityService.updateSecuritySettings(
      user.id,
      updateDto,
    );
    return {
      success: true,
      message: 'Paramètres de sécurité mis à jour avec succès',
      data: settings,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('login-history')
  @ApiOperation({
    summary: 'Récupérer l\'historique de connexion',
    description: 'Retourne l\'historique des connexions de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Historique de connexion récupéré avec succès',
  })
  async getLoginHistory(@CurrentUser() user: User) {
    const history = await this.securityService.getLoginHistory(user.id);
    return {
      success: true,
      message: 'Historique de connexion récupéré avec succès',
      data: history,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('deactivate-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Désactiver le compte',
    description: 'Désactive le compte de l\'utilisateur (peut être réactivé)',
  })
  @ApiResponse({
    status: 200,
    description: 'Compte désactivé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async deactivateAccount(@CurrentUser() user: User) {
    await this.securityService.deactivateAccount(user.id);
    return {
      success: true,
      message: 'Compte désactivé avec succès',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reactivate-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réactiver le compte',
    description: 'Réactive le compte de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Compte réactivé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async reactivateAccount(@CurrentUser() user: User) {
    await this.securityService.reactivateAccount(user.id);
    return {
      success: true,
      message: 'Compte réactivé avec succès',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer le compte',
    description: 'Supprime définitivement le compte de l\'utilisateur (soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Compte supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async deleteAccount(@CurrentUser() user: User) {
    await this.securityService.deleteAccount(user.id);
    return {
      success: true,
      message: 'Compte supprimé avec succès',
      timestamp: new Date().toISOString(),
    };
  }
}

