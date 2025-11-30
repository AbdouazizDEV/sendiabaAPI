import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const mailHost = this.configService.get<string>('MAIL_HOST');
    const mailPort = parseInt(this.configService.get<string>('MAIL_PORT') || '587', 10);
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPassword = this.configService.get<string>('MAIL_PASSWORD');

    if (!mailHost || !mailUser || !mailPassword) {
      this.logger.warn('⚠️ Configuration email incomplète. Les emails ne pourront pas être envoyés.');
      this.logger.warn('Vérifiez vos variables MAIL_HOST, MAIL_USER et MAIL_PASSWORD dans le fichier .env');
    }

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailPort === 465, // true pour 465, false pour autres ports
      auth: {
        user: mailUser,
        pass: mailPassword,
      },
      tls: {
        rejectUnauthorized: false, // Pour les certificats auto-signés
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Sendiaba" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Sendiaba',
      html: passwordResetTemplate({
        firstName: firstName || 'Cher utilisateur',
        resetLink,
        resetToken,
      }),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email de réinitialisation envoyé à ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi de l'email à ${email}`);
      
      // Messages d'erreur plus explicites
      if (error.code === 'EAUTH') {
        this.logger.error('🔐 Erreur d\'authentification Gmail');
        this.logger.error('📋 Solutions possibles :');
        this.logger.error('   1. Vérifiez que l\'authentification à deux facteurs est activée');
        this.logger.error('   2. Générez un mot de passe d\'application : https://myaccount.google.com/apppasswords');
        this.logger.error('   3. Utilisez le mot de passe d\'application (pas votre mot de passe Gmail)');
        this.logger.error('   4. Vérifiez MAIL_USER et MAIL_PASSWORD dans votre fichier .env');
      } else if (error.code === 'ECONNECTION') {
        this.logger.error('🌐 Erreur de connexion au serveur SMTP');
        this.logger.error('   Vérifiez MAIL_HOST et MAIL_PORT dans votre fichier .env');
      } else {
        this.logger.error('Erreur détaillée:', error.message);
      }
      
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Connexion au serveur email vérifiée');
      return true;
    } catch (error) {
      this.logger.error('Erreur de connexion au serveur email:', error);
      return false;
    }
  }
}

