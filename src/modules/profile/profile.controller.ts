import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('👤 Profile Management', '📍 Addresses', '⚙️ Preferences')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer le profil utilisateur',
    description: 'Retourne les informations du profil de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    schema: {
      example: {
        success: true,
        message: 'Profil récupéré avec succès',
        data: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'CUSTOMER',
          firstName: 'Amadou',
          lastName: 'Diallo',
          phone: '+221 77 123 45 67',
          isEmailVerified: false,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.profileService.getProfile(user.id);
    return {
      success: true,
      message: 'Profil récupéré avec succès',
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modifier le profil utilisateur',
    description: 'Met à jour les informations du profil de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil modifié avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.updateProfile(user.id, updateProfileDto);
    return {
      success: true,
      message: 'Profil modifié avec succès',
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('addresses')
  @ApiTags('📍 Addresses')
  @ApiOperation({
    summary: 'Liste des adresses',
    description: 'Retourne toutes les adresses de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des adresses récupérée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Adresses récupérées avec succès',
        data: [
          {
            id: 'uuid',
            userId: 'uuid',
            label: 'Domicile',
            recipientName: 'Amadou Diallo',
            phone: '+221 77 123 45 67',
            address: '123 Rue de la République',
            city: 'Dakar',
            region: 'Dakar',
            postalCode: '12345',
            country: 'Sénégal',
            isDefault: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getAddresses(@CurrentUser() user: User) {
    const addresses = await this.profileService.getAddresses(user.id);
    return {
      success: true,
      message: 'Adresses récupérées avec succès',
      data: addresses,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiTags('📍 Addresses')
  @ApiOperation({
    summary: 'Ajouter une adresse',
    description: 'Ajoute une nouvelle adresse pour l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 201,
    description: 'Adresse créée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async createAddress(
    @CurrentUser() user: User,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    const address = await this.profileService.createAddress(user.id, createAddressDto);
    return {
      success: true,
      message: 'Adresse créée avec succès',
      data: address,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiTags('📍 Addresses')
  @ApiOperation({
    summary: 'Modifier une adresse',
    description: 'Met à jour une adresse existante de l\'utilisateur connecté',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'adresse',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Adresse modifiée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  async updateAddress(
    @CurrentUser() user: User,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.profileService.updateAddress(
      user.id,
      addressId,
      updateAddressDto,
    );
    return {
      success: true,
      message: 'Adresse modifiée avec succès',
      data: address,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiTags('📍 Addresses')
  @ApiOperation({
    summary: 'Supprimer une adresse',
    description: 'Supprime une adresse de l\'utilisateur connecté',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'adresse',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Adresse supprimée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  async deleteAddress(@CurrentUser() user: User, @Param('id') addressId: string) {
    await this.profileService.deleteAddress(user.id, addressId);
    return {
      success: true,
      message: 'Adresse supprimée avec succès',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiTags('⚙️ Preferences')
  @ApiOperation({
    summary: 'Modifier les préférences',
    description: 'Met à jour les préférences de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences modifiées avec succès',
    schema: {
      example: {
        success: true,
        message: 'Préférences modifiées avec succès',
        data: {
          id: 'uuid',
          userId: 'uuid',
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
          language: 'fr',
          currency: 'XOF',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    const preferences = await this.profileService.updatePreferences(
      user.id,
      updatePreferencesDto,
    );
    return {
      success: true,
      message: 'Préférences modifiées avec succès',
      data: preferences,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('preferences')
  @ApiTags('⚙️ Preferences')
  @ApiOperation({
    summary: 'Récupérer les préférences',
    description: 'Retourne les préférences de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getPreferences(@CurrentUser() user: User) {
    const preferences = await this.profileService.getPreferences(user.id);
    return {
      success: true,
      message: 'Préférences récupérées avec succès',
      data: preferences,
      timestamp: new Date().toISOString(),
    };
  }
}


