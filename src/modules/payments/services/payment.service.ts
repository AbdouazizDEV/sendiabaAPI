import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../seller/services/prisma.service';
import { PayDunyaService } from './paydunya.service';
import { MobileMoneyPaymentDto } from '../dto/mobile-money-payment.dto';
import { CashOnDeliveryDto } from '../dto/cash-on-delivery.dto';
import { DirectContactDto } from '../dto/direct-contact.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payDunyaService: PayDunyaService,
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

  /**
   * Traite un paiement Mobile Money via PayDunya
   */
  async processMobileMoneyPayment(
    userId: string,
    mobileMoneyDto: MobileMoneyPaymentDto,
  ) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await this.prisma.order.findFirst({
      where: {
        id: mobileMoneyDto.orderId,
        userId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException('Cette commande ne peut plus être payée');
    }

    // Vérifier s'il existe déjà un paiement en cours ou complété
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Un paiement est déjà en cours ou complété pour cette commande',
      );
    }

    // Créer la facture PayDunya
    const invoiceItems = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unit_price: this.toNumber(item.unitPrice) || 0,
      total_price: this.toNumber(item.total) || 0,
      description: item.productSku || undefined,
    }));

    let payDunyaInvoice;
    try {
      payDunyaInvoice = await this.payDunyaService.createInvoice({
        totalAmount: this.toNumber(order.total) || 0,
        description: `Commande ${order.orderNumber}`,
        items: invoiceItems,
        customerInfo: {
          phone: mobileMoneyDto.phoneNumber,
        },
      });
    } catch (error: any) {
      this.logger.error('Erreur lors de la création de la facture PayDunya:', error);
      throw error; // Re-lancer l'erreur pour qu'elle soit gérée par le contrôleur
    }

    // Vérifier que la réponse PayDunya a la structure attendue
    // PayDunya retourne token et response_text (URL) directement à la racine
    if (!payDunyaInvoice || !payDunyaInvoice.token || !payDunyaInvoice.response_text) {
      this.logger.error('Réponse PayDunya invalide:', JSON.stringify(payDunyaInvoice, null, 2));
      throw new BadRequestException(
        'Réponse invalide de PayDunya. La facture n\'a pas pu être créée. ' +
        'Vérifiez vos clés API PayDunya dans le fichier .env.',
      );
    }

    // Extraire l'URL de paiement depuis response_text
    const paymentUrl = payDunyaInvoice.response_text;
    const token = payDunyaInvoice.token;

    // Créer l'enregistrement de paiement
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'MOBILE_MONEY',
        status: 'PENDING',
        amount: order.total,
        currency: 'XOF',
        paydunyaToken: token,
        paydunyaInvoiceId: paymentUrl.split('/').pop() || null,
        mobileMoneyNumber: mobileMoneyDto.phoneNumber,
        mobileMoneyProvider: mobileMoneyDto.provider,
      },
    });

    return {
      id: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      method: payment.method,
      status: payment.status,
      amount: this.toNumber(payment.amount),
      paymentUrl: paymentUrl,
      token: token,
    };
  }

  /**
   * Traite un paiement à la livraison
   */
  async processCashOnDelivery(
    userId: string,
    cashOnDeliveryDto: CashOnDeliveryDto,
  ) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await this.prisma.order.findFirst({
      where: {
        id: cashOnDeliveryDto.orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException('Cette commande ne peut plus être payée');
    }

    // Vérifier s'il existe déjà un paiement en cours ou complété
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Un paiement est déjà en cours ou complété pour cette commande',
      );
    }

    // Créer l'enregistrement de paiement
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'CASH_ON_DELIVERY',
        status: 'PENDING',
        amount: order.total,
        currency: 'XOF',
        metadata: cashOnDeliveryDto.notes || null,
      },
    });

    // Mettre à jour le statut de la commande
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });

    return {
      id: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      method: payment.method,
      status: payment.status,
      amount: this.toNumber(payment.amount),
      message: 'Paiement à la livraison confirmé. La commande sera livrée et payée à la réception.',
    };
  }

  /**
   * Traite un contact direct avec l'entreprise
   */
  async processDirectContact(
    userId: string,
    directContactDto: DirectContactDto,
  ) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await this.prisma.order.findFirst({
      where: {
        id: directContactDto.orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException('Cette commande ne peut plus être payée');
    }

    // Vérifier s'il existe déjà un paiement en cours ou complété
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Un paiement est déjà en cours ou complété pour cette commande',
      );
    }

    // Créer l'enregistrement de paiement
    const metadata = JSON.stringify({
      email: directContactDto.email,
      phone: directContactDto.phone,
      message: directContactDto.message,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'DIRECT_CONTACT',
        status: 'PENDING',
        amount: order.total,
        currency: 'XOF',
        metadata: metadata,
      },
    });

    // Mettre à jour le statut de la commande
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });

    return {
      id: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      method: payment.method,
      status: payment.status,
      amount: this.toNumber(payment.amount),
      message: 'Votre demande de contact direct a été enregistrée. L\'équipe vous contactera bientôt.',
    };
  }

  /**
   * Traite le webhook PayDunya
   */
  async handlePayDunyaWebhook(data: any) {
    try {
      const token = data.token || data.invoice?.token;
      if (!token) {
        throw new BadRequestException('Token manquant dans le webhook');
      }

      // Vérifier la facture PayDunya
      const invoiceData = await this.payDunyaService.verifyInvoice(token);

      // Trouver le paiement correspondant
      const payment = await this.prisma.payment.findUnique({
        where: { paydunyaToken: token },
        include: { order: true },
      });

      if (!payment) {
        this.logger.warn(`Paiement non trouvé pour le token: ${token}`);
        return { success: false, message: 'Paiement non trouvé' };
      }

      // Mettre à jour le statut du paiement
      const status = invoiceData.invoice?.status || data.status;
      let paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' = 'PENDING';

      if (status === 'completed' || status === 'paid') {
        paymentStatus = 'COMPLETED';
      } else if (status === 'cancelled') {
        paymentStatus = 'CANCELLED';
      } else if (status === 'failed') {
        paymentStatus = 'FAILED';
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          paydunyaReceiptUrl: invoiceData.invoice?.receipt_url || null,
          transactionId: invoiceData.invoice?.txn_code || null,
          paidAt: paymentStatus === 'COMPLETED' ? new Date() : null,
          failureReason:
            paymentStatus === 'FAILED'
              ? invoiceData.description || 'Paiement échoué'
              : null,
        },
      });

      // Mettre à jour le statut de la commande si le paiement est complété
      if (paymentStatus === 'COMPLETED') {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'CONFIRMED' },
        });
      }

      return { success: true, paymentId: payment.id, status: paymentStatus };
    } catch (error: any) {
      this.logger.error('Erreur lors du traitement du webhook PayDunya:', error);
      throw new BadRequestException(
        error.message || 'Erreur lors du traitement du webhook',
      );
    }
  }
}

