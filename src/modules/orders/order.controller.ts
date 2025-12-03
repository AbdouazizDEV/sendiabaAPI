import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrderService } from './services/order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentService } from '../payments/services/payment.service';
import { MobileMoneyPaymentDto, MobileMoneyProvider } from '../payments/dto/mobile-money-payment.dto';
import { CashOnDeliveryDto } from '../payments/dto/cash-on-delivery.dto';
import { DirectContactDto } from '../payments/dto/direct-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

@ApiTags('🛍️ Commandes')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({ 
    summary: 'Créer une nouvelle commande',
    description: `
    **Création d'une commande à partir du panier de l'utilisateur**
    
    Cet endpoint permet de créer une nouvelle commande en utilisant les articles présents dans le panier de l'utilisateur connecté.
    
    **Fonctionnalités :**
    - Crée une commande avec un numéro unique (format: CMD-{timestamp}-{random})
    - Calcule automatiquement les totaux (sous-total, taxes, frais de livraison, remises)
    - Applique les promotions actives sur les produits
    - Vérifie la disponibilité du stock pour chaque produit
    - Réserve le stock des produits commandés
    - Vide automatiquement le panier après création de la commande
    - Lie la commande à l'adresse de livraison spécifiée
    
    **Prérequis :**
    - L'utilisateur doit être authentifié (CUSTOMER ou ENTERPRISE)
    - Le panier doit contenir au moins un article
    - L'adresse de livraison doit exister et appartenir à l'utilisateur
    - Les produits doivent être en statut ACTIVE
    - Le stock doit être suffisant pour tous les produits
    
    **Note :** Après la création, vous devrez utiliser l'endpoint POST /orders/:id/payment pour traiter le paiement.
    `
  })
  @ApiBody({ 
    type: CreateOrderDto,
    description: 'Données de la commande à créer',
    examples: {
      example1: {
        summary: 'Commande simple',
        value: {
          shippingAddressId: '29dfbd94-6a09-4162-b9af-25234a69f04c',
          items: [
            {
              productId: 'e8faa8e6-39a7-4223-a249-023536cc01ea',
              quantity: 2
            }
          ],
          notes: 'Livrer entre 9h et 12h'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Commande créée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Commande créée avec succès',
        data: {
          id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          orderNumber: 'CMD-1733123456789-1234',
          status: 'PENDING',
          subtotal: 50000,
          tax: 0,
          shipping: 0,
          discount: 5000,
          total: 45000,
          items: [
            {
              productId: 'e8faa8e6-39a7-4223-a249-023536cc01ea',
              productName: 'Produit exemple',
              quantity: 2,
              unitPrice: 22500,
              total: 45000
            }
          ]
        },
        timestamp: '2025-12-02T05:09:00.834Z'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Panier vide, stock insuffisant, produit indisponible, etc.' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adresse de livraison non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.id, createOrderDto);
  }

  @Get(':id/summary')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Récapitulatif de commande',
    description: `
    **Récupère le récapitulatif détaillé d'une commande**
    
    Cet endpoint retourne toutes les informations détaillées d'une commande, incluant :
    - Les détails de la commande (numéro, statut, totaux)
    - La liste complète des articles commandés
    - Les informations de livraison
    - L'historique des paiements associés
    - Les informations de l'utilisateur
    
    **Accès :**
    - Les clients (CUSTOMER, ENTERPRISE) peuvent voir uniquement leurs propres commandes
    - Les vendeurs (SELLER) peuvent voir les commandes de leurs produits
    - Les administrateurs (ADMIN, SUPER_ADMIN) peuvent voir toutes les commandes
    
    **Utilisation :** Idéal pour afficher la page de détails d'une commande ou pour générer une facture.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID de la commande (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0'
  })
  @ApiResponse({
    status: 200,
    description: 'Récapitulatif de la commande récupéré avec succès',
    schema: {
      example: {
        success: true,
        message: 'Récapitulatif de la commande récupéré avec succès',
        data: {
          id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          orderNumber: 'CMD-1733123456789-1234',
          status: 'PENDING',
          subtotal: 50000,
          tax: 0,
          shipping: 0,
          discount: 5000,
          total: 45000,
          shippingAddress: '123 Rue Example',
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          items: [
            {
              productName: 'Produit exemple',
              quantity: 2,
              unitPrice: 22500,
              total: 45000
            }
          ],
          payments: []
        },
        timestamp: '2025-12-02T05:09:00.834Z'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  async getOrderSummary(@Request() req, @Param('id') orderId: string) {
    return this.orderService.getOrderSummary(orderId, req.user.id);
  }

  @Get(':id/confirmation')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Confirmation de commande',
    description: `
    **Récupère la confirmation d'une commande**
    
    Cet endpoint retourne les informations de confirmation d'une commande, similaires au récapitulatif mais optimisées pour l'affichage de la page de confirmation après paiement.
    
    **Différence avec /summary :**
    - Format optimisé pour la page de confirmation
    - Inclut les informations de paiement complétées
    - Peut inclure des instructions de suivi de commande
    
    **Utilisation :** À appeler après un paiement réussi pour afficher la page de confirmation à l'utilisateur.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID de la commande (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0'
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmation de la commande récupérée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Confirmation de la commande récupérée avec succès',
        data: {
          id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          orderNumber: 'CMD-1733123456789-1234',
          status: 'CONFIRMED',
          total: 45000,
          items: [
            {
              productName: 'Produit exemple',
              quantity: 2,
              total: 45000
            }
          ]
        },
        timestamp: '2025-12-02T05:09:00.834Z'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  async getOrderConfirmation(@Request() req, @Param('id') orderId: string) {
    return this.orderService.getOrderConfirmation(orderId, req.user.id);
  }

  @Post(':id/payment')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({ 
    summary: 'Traitement du paiement d\'une commande',
    description: `
    **Traite le paiement d'une commande existante**
    
    Cet endpoint permet de traiter le paiement d'une commande en utilisant différentes méthodes de paiement.
    
    **Méthodes de paiement supportées :**
    
    1. **MOBILE_MONEY** - Paiement via Mobile Money (Orange Money, Free Money, Wave, etc.)
       - Crée une facture PayDunya
       - Retourne une URL de paiement à rediriger vers l'utilisateur
       - Requis: phoneNumber, provider
       
    2. **CASH_ON_DELIVERY** - Paiement à la livraison
       - Confirme la commande pour paiement à la réception
       - Met automatiquement la commande en statut CONFIRMED
       - Optionnel: notes
       
    3. **DIRECT_CONTACT** - Contact direct avec l'entreprise
       - Enregistre une demande de contact pour finaliser le paiement
       - Met automatiquement la commande en statut CONFIRMED
       - Requis: email, phone, message
       
    **Flux de paiement Mobile Money :**
    1. Appeler cet endpoint avec method: "MOBILE_MONEY"
    2. Recevoir l'URL de paiement (paymentUrl) dans la réponse
    3. Rediriger l'utilisateur vers cette URL
    4. PayDunya enverra un webhook à /payments/paydunya/webhook lors du paiement
    
    **Note :** Une commande ne peut avoir qu'un seul paiement en cours ou complété à la fois.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID de la commande à payer (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0'
  })
  @ApiBody({ 
    type: ProcessPaymentDto,
    description: 'Données du paiement à traiter',
    examples: {
      mobileMoney: {
        summary: 'Paiement Mobile Money',
        value: {
          method: 'MOBILE_MONEY',
          phoneNumber: '+221771234567',
          provider: 'ORANGE_MONEY'
        }
      },
      cashOnDelivery: {
        summary: 'Paiement à la livraison',
        value: {
          method: 'CASH_ON_DELIVERY',
          notes: 'Livrer entre 9h et 12h'
        }
      },
      directContact: {
        summary: 'Contact direct',
        value: {
          method: 'DIRECT_CONTACT',
          email: 'client@example.com',
          phone: '+221771234567',
          message: 'Je souhaite contacter directement l\'entreprise pour finaliser le paiement'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Paiement traité avec succès',
    schema: {
      oneOf: [
        {
          title: 'Réponse Mobile Money',
          example: {
            id: 'payment-uuid',
            orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
            orderNumber: 'CMD-1733123456789-1234',
            method: 'MOBILE_MONEY',
            status: 'PENDING',
            amount: 45000,
            paymentUrl: 'https://paydunya.com/sandbox-checkout/invoice/test_9jTlZiIc3O',
            token: 'test_9jTlZiIc3O'
          }
        },
        {
          title: 'Réponse Cash on Delivery',
          example: {
            id: 'payment-uuid',
            orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
            orderNumber: 'CMD-1733123456789-1234',
            method: 'CASH_ON_DELIVERY',
            status: 'PENDING',
            amount: 45000,
            message: 'Paiement à la livraison confirmé. La commande sera livrée et payée à la réception.'
          }
        },
        {
          title: 'Réponse Direct Contact',
          example: {
            id: 'payment-uuid',
            orderId: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
            orderNumber: 'CMD-1733123456789-1234',
            method: 'DIRECT_CONTACT',
            status: 'PENDING',
            amount: 45000,
            message: 'Votre demande de contact direct a été enregistrée. L\'équipe vous contactera bientôt.'
          }
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Méthode non supportée, champs manquants, commande déjà payée, etc.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée ou n\'appartient pas à l\'utilisateur' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide' 
  })
  async processPayment(
    @Request() req,
    @Param('id') orderId: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    switch (processPaymentDto.method) {
      case 'MOBILE_MONEY':
        if (!processPaymentDto.phoneNumber || !processPaymentDto.provider) {
          throw new BadRequestException(
            'phoneNumber et provider sont requis pour le paiement Mobile Money',
          );
        }
        const mobileMoneyDto: MobileMoneyPaymentDto = {
          orderId,
          provider: processPaymentDto.provider as MobileMoneyProvider,
          phoneNumber: processPaymentDto.phoneNumber,
          confirmationCode: undefined,
        };
        return this.paymentService.processMobileMoneyPayment(
          req.user.id,
          mobileMoneyDto,
        );

      case 'CASH_ON_DELIVERY':
        const cashOnDeliveryDto: CashOnDeliveryDto = {
          orderId,
          notes: processPaymentDto.notes,
        };
        return this.paymentService.processCashOnDelivery(
          req.user.id,
          cashOnDeliveryDto,
        );

      case 'DIRECT_CONTACT':
        const directContactDto: DirectContactDto = {
          orderId,
          email: processPaymentDto.email,
          phone: processPaymentDto.phone,
          message: processPaymentDto.message,
        };
        return this.paymentService.processDirectContact(
          req.user.id,
          directContactDto,
        );

      default:
        throw new BadRequestException('Méthode de paiement non supportée');
    }
  }
}

