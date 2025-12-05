import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';
import { ProfileService } from '../../profile/profile.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly notificationService: NotificationService,
  ) {}

  // Convertir Decimal en Number
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

  // Calculer le prix avec promotion
  private calculatePriceWithPromotion(product: any): {
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    discountPercentage: number | null;
    hasPromotion: boolean;
  } {
    const originalPrice = this.toNumber(product.price) || 0;
    let finalPrice = originalPrice;
    let discountAmount = 0;
    let discountPercentage: number | null = null;
    let hasPromotion = false;

    if (product.promotions && product.promotions.length > 0) {
      const activePromotion = product.promotions[0];
      hasPromotion = true;

      if (activePromotion.discountType === 'PERCENTAGE') {
        discountPercentage = this.toNumber(activePromotion.discountValue);
        discountAmount = (originalPrice * (discountPercentage || 0)) / 100;
        finalPrice = originalPrice - discountAmount;
      } else if (activePromotion.discountType === 'FIXED_AMOUNT') {
        discountAmount = this.toNumber(activePromotion.discountValue) || 0;
        finalPrice = Math.max(0, originalPrice - discountAmount);
      }
    }

    return {
      originalPrice,
      finalPrice,
      discountAmount,
      discountPercentage,
      hasPromotion,
    };
  }

  // Générer un numéro de commande unique
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CMD-${timestamp}-${random}`;
  }

  /**
   * Crée une nouvelle commande à partir du panier
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // Vérifier que l'adresse existe et appartient à l'utilisateur (via TypeORM)
    const addresses = await this.profileService.getAddresses(userId);
    const address = addresses.find(
      (addr) => addr.id === createOrderDto.shippingAddressId,
    );

    if (!address) {
      throw new NotFoundException('Adresse de livraison non trouvée');
    }

    // Récupérer le panier de l'utilisateur
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                stock: true,
                promotions: {
                  where: {
                    isActive: true,
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() },
                  },
                  orderBy: { discountValue: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Le panier est vide');
    }

    // Filtrer les articles demandés si spécifiés, sinon utiliser tous les articles du panier
    let itemsToOrder = cart.items;
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      const requestedProductIds = createOrderDto.items.map((item) => item.productId);
      itemsToOrder = cart.items.filter((item) =>
        requestedProductIds.includes(item.productId),
      );

      // Vérifier que tous les produits demandés sont dans le panier
      if (itemsToOrder.length !== createOrderDto.items.length) {
        throw new BadRequestException(
          'Certains produits demandés ne sont pas dans le panier',
        );
      }

      // Mettre à jour les quantités selon la demande
      itemsToOrder = itemsToOrder.map((item) => {
        const requestedItem = createOrderDto.items.find(
          (req) => req.productId === item.productId,
        );
        return {
          ...item,
          quantity: requestedItem?.quantity || item.quantity,
        };
      });
    }

    // Vérifier le stock et calculer les totaux
    const orderItems: Array<{
      productId: string;
      productName: string;
      productSku: string | null;
      quantity: number;
      unitPrice: number;
      discount: number;
      total: number;
    }> = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const cartItem of itemsToOrder) {
      const product = cartItem.product;

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Le produit "${product.name}" n'est pas disponible pour l'achat`,
        );
      }

      // Vérifier le stock
      if (product.trackInventory && product.stock) {
        const availableQuantity =
          product.stock.quantity - product.stock.reservedQuantity;
        if (availableQuantity < cartItem.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour "${product.name}". Quantité disponible: ${availableQuantity}`,
          );
        }
      }

      // Calculer le prix avec promotion
      const pricing = this.calculatePriceWithPromotion(product);
      const itemTotal = pricing.finalPrice * cartItem.quantity;
      const itemDiscount = pricing.discountAmount * cartItem.quantity;

      subtotal += itemTotal;
      totalDiscount += itemDiscount;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: cartItem.quantity,
        unitPrice: pricing.finalPrice,
        discount: pricing.discountAmount,
        total: itemTotal,
      });
    }

    // Calculer les totaux (taxe et frais de livraison à 0 pour l'instant)
    const tax = 0;
    const shipping = 0;
    const total = subtotal + tax + shipping;

    // Créer la commande avec les articles
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber: this.generateOrderNumber(),
        status: 'PENDING',
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        shipping: new Prisma.Decimal(shipping),
        discount: new Prisma.Decimal(totalDiscount),
        total: new Prisma.Decimal(total),
        shippingAddress: address.address,
        shippingCity: address.city,
        shippingRegion: address.region,
        shippingCountry: address.country,
        shippingPostalCode: address.postalCode,
        recipientName: address.recipientName,
        recipientPhone: address.phone,
        notes: createOrderDto.notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
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
          },
        },
      },
    });

    // Réserver le stock et supprimer les articles du panier
    for (const cartItem of itemsToOrder) {
      if (cartItem.product.trackInventory && cartItem.product.stock) {
        await this.prisma.productStock.update({
          where: { productId: cartItem.product.id },
          data: {
            reservedQuantity: {
              increment: cartItem.quantity,
            },
          },
        });
      }

      // Supprimer l'article du panier
      await this.prisma.cartItem.delete({
        where: { id: cartItem.id },
      });
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: this.toNumber(order.subtotal),
      tax: this.toNumber(order.tax),
      shipping: this.toNumber(order.shipping),
      discount: this.toNumber(order.discount),
      total: this.toNumber(order.total),
      shippingAddress: {
        address: order.shippingAddress,
        city: order.shippingCity,
        region: order.shippingRegion,
        country: order.shippingCountry,
        postalCode: order.shippingPostalCode,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
      },
      items: order.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0]?.url || null,
        },
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unitPrice),
        discount: this.toNumber(item.discount),
        total: this.toNumber(item.total),
      })),
      notes: order.notes,
      createdAt: order.createdAt,
    };
  }

  /**
   * Récupère le récapitulatif d'une commande
   */
  async getOrderSummary(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        items: {
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
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: this.toNumber(order.subtotal),
      tax: this.toNumber(order.tax),
      shipping: this.toNumber(order.shipping),
      discount: this.toNumber(order.discount),
      total: this.toNumber(order.total),
      shippingAddress: {
        address: order.shippingAddress,
        city: order.shippingCity,
        region: order.shippingRegion,
        country: order.shippingCountry,
        postalCode: order.shippingPostalCode,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
      },
      items: order.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0]?.url || null,
        },
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unitPrice),
        discount: this.toNumber(item.discount),
        total: this.toNumber(item.total),
      })),
      payment: order.payments[0]
        ? {
            id: order.payments[0].id,
            method: order.payments[0].method,
            status: order.payments[0].status,
            amount: this.toNumber(order.payments[0].amount),
          }
        : null,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Récupère la confirmation d'une commande
   */
  async getOrderConfirmation(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        items: {
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
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: this.toNumber(order.total),
      items: order.items.map((item) => ({
        product: {
          name: item.product.name,
          image: item.product.images[0]?.url || null,
        },
        quantity: item.quantity,
        total: this.toNumber(item.total),
      })),
      payment: order.payments[0]
        ? {
            method: order.payments[0].method,
            status: order.payments[0].status,
          }
        : null,
      createdAt: order.createdAt,
    };
  }

  /**
   * Récupère l'historique des commandes d'un utilisateur
   */
  async getOrderHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
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
            take: 3, // Limiter à 3 items pour la liste
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: this.toNumber(order.total),
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.images[0]?.url || null,
          },
          quantity: item.quantity,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
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
   * Récupère les détails d'une commande spécifique
   */
  async getOrderDetails(orderId: string, userId: string) {
    return this.getOrderSummary(orderId, userId);
  }

  /**
   * Récupère le statut actuel d'une commande
   */
  async getOrderStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        confirmedAt: true,
        processedAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      timestamps: {
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        confirmedAt: order.confirmedAt,
        processedAt: order.processedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
      },
    };
  }

  /**
   * Récupère les informations de suivi de livraison
   */
  async getOrderTracking(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        trackingUrl: true,
        carrier: true,
        shippingAddress: true,
        shippingCity: true,
        shippingRegion: true,
        shippingCountry: true,
        recipientName: true,
        recipientPhone: true,
        shippedAt: true,
        deliveredAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      tracking: {
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        carrier: order.carrier,
      },
      shipping: {
        address: order.shippingAddress,
        city: order.shippingCity,
        region: order.shippingRegion,
        country: order.shippingCountry,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
      },
      timestamps: {
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
    };
  }

  /**
   * Annule une commande (si autorisé)
   */
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        payments: {
          where: {
            status: { in: ['COMPLETED', 'PROCESSING'] },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Vérifier si la commande peut être annulée
    if (
      order.status === 'CANCELLED' ||
      order.status === 'DELIVERED' ||
      order.status === 'REFUNDED'
    ) {
      throw new BadRequestException(
        `Cette commande ne peut pas être annulée. Statut actuel: ${order.status}`,
      );
    }

    // Si un paiement est complété, la commande ne peut être annulée que par le vendeur
    if (order.payments.length > 0) {
      const hasCompletedPayment = order.payments.some(
        (p) => p.status === 'COMPLETED',
      );
      if (hasCompletedPayment) {
        throw new BadRequestException(
          'Cette commande ne peut pas être annulée directement car un paiement a été effectué. Veuillez contacter le vendeur pour un remboursement.',
        );
      }
    }

    // Annuler la commande
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledReason: reason || 'Annulée par le client',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Libérer le stock réservé
    for (const item of updatedOrder.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { stock: true },
      });

      if (product?.trackInventory && product.stock) {
        await this.prisma.productStock.update({
          where: { productId: product.id },
          data: {
            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Créer automatiquement une notification pour le client
    try {
      await this.notificationService.createNotification(
        userId,
        'ORDER_UPDATE',
        'Commande annulée',
        `Votre commande ${updatedOrder.orderNumber} a été annulée${reason ? ` : ${reason}` : ''}.`,
        {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: 'CANCELLED',
          reason: reason || null,
        },
      );
      this.logger.log(
        `Notification créée pour le client ${userId} - Commande ${updatedOrder.orderNumber} annulée`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de la notification pour l'annulation de la commande ${updatedOrder.orderNumber}:`,
        error,
      );
    }

    return {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      cancelledAt: updatedOrder.cancelledAt,
      cancelledReason: updatedOrder.cancelledReason,
      message: 'Commande annulée avec succès',
    };
  }

  /**
   * Envoie un message au vendeur concernant une commande
   */
  async sendMessage(orderId: string, userId: string, message: string) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sellerId: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.items.length === 0) {
      throw new BadRequestException('Cette commande ne contient aucun produit');
    }

    // Récupérer le sellerId du premier produit (pour les commandes avec plusieurs sellers, on prend le premier)
    const sellerId = order.items[0].product.sellerId;

    // Créer le message
    const orderMessage = await this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId: userId,
        senderRole: 'CUSTOMER',
        message,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Créer automatiquement une notification pour le seller
    try {
      await this.notificationService.createNotification(
        sellerId,
        'ORDER_MESSAGE',
        'Nouveau message du client',
        `Vous avez reçu un nouveau message de ${orderMessage.sender.firstName} ${orderMessage.sender.lastName} concernant la commande ${order.orderNumber} : ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          messageId: orderMessage.id,
          senderId: userId,
          customerName: `${orderMessage.sender.firstName} ${orderMessage.sender.lastName}`,
        },
      );
      this.logger.log(
        `Notification créée pour le seller ${sellerId} - Nouveau message du client pour la commande ${order.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de la notification pour le message du client de la commande ${order.orderNumber}:`,
        error,
      );
    }

    return {
      id: orderMessage.id,
      orderId: orderMessage.orderId,
      orderNumber: order.orderNumber,
      senderId: orderMessage.senderId,
      senderRole: orderMessage.senderRole,
      message: orderMessage.message,
      isRead: orderMessage.isRead,
      createdAt: orderMessage.createdAt,
    };
  }

  /**
   * Récupère l'historique des messages d'une commande pour le client
   */
  async getOrderMessages(orderId: string, userId: string) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
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
      unreadCount: messages.filter((m) => !m.isRead && m.senderRole === 'SELLER').length,
    };
  }
}

