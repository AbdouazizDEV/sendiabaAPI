import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderService } from './services/order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { SendMessageDto } from './dto/send-message.dto';
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

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Historique des commandes',
    description: `
    **Récupère l'historique de toutes les commandes de l'utilisateur connecté**
    
    Cet endpoint permet au client de consulter toutes ses commandes passées avec pagination.
    
    **Fonctionnalités :**
    - Liste paginée de toutes les commandes
    - Filtrage par statut (optionnel)
    - Informations résumées pour chaque commande (numéro, statut, total, items)
    - Tri par date de création (plus récentes en premier)
    
    **Utilisation :** Idéal pour afficher la page "Mes commandes" dans l'application.
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'éléments par page (défaut: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filtrer par statut (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)',
    example: 'CONFIRMED',
  })
  @ApiResponse({
    status: 200,
    description: 'Historique des commandes récupéré avec succès',
    schema: {
      example: {
        success: true,
        message: 'Historique des commandes récupéré avec succès',
        data: {
          orders: [
            {
              id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
              orderNumber: 'CMD-1733123456789-1234',
              status: 'CONFIRMED',
              total: 45000,
              itemCount: 2,
              items: [
                {
                  product: {
                    id: 'product-uuid',
                    name: 'Produit exemple',
                    slug: 'produit-exemple',
                    image: 'https://example.com/image.jpg',
                  },
                  quantity: 2,
                },
              ],
              createdAt: '2025-12-04T10:00:00.000Z',
              updatedAt: '2025-12-04T10:00:00.000Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 5,
            totalPages: 1,
          },
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  async getOrderHistory(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.orderService.getOrderHistory(
      req.user.id,
      page,
      limit,
      status,
    );
    return {
      success: true,
      message: 'Historique des commandes récupéré avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Détails d\'une commande spécifique',
    description: `
    **Récupère les détails complets d'une commande**
    
    Cet endpoint retourne toutes les informations détaillées d'une commande spécifique,
    incluant les articles, les paiements, et les informations de livraison.
    
    **Différence avec /:id/summary :**
    - Cet endpoint est optimisé pour l'affichage des détails complets
    - Inclut tous les articles (pas de limite)
    - Format plus détaillé pour la page de détails
    
    **Utilisation :** À utiliser pour afficher la page de détails d'une commande.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande',
    type: String,
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async getOrderDetails(@Request() req, @Param('id') orderId: string) {
    const order = await this.orderService.getOrderDetails(orderId, req.user.id);
    return {
      success: true,
      message: 'Détails de la commande récupérés avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/status')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Statut actuel de la commande',
    description: `
    **Récupère uniquement le statut et les timestamps d'une commande**
    
    Cet endpoint retourne uniquement les informations de statut d'une commande,
    optimisé pour les mises à jour en temps réel ou les vérifications rapides.
    
    **Retourne :**
    - Statut actuel de la commande
    - Tous les timestamps importants (création, confirmation, expédition, livraison, annulation)
    
    **Utilisation :** Idéal pour les vérifications périodiques du statut ou les mises à jour en temps réel.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande',
    type: String,
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut de la commande récupéré avec succès',
    schema: {
      example: {
        success: true,
        message: 'Statut de la commande récupéré avec succès',
        data: {
          id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          orderNumber: 'CMD-1733123456789-1234',
          status: 'SHIPPED',
          timestamps: {
            createdAt: '2025-12-04T10:00:00.000Z',
            updatedAt: '2025-12-04T11:00:00.000Z',
            confirmedAt: '2025-12-04T10:05:00.000Z',
            processedAt: '2025-12-04T10:30:00.000Z',
            shippedAt: '2025-12-04T11:00:00.000Z',
            deliveredAt: null,
            cancelledAt: null,
          },
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async getOrderStatus(@Request() req, @Param('id') orderId: string) {
    const status = await this.orderService.getOrderStatus(orderId, req.user.id);
    return {
      success: true,
      message: 'Statut de la commande récupéré avec succès',
      data: status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/tracking')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Suivi de livraison',
    description: `
    **Récupère les informations de suivi de livraison d'une commande**
    
    Cet endpoint retourne toutes les informations nécessaires pour suivre la livraison
    d'une commande, incluant le numéro de suivi, l'URL de suivi, le transporteur,
    et les informations d'adresse de livraison.
    
    **Retourne :**
    - Numéro de suivi (trackingNumber)
    - URL de suivi (trackingUrl)
    - Transporteur (carrier)
    - Adresse de livraison complète
    - Timestamps d'expédition et de livraison
    
    **Note :** Les informations de suivi ne sont disponibles que si la commande a été expédiée.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande',
    type: String,
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
  })
  @ApiResponse({
    status: 200,
    description: 'Informations de suivi récupérées avec succès',
    schema: {
      example: {
        success: true,
        message: 'Informations de suivi récupérées avec succès',
        data: {
          id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          orderNumber: 'CMD-1733123456789-1234',
          status: 'SHIPPED',
          tracking: {
            trackingNumber: 'TRACK123456789',
            trackingUrl: 'https://tracking.example.com/TRACK123456789',
            carrier: 'DHL Express',
          },
          shipping: {
            address: '123 Rue Example',
            city: 'Dakar',
            region: 'Dakar',
            country: 'Sénégal',
            recipientName: 'Amadou Diallo',
            recipientPhone: '+221 77 123 45 67',
          },
          timestamps: {
            shippedAt: '2025-12-04T11:00:00.000Z',
            deliveredAt: null,
          },
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async getOrderTracking(@Request() req, @Param('id') orderId: string) {
    const tracking = await this.orderService.getOrderTracking(orderId, req.user.id);
    return {
      success: true,
      message: 'Informations de suivi récupérées avec succès',
      data: tracking,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Annuler une commande',
    description: `
    **Annule une commande si elle peut encore être annulée**
    
    Cet endpoint permet au client d'annuler sa commande sous certaines conditions.
    
    **Conditions d'annulation :**
    - La commande ne doit pas être déjà annulée, livrée ou remboursée
    - Si un paiement a été complété, la commande ne peut pas être annulée directement
      (le client doit contacter le vendeur pour un remboursement)
    - Le stock réservé sera automatiquement libéré
    
    **Actions effectuées :**
    - Met la commande au statut CANCELLED
    - Libère le stock réservé pour tous les articles
    - Enregistre la raison d'annulation (si fournie)
    
    **Note :** Les commandes avec paiement complété nécessitent une intervention du vendeur.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande à annuler',
    type: String,
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Raison de l\'annulation (optionnel)',
          example: 'Changement d\'avis',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Commande annulée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Commande annulée avec succès',
        data: {
          id: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
          orderNumber: 'CMD-1733123456789-1234',
          status: 'CANCELLED',
          cancelledAt: '2025-12-04T12:00:00.000Z',
          cancelledReason: 'Changement d\'avis',
          message: 'Commande annulée avec succès',
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La commande ne peut pas être annulée (déjà annulée, livrée, ou paiement complété)',
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async cancelOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() body?: { reason?: string },
  ) {
    const result = await this.orderService.cancelOrder(
      orderId,
      req.user.id,
      body?.reason,
    );
    return {
      success: true,
      message: 'Commande annulée avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Envoyer un message au vendeur',
    description: `
    **Permet au client d'envoyer un message au vendeur concernant une commande**
    
    Cet endpoint permet au client de communiquer avec le vendeur à propos de sa commande.
    Le vendeur recevra automatiquement une notification lorsqu'un message est envoyé.
    
    **Fonctionnalités :**
    - Envoie un message au vendeur de la commande
    - Crée automatiquement une notification pour le vendeur
    - Le message est associé à la commande et visible dans l'historique
    
    **Utilisation :** Idéal pour poser des questions, demander des informations de suivi,
    ou communiquer avec le vendeur concernant la commande.
    
    **Note :** Le vendeur peut répondre via son endpoint dédié.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande',
    type: String,
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
  })
  @ApiBody({
    type: SendMessageDto,
    description: 'Message à envoyer au vendeur',
  })
  @ApiResponse({
    status: 201,
    description: 'Message envoyé avec succès',
    schema: {
      example: {
        success: true,
        message: 'Message envoyé avec succès',
        data: {
          id: 'message-uuid',
          orderId: 'order-uuid',
          orderNumber: 'CMD-1733123456789-1234',
          senderId: 'customer-uuid',
          senderRole: 'CUSTOMER',
          message: 'Merci pour votre message. J\'aimerais savoir quand ma commande sera expédiée.',
          isRead: false,
          createdAt: '2025-12-05T08:15:00.000Z',
        },
        timestamp: '2025-12-05T08:15:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  @ApiResponse({ status: 400, description: 'Message vide ou commande invalide' })
  async sendMessage(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const result = await this.orderService.sendMessage(
      orderId,
      req.user.id,
      sendMessageDto.message,
    );
    return {
      success: true,
      message: 'Message envoyé avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/messages')
  @Roles(UserRole.CUSTOMER, UserRole.ENTERPRISE)
  @ApiOperation({
    summary: 'Historique des messages d\'une commande',
    description: `
    **Récupère tous les messages échangés entre le client et le vendeur pour une commande**
    
    Cet endpoint permet au client de consulter l'historique complet des messages
    échangés avec le vendeur concernant sa commande.
    
    **Fonctionnalités :**
    - Liste tous les messages de la commande (client et vendeur)
    - Affiche les informations de l'expéditeur (nom, rôle, photo de profil)
    - Indique le nombre de messages non lus du vendeur
    - Tri par date de création (plus anciens en premier)
    
    **Utilisation :** Idéal pour afficher la conversation complète dans l'interface de détails de commande.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande',
    type: String,
    example: '8af2c335-e282-43b7-a409-4f5ba99d6cc0',
  })
  @ApiResponse({
    status: 200,
    description: 'Historique des messages récupéré avec succès',
    schema: {
      example: {
        success: true,
        message: 'Historique des messages récupéré avec succès',
        data: {
          orderId: 'order-uuid',
          orderNumber: 'CMD-1733123456789-1234',
          messages: [
            {
              id: 'message-uuid-1',
              senderId: 'seller-uuid',
              senderRole: 'SELLER',
              sender: {
                id: 'seller-uuid',
                name: 'Vendeur Exemple',
                role: 'SELLER',
                profilePicture: 'https://example.com/photo.jpg',
              },
              message: 'Votre commande a été confirmée et sera expédiée sous 24h.',
              isRead: true,
              createdAt: '2025-12-05T08:10:00.000Z',
            },
            {
              id: 'message-uuid-2',
              senderId: 'customer-uuid',
              senderRole: 'CUSTOMER',
              sender: {
                id: 'customer-uuid',
                name: 'Amadou Diallo',
                role: 'CUSTOMER',
                profilePicture: null,
              },
              message: 'Merci pour votre message. J\'aimerais savoir quand ma commande sera expédiée.',
              isRead: false,
              createdAt: '2025-12-05T08:15:00.000Z',
            },
          ],
          totalMessages: 2,
          unreadCount: 0,
        },
        timestamp: '2025-12-05T08:20:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async getOrderMessages(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    const result = await this.orderService.getOrderMessages(orderId, req.user.id);
    return {
      success: true,
      message: 'Historique des messages récupéré avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

