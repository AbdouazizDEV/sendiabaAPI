import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface PayDunyaInvoice {
  response_code: string;
  response_text: string; // Contient l'URL de paiement
  description: string;
  token: string; // Token directement à la racine
  invoice?: {
    token?: string;
    url?: string;
    receipt_url?: string;
  };
}

export interface PayDunyaInvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
}

@Injectable()
export class PayDunyaService {
  private readonly logger = new Logger(PayDunyaService.name);
  private readonly masterKey: string;
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly token: string;
  private readonly mode: 'test' | 'live';
  private readonly baseUrl: string;
  private readonly ipnUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.mode = (this.configService.get<string>('PAYDUNYA_MODE') || 'test') as 'test' | 'live';
    
    if (this.mode === 'test') {
      this.masterKey = this.configService.get<string>('PAYDUNYA_TEST_MASTER_KEY') || '';
      this.privateKey = this.configService.get<string>('PAYDUNYA_TEST_PRIVATE_KEY') || '';
      this.publicKey = this.configService.get<string>('PAYDUNYA_TEST_PUBLIC_KEY') || '';
      this.token = this.configService.get<string>('PAYDUNYA_TEST_TOKEN') || '';
      this.baseUrl = 'https://app.paydunya.com/sandbox-api/v1';
    } else {
      this.masterKey = this.configService.get<string>('PAYDUNYA_LIVE_MASTER_KEY') || '';
      this.privateKey = this.configService.get<string>('PAYDUNYA_LIVE_PRIVATE_KEY') || '';
      this.publicKey = this.configService.get<string>('PAYDUNYA_LIVE_PUBLIC_KEY') || '';
      this.token = this.configService.get<string>('PAYDUNYA_LIVE_TOKEN') || '';
      this.baseUrl = 'https://app.paydunya.com/api/v1';
    }

    const apiBaseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    this.ipnUrl = `${apiBaseUrl}/api/v1/payments/paydunya/webhook`;

    if (!this.masterKey || !this.privateKey || !this.publicKey || !this.token) {
      this.logger.error('❌ Clés PayDunya non configurées dans le fichier .env');
      this.logger.error('Veuillez configurer les variables suivantes :');
      if (this.mode === 'test') {
        this.logger.error('- PAYDUNYA_TEST_MASTER_KEY');
        this.logger.error('- PAYDUNYA_TEST_PRIVATE_KEY');
        this.logger.error('- PAYDUNYA_TEST_PUBLIC_KEY');
        this.logger.error('- PAYDUNYA_TEST_TOKEN');
      } else {
        this.logger.error('- PAYDUNYA_LIVE_MASTER_KEY');
        this.logger.error('- PAYDUNYA_LIVE_PRIVATE_KEY');
        this.logger.error('- PAYDUNYA_LIVE_PUBLIC_KEY');
        this.logger.error('- PAYDUNYA_LIVE_TOKEN');
      }
    }
  }

  /**
   * Génère la signature HMAC pour l'authentification PayDunya
   */
  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.masterKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Vérifie la signature d'une requête PayDunya
   */
  verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Crée une facture PayDunya
   */
  async createInvoice(params: {
    totalAmount: number;
    description: string;
    items: PayDunyaInvoiceItem[];
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    cancelUrl?: string;
    returnUrl?: string;
    callbackUrl?: string;
  }): Promise<PayDunyaInvoice> {
    // Vérifier que les clés sont configurées
    if (!this.masterKey || !this.privateKey || !this.publicKey || !this.token) {
      throw new BadRequestException(
        'Les clés API PayDunya ne sont pas configurées. Veuillez ajouter les variables d\'environnement PAYDUNYA_TEST_* ou PAYDUNYA_LIVE_* dans votre fichier .env. Consultez docs/PAYDUNYA_CONFIGURATION.md pour plus d\'informations.',
      );
    }

    try {
      const invoiceData = {
        invoice: {
          items: params.items,
          total_amount: params.totalAmount,
          description: params.description,
          callback_url: params.callbackUrl || this.ipnUrl,
          return_url: params.returnUrl || `${this.configService.get<string>('FRONTEND_URL')}/orders/success`,
          cancel_url: params.cancelUrl || `${this.configService.get<string>('FRONTEND_URL')}/orders/cancel`,
        },
        store: {
          name: 'Sendiaba',
          tagline: 'Plateforme B2B en Afrique de l\'Ouest',
          phone_number: '+221771234567',
          postal_address: 'Dakar, Sénégal',
          website_url: this.configService.get<string>('FRONTEND_URL') || 'https://sendiaba.com',
          logo_url: '',
        },
        custom_data: {
          order_id: params.items[0]?.name || '',
        },
        actions: {
          cancel_url: params.cancelUrl || `${this.configService.get<string>('FRONTEND_URL')}/orders/cancel`,
          return_url: params.returnUrl || `${this.configService.get<string>('FRONTEND_URL')}/orders/success`,
        },
      };

      const dataString = JSON.stringify(invoiceData);
      const signature = this.generateSignature(dataString);

      const headers = {
        'PAYDUNYA-MASTER-KEY': this.masterKey,
        'PAYDUNYA-PRIVATE-KEY': this.privateKey,
        'PAYDUNYA-PUBLIC-KEY': this.publicKey,
        'PAYDUNYA-TOKEN': this.token,
        'Content-Type': 'application/json',
        'PAYDUNYA-SIGNATURE': signature,
      };

      this.logger.debug(`PayDunya Request URL: ${this.baseUrl}/checkout-invoice/create`);
      this.logger.debug(`PayDunya Mode: ${this.mode}`);
      this.logger.debug(`PayDunya Master Key (first 10 chars): ${this.masterKey.substring(0, 10)}...`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/checkout-invoice/create`, invoiceData, { headers }),
      );

      // Vérifier que la réponse existe
      if (!response || !response.data) {
        this.logger.error('Réponse PayDunya vide ou invalide');
        throw new BadRequestException('Réponse invalide de PayDunya. Aucune donnée reçue.');
      }

      // Log de la réponse complète pour le débogage
      this.logger.debug(`PayDunya Response: ${JSON.stringify(response.data, null, 2)}`);

      // Vérifier le code de réponse
      if (response.data.response_code === '00') {
        // Vérifier que la structure de la réponse est correcte
        // PayDunya retourne token et response_text (URL) directement à la racine
        if (!response.data.token || !response.data.response_text) {
          this.logger.error('Réponse PayDunya incomplète:', JSON.stringify(response.data, null, 2));
          throw new BadRequestException(
            'Réponse PayDunya incomplète. Le token ou l\'URL de paiement est manquant. ' +
            'Vérifiez vos clés API PayDunya dans le fichier .env.',
          );
        }
        return response.data;
      } else {
        const errorMessage = response.data.response_text || response.data.description || 'Erreur inconnue';
        const responseCode = response.data.response_code || 'N/A';
        
        this.logger.error(`Erreur PayDunya: ${errorMessage}`);
        this.logger.error(`Response Code: ${responseCode}`);
        this.logger.error(`Full Response: ${JSON.stringify(response.data, null, 2)}`);
        
        // Messages d'erreur plus explicites
        if (errorMessage.includes('Invalid Masterkey') || errorMessage.includes('Masterkey')) {
          throw new BadRequestException(
            `Clé API PayDunya invalide (Mode: ${this.mode}). ` +
            `Vérifiez que PAYDUNYA_${this.mode.toUpperCase()}_MASTER_KEY dans votre fichier .env correspond exactement ` +
            `à la Master Key récupérée depuis votre compte PayDunya (section "Intégrez notre API" → "Sendiaba"). ` +
            `Assurez-vous qu'il n'y a pas d'espaces avant/après la clé et que vous utilisez les clés du bon mode (test/live). ` +
            `Redémarrez l'application après modification du fichier .env.`,
          );
        }
        
        throw new BadRequestException(`Erreur PayDunya (${responseCode}): ${errorMessage}`);
      }
    } catch (error: any) {
      this.logger.error('Erreur lors de la création de la facture PayDunya:', error);
      
      // Gérer les erreurs HTTP
      if (error.response?.data) {
        const errorMessage = error.response.data.description || error.response.data.response_text || 'Erreur PayDunya';
        const responseCode = error.response.data.response_code;
        
        this.logger.error(`PayDunya Error Code: ${responseCode}`);
        this.logger.error(`PayDunya Error Message: ${errorMessage}`);
        this.logger.error(`Full Error Response: ${JSON.stringify(error.response.data, null, 2)}`);
        
        if (errorMessage.includes('Invalid Masterkey') || errorMessage.includes('Masterkey')) {
          throw new BadRequestException(
            `Clé API PayDunya invalide (Mode: ${this.mode}). ` +
            `Vérifiez que PAYDUNYA_${this.mode.toUpperCase()}_MASTER_KEY dans votre fichier .env correspond exactement ` +
            `à la Master Key récupérée depuis votre compte PayDunya (section "Intégrez notre API" → "Sendiaba"). ` +
            `Assurez-vous qu'il n'y a pas d'espaces avant/après la clé et que vous utilisez les clés du bon mode (test/live). ` +
            `Redémarrez l'application après modification du fichier .env.`,
          );
        }
        
        throw new BadRequestException(`Erreur PayDunya (${responseCode}): ${errorMessage}`);
      }
      
      throw new BadRequestException(
        error.message || 'Erreur lors de la création de la facture PayDunya',
      );
    }
  }

  /**
   * Vérifie le statut d'une facture PayDunya
   */
  async verifyInvoice(token: string): Promise<any> {
    try {
      const headers = {
        'PAYDUNYA-MASTER-KEY': this.masterKey,
        'PAYDUNYA-PRIVATE-KEY': this.privateKey,
        'PAYDUNYA-PUBLIC-KEY': this.publicKey,
        'PAYDUNYA-TOKEN': this.token,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/checkout-invoice/verify/${token}`, { headers }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('Erreur lors de la vérification de la facture PayDunya:', error);
      throw new BadRequestException(
        error.response?.data?.description || error.message || 'Erreur lors de la vérification de la facture',
      );
    }
  }
}

