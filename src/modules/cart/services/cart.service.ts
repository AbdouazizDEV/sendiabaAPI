import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      } else {
        // FIXED_AMOUNT
        discountAmount = this.toNumber(activePromotion.discountValue) || 0;
        finalPrice = originalPrice - discountAmount;
        if (finalPrice < 0) finalPrice = 0;
        discountPercentage =
          originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
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

  // Obtenir ou créer le panier de l'utilisateur
  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
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
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return cart;
  }

  // Récupérer le contenu du panier
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = cart.items.map((item) => {
      const pricing = this.calculatePriceWithPromotion(item.product);

      return {
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: pricing.originalPrice,
          finalPrice: pricing.finalPrice,
          discountAmount: pricing.discountAmount,
          discountPercentage: pricing.discountPercentage,
          hasPromotion: pricing.hasPromotion,
          image: item.product.images[0]?.url || null,
          stock: item.product.stock
            ? {
                quantity: item.product.stock.quantity,
                inStock: item.product.stock.quantity > 0,
              }
            : null,
        },
        quantity: item.quantity,
        subtotal: pricing.finalPrice * item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items,
      itemCount,
      total,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  // Ajouter un produit au panier
  async addItem(userId: string, addItemDto: AddCartItemDto) {
    // Vérifier que le produit existe et est actif
    const product = await this.prisma.product.findUnique({
      where: { id: addItemDto.productId },
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
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Ce produit n\'est pas disponible pour l\'achat',
      );
    }

    // Vérifier le stock si le produit suit l'inventaire
    if (product.trackInventory && product.stock) {
      const availableQuantity =
        product.stock.quantity - product.stock.reservedQuantity;
      if (availableQuantity < addItemDto.quantity) {
        throw new BadRequestException(
          `Stock insuffisant. Quantité disponible: ${availableQuantity}`,
        );
      }
    }

    // Obtenir ou créer le panier
    const cart = await this.getOrCreateCart(userId);

    // Vérifier si le produit est déjà dans le panier
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addItemDto.productId,
        },
      },
    });

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + addItemDto.quantity;

      // Vérifier le stock à nouveau
      if (product.trackInventory && product.stock) {
        const availableQuantity =
          product.stock.quantity - product.stock.reservedQuantity;
        if (availableQuantity < newQuantity) {
          throw new BadRequestException(
            `Stock insuffisant. Quantité disponible: ${availableQuantity}`,
          );
        }
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
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
      });

      const pricing = this.calculatePriceWithPromotion(updatedItem.product);

      return {
        id: updatedItem.id,
        product: {
          id: updatedItem.product.id,
          name: updatedItem.product.name,
          slug: updatedItem.product.slug,
          price: pricing.originalPrice,
          finalPrice: pricing.finalPrice,
          discountAmount: pricing.discountAmount,
          discountPercentage: pricing.discountPercentage,
          hasPromotion: pricing.hasPromotion,
          image: updatedItem.product.images[0]?.url || null,
        },
        quantity: updatedItem.quantity,
        subtotal: pricing.finalPrice * updatedItem.quantity,
      };
    }

    // Créer un nouvel article
    const newItem = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: addItemDto.productId,
        quantity: addItemDto.quantity,
      },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
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
    });

    const pricing = this.calculatePriceWithPromotion(newItem.product);

    return {
      id: newItem.id,
      product: {
        id: newItem.product.id,
        name: newItem.product.name,
        slug: newItem.product.slug,
        price: pricing.originalPrice,
        finalPrice: pricing.finalPrice,
        discountAmount: pricing.discountAmount,
        discountPercentage: pricing.discountPercentage,
        hasPromotion: pricing.hasPromotion,
        image: newItem.product.images[0]?.url || null,
      },
      quantity: newItem.quantity,
      subtotal: pricing.finalPrice * newItem.quantity,
    };
  }

  // Modifier la quantité d'un article
  async updateItem(userId: string, itemId: string, updateDto: UpdateCartItemDto) {
    // Vérifier que l'article appartient au panier de l'utilisateur
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: {
          include: {
            stock: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Article non trouvé dans votre panier');
    }

    // Vérifier le stock si le produit suit l'inventaire
    if (item.product.trackInventory && item.product.stock) {
      const availableQuantity =
        item.product.stock.quantity - item.product.stock.reservedQuantity;
      if (availableQuantity < updateDto.quantity) {
        throw new BadRequestException(
          `Stock insuffisant. Quantité disponible: ${availableQuantity}`,
        );
      }
    }

    const updatedItem = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateDto.quantity },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
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
    });

    const pricing = this.calculatePriceWithPromotion(updatedItem.product);

    return {
      id: updatedItem.id,
      product: {
        id: updatedItem.product.id,
        name: updatedItem.product.name,
        slug: updatedItem.product.slug,
        price: pricing.originalPrice,
        finalPrice: pricing.finalPrice,
        discountAmount: pricing.discountAmount,
        discountPercentage: pricing.discountPercentage,
        hasPromotion: pricing.hasPromotion,
        image: updatedItem.product.images[0]?.url || null,
      },
      quantity: updatedItem.quantity,
      subtotal: pricing.finalPrice * updatedItem.quantity,
    };
  }

  // Supprimer un article du panier
  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Article non trouvé dans votre panier');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: 'Article supprimé du panier avec succès' };
  }

  // Vider le panier
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Panier vidé avec succès' };
  }

  // Calculer le total du panier
  async getCartTotal(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
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
    });

    let subtotal = 0;
    let totalDiscount = 0;
    let itemCount = 0;

    for (const item of items) {
      const pricing = this.calculatePriceWithPromotion(item.product);
      const itemSubtotal = pricing.originalPrice * item.quantity;
      const itemFinalTotal = pricing.finalPrice * item.quantity;
      const itemDiscount = itemSubtotal - itemFinalTotal;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      itemCount += item.quantity;
    }

    const total = subtotal - totalDiscount;

    return {
      subtotal,
      totalDiscount,
      total,
      itemCount,
      currency: 'XOF',
    };
  }
}

