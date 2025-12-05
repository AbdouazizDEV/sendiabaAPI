import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ParseUUIDPipe } from '@nestjs/common/pipes';

@ApiTags('🔔 Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.CUSTOMER,
  UserRole.ENTERPRISE,
  UserRole.SELLER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer les notifications',
    description: `
    **Récupère toutes les notifications de l'utilisateur connecté**
    
    Cet endpoint permet de récupérer l'historique des notifications avec pagination.
    
    **Fonctionnalités :**
    - Liste paginée de toutes les notifications
    - Filtrage par statut de lecture (unreadOnly)
    - Compteur de notifications non lues
    - Tri par date de création (plus récentes en premier)
    
    **Types de notifications :**
    - ORDER_UPDATE : Mise à jour du statut d'une commande
    - PAYMENT_RECEIVED : Paiement reçu
    - SHIPMENT_TRACKING : Mise à jour du suivi de livraison
    - Et autres types personnalisés
    
    **Utilisation :** Idéal pour afficher la liste des notifications dans l'application.
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
    description: "Nombre d'éléments par page (défaut: 20)",
    example: 20,
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Afficher uniquement les notifications non lues (défaut: false)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications récupérées avec succès',
    schema: {
      example: {
        success: true,
        message: 'Notifications récupérées avec succès',
        data: {
          notifications: [
            {
              id: 'notification-uuid',
              type: 'ORDER_UPDATE',
              title: 'Votre commande a été confirmée',
              message: 'Votre commande CMD-123456789 a été confirmée et est en cours de préparation.',
              data: {
                orderId: 'order-uuid',
                orderNumber: 'CMD-123456789',
              },
              isRead: false,
              readAt: null,
              createdAt: '2025-12-04T10:00:00.000Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 5,
            totalPages: 1,
          },
          unreadCount: 3,
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  async getNotifications(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const result = await this.notificationService.getNotifications(
      req.user.id,
      page,
      limit,
      unreadOnly === 'true',
    );
    return {
      success: true,
      message: 'Notifications récupérées avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id/read')
  @ApiOperation({
    summary: 'Marquer notification comme lue',
    description: `
    **Marque une notification spécifique comme lue**
    
    Cet endpoint permet de marquer une notification comme lue, ce qui met à jour
    le statut isRead et enregistre la date de lecture.
    
    **Fonctionnalités :**
    - Met à jour le statut isRead à true
    - Enregistre la date de lecture (readAt)
    - Retourne la notification mise à jour
    
    **Note :** Si la notification est déjà lue, l'endpoint retourne simplement
    l'état actuel sans erreur.
    
    **Utilisation :** À appeler lorsque l'utilisateur ouvre/consulte une notification.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la notification',
    type: String,
    example: 'notification-uuid-1234',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée comme lue avec succès',
    schema: {
      example: {
        success: true,
        message: 'Notification marquée comme lue avec succès',
        data: {
          id: 'notification-uuid',
          isRead: true,
          readAt: '2025-12-04T12:00:00.000Z',
          message: 'Notification marquée comme lue',
        },
        timestamp: '2025-12-04T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  async markAsRead(
    @Request() req,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    const result = await this.notificationService.markAsRead(
      notificationId,
      req.user.id,
    );
    return {
      success: true,
      message: 'Notification marquée comme lue avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: "Détails d'une notification",
    description: `
    **Récupère les détails complets d'une notification spécifique**
    
    Cet endpoint retourne toutes les informations d'une notification, y compris :
    - Les détails de la notification (type, titre, message, statut de lecture)
    - Les détails de la commande associée (si applicable)
    - Les informations des vendeurs concernés
    - Les détails des produits commandés
    - Les informations de paiement et de suivi
    
    **Utilisation :** Idéal pour afficher une page de détails complète lorsqu'un utilisateur clique sur une notification.
    
    **Note :** Si la notification est liée à une commande, toutes les informations de la commande seront incluses.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la notification',
    type: String,
    example: '38d4f0ef-6b71-4063-be52-40cb1322fa56',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la notification récupérés avec succès',
    schema: {
      example: {
        success: true,
        message: 'Détails de la notification récupérés avec succès',
        data: {
          id: '38d4f0ef-6b71-4063-be52-40cb1322fa56',
          type: 'ORDER_UPDATE',
          title: 'Commande confirmée',
          message: 'Votre commande CMD-1764922696218-6013 a été confirmée et est en cours de préparation.',
          data: {
            orderId: '9404b5e7-3357-4cf1-ac93-33ea728fa353',
            orderNumber: 'CMD-1764922696218-6013',
            status: 'CONFIRMED',
          },
          isRead: false,
          readAt: null,
          createdAt: '2025-12-05T08:19:10.209Z',
          updatedAt: '2025-12-05T08:19:10.209Z',
          order: {
            id: '9404b5e7-3357-4cf1-ac93-33ea728fa353',
            orderNumber: 'CMD-1764922696218-6013',
            status: 'CONFIRMED',
            total: 105000,
            subtotal: 100000,
            shippingCost: 5000,
            tax: 0,
            currency: 'XOF',
            shippingAddress: {
              recipientName: 'Abdou Aziz DIOP',
              recipientPhone: '+221773893038',
              address: '123 Rue Example',
              city: 'Dakar',
              region: 'Dakar',
              country: 'Sénégal',
              postalCode: '12345',
            },
            tracking: {
              trackingNumber: null,
              trackingUrl: null,
              carrier: null,
            },
            timestamps: {
              createdAt: '2025-12-05T08:18:16.229Z',
              confirmedAt: '2025-12-05T08:19:10.175Z',
              processedAt: null,
              shippedAt: null,
              deliveredAt: null,
              cancelledAt: null,
              refundedAt: null,
            },
            payment: {
              id: 'payment-uuid',
              status: 'COMPLETED',
              method: 'MOBILE_MONEY',
              amount: 105000,
              currency: 'XOF',
              paidAt: '2025-12-05T08:18:20.000Z',
            },
            sellers: [
              {
                id: 'seller-uuid',
                firstName: 'El Hadji',
                lastName: 'Fall Basse',
                email: 'seller@example.com',
                phone: '+221771234567',
                role: 'SELLER',
                profilePicture: 'https://example.com/profile.jpg',
                company: {
                  id: 'company-uuid',
                  name: 'Ma Boutique',
                  legalName: 'Ma Boutique SARL',
                  email: 'contact@maboutique.sn',
                  phone: '+221771234567',
                  address: '456 Avenue Example',
                  city: 'Dakar',
                  region: 'Dakar',
                  country: 'Sénégal',
                  website: 'https://maboutique.sn',
                  logo: 'https://example.com/logo.jpg',
                  description: 'Description de la boutique',
                },
                products: [
                  {
                    id: 'product-uuid',
                    name: 'Maillot Équipe Sénégal 2024',
                    slug: 'maillot-equipe-senegal-2024',
                    description: 'Maillot officiel',
                    price: 35000,
                    image: 'https://example.com/product.jpg',
                    category: {
                      id: 'category-uuid',
                      name: 'Vêtements',
                      slug: 'vetements',
                    },
                    quantity: 3,
                    subtotal: 105000,
                  },
                ],
              },
            ],
            items: [
              {
                id: 'item-uuid',
                product: {
                  id: 'product-uuid',
                  name: 'Maillot Équipe Sénégal 2024',
                  slug: 'maillot-equipe-senegal-2024',
                  image: 'https://example.com/product.jpg',
                },
                quantity: 3,
                price: 35000,
                subtotal: 105000,
              },
            ],
          },
        },
        timestamp: '2025-12-05T08:40:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getNotificationDetails(
    @Request() req,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    const result = await this.notificationService.getNotificationDetails(
      notificationId,
      req.user.id,
    );
    return {
      success: true,
      message: 'Détails de la notification récupérés avec succès',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

