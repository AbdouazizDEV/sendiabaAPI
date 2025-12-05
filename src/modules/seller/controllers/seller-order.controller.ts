import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SellerOrderService } from '../services/orders/seller-order.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { FilterOrdersDto } from '../dto/orders/filter-orders.dto';
import { UpdateOrderStatusDto } from '../dto/orders/update-order-status.dto';
import { TrackingDto } from '../dto/orders/tracking.dto';
import { CancelOrderDto } from '../dto/orders/cancel-order.dto';
import { RefundOrderDto } from '../dto/orders/refund-order.dto';
import { SendMessageDto } from '../dto/orders/send-message.dto';
import { OrderStatus } from '@prisma/client';

@ApiTags('🛍️ Gestion des Commandes (Vendeur)')
@Controller('seller/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER, UserRole.ENTERPRISE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class SellerOrderController {
  constructor(private readonly sellerOrderService: SellerOrderService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste des commandes reçues',
    description: `
    **Récupère toutes les commandes contenant des produits du vendeur connecté**
    
    Cet endpoint permet au vendeur de consulter toutes les commandes qui contiennent au moins un de ses produits.
    Les commandes sont filtrées automatiquement pour ne montrer que celles qui concernent le vendeur.
    
    **Fonctionnalités :**
    - Pagination (page, limit)
    - Filtrage par statut
    - Filtrage par date (startDate, endDate)
    - Recherche par numéro de commande
    - Tri par date de création (plus récentes en premier)
    
    **Informations incluses :**
    - Détails de la commande (montants, adresse de livraison)
    - Articles de la commande (uniquement les produits du vendeur)
    - Informations du client
    - Statut des paiements
    - Nombre de messages non lus
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des commandes récupérée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Commandes récupérées avec succès',
        data: {
          orders: [
            {
              id: 'uuid',
              orderNumber: 'ORD-2025-001',
              status: 'PENDING',
              total: 50000,
              customer: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
              },
              items: [],
              unreadMessagesCount: 2,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 50,
            totalPages: 3,
          },
        },
      },
    },
  })
  async findAll(@CurrentUser() user: User, @Query() filterDto: FilterOrdersDto) {
    const result = await this.sellerOrderService.findAll(user.id, filterDto);
    return {
      success: true,
      message: 'Commandes récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Commandes en attente',
    description: 'Récupère toutes les commandes avec le statut PENDING contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 20)' })
  @ApiResponse({ status: 200, description: 'Commandes en attente récupérées avec succès' })
  async getPendingOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.PENDING, page, limit);
    return {
      success: true,
      message: 'Commandes en attente récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('confirmed')
  @ApiOperation({
    summary: 'Commandes confirmées',
    description: 'Récupère toutes les commandes avec le statut CONFIRMED contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Commandes confirmées récupérées avec succès' })
  async getConfirmedOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.CONFIRMED, page, limit);
    return {
      success: true,
      message: 'Commandes confirmées récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('processing')
  @ApiOperation({
    summary: 'Commandes en préparation',
    description: 'Récupère toutes les commandes avec le statut PROCESSING contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Commandes en préparation récupérées avec succès' })
  async getProcessingOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.PROCESSING, page, limit);
    return {
      success: true,
      message: 'Commandes en préparation récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('shipped')
  @ApiOperation({
    summary: 'Commandes expédiées',
    description: 'Récupère toutes les commandes avec le statut SHIPPED contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Commandes expédiées récupérées avec succès' })
  async getShippedOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.SHIPPED, page, limit);
    return {
      success: true,
      message: 'Commandes expédiées récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('delivered')
  @ApiOperation({
    summary: 'Commandes livrées',
    description: 'Récupère toutes les commandes avec le statut DELIVERED contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Commandes livrées récupérées avec succès' })
  async getDeliveredOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.DELIVERED, page, limit);
    return {
      success: true,
      message: 'Commandes livrées récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cancelled')
  @ApiOperation({
    summary: 'Commandes annulées',
    description: 'Récupère toutes les commandes avec le statut CANCELLED contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Commandes annulées récupérées avec succès' })
  async getCancelledOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.CANCELLED, page, limit);
    return {
      success: true,
      message: 'Commandes annulées récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('returned')
  @ApiOperation({
    summary: 'Commandes retournées',
    description: 'Récupère toutes les commandes avec le statut REFUNDED contenant des produits du vendeur',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Commandes retournées récupérées avec succès' })
  async getReturnedOrders(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.findByStatus(user.id, OrderStatus.REFUNDED, page, limit);
    return {
      success: true,
      message: 'Commandes retournées récupérées avec succès',
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détails d\'une commande spécifique',
    description: `
    **Récupère les détails complets d'une commande spécifique**
    
    Cet endpoint retourne toutes les informations détaillées d'une commande, y compris :
    - Tous les articles de la commande (uniquement ceux du vendeur)
    - Informations complètes du client
    - Historique des paiements
    - Historique complet des messages échangés
    - Informations de suivi (tracking)
    - Dates importantes (confirmée, expédiée, livrée, etc.)
    
    **Sécurité :** Seules les commandes contenant au moins un produit du vendeur sont accessibles.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  @ApiResponse({ status: 403, description: 'Non autorisé à accéder à cette commande' })
  async findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) orderId: string) {
    const order = await this.sellerOrderService.findOne(user.id, orderId);
    return {
      success: true,
      message: 'Détails de la commande récupérés avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour le statut d\'une commande',
    description: `
    **Met à jour le statut d'une commande avec validation des transitions**
    
    Cet endpoint permet de changer le statut d'une commande. Les transitions de statut sont validées :
    - PENDING → CONFIRMED, CANCELLED
    - CONFIRMED → PROCESSING, CANCELLED
    - PROCESSING → SHIPPED, CANCELLED
    - SHIPPED → DELIVERED, CANCELLED
    - DELIVERED → REFUNDED
    - CANCELLED → (aucune transition possible)
    - REFUNDED → (aucune transition possible)
    
    Les timestamps sont automatiquement mis à jour selon le nouveau statut.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Statut de la commande mis à jour avec succès',
  })
  @ApiResponse({ status: 400, description: 'Transition de statut invalide' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.sellerOrderService.updateStatus(user.id, orderId, updateStatusDto);
    return {
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmer une commande',
    description: `
    **Confirme une commande en attente**
    
    Change le statut de la commande de PENDING à CONFIRMED.
    La date de confirmation (confirmedAt) est automatiquement enregistrée.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande confirmée avec succès',
  })
  @ApiResponse({ status: 400, description: 'La commande ne peut pas être confirmée dans son état actuel' })
  async confirmOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) orderId: string) {
    const order = await this.sellerOrderService.confirmOrder(user.id, orderId);
    return {
      success: true,
      message: 'Commande confirmée avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer une commande en préparation',
    description: `
    **Marque une commande confirmée comme étant en préparation**
    
    Change le statut de la commande de CONFIRMED à PROCESSING.
    La date de traitement (processedAt) est automatiquement enregistrée.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande marquée en préparation avec succès',
  })
  async processOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) orderId: string) {
    const order = await this.sellerOrderService.processOrder(user.id, orderId);
    return {
      success: true,
      message: 'Commande marquée en préparation avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/ship')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer une commande comme expédiée',
    description: `
    **Marque une commande en préparation comme étant expédiée**
    
    Change le statut de la commande de PROCESSING à SHIPPED.
    La date d'expédition (shippedAt) est automatiquement enregistrée.
    
    **Optionnel :** Vous pouvez inclure les informations de suivi (trackingNumber, trackingUrl, carrier)
    dans le corps de la requête pour les enregistrer en même temps.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: TrackingDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Commande marquée comme expédiée avec succès',
  })
  async shipOrder(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() trackingDto?: TrackingDto,
  ) {
    const order = await this.sellerOrderService.shipOrder(user.id, orderId, trackingDto);
    return {
      success: true,
      message: 'Commande marquée comme expédiée avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer une commande comme livrée',
    description: `
    **Marque une commande expédiée comme étant livrée**
    
    Change le statut de la commande de SHIPPED à DELIVERED.
    La date de livraison (deliveredAt) est automatiquement enregistrée.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande marquée comme livrée avec succès',
  })
  async deliverOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) orderId: string) {
    const order = await this.sellerOrderService.deliverOrder(user.id, orderId);
    return {
      success: true,
      message: 'Commande marquée comme livrée avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler une commande',
    description: `
    **Annule une commande avec une raison**
    
    Change le statut de la commande à CANCELLED.
    La date d'annulation (cancelledAt) et la raison sont enregistrées.
    
    **Note :** Seules les commandes non livrées peuvent être annulées.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Commande annulée avec succès',
  })
  async cancelOrder(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() cancelDto: CancelOrderDto,
  ) {
    const order = await this.sellerOrderService.cancelOrder(user.id, orderId, cancelDto);
    return {
      success: true,
      message: 'Commande annulée avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id/tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ajouter ou mettre à jour les informations de suivi',
    description: `
    **Ajoute ou met à jour les informations de suivi d'une commande**
    
    Permet d'enregistrer :
    - Le numéro de suivi (trackingNumber)
    - L'URL de suivi (trackingUrl) - optionnel
    - Le nom du transporteur (carrier) - optionnel
    
    Ces informations peuvent être ajoutées à tout moment, même si la commande n'est pas encore expédiée.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: TrackingDto })
  @ApiResponse({
    status: 200,
    description: 'Informations de suivi mises à jour avec succès',
  })
  async updateTracking(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() trackingDto: TrackingDto,
  ) {
    const order = await this.sellerOrderService.updateTracking(user.id, orderId, trackingDto);
    return {
      success: true,
      message: 'Informations de suivi mises à jour avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initier un remboursement',
    description: `
    **Initie un remboursement pour une commande livrée**
    
    Change le statut de la commande de DELIVERED à REFUNDED.
    La date de remboursement (refundedAt) et la raison sont enregistrées.
    
    **Note :** Seules les commandes livrées (DELIVERED) peuvent être remboursées.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: RefundOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Remboursement initié avec succès',
  })
  @ApiResponse({ status: 400, description: 'Seules les commandes livrées peuvent être remboursées' })
  async refundOrder(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() refundDto: RefundOrderDto,
  ) {
    const order = await this.sellerOrderService.refundOrder(user.id, orderId, refundDto);
    return {
      success: true,
      message: 'Remboursement initié avec succès',
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/customer-info')
  @ApiOperation({
    summary: 'Coordonnées du client',
    description: `
    **Récupère les coordonnées complètes du client pour une commande**
    
    Retourne :
    - Informations du compte utilisateur (nom, email, téléphone)
    - Adresse de livraison complète
    - Nom et téléphone du destinataire
    
    Ces informations sont essentielles pour la préparation et l'expédition de la commande.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Coordonnées du client récupérées avec succès',
  })
  async getCustomerInfo(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) orderId: string) {
    const customerInfo = await this.sellerOrderService.getCustomerInfo(user.id, orderId);
    return {
      success: true,
      message: 'Coordonnées du client récupérées avec succès',
      data: customerInfo,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Envoyer un message au client',
    description: `
    **Envoie un message au client concernant sa commande**
    
    Permet au vendeur de communiquer directement avec le client à propos de sa commande.
    Le message est enregistré dans l'historique de la commande et peut être consulté par le client.
    
    **Utilisation :**
    - Informer le client de l'avancement de sa commande
    - Demander des précisions sur l'adresse de livraison
    - Notifier d'un retard ou d'un problème
    - Confirmer la réception du paiement
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message envoyé avec succès',
  })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const message = await this.sellerOrderService.sendMessage(user.id, orderId, sendMessageDto);
    return {
      success: true,
      message: 'Message envoyé avec succès',
      data: message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Historique des échanges',
    description: `
    **Récupère l'historique complet des messages échangés pour une commande**
    
    Retourne tous les messages (du vendeur et du client) concernant cette commande,
    triés par date de création (plus anciens en premier).
    
    **Informations incluses :**
    - Contenu du message
    - Auteur (SELLER ou CUSTOMER)
    - Date d'envoi
    - Statut de lecture
    `,
  })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Historique des messages récupéré avec succès',
  })
  async getOrderMessages(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) orderId: string) {
    const messages = await this.sellerOrderService.getOrderMessages(user.id, orderId);
    return {
      success: true,
      message: 'Historique des messages récupéré avec succès',
      data: messages,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('messages/all')
  @ApiOperation({
    summary: 'Tous les messages clients',
    description: `
    **Récupère tous les messages de toutes les commandes du vendeur**
    
    Permet au vendeur de consulter tous les messages échangés avec ses clients,
    toutes commandes confondues, avec pagination.
    
    **Utile pour :**
    - Voir tous les messages non lus
    - Suivre les communications avec les clients
    - Identifier les commandes nécessitant une attention
    `,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Messages récupérés avec succès',
  })
  async getAllMessages(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const result = await this.sellerOrderService.getAllMessages(user.id, page, limit);
    return {
      success: true,
      message: 'Messages récupérés avec succès',
      data: result.messages,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/invoice')
  @ApiOperation({
    summary: 'Générer et télécharger la facture PDF',
    description: `
    **Génère une facture PDF pour une commande spécifique**
    
    Cet endpoint permet au vendeur de générer et télécharger une facture PDF
    pour une commande contenant ses produits.
    
    **La facture contient :**
    - Informations du vendeur (avec entreprise si applicable)
    - Informations du client
    - Détails de la commande (statut, numéro de suivi, notes)
    - Tableau détaillé des produits (nom, SKU, quantité, prix, remise, total)
    - Calculs des totaux (sous-total, taxe, livraison, remise, total)
    
    **Format de réponse :**
    - Type : application/pdf
    - Nom du fichier : Facture_[NUMERO_COMMANDE].pdf
    
    **Note :** Seules les commandes contenant des produits du vendeur connecté
    peuvent être consultées.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Facture PDF générée avec succès',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès refusé - La commande ne contient pas vos produits' })
  @Header('Content-Type', 'application/pdf')
  async generateInvoice(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.sellerOrderService.generateInvoice(user.id, orderId);

    // Récupérer le numéro de commande pour le nom du fichier
    const order = await this.sellerOrderService.findOne(user.id, orderId);
    const filename = `Facture_${order.orderNumber}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  }

  @Post(':id/invoice/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoyer la facture par email au client',
    description: `
    **Envoie la facture PDF par email au client**
    
    Cet endpoint permet au vendeur d'envoyer automatiquement la facture PDF
    par email au client qui a passé la commande.
    
    **Processus :**
    1. Génération de la facture PDF
    2. Préparation de l'email avec le contenu HTML formaté
    3. Envoi de l'email avec la facture en pièce jointe
    
    **Contenu de l'email :**
    - Sujet : "Facture - Commande [NUMERO] - Sendiaba"
    - Corps HTML avec détails de la commande
    - Pièce jointe : Facture_[NUMERO_COMMANDE].pdf
    
    **Prérequis :**
    - La commande doit contenir des produits du vendeur
    - Le client doit avoir une adresse email valide
    
    **Note :** L'email est envoyé à l'adresse email du compte client.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Facture envoyée par email avec succès',
    schema: {
      example: {
        success: true,
        message: 'Facture envoyée par email avec succès',
        data: {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          orderNumber: 'CMD-1733123456789-1234',
          customerEmail: 'client@example.com',
          invoiceFilename: 'Facture_CMD-1733123456789-1234.pdf',
        },
        timestamp: '2025-12-04T13:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: "L'email du client n'est pas disponible" })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès refusé - La commande ne contient pas vos produits' })
  async sendInvoiceByEmail(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    await this.sellerOrderService.sendInvoiceByEmail(user.id, orderId);

    const order = await this.sellerOrderService.findOne(user.id, orderId);

    return {
      success: true,
      message: 'Facture envoyée par email avec succès',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customer?.email || null,
        invoiceFilename: `Facture_${order.orderNumber}.pdf`,
      },
      timestamp: new Date().toISOString(),
    };
  }
}


