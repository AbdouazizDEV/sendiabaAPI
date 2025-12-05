import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { FilterOrdersDto } from '../../dto/orders/filter-orders.dto';
import { UpdateOrderStatusDto } from '../../dto/orders/update-order-status.dto';
import { TrackingDto } from '../../dto/orders/tracking.dto';
import { CancelOrderDto } from '../../dto/orders/cancel-order.dto';
import { RefundOrderDto } from '../../dto/orders/refund-order.dto';
import { SendMessageDto } from '../../dto/orders/send-message.dto';
import { InvoiceService } from '../../../invoice/invoice.service';
import { MailService } from '../../../mail/mail.service';
import { NotificationService } from '../../../notifications/services/notification.service';

@Injectable()
export class SellerOrderService {
  private readonly logger = new Logger(SellerOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Convertir Decimal en Number pour la sérialisation JSON
   */
  private toNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    try {
      return parseFloat(String(value));
    } catch {
      return null;
    }
  }

  /**
   * Vérifier qu'une commande contient des produits du seller
   */
  private async verifyOrderBelongsToSeller(orderId: string, sellerId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                sellerId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Vérifier qu'au moins un produit de la commande appartient au seller
    const hasSellerProduct = order.items.some((item) => item.product.sellerId === sellerId);

    if (!hasSellerProduct) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à accéder à cette commande');
    }
  }

  /**
   * Récupérer toutes les commandes du seller avec filtres et pagination
   */
  async findAll(sellerId: string, filterDto: FilterOrdersDto) {
    const { page = 1, limit = 20, status, startDate, endDate, orderNumber } = filterDto;
    const skip = (page - 1) * limit;

    // Construire les conditions de filtrage
    const where: Prisma.OrderWhereInput = {
      items: {
        some: {
          product: {
            sellerId,
          },
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (orderNumber) {
      where.orderNumber = {
        contains: orderNumber,
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            where: {
              product: {
                sellerId,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          payments: {
            select: {
              id: true,
              method: true,
              status: true,
              amount: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => this.formatOrder(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer une commande spécifique
   */
  async findOne(sellerId: string, orderId: string) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 5,
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return this.formatOrder(order, true);
  }

  /**
   * Récupérer les commandes par statut
   */
  async findByStatus(sellerId: string, status: OrderStatus, page: number = 1, limit: number = 20) {
    return this.findAll(sellerId, { page, limit, status });
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatus(sellerId: string, orderId: string, updateStatusDto: UpdateOrderStatusDto) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const { status, reason } = updateStatusDto;

    // Validation des transitions de statut
    const currentOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!currentOrder) {
      throw new NotFoundException('Commande non trouvée');
    }

    this.validateStatusTransition(currentOrder.status, status);

    // Préparer les données de mise à jour
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Gérer les timestamps selon le statut
    switch (status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case OrderStatus.PROCESSING:
        updateData.processedAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        updateData.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        if (reason) {
          updateData.cancelledReason = reason;
        }
        break;
      case OrderStatus.REFUNDED:
        updateData.refundedAt = new Date();
        if (reason) {
          updateData.refundReason = reason;
        }
        break;
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Créer automatiquement une notification pour le client
    await this.createOrderStatusNotification(order.user.id, order, status, reason);

    return this.formatOrder(order);
  }

  /**
   * Crée une notification pour le client lors d'un changement de statut
   */
  private async createOrderStatusNotification(
    userId: string,
    order: any,
    status: OrderStatus,
    reason?: string,
  ): Promise<void> {
    const statusMessages: Record<OrderStatus, { title: string; message: string }> = {
      [OrderStatus.CONFIRMED]: {
        title: 'Commande confirmée',
        message: `Votre commande ${order.orderNumber} a été confirmée et est en cours de préparation.`,
      },
      [OrderStatus.PROCESSING]: {
        title: 'Commande en préparation',
        message: `Votre commande ${order.orderNumber} est actuellement en cours de préparation.`,
      },
      [OrderStatus.SHIPPED]: {
        title: 'Commande expédiée',
        message: `Votre commande ${order.orderNumber} a été expédiée${order.trackingNumber ? ` avec le numéro de suivi ${order.trackingNumber}` : ''}.`,
      },
      [OrderStatus.DELIVERED]: {
        title: 'Commande livrée',
        message: `Votre commande ${order.orderNumber} a été livrée avec succès. Merci pour votre achat !`,
      },
      [OrderStatus.CANCELLED]: {
        title: 'Commande annulée',
        message: `Votre commande ${order.orderNumber} a été annulée${reason ? ` : ${reason}` : ''}.`,
      },
      [OrderStatus.REFUNDED]: {
        title: 'Remboursement effectué',
        message: `Le remboursement pour votre commande ${order.orderNumber} a été effectué${reason ? ` : ${reason}` : ''}.`,
      },
      [OrderStatus.PENDING]: {
        title: 'Mise à jour de commande',
        message: `Votre commande ${order.orderNumber} a été mise à jour.`,
      },
    };

    const notification = statusMessages[status];
    if (notification) {
      try {
        await this.notificationService.createNotification(
          userId,
          'ORDER_UPDATE',
          notification.title,
          notification.message,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status,
            reason: reason || null,
          },
        );
        this.logger.log(
          `Notification créée pour le client ${userId} - Commande ${order.orderNumber} - Statut: ${status}`,
        );
      } catch (error) {
        this.logger.error(
          `Erreur lors de la création de la notification pour la commande ${order.orderNumber}:`,
          error,
        );
      }
    }
  }

  /**
   * Valider les transitions de statut
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Transition de statut invalide : impossible de passer de ${currentStatus} à ${newStatus}`,
      );
    }
  }

  /**
   * Actions spécifiques pour chaque statut
   */
  async confirmOrder(sellerId: string, orderId: string) {
    return this.updateStatus(sellerId, orderId, { status: OrderStatus.CONFIRMED });
  }

  async processOrder(sellerId: string, orderId: string) {
    return this.updateStatus(sellerId, orderId, { status: OrderStatus.PROCESSING });
  }

  async shipOrder(sellerId: string, orderId: string, trackingDto?: TrackingDto) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const updateData: any = {
      status: OrderStatus.SHIPPED,
      shippedAt: new Date(),
    };

    if (trackingDto) {
      updateData.trackingNumber = trackingDto.trackingNumber;
      updateData.trackingUrl = trackingDto.trackingUrl;
      updateData.carrier = trackingDto.carrier;
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Créer automatiquement une notification pour le client
    await this.createOrderStatusNotification(
      order.user.id,
      order,
      OrderStatus.SHIPPED,
    );

    return this.formatOrder(order);
  }

  async deliverOrder(sellerId: string, orderId: string) {
    return this.updateStatus(sellerId, orderId, { status: OrderStatus.DELIVERED });
  }

  async cancelOrder(sellerId: string, orderId: string, cancelDto: CancelOrderDto) {
    return this.updateStatus(sellerId, orderId, {
      status: OrderStatus.CANCELLED,
      reason: cancelDto.reason,
    });
  }

  /**
   * Ajouter ou mettre à jour les informations de suivi
   */
  async updateTracking(sellerId: string, orderId: string, trackingDto: TrackingDto) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingDto.trackingNumber,
        trackingUrl: trackingDto.trackingUrl,
        carrier: trackingDto.carrier,
      },
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return this.formatOrder(order);
  }

  /**
   * Initier un remboursement
   */
  async refundOrder(sellerId: string, orderId: string, refundDto: RefundOrderDto) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Seules les commandes livrées peuvent être remboursées');
    }

    return this.updateStatus(sellerId, orderId, {
      status: OrderStatus.REFUNDED,
      reason: refundDto.reason,
    });
  }

  /**
   * Récupérer les informations du client pour une commande
   */
  async getCustomerInfo(sellerId: string, orderId: string) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
          },
        },
        recipientName: true,
        recipientPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingRegion: true,
        shippingCountry: true,
        shippingPostalCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return {
      user: order.user,
      shipping: {
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        address: order.shippingAddress,
        city: order.shippingCity,
        region: order.shippingRegion,
        country: order.shippingCountry,
        postalCode: order.shippingPostalCode,
      },
    };
  }

  /**
   * Envoyer un message au client
   */
  async sendMessage(sellerId: string, orderId: string, sendMessageDto: SendMessageDto) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    // Récupérer la commande avec les infos du client
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    const message = await this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId: sellerId,
        senderRole: 'SELLER',
        message: sendMessageDto.message,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    // Créer automatiquement une notification pour le client
    try {
      await this.notificationService.createNotification(
        order.userId,
        'ORDER_MESSAGE',
        'Nouveau message du vendeur',
        `Vous avez reçu un nouveau message concernant votre commande ${order.orderNumber} : ${sendMessageDto.message.substring(0, 100)}${sendMessageDto.message.length > 100 ? '...' : ''}`,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          messageId: message.id,
          senderId: sellerId,
        },
      );
      this.logger.log(
        `Notification créée pour le client ${order.userId} - Nouveau message pour la commande ${order.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de la notification pour le message de la commande ${order.orderNumber}:`,
        error,
      );
    }

    return {
      id: message.id,
      orderId: message.orderId,
      orderNumber: message.order.orderNumber,
      senderId: message.senderId,
      senderRole: message.senderRole,
      message: message.message,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  /**
   * Récupérer l'historique des messages d'une commande
   */
  async getOrderMessages(sellerId: string, orderId: string) {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    const messages = await this.prisma.orderMessage.findMany({
      where: { orderId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      messages: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        sender: {
          id: msg.sender.id,
          name: `${msg.sender.firstName} ${msg.sender.lastName}`,
          role: msg.sender.role,
          profilePicture: msg.sender.profilePicture,
        },
        message: msg.message,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      })),
      totalMessages: messages.length,
      unreadCount: messages.filter((m) => !m.isRead && m.senderRole === 'CUSTOMER').length,
    };
  }

  /**
   * Récupérer tous les messages du seller
   */
  async getAllMessages(sellerId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Récupérer les commandes du seller
    const sellerOrders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId,
            },
          },
        },
      },
      select: { id: true },
    });

    const orderIds = sellerOrders.map((o) => o.id);

    const [messages, total] = await Promise.all([
      this.prisma.orderMessage.findMany({
        where: {
          orderId: { in: orderIds },
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.orderMessage.count({
        where: {
          orderId: { in: orderIds },
        },
      }),
    ]);

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        orderId: msg.orderId,
        orderNumber: msg.order.orderNumber,
        orderStatus: msg.order.status,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        message: msg.message,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Formater une commande pour la réponse
   */
  private formatOrder(order: any, detailed: boolean = false) {
    const formatted = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: this.toNumber(order.subtotal),
      tax: this.toNumber(order.tax),
      shipping: this.toNumber(order.shipping),
      discount: this.toNumber(order.discount),
      total: this.toNumber(order.total),
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingRegion: order.shippingRegion,
      shippingCountry: order.shippingCountry,
      shippingPostalCode: order.shippingPostalCode,
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      carrier: order.carrier,
      confirmedAt: order.confirmedAt,
      processedAt: order.processedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancelledReason: order.cancelledReason,
      refundedAt: order.refundedAt,
      refundReason: order.refundReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unitPrice),
        discount: this.toNumber(item.discount),
        total: this.toNumber(item.total),
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              images: item.product.images || [],
            }
          : null,
      })),
      customer: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email,
            phone: order.user.phone,
            profilePicture: order.user.profilePicture,
          }
        : null,
      payments: (order.payments || []).map((payment: any) => ({
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amount: this.toNumber(payment.amount),
      })),
      unreadMessagesCount: order._count?.messages || 0,
    };

    if (detailed && order.messages) {
      (formatted as any).messages = order.messages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        message: msg.message,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      }));
    }

    return formatted;
  }

  /**
   * Génère une facture PDF pour une commande
   */
  async generateInvoice(sellerId: string, orderId: string): Promise<Buffer> {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Récupérer les informations du vendeur
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: {
          select: {
            id: true,
            name: true,
            legalName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            region: true,
            country: true,
            website: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    // Générer le PDF
    const pdfBuffer = await this.invoiceService.generateInvoicePDF(order, seller);

    return pdfBuffer;
  }

  /**
   * Envoie la facture par email au client
   */
  async sendInvoiceByEmail(sellerId: string, orderId: string): Promise<void> {
    await this.verifyOrderBelongsToSeller(orderId, sellerId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (!order.user.email) {
      throw new BadRequestException(
        "L'email du client n'est pas disponible pour cette commande",
      );
    }

    // Récupérer les informations du vendeur
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: {
          select: {
            id: true,
            name: true,
            legalName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            region: true,
            country: true,
            website: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    // Générer le PDF
    const pdfBuffer = await this.invoiceService.generateInvoicePDF(order, seller);

    // Préparer le contenu HTML de l'email
    const companyName = seller.company?.name || seller.company?.legalName;
    const sellerName = `${seller.firstName} ${seller.lastName}`;
    const customerName = `${order.user.firstName} ${order.user.lastName}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Votre facture - Sendiaba</h1>
          </div>
          <div class="content">
            <p>Bonjour ${customerName},</p>
            <p>Vous trouverez ci-joint la facture pour votre commande <strong>${order.orderNumber}</strong>.</p>
            
            <div class="info-box">
              <p><strong>Détails de la commande :</strong></p>
              <p>Numéro de commande : ${order.orderNumber}</p>
              <p>Date : ${new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}</p>
              <p>Montant total : ${this.formatCurrency(Number(order.total))} XOF</p>
              <p>Statut : ${this.getStatusLabel(order.status)}</p>
            </div>

            <p>Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
            <p>Cordialement,<br>${companyName || sellerName}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sendiaba. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email avec la pièce jointe
    await this.mailService.sendEmailWithAttachment(
      order.user.email,
      `Facture - Commande ${order.orderNumber} - Sendiaba`,
      emailHtml,
      {
        filename: `Facture_${order.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
      customerName,
    );

    this.logger.log(
      `Facture envoyée par email pour la commande ${order.orderNumber} à ${order.user.email}`,
    );
  }

  /**
   * Formate un montant en devise
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Retourne le libellé du statut en français
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En préparation',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    };
    return labels[status] || status;
  }
}

