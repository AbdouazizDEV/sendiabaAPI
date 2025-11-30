import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = (req as any).body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement manquant');
    }
    
    const user = await this.authService.validateUserById(payload.sub);
    
    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
    
    // Comparer les tokens (le refresh token stocké est le même que celui envoyé)
    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
    
    return user;
  }
}

