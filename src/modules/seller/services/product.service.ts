import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { BulkUpdateStockDto } from '../dto/bulk-update-stock.dto';
import { InventoryAlertSettingsDto } from '../dto/inventory-alert-settings.dto';
import { UpdateImageOrderDto } from '../dto/update-image-order.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { ProductStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Générer un slug à partir du nom
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // CRUD Produits
  async findAll(sellerId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { sellerId },
        include: {
          category: true,
          images: { orderBy: { order: 'asc' } },
          stock: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { sellerId } }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(sellerId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId, // Vérifier que le produit appartient au vendeur
      },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        stock: true,
        inventoryAlerts: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    return product;
  }

  async create(sellerId: string, createProductDto: CreateProductDto) {
    try {
      // Vérifier que la catégorie existe
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Catégorie avec l'ID "${createProductDto.categoryId}" non trouvée`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Erreur lors de la vérification de la catégorie:', error);
      throw new BadRequestException(
        `Erreur lors de la vérification de la catégorie: ${error.message}`,
      );
    }

    // Générer un slug unique
    let slug = this.generateSlug(createProductDto.name);
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      slug = `${slug}-${uuidv4().substring(0, 8)}`;
    }

    try {
      // Créer le produit
      const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        categoryId: createProductDto.categoryId,
        description: createProductDto.description,
        shortDescription: createProductDto.shortDescription,
        sku: createProductDto.sku,
        slug,
        sellerId,
        price: createProductDto.price,
        compareAtPrice: createProductDto.compareAtPrice ?? null,
        costPrice: createProductDto.costPrice ?? null,
        weight: createProductDto.weight ?? null,
        dimensions: createProductDto.dimensions ?? null,
        tags: createProductDto.tags ?? [],
        isDigital: createProductDto.isDigital ?? false,
        requiresShipping: createProductDto.requiresShipping ?? true,
        trackInventory: createProductDto.trackInventory ?? true,
        allowBackorder: createProductDto.allowBackorder ?? false,
        status: createProductDto.status || ProductStatus.DRAFT,
      },
      include: {
        category: true,
        images: true,
        stock: true,
      },
    });

      // Créer le stock initial si trackInventory est true
      if (createProductDto.trackInventory !== false) {
        await this.prisma.productStock.create({
          data: {
            productId: product.id,
            quantity: 0,
            reservedQuantity: 0,
            lowStockThreshold: 10,
          },
        });
      }

      return product;
    } catch (error) {
      this.logger.error('Erreur lors de la création du produit:', error);
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Un produit avec ce SKU ou ce slug existe déjà',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Erreur de référence: la catégorie ou le vendeur n\'existe pas',
        );
      }
      throw new BadRequestException(
        `Erreur lors de la création du produit: ${error.message}`,
      );
    }
  }

  async update(
    sellerId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ) {
    // Vérifier que le produit existe et appartient au vendeur
    const existingProduct = await this.findOne(sellerId, productId);

    // Si le nom change, mettre à jour le slug
    let slug = existingProduct.slug;
    if (updateProductDto.name && updateProductDto.name !== existingProduct.name) {
      slug = this.generateSlug(updateProductDto.name);
      const slugExists = await this.prisma.product.findFirst({
        where: {
          slug,
          id: { not: productId },
        },
      });

      if (slugExists) {
        slug = `${slug}-${uuidv4().substring(0, 8)}`;
      }
    }

    // Vérifier la catégorie si elle change
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Catégorie non trouvée');
      }
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...updateProductDto,
        slug,
      },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        stock: true,
      },
    });

    return product;
  }

  async remove(sellerId: string, productId: string) {
    // Vérifier que le produit existe et appartient au vendeur
    await this.findOne(sellerId, productId);

    // Supprimer les images de Cloudinary
    const images = await this.prisma.productImage.findMany({
      where: { productId },
    });

    for (const image of images) {
      if (image.cloudinaryId) {
        try {
          await this.cloudinaryService.deleteImage(image.cloudinaryId);
        } catch (error) {
          this.logger.warn(
            `Erreur lors de la suppression de l'image ${image.id}: ${error.message}`,
          );
        }
      }
    }

    // Supprimer le produit (cascade supprimera les images, stock, etc.)
    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Produit supprimé avec succès' };
  }

  async updateStatus(
    sellerId: string,
    productId: string,
    updateStatusDto: UpdateProductStatusDto,
  ) {
    await this.findOne(sellerId, productId);

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { status: updateStatusDto.status },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        stock: true,
      },
    });

    return product;
  }

  // Gestion des images produits
  async uploadProductImages(
    sellerId: string,
    productId: string,
    files: Express.Multer.File[],
  ) {
    try {
      await this.findOne(sellerId, productId);

      if (!files || files.length === 0) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      const uploadedImages: any[] = [];

      for (const file of files) {
        if (!file.buffer || file.size === 0) {
          this.logger.warn(`Fichier ${file.originalname} est vide, ignoré`);
          continue;
        }

        try {
          const imageUrl = await this.cloudinaryService.uploadImage(file, {
            folder: `sendiaba/products/${productId}`,
          });

          // Extraire le public_id de l'URL
          const cloudinaryId =
            this.cloudinaryService.extractPublicIdFromUrl(imageUrl);

          // Obtenir le nombre d'images existantes pour déterminer l'ordre
          const imageCount = await this.prisma.productImage.count({
            where: { productId },
          });

          const image = await this.prisma.productImage.create({
            data: {
              productId,
              url: imageUrl,
              cloudinaryId,
              alt: file.originalname,
              order: imageCount,
              isPrimary: imageCount === 0, // Première image = principale
            },
          });

          uploadedImages.push(image);
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'upload de l'image ${file.originalname}:`,
            error,
          );
          throw new BadRequestException(
            `Erreur lors de l'upload de l'image ${file.originalname}: ${error.message}`,
          );
        }
      }

      if (uploadedImages.length === 0) {
        throw new BadRequestException(
          'Aucune image n\'a pu être uploadée. Vérifiez que les fichiers sont valides.',
        );
      }

      return uploadedImages;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Erreur lors de l\'upload des images:', error);
      throw new BadRequestException(
        `Erreur lors de l'upload des images: ${error.message}`,
      );
    }
  }

  async deleteProductImage(
    sellerId: string,
    productId: string,
    imageId: string,
  ) {
    await this.findOne(sellerId, productId);

    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image non trouvée');
    }

    // Supprimer de Cloudinary
    if (image.cloudinaryId) {
      try {
        await this.cloudinaryService.deleteImage(image.cloudinaryId);
      } catch (error) {
        this.logger.warn(
          `Erreur lors de la suppression Cloudinary: ${error.message}`,
        );
      }
    }

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    return { message: 'Image supprimée avec succès' };
  }

  async updateImageOrder(
    sellerId: string,
    productId: string,
    imageId: string,
    updateOrderDto: UpdateImageOrderDto,
  ) {
    await this.findOne(sellerId, productId);

    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image non trouvée');
    }

    const updatedImage = await this.prisma.productImage.update({
      where: { id: imageId },
      data: { order: updateOrderDto.order },
    });

    return updatedImage;
  }

  async setPrimaryImage(
    sellerId: string,
    productId: string,
    imageId: string,
  ) {
    await this.findOne(sellerId, productId);

    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image non trouvée');
    }

    // Désactiver toutes les images principales
    await this.prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    // Définir cette image comme principale
    const updatedImage = await this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    return updatedImage;
  }

  // Gestion des stocks
  async getStock(sellerId: string, productId: string) {
    await this.findOne(sellerId, productId);

    const stock = await this.prisma.productStock.findUnique({
      where: { productId },
    });

    if (!stock) {
      // Créer un stock par défaut si inexistant
      return this.prisma.productStock.create({
        data: {
          productId,
          quantity: 0,
          reservedQuantity: 0,
          lowStockThreshold: 10,
        },
      });
    }

    return stock;
  }

  async updateStock(
    sellerId: string,
    productId: string,
    updateStockDto: UpdateStockDto,
  ) {
    await this.findOne(sellerId, productId);

    const stock = await this.prisma.productStock.upsert({
      where: { productId },
      update: {
        quantity: updateStockDto.quantity,
        reservedQuantity: updateStockDto.reservedQuantity,
        lowStockThreshold:
          updateStockDto.lowStockThreshold ?? undefined,
        location: updateStockDto.location ?? undefined,
      },
      create: {
        productId,
        quantity: updateStockDto.quantity,
        reservedQuantity: updateStockDto.reservedQuantity || 0,
        lowStockThreshold: updateStockDto.lowStockThreshold || 10,
        location: updateStockDto.location,
      },
    });

    return stock;
  }

  async getInventory(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      include: {
        category: true,
        stock: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      const stock = product.stock;
      const costPrice = product.costPrice
        ? Number(product.costPrice)
        : Number(product.price) * 0.7; // Estimation si pas de prix de revient
      return sum + (stock ? stock.quantity * costPrice : 0);
    }, 0);

    const lowStockProducts = products.filter((product) => {
      const stock = product.stock;
      return (
        stock &&
        stock.quantity <= stock.lowStockThreshold &&
        stock.quantity > 0
      );
    });

    const outOfStockProducts = products.filter((product) => {
      const stock = product.stock;
      return stock && stock.quantity === 0;
    });

    return {
      summary: {
        totalProducts,
        totalValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      products,
      lowStockProducts,
      outOfStockProducts,
    };
  }

  async bulkUpdateStock(
    sellerId: string,
    bulkUpdateDto: BulkUpdateStockDto,
  ) {
    const results: any[] = [];

    for (const update of bulkUpdateDto.updates) {
      try {
        // Vérifier que le produit appartient au vendeur
        await this.findOne(sellerId, update.productId);

        const stock = await this.prisma.productStock.upsert({
          where: { productId: update.productId },
          update: { quantity: update.quantity },
          create: {
            productId: update.productId,
            quantity: update.quantity,
            reservedQuantity: 0,
            lowStockThreshold: 10,
          },
        });

        results.push({ productId: update.productId, success: true, stock });
      } catch (error) {
        results.push({
          productId: update.productId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async getLowStock(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      include: {
        category: true,
        stock: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    const lowStock = products.filter(
      (product) =>
        product.stock &&
        product.stock.quantity > 0 &&
        product.stock.quantity <= product.stock.lowStockThreshold,
    );

    const outOfStock = products.filter(
      (product) => product.stock && product.stock.quantity === 0,
    );

    return {
      lowStock,
      outOfStock,
    };
  }

  async setInventoryAlert(
    sellerId: string,
    productId: string,
    alertSettingsDto: InventoryAlertSettingsDto,
  ) {
    await this.findOne(sellerId, productId);

    // Vérifier si une alerte existe déjà
    const existingAlert = await this.prisma.inventoryAlert.findFirst({
      where: { productId },
    });

    const alert = existingAlert
      ? await this.prisma.inventoryAlert.update({
          where: { id: existingAlert.id },
          data: {
            threshold: alertSettingsDto.threshold,
            isActive: alertSettingsDto.isActive ?? true,
            notifyEmail: alertSettingsDto.notifyEmail ?? true,
            notifySms: alertSettingsDto.notifySms ?? false,
          },
        })
      : await this.prisma.inventoryAlert.create({
          data: {
            productId,
            threshold: alertSettingsDto.threshold,
            isActive: alertSettingsDto.isActive ?? true,
            notifyEmail: alertSettingsDto.notifyEmail ?? true,
            notifySms: alertSettingsDto.notifySms ?? false,
          },
        });

    return alert;
  }

  // Catégories
  async updateProductCategory(
    sellerId: string,
    productId: string,
    updateCategoryDto: UpdateProductCategoryDto,
  ) {
    // Vérifier que le produit appartient au vendeur
    await this.findOne(sellerId, productId);

    // Vérifier que la catégorie existe
    const category = await this.prisma.category.findUnique({
      where: { id: updateCategoryDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { categoryId: updateCategoryDto.categoryId },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        stock: true,
      },
    });

    return product;
  }

  async getProductsByCategory(sellerId: string) {
    try {
      this.logger.log(`Récupération des produits pour le vendeur: ${sellerId}`);

      // Récupérer les produits avec leurs relations
      const products = await this.prisma.product.findMany({
        where: { sellerId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 1,
            select: {
              id: true,
              url: true,
              alt: true,
              order: true,
              isPrimary: true,
            },
          },
          stock: {
            select: {
              id: true,
              quantity: true,
              reservedQuantity: true,
              lowStockThreshold: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`Nombre de produits trouvés: ${products.length}`);

      // Si aucun produit, retourner un tableau vide
      if (!products || products.length === 0) {
        return [];
      }

      // Grouper par catégorie
      const groupedMap = new Map<
        string,
        {
          category: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
          };
          products: any[];
          count: number;
        }
      >();

      for (const product of products) {
        // Vérifier que la catégorie existe
        if (!product.category || !product.category.id) {
          this.logger.warn(
            `Produit ${product.id} n'a pas de catégorie, ignoré`,
          );
          continue;
        }

        const categoryId = product.category.id;

        // Initialiser le groupe si nécessaire
        if (!groupedMap.has(categoryId)) {
          groupedMap.set(categoryId, {
            category: {
              id: product.category.id,
              name: product.category.name,
              slug: product.category.slug,
              description: product.category.description,
            },
            products: [],
            count: 0,
          });
        }

        const group = groupedMap.get(categoryId)!;

        // Préparer le produit pour la sérialisation
        const productData: any = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          sku: product.sku,
          status: product.status,
          price:
            product.price !== null && product.price !== undefined
              ? parseFloat(String(product.price))
              : null,
          compareAtPrice:
            product.compareAtPrice !== null &&
            product.compareAtPrice !== undefined
              ? parseFloat(String(product.compareAtPrice))
              : null,
          costPrice:
            product.costPrice !== null && product.costPrice !== undefined
              ? parseFloat(String(product.costPrice))
              : null,
          weight:
            product.weight !== null && product.weight !== undefined
              ? parseFloat(String(product.weight))
              : null,
          dimensions: product.dimensions,
          tags: product.tags || [],
          isDigital: product.isDigital,
          requiresShipping: product.requiresShipping,
          trackInventory: product.trackInventory,
          allowBackorder: product.allowBackorder,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          images: product.images || [],
          stock: product.stock || null,
        };

        group.products.push(productData);
        group.count += 1;
      }

      const result = Array.from(groupedMap.values());
      this.logger.log(`Groupement terminé: ${result.length} catégorie(s)`);
      return result;
    } catch (error) {
      this.logger.error(
        'Erreur lors du groupement par catégorie:',
        error instanceof Error ? error.stack : String(error),
      );
      this.logger.error('Détails complets de l\'erreur:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new BadRequestException(
        `Erreur lors du groupement des produits par catégorie: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

