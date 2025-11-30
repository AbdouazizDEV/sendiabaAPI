import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterPublicDto } from './dto/register-public.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('🔐 Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur",
    description:
      'Permet à un utilisateur de créer un compte avec tous les rôles disponibles (CUSTOMER, SELLER, ENTERPRISE, ADMIN, SUPER_ADMIN). Photo de profil optionnelle.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        role: {
          type: 'string',
          enum: ['CUSTOMER', 'SELLER', 'ENTERPRISE', 'ADMIN', 'SUPER_ADMIN'],
        },
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'Photo de profil (image)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    schema: {
      example: {
        success: true,
        message: 'Inscription réussie',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
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
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    schema: {
      example: {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
        error: 'VALIDATION_ERROR',
        statusCode: 400,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
    schema: {
      example: {
        success: false,
        message: 'Cet email est déjà utilisé',
        error: 'CONFLICT',
        statusCode: 409,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const result = await this.authService.register(registerDto, profilePicture);
    return {
      success: true,
      message: 'Inscription réussie',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('register-public')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Inscription publique (sans choix de rôle)',
    description:
      'Permet à un utilisateur de créer un compte sans spécifier de rôle. Le rôle CUSTOMER sera attribué automatiquement. Photo de profil optionnelle.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'Photo de profil (image)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès (rôle CUSTOMER par défaut)',
    schema: {
      example: {
        success: true,
        message: 'Inscription réussie',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
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
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    schema: {
      example: {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
        error: 'VALIDATION_ERROR',
        statusCode: 400,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
    schema: {
      example: {
        success: false,
        message: 'Cet email est déjà utilisé',
        error: 'CONFLICT',
        statusCode: 409,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async registerPublic(
    @Body() registerPublicDto: RegisterPublicDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const result = await this.authService.registerPublic(
      registerPublicDto,
      profilePicture,
    );
    return {
      success: true,
      message: 'Inscription réussie',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Connexion d'un utilisateur",
    description:
      'Authentifie un utilisateur et retourne les tokens JWT (access et refresh)',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    schema: {
      example: {
        success: true,
        message: 'Connexion réussie',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid',
            email: 'user@example.com',
            role: 'CUSTOMER',
            firstName: 'Amadou',
            lastName: 'Diallo',
            phone: '+221 77 123 45 67',
            isEmailVerified: false,
            isActive: true,
            lastLogin: '2025-01-01T00:00:00.000Z',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
    schema: {
      example: {
        success: false,
        message: 'Email ou mot de passe incorrect',
        error: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Connexion réussie',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Déconnexion d'un utilisateur",
    description: "Invalide le refresh token de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
    schema: {
      example: {
        success: true,
        message: 'Déconnexion réussie',
        data: null,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return {
      success: true,
      message: 'Déconnexion réussie',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demande de réinitialisation de mot de passe',
    description:
      'Envoie un email avec un lien de réinitialisation de mot de passe',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Email de réinitialisation envoyé (si l'email existe)",
    schema: {
      example: {
        success: true,
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé',
        data: null,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réinitialisation de mot de passe',
    description: 'Réinitialise le mot de passe avec le token reçu par email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
    schema: {
      example: {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
        data: null,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou expiré',
    schema: {
      example: {
        success: false,
        message: 'Token de réinitialisation invalide',
        error: 'BAD_REQUEST',
        statusCode: 400,
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Rafraîchir le token d'accès",
    description:
      'Génère un nouveau access token et refresh token à partir du refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens rafraîchis avec succès',
    schema: {
      example: {
        success: true,
        message: 'Tokens rafraîchis avec succès',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid',
            email: 'user@example.com',
            role: 'CUSTOMER',
            firstName: 'Amadou',
            lastName: 'Diallo',
          },
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalide',
  })
  async refresh(
    @CurrentUser() user: User,
    @Body('refreshToken') refreshToken: string,
  ) {
    const result = await this.authService.refreshToken(user.id, refreshToken);
    return {
      success: true,
      message: 'Tokens rafraîchis avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
