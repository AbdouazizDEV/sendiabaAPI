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

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
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
}

