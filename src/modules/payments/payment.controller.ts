import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from './services/payment.service';
import { MobileMoneyPaymentDto } from './dto/mobile-money-payment.dto';
import { CashOnDeliveryDto } from './dto/cash-on-delivery.dto';
import { DirectContactDto } from './dto/direct-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('💳 Paiements')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('mobile-money')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Paiement Mobile Money (Orange Money, Free Money, Wave, etc.)',
    description: `
    **Initie un paiement Mobile Money via PayDunya**
    
    Cet endpoint permet de créer une facture PayDunya pour un paiement Mobile Money et retourne l'URL de paiement à laquelle rediriger l'utilisateur.
    
    **Fonctionnalités :**
    - Crée une facture PayDunya avec les détails de la commande
    - Génère un token unique pour le suivi du paiement
    - Retourne une URL de paiement sécurisée
    - Enregistre le paiement en statut PENDING dans la base de données
    - PayDunya enverra un webhook à /payments/paydunya/webhook lors du paiement
    
    **Fournisseurs supportés :**
    - ORANGE_MONEY (Orange Money - Sénégal)
    - WAVE (Wave - Sénégal)
    - MTN (MTN Mobile Money)
    - MOOV (Moov Money)
    - T_MONEY (T-Money)
    
    **Flux de paiement :**
    1. Appeler cet endpoint avec orderId, provider et phoneNumber
    2. Recevoir l'URL de paiement (paymentUrl) dans la réponse
    3. Rediriger l'utilisateur vers cette URL
    4. L'utilisateur complète le paiement sur la plateforme PayDunya
    5. PayDunya envoie un webhook pour mettre à jour le statut du paiement
    
    **Note :** Assurez-vous que PayDunya est correctement configuré (voir docs/PAYDUNYA_CONFIGURATION.md)
    `
  })
  @ApiBody({ 
    type: MobileMoneyPaymentDto,
    description: 'Données du paiement Mobile Money',
    examples: {
      orangeMoney: {
        summary: 'Paiement Orange Money',
        value: {
          orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          provider: 'ORANGE_MONEY',
          phoneNumber: '+221771234567'
        }
      },
      wave: {
        summary: 'Paiement Wave',
        value: {
          orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          provider: 'WAVE',
          phoneNumber: '+221771234567'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Paiement Mobile Money initié avec succès - URL de paiement retournée',
    schema: {
      example: {
        id: 'payment-uuid-1234',
        orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
        orderNumber: 'CMD-1733123456789-1234',
        method: 'MOBILE_MONEY',
        status: 'PENDING',
        amount: 45000,
        paymentUrl: 'https://paydunya.com/sandbox-checkout/invoice/test_9jTlZiIc3O',
        token: 'test_9jTlZiIc3O'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Clés PayDunya manquantes, commande déjà payée, etc.' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  async processMobileMoney(
    @Request() req,
    @Body() mobileMoneyDto: MobileMoneyPaymentDto,
  ) {
    return this.paymentService.processMobileMoneyPayment(
      req.user.id,
      mobileMoneyDto,
    );
  }

  @Post('cash-on-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Paiement à la livraison',
    description: `
    **Confirme un paiement à la livraison**
    
    Cet endpoint permet de confirmer qu'une commande sera payée à la livraison (paiement cash on delivery).
    
    **Fonctionnalités :**
    - Crée un enregistrement de paiement avec méthode CASH_ON_DELIVERY
    - Met automatiquement la commande en statut CONFIRMED
    - Permet d'ajouter des notes pour le livreur
    - Le paiement reste en statut PENDING jusqu'à la livraison effective
    
    **Utilisation :**
    - Idéal pour les commandes locales où le client préfère payer en espèces à la réception
    - Permet de confirmer la commande sans passer par un système de paiement en ligne
    - Les notes peuvent contenir des instructions spéciales pour la livraison
    
    **Note :** Après la livraison, le statut du paiement devra être mis à jour manuellement par l'administrateur.
    `
  })
  @ApiBody({ 
    type: CashOnDeliveryDto,
    description: 'Données du paiement à la livraison',
    examples: {
      example1: {
        summary: 'Paiement à la livraison avec notes',
        value: {
          orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          notes: 'Livrer entre 9h et 12h. Le client paiera en espèces.'
        }
      },
      example2: {
        summary: 'Paiement à la livraison simple',
        value: {
          orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Paiement à la livraison confirmé - Commande mise en statut CONFIRMED',
    schema: {
      example: {
        id: 'payment-uuid-1234',
        orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
        orderNumber: 'CMD-1733123456789-1234',
        method: 'CASH_ON_DELIVERY',
        status: 'PENDING',
        amount: 45000,
        message: 'Paiement à la livraison confirmé. La commande sera livrée et payée à la réception.'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Commande déjà payée, commande annulée, etc.' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  async processCashOnDelivery(
    @Request() req,
    @Body() cashOnDeliveryDto: CashOnDeliveryDto,
  ) {
    return this.paymentService.processCashOnDelivery(
      req.user.id,
      cashOnDeliveryDto,
    );
  }

  @Post('direct-contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Contact direct avec l\'entreprise',
    description: `
    **Enregistre une demande de contact direct pour finaliser le paiement**
    
    Cet endpoint permet à un client de demander un contact direct avec l'entreprise pour finaliser le paiement d'une commande (par exemple, pour un virement bancaire, un paiement par chèque, ou toute autre méthode non standard).
    
    **Fonctionnalités :**
    - Crée un enregistrement de paiement avec méthode DIRECT_CONTACT
    - Met automatiquement la commande en statut CONFIRMED
    - Enregistre les coordonnées de contact du client (email, téléphone)
    - Stocke le message du client dans les métadonnées
    - L'équipe peut ensuite contacter le client pour finaliser le paiement
    
    **Utilisation :**
    - Pour les paiements par virement bancaire
    - Pour les paiements par chèque
    - Pour toute méthode de paiement personnalisée nécessitant un contact humain
    - Pour les commandes B2B nécessitant une facturation
    
    **Note :** Après le contact et le paiement effectif, le statut du paiement devra être mis à jour manuellement par l'administrateur.
    `
  })
  @ApiBody({ 
    type: DirectContactDto,
    description: 'Données du contact direct',
    examples: {
      example1: {
        summary: 'Demande de contact pour virement bancaire',
        value: {
          orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          email: 'client@example.com',
          phone: '+221771234567',
          message: 'Je souhaite payer par virement bancaire. Veuillez me contacter pour les coordonnées bancaires.'
        }
      },
      example2: {
        summary: 'Demande de contact pour facturation B2B',
        value: {
          orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          email: 'entreprise@example.com',
          phone: '+221771234567',
          message: 'Nous sommes une entreprise et souhaitons une facture pour cette commande.'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Demande de contact direct enregistrée - Commande mise en statut CONFIRMED',
    schema: {
      example: {
        id: 'payment-uuid-1234',
        orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
        orderNumber: 'CMD-1733123456789-1234',
        method: 'DIRECT_CONTACT',
        status: 'PENDING',
        amount: 45000,
        message: 'Votre demande de contact direct a été enregistrée. L\'équipe vous contactera bientôt.'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Commande déjà payée, champs manquants, etc.' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  async processDirectContact(
    @Request() req,
    @Body() directContactDto: DirectContactDto,
  ) {
    return this.paymentService.processDirectContact(
      req.user.id,
      directContactDto,
    );
  }

  @Get('verify/:token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Vérifier le statut d\'un paiement PayDunya',
    description: `
    **Vérifie le statut d'un paiement via le token PayDunya**
    
    Cet endpoint est utilisé par la page de succès après redirection depuis PayDunya.
    Il permet de récupérer les détails du paiement et de la commande associée.
    
    **Utilisation :**
    - Après redirection depuis PayDunya vers \`/orders/success?token=XXX\`
    - La page frontend appelle cet endpoint avec le token de l'URL
    - L'endpoint retourne les détails du paiement et de la commande
    - Si le paiement est complété sur PayDunya mais pas encore mis à jour en base, il sera synchronisé
    
    **Note :** L'utilisateur doit être authentifié et être le propriétaire de la commande.
    `
  })
  @ApiParam({
    name: 'token',
    description: 'Token PayDunya retourné dans l\'URL de redirection',
    example: 'test_JZAo8SakxF'
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du paiement récupéré avec succès',
    schema: {
      example: {
        success: true,
        data: {
          payment: {
            id: 'payment-uuid',
            status: 'COMPLETED',
            method: 'MOBILE_MONEY',
            amount: 450000,
            currency: 'XOF',
            paydunyaReceiptUrl: 'https://paydunya.com/receipt/...',
            transactionId: 'TXN123456',
            paidAt: '2025-12-03T05:56:44.929Z'
          },
          order: {
            id: 'order-uuid',
            orderNumber: 'CMD-1764741404562-4560',
            status: 'CONFIRMED',
            total: 450000,
            items: [
              {
                product: {
                  name: 'Téléphone Samsung Galaxy S222',
                  image: 'https://...'
                },
                quantity: 1,
                total: 450000
              }
            ]
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Paiement non trouvé pour ce token'
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié'
  })
  async verifyPayment(
    @Request() req,
    @Param('token') token: string,
  ) {
    const result = await this.paymentService.verifyPaymentByToken(
      token,
      req.user?.id,
    );
    return {
      success: true,
      message: 'Statut du paiement récupéré avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('paydunya/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Webhook PayDunya (IPN - Instant Payment Notification)',
    description: `
    **Endpoint webhook pour recevoir les notifications de paiement PayDunya**
    
    Cet endpoint est appelé automatiquement par PayDunya lorsqu'un paiement est effectué, annulé ou échoué. Il ne doit pas être appelé manuellement.
    
    **Fonctionnalités :**
    - Reçoit les notifications de statut de paiement de PayDunya
    - Vérifie la signature HMAC pour sécuriser la requête
    - Met à jour automatiquement le statut du paiement dans la base de données
    - Met à jour le statut de la commande si le paiement est complété
    - Enregistre l'URL du reçu PayDunya si disponible
    
    **Statuts de paiement gérés :**
    - **completed/paid** → Met le paiement et la commande en statut COMPLETED/CONFIRMED
    - **cancelled** → Met le paiement en statut CANCELLED
    - **failed** → Met le paiement en statut FAILED avec la raison de l'échec
    
    **Configuration requise :**
    - L'URL de ce webhook doit être configurée dans le tableau de bord PayDunya
    - Pour le développement local, utilisez ngrok ou localtunnel (voir docs/PAYDUNYA_CONFIGURATION.md)
    - L'URL doit être accessible publiquement pour que PayDunya puisse l'appeler
    
    **Sécurité :**
    - PayDunya signe chaque requête avec une signature HMAC
    - Le service vérifie cette signature avant de traiter la notification
    - Les requêtes non signées ou avec une signature invalide sont rejetées
    
    **Note :** Cet endpoint est public (pas d'authentification JWT) car il est appelé par PayDunya.
    `
  })
  @ApiBody({ 
    description: 'Données du webhook PayDunya (format PayDunya)',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token de la facture PayDunya' },
        invoice: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            status: { type: 'string', enum: ['completed', 'paid', 'cancelled', 'failed'] },
            receipt_url: { type: 'string' },
            txn_code: { type: 'string' }
          }
        },
        status: { type: 'string' },
        description: { type: 'string' }
      }
    },
    examples: {
      paymentCompleted: {
        summary: 'Paiement complété',
        value: {
          token: 'test_9jTlZiIc3O',
          invoice: {
            token: 'test_9jTlZiIc3O',
            status: 'completed',
            receipt_url: 'https://paydunya.com/receipt/...',
            txn_code: 'TXN123456'
          }
        }
      },
      paymentCancelled: {
        summary: 'Paiement annulé',
        value: {
          token: 'test_9jTlZiIc3O',
          invoice: {
            token: 'test_9jTlZiIc3O',
            status: 'cancelled'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook traité avec succès - Paiement et commande mis à jour',
    schema: {
      example: {
        success: true,
        paymentId: 'payment-uuid-1234',
        status: 'COMPLETED'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Token manquant, signature invalide, paiement non trouvé, etc.' 
  })
  async handlePayDunyaWebhook(@Body() body: any) {
    return this.paymentService.handlePayDunyaWebhook(body);
  }
}

