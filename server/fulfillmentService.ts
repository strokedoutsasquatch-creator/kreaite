import { storage } from './storage';
import { db } from './db';
import { 
  bookOrders, orderItems, bookEditions, marketplaceListings, authorEarnings,
  type BookOrder, type OrderItem, type BookEdition, type MarketplaceListing
} from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { 
  createPrintable, 
  createPrintJob, 
  getPrintJobStatus,
  isLuluConfigured,
  generatePodPackageId,
  calculatePrintCost,
  generateOrderNumber as generateLuluOrderNumber
} from './luluService';
import type Stripe from 'stripe';

const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;

interface FulfillmentResult {
  success: boolean;
  orderId?: number;
  digitalDelivered?: boolean;
  printJobsCreated?: number;
  error?: string;
}

export function calculateRevenueSplit(
  salePrice: number, 
  productionCost: number = 0
): { platformFee: number; creatorShare: number; netProfit: number } {
  const netProfit = salePrice - productionCost;
  const platformFee = Math.round(netProfit * PLATFORM_FEE_PERCENT / 100);
  const creatorShare = netProfit - platformFee;
  
  return { platformFee, creatorShare, netProfit };
}

export async function fulfillOrder(orderId: number): Promise<FulfillmentResult> {
  try {
    const order = await storage.getBookOrder(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const items = await storage.getOrderItems(orderId);
    if (!items.length) {
      return { success: false, error: 'No items in order' };
    }

    let digitalDelivered = false;
    let printJobsCreated = 0;

    for (const item of items) {
      const edition = await storage.getBookEdition(item.editionId);
      if (!edition) continue;

      const listing = await storage.getMarketplaceListing(item.listingId);
      if (!listing) continue;

      const isDigital = edition.editionType.includes('digital');
      
      if (isDigital) {
        const result = await fulfillDigitalProduct(order, item, edition);
        if (result.success) digitalDelivered = true;
      } else {
        const result = await fulfillPrintProduct(order, item, edition, listing);
        if (result.success) printJobsCreated++;
      }

      await recordAuthorEarning(order, item, edition, listing);
    }

    await updateListingSalesStats(items);

    return {
      success: true,
      orderId,
      digitalDelivered,
      printJobsCreated,
    };
  } catch (error) {
    console.error('Fulfillment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fulfillment failed',
    };
  }
}

async function fulfillDigitalProduct(
  order: BookOrder,
  item: OrderItem,
  edition: BookEdition
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    let downloadUrl = edition.epubUrl || edition.interiorPdfUrl;
    
    if (!downloadUrl) {
      return { success: false, error: 'No digital file available' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    await storage.updateOrderItem(item.id, {
      downloadUrl,
      downloadExpiresAt: expiresAt,
    });

    console.log(`Digital fulfillment completed for order ${order.orderNumber}, item ${item.id}`);
    
    return { success: true, downloadUrl };
  } catch (error) {
    console.error('Digital fulfillment error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Digital fulfillment failed' 
    };
  }
}

async function fulfillPrintProduct(
  order: BookOrder,
  item: OrderItem,
  edition: BookEdition,
  listing: MarketplaceListing
): Promise<{ success: boolean; luluOrderId?: string; error?: string }> {
  try {
    if (!isLuluConfigured()) {
      console.log('Lulu not configured - creating mock print job record');
      
      await storage.createLuluPrintJob({
        orderId: order.id,
        orderItemId: item.id,
        status: 'pending',
        quantity: item.quantity,
        interiorSourceUrl: edition.interiorPdfUrl || undefined,
        coverSourceUrl: edition.coverPdfUrl || undefined,
        shippingLevel: order.shippingMethod?.toUpperCase() as any || 'GROUND',
      });

      return { success: true, luluOrderId: 'MOCK_' + Date.now() };
    }

    if (!edition.interiorPdfUrl || !edition.coverPdfUrl) {
      const printJob = await storage.createLuluPrintJob({
        orderId: order.id,
        orderItemId: item.id,
        status: 'failed',
        quantity: item.quantity,
        errorMessage: 'Missing interior or cover PDF',
      });
      return { success: false, error: 'Missing interior or cover PDF for print job' };
    }

    const podPackageId = edition.luluPackageId || generatePodPackageId({
      pageCount: 200,
      trimSize: (edition.trimSize as any) || 'us_trade',
      bindingType: (edition.bindingType as any) || 'perfect',
      paperType: (edition.paperType as any) || 'standard_white',
      colorInterior: edition.colorInterior,
    });

    const printableResult = await createPrintable({
      externalId: `${order.orderNumber}-${item.id}`,
      title: listing.title,
      interiorSourceUrl: edition.interiorPdfUrl,
      coverSourceUrl: edition.coverPdfUrl,
      podPackageId,
    });

    if (!printableResult.success || !printableResult.printableId) {
      await storage.createLuluPrintJob({
        orderId: order.id,
        orderItemId: item.id,
        status: 'failed',
        quantity: item.quantity,
        errorMessage: printableResult.error || 'Failed to create Lulu printable',
      });
      return { success: false, error: printableResult.error };
    }

    const printJobResult = await createPrintJob({
      externalId: order.orderNumber,
      lineItems: [{
        externalId: `${item.id}`,
        printableId: printableResult.printableId,
        quantity: item.quantity,
      }],
      shippingAddress: {
        name: order.shippingName || order.customerName,
        street1: order.shippingStreet1 || '',
        street2: order.shippingStreet2 || undefined,
        city: order.shippingCity || '',
        stateCode: order.shippingState || '',
        postcode: order.shippingPostcode || '',
        countryCode: order.shippingCountry || 'US',
        phone: order.shippingPhone || undefined,
      },
      shippingLevel: (order.shippingMethod?.toUpperCase() as any) || 'GROUND',
      contactEmail: order.customerEmail,
    });

    if (!printJobResult.success) {
      await storage.createLuluPrintJob({
        orderId: order.id,
        orderItemId: item.id,
        status: 'failed',
        quantity: item.quantity,
        interiorSourceUrl: edition.interiorPdfUrl,
        coverSourceUrl: edition.coverPdfUrl,
        errorMessage: printJobResult.error || 'Failed to create Lulu print job',
      });
      return { success: false, error: printJobResult.error };
    }

    await storage.createLuluPrintJob({
      orderId: order.id,
      orderItemId: item.id,
      luluOrderId: printJobResult.orderId,
      status: 'submitted',
      quantity: item.quantity,
      productId: printableResult.printableId,
      interiorSourceUrl: edition.interiorPdfUrl,
      coverSourceUrl: edition.coverPdfUrl,
      shippingLevel: (order.shippingMethod?.toUpperCase() as any) || 'GROUND',
      estimatedShipDate: printJobResult.estimatedShipDate ? new Date(printJobResult.estimatedShipDate) : undefined,
      productionCost: printJobResult.costs?.printing,
      shippingCost: printJobResult.costs?.shipping,
    });

    await storage.updateBookOrder(order.id, {
      status: 'processing',
    });

    console.log(`Print job created for order ${order.orderNumber}: Lulu Order ${printJobResult.orderId}`);
    
    return { success: true, luluOrderId: printJobResult.orderId };
  } catch (error) {
    console.error('Print fulfillment error:', error);
    
    await storage.createLuluPrintJob({
      orderId: order.id,
      orderItemId: item.id,
      status: 'failed',
      quantity: item.quantity,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Print fulfillment failed' 
    };
  }
}

async function recordAuthorEarning(
  order: BookOrder,
  item: OrderItem,
  edition: BookEdition,
  listing: MarketplaceListing
): Promise<void> {
  const productionCost = edition.printCost || 0;
  const saleAmount = item.unitPrice * item.quantity;
  
  const { platformFee, creatorShare } = calculateRevenueSplit(saleAmount, productionCost * item.quantity);

  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + 14);

  await storage.createAuthorEarning({
    authorId: listing.authorId,
    orderId: order.id,
    orderItemId: item.id,
    listingId: listing.id,
    saleAmount,
    printCost: productionCost * item.quantity,
    platformFee,
    netEarnings: creatorShare,
    status: 'pending',
    availableAt,
  });

  console.log(`Author earning recorded: $${(creatorShare / 100).toFixed(2)} for ${listing.authorId}`);
}

async function updateListingSalesStats(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    await db.update(marketplaceListings)
      .set({
        totalSales: sql`${marketplaceListings.totalSales} + ${item.quantity}`,
        totalRevenue: sql`${marketplaceListings.totalRevenue} + ${item.subtotal}`,
        updatedAt: new Date(),
      })
      .where(eq(marketplaceListings.id, item.listingId));
  }
}

export async function handleStripeCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<FulfillmentResult> {
  try {
    const orderId = session.metadata?.orderId;
    const orderNumber = session.metadata?.orderNumber;
    
    if (!orderId && !orderNumber) {
      return { success: false, error: 'No order ID or number in session metadata' };
    }

    let order: BookOrder | undefined;
    
    if (orderId) {
      order = await storage.getBookOrder(parseInt(orderId));
    } else if (orderNumber) {
      order = await storage.getBookOrderByOrderNumber(orderNumber);
    }

    if (!order) {
      order = await storage.getBookOrderBySessionId(session.id);
    }

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    await storage.updateBookOrder(order.id, {
      status: 'paid',
      stripePaymentIntentId: session.payment_intent as string || undefined,
      paidAt: new Date(),
    });

    console.log(`Payment confirmed for order ${order.orderNumber}, starting fulfillment...`);

    return await fulfillOrder(order.id);
  } catch (error) {
    console.error('Stripe checkout complete handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Handler failed',
    };
  }
}

export async function syncLuluOrderStatus(orderId: number): Promise<{
  success: boolean;
  updated: boolean;
  error?: string;
}> {
  try {
    const printJobs = await storage.getLuluPrintJobsByOrder(orderId);
    
    if (!printJobs.length) {
      return { success: true, updated: false };
    }

    let updated = false;
    let anyShipped = false;
    let allDelivered = true;

    for (const job of printJobs) {
      if (!job.luluOrderId || job.status === 'delivered' || job.status === 'cancelled') {
        if (job.status !== 'delivered') allDelivered = false;
        continue;
      }

      const status = await getPrintJobStatus(job.luluOrderId);
      
      if (!status.success) continue;

      const updates: any = {};
      
      if (status.status && status.status !== job.status) {
        updates.status = status.status.toLowerCase();
        updated = true;
      }
      
      if (status.trackingNumber && status.trackingNumber !== job.trackingNumber) {
        updates.trackingNumber = status.trackingNumber;
        updates.trackingUrl = status.trackingUrl;
        updates.carrier = status.carrier;
        updated = true;
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateLuluPrintJob(job.id, updates);
      }

      if (updates.status === 'shipped' || job.status === 'shipped') {
        anyShipped = true;
      }
      if (updates.status !== 'delivered' && job.status !== 'delivered') {
        allDelivered = false;
      }
    }

    if (anyShipped || allDelivered) {
      const order = await storage.getBookOrder(orderId);
      if (order) {
        const newStatus = allDelivered ? 'delivered' : 'shipped';
        if (order.status !== newStatus) {
          const orderUpdates: any = { status: newStatus };
          
          const shippedJob = printJobs.find(j => j.trackingNumber);
          if (shippedJob) {
            orderUpdates.trackingNumber = shippedJob.trackingNumber;
            orderUpdates.trackingUrl = shippedJob.trackingUrl;
            if (anyShipped && !allDelivered) {
              orderUpdates.shippedAt = new Date();
            }
            if (allDelivered) {
              orderUpdates.deliveredAt = new Date();
            }
          }
          
          await storage.updateBookOrder(orderId, orderUpdates);
          updated = true;
        }
      }
    }

    return { success: true, updated };
  } catch (error) {
    console.error('Sync Lulu order status error:', error);
    return {
      success: false,
      updated: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

export const fulfillmentService = {
  fulfillOrder,
  calculateRevenueSplit,
  handleStripeCheckoutComplete,
  syncLuluOrderStatus,
};
