import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { RegisterPublicDto } from './dto/register-public.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from './entities/user.entity';
import { UserPreferences } from '../profile/entities/user-preferences.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password' | 'refreshToken' | 'passwordResetToken'>;
}

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
    private readonly mailService: MailService,
  ) {
    this.saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'),
      10,
    );
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, this.saltRounds);

    const user = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
      email: registerDto.email.toLowerCase(),
    });

    // Créer les préférences par défaut
    const preferences = this.preferencesRepository.create({
      userId: user.id,
    });
    await this.preferencesRepository.save(preferences);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async registerPublic(registerPublicDto: RegisterPublicDto): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findByEmail(registerPublicDto.email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(registerPublicDto.password, this.saltRounds);

    // Créer l'utilisateur avec le rôle CUSTOMER par défaut
    const user = await this.authRepository.create({
      ...registerPublicDto,
      password: hashedPassword,
      email: registerPublicDto.email.toLowerCase(),
      role: UserRole.CUSTOMER, // Rôle par défaut pour l'inscription publique
    });

    // Créer les préférences par défaut
    const preferences = this.preferencesRepository.create({
      userId: user.id,
    });
    await this.preferencesRepository.save(preferences);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est désactivé');
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await this.authRepository.save(user);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.update(userId, { refreshToken: null as any });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.authRepository.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Expire dans 1 heure

    await this.authRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Envoyer l'email avec le lien de réinitialisation
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName,
      );
    } catch (error) {
      // Logger l'erreur mais ne pas faire échouer la requête
      // L'utilisateur a déjà reçu le token, on log juste l'erreur d'envoi
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.authRepository.findByPasswordResetToken(resetPasswordDto.token);

    if (!user) {
      throw new BadRequestException('Token de réinitialisation invalide');
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Le token de réinitialisation a expiré');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, this.saltRounds);

    await this.authRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null as any,
      passwordResetExpires: null as any,
    });
  }

  async refreshToken(userId: string, refreshToken: string): Promise<AuthResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.authRepository.findById(id);
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn,
      } as any),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      } as any),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Stocker le refresh token tel quel (on le hash dans la stratégie de validation)
    await this.authRepository.update(userId, { refreshToken });
  }

  private sanitizeUser(user: User): Omit<User, 'password' | 'refreshToken' | 'passwordResetToken'> {
    const { password, refreshToken, passwordResetToken, ...sanitized } = user;
    return sanitized;
  }
}

