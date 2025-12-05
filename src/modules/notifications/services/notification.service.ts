import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère toutes les notifications d'un utilisateur
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data ? JSON.parse(notif.data) : null,
        isRead: notif.isRead,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    if (notification.isRead) {
      return {
        id: notification.id,
        isRead: true,
        readAt: notification.readAt,
        message: 'Notification déjà marquée comme lue',
      };
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      id: updated.id,
      isRead: updated.isRead,
      readAt: updated.readAt,
      message: 'Notification marquée comme lue',
    };
  }

  /**
   * Crée une notification (utilisé par d'autres services)
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    this.logger.log(
      `Notification créée pour l'utilisateur ${userId}: ${title}`,
    );

    return notification;
  }

  /**
   * Récupère les détails complets d'une notification
   * Inclut les détails de la commande, du vendeur et des produits si applicable
   */
  async getNotificationDetails(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    const notificationData = notification.data
      ? JSON.parse(notification.data)
      : null;

    const result: any = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notificationData,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };

    // Si la notification contient un orderId, récupérer les détails de la commande
    if (notificationData?.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: notificationData.orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                      role: true,
                      profilePicture: true,
                      company: {
                        select: {
                          id: true,
                          name: true,
                          legalName: true,
                          email: true,
                          phone: true,
                          address: true,
                          city: true,
                          region: true,
                          country: true,
                          website: true,
                          logo: true,
                          description: true,
                        },
                      },
                    },
                  },
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
              currency: true,
              paidAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (order) {
        // Convertir Decimal en Number
        const toNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'number') return value;
          if (typeof value === 'string') return parseFloat(value);
          try {
            return parseFloat(String(value));
          } catch {
            return null;
          }
        };

        // Grouper les items par seller
        const sellersMap = new Map();
        const allSellers: any[] = [];

        order.items.forEach((item) => {
          const sellerId = item.product.sellerId;
          const seller = item.product.seller;

          if (!sellersMap.has(sellerId)) {
            const sellerInfo = {
              id: seller.id,
              firstName: seller.firstName,
              lastName: seller.lastName,
              email: seller.email,
              phone: seller.phone,
              role: seller.role,
              profilePicture: seller.profilePicture,
              company: seller.company,
              products: [],
            };
            sellersMap.set(sellerId, sellerInfo);
            allSellers.push(sellerInfo);
          }

          const sellerInfo = sellersMap.get(sellerId);
          sellerInfo.products.push({
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            description: item.product.description,
            price: toNumber(item.product.price),
            image: item.product.images[0]?.url || null,
            category: item.product.category,
            quantity: item.quantity,
            unitPrice: toNumber(item.unitPrice),
            discount: toNumber(item.discount),
            total: toNumber(item.total),
          });
        });

        result.order = {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: toNumber(order.total),
          subtotal: toNumber(order.subtotal),
          shippingCost: toNumber(order.shipping),
          tax: toNumber(order.tax),
          discount: toNumber(order.discount),
          shippingAddress: {
            recipientName: order.recipientName,
            recipientPhone: order.recipientPhone,
            address: order.shippingAddress,
            city: order.shippingCity,
            region: order.shippingRegion,
            country: order.shippingCountry,
            postalCode: order.shippingPostalCode,
          },
          tracking: {
            trackingNumber: order.trackingNumber,
            trackingUrl: order.trackingUrl,
            carrier: order.carrier,
          },
          timestamps: {
            createdAt: order.createdAt,
            confirmedAt: order.confirmedAt,
            processedAt: order.processedAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            refundedAt: order.refundedAt,
          },
          payment: order.payments && order.payments.length > 0
            ? {
                id: order.payments[0].id,
                status: order.payments[0].status,
                method: order.payments[0].method,
                amount: toNumber(order.payments[0].amount),
                paidAt: order.payments[0].paidAt,
              }
            : null,
          sellers: allSellers,
          items: order.items.map((item) => ({
            id: item.id,
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              image: item.product.images[0]?.url || null,
            },
            quantity: item.quantity,
            productName: item.productName,
            productSku: item.productSku,
            unitPrice: toNumber(item.unitPrice),
            discount: toNumber(item.discount),
            total: toNumber(item.total),
          })),
        };
      }
    }

    return result;
  }
}

