import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Order, OrderItem, User, Company } from '@prisma/client';

interface OrderWithDetails extends Order {
  items: (OrderItem & {
    product: {
      id: string;
      name: string;
      sku?: string | null;
    };
  })[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
}

interface SellerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: {
    id: string;
    name: string;
    legalName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    region?: string | null;
    country?: string;
    website?: string | null;
  } | null;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  /**
   * Génère une facture PDF pour une commande
   */
  async generateInvoicePDF(
    order: OrderWithDetails,
    seller: SellerInfo,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // En-tête de la facture
        this.addHeader(doc, order, seller);

        // Informations du vendeur
        this.addSellerInfo(doc, seller);

        // Informations du client
        this.addCustomerInfo(doc, order);

        // Détails de la commande
        this.addOrderDetails(doc, order);

        // Tableau des produits
        this.addProductsTable(doc, order.items);

        // Totaux
        this.addTotals(doc, order);

        // Pied de page
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        this.logger.error('Erreur lors de la génération du PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Ajoute l'en-tête de la facture
   */
  private addHeader(
    doc: PDFKit.PDFDocument,
    order: OrderWithDetails,
    seller: SellerInfo,
  ): void {
    // Logo et titre
    doc
      .fontSize(24)
      .fillColor('#667eea')
      .text('FACTURE', 50, 50, { align: 'right' })
      .fontSize(12)
      .fillColor('#666')
      .text(`N° ${order.orderNumber}`, 50, 80, { align: 'right' })
      .text(
        `Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`,
        50,
        95,
        { align: 'right' },
      );

    // Ligne de séparation
    doc
      .moveTo(50, 120)
      .lineTo(545, 120)
      .strokeColor('#667eea')
      .lineWidth(2)
      .stroke();
  }

  /**
   * Ajoute les informations du vendeur
   */
  private addSellerInfo(
    doc: PDFKit.PDFDocument,
    seller: SellerInfo,
  ): void {
    const companyName = seller.company?.name || seller.company?.legalName;
    const sellerName = `${seller.firstName} ${seller.lastName}`;

    doc
      .fontSize(14)
      .fillColor('#333')
      .text('Vendeur', 50, 140)
      .fontSize(10)
      .fillColor('#666');

    if (companyName) {
      doc.text(companyName, 50, 160);
      if (seller.company?.legalName && seller.company.legalName !== companyName) {
        doc.text(`(${seller.company.legalName})`, 50, 175);
      }
      if (seller.company?.address) {
        doc.text(seller.company.address, 50, 190);
      }
      if (seller.company?.city) {
        doc.text(
          `${seller.company.city}${seller.company.postalCode ? ` ${seller.company.postalCode}` : ''}`,
          50,
          205,
        );
      }
      if (seller.company?.email) {
        doc.text(`Email: ${seller.company.email}`, 50, 220);
      }
      if (seller.company?.phone) {
        doc.text(`Tél: ${seller.company.phone}`, 50, 235);
      }
    } else {
      doc.text(sellerName, 50, 160);
      if (seller.email) {
        doc.text(`Email: ${seller.email}`, 50, 175);
      }
      if (seller.phone) {
        doc.text(`Tél: ${seller.phone}`, 50, 190);
      }
    }
  }

  /**
   * Ajoute les informations du client
   */
  private addCustomerInfo(
    doc: PDFKit.PDFDocument,
    order: OrderWithDetails,
  ): void {
    doc
      .fontSize(14)
      .fillColor('#333')
      .text('Client', 300, 140)
      .fontSize(10)
      .fillColor('#666')
      .text(
        `${order.user.firstName} ${order.user.lastName}`,
        300,
        160,
      );

    if (order.user.email) {
      doc.text(`Email: ${order.user.email}`, 300, 175);
    }
    if (order.user.phone) {
      doc.text(`Tél: ${order.user.phone}`, 300, 190);
    }

    // Adresse de livraison
    doc.fontSize(12).fillColor('#333').text('Adresse de livraison', 300, 210);
    doc.fontSize(10).fillColor('#666');
    doc.text(order.recipientName, 300, 230);
    doc.text(order.shippingAddress, 300, 245);
    doc.text(
      `${order.shippingCity}${order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ''}`,
      300,
      260,
    );
    doc.text(`${order.shippingRegion}, ${order.shippingCountry}`, 300, 275);
    if (order.recipientPhone) {
      doc.text(`Tél: ${order.recipientPhone}`, 300, 290);
    }
  }

  /**
   * Ajoute les détails de la commande
   */
  private addOrderDetails(
    doc: PDFKit.PDFDocument,
    order: OrderWithDetails,
  ): void {
    let yPosition = 320;

    doc
      .fontSize(12)
      .fillColor('#333')
      .text('Détails de la commande', 50, yPosition);

    yPosition += 20;

    doc.fontSize(10).fillColor('#666');
    doc.text(`Statut: ${this.getStatusLabel(order.status)}`, 50, yPosition);
    yPosition += 15;

    if (order.trackingNumber) {
      doc.text(`Numéro de suivi: ${order.trackingNumber}`, 50, yPosition);
      yPosition += 15;
    }

    if (order.notes) {
      doc.text(`Notes: ${order.notes}`, 50, yPosition);
      yPosition += 15;
    }

    // Ligne de séparation
    yPosition += 10;
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#ddd')
      .lineWidth(1)
      .stroke();
  }

  /**
   * Ajoute le tableau des produits
   */
  private addProductsTable(
    doc: PDFKit.PDFDocument,
    items: OrderWithDetails['items'],
  ): void {
    let yPosition = 400;

    // En-tête du tableau
    doc
      .fontSize(10)
      .fillColor('#fff')
      .rect(50, yPosition, 495, 25)
      .fill('#667eea')
      .text('Produit', 60, yPosition + 8)
      .text('SKU', 200, yPosition + 8)
      .text('Qté', 280, yPosition + 8)
      .text('Prix unit.', 320, yPosition + 8, { width: 80, align: 'right' })
      .text('Remise', 410, yPosition + 8, { width: 60, align: 'right' })
      .text('Total', 480, yPosition + 8, { width: 65, align: 'right' });

    yPosition += 25;

    // Lignes des produits
    doc.fillColor('#333');
    items.forEach((item, index) => {
      const rowHeight = 30;
      const isEven = index % 2 === 0;

      // Fond alterné
      if (isEven) {
        doc
          .rect(50, yPosition, 495, rowHeight)
          .fillColor('#f9f9f9')
          .fill()
          .fillColor('#333');
      }

      // Contenu de la ligne
      doc
        .fontSize(9)
        .text(item.productName, 60, yPosition + 8, { width: 130 })
        .text(item.productSku || 'N/A', 200, yPosition + 8, { width: 70 })
        .text(item.quantity.toString(), 280, yPosition + 8, { width: 30 })
        .text(
          `${this.formatCurrency(Number(item.unitPrice))} XOF`,
          320,
          yPosition + 8,
          { width: 80, align: 'right' },
        )
        .text(
          Number(item.discount) > 0
            ? `${this.formatCurrency(Number(item.discount))} XOF`
            : '-',
          410,
          yPosition + 8,
          { width: 60, align: 'right' },
        )
        .text(
          `${this.formatCurrency(Number(item.total))} XOF`,
          480,
          yPosition + 8,
          { width: 65, align: 'right' },
        );

      yPosition += rowHeight;
    });

    // Bordure du tableau
    doc
      .rect(50, 400, 495, yPosition - 400)
      .strokeColor('#ddd')
      .lineWidth(1)
      .stroke();
  }

  /**
   * Ajoute les totaux
   */
  private addTotals(
    doc: PDFKit.PDFDocument,
    order: OrderWithDetails,
  ): void {
    const startY = 550;
    let yPosition = startY;

    // Ligne de séparation
    doc
      .moveTo(350, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#ddd')
      .lineWidth(1)
      .stroke();

    yPosition += 20;

    doc.fontSize(10).fillColor('#666');

    // Sous-total
    doc
      .text('Sous-total:', 350, yPosition, { width: 100, align: 'right' })
      .text(
        `${this.formatCurrency(Number(order.subtotal))} XOF`,
        460,
        yPosition,
        { width: 85, align: 'right' },
      );

    yPosition += 20;

    // Taxe
    if (Number(order.tax) > 0) {
      doc
        .text('Taxe:', 350, yPosition, { width: 100, align: 'right' })
        .text(
          `${this.formatCurrency(Number(order.tax))} XOF`,
          460,
          yPosition,
          { width: 85, align: 'right' },
        );
      yPosition += 20;
    }

    // Frais de livraison
    if (Number(order.shipping) > 0) {
      doc
        .text('Livraison:', 350, yPosition, { width: 100, align: 'right' })
        .text(
          `${this.formatCurrency(Number(order.shipping))} XOF`,
          460,
          yPosition,
          { width: 85, align: 'right' },
        );
      yPosition += 20;
    }

    // Remise
    if (Number(order.discount) > 0) {
      doc
        .fillColor('#e74c3c')
        .text('Remise:', 350, yPosition, { width: 100, align: 'right' })
        .text(
          `-${this.formatCurrency(Number(order.discount))} XOF`,
          460,
          yPosition,
          { width: 85, align: 'right' },
        );
      yPosition += 20;
      doc.fillColor('#666');
    }

    // Ligne de séparation avant le total
    yPosition += 10;
    doc
      .moveTo(350, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#667eea')
      .lineWidth(2)
      .stroke();

    yPosition += 15;

    // Total
    doc
      .fontSize(14)
      .fillColor('#333')
      .font('Helvetica-Bold')
      .text('TOTAL:', 350, yPosition, { width: 100, align: 'right' })
      .text(
        `${this.formatCurrency(Number(order.total))} XOF`,
        460,
        yPosition,
        { width: 85, align: 'right' },
      );
  }

  /**
   * Ajoute le pied de page
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 80;

    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        'Cette facture a été générée automatiquement par Sendiaba.',
        50,
        footerY,
        { align: 'center', width: 495 },
      )
      .text(
        `Générée le ${new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        50,
        footerY + 15,
        { align: 'center', width: 495 },
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

