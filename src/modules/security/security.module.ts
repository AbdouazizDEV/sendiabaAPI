import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { SecurityRepository } from './security.repository';
import { UserSecuritySettings } from './entities/user-security-settings.entity';
import { LoginActivity } from './entities/login-activity.entity';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSecuritySettings, LoginActivity]),
    AuthModule,
    MailModule,
  ],
  controllers: [SecurityController],
  providers: [SecurityService, SecurityRepository],
  exports: [SecurityService],
})
export class SecurityModule {}



