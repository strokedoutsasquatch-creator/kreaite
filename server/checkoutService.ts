import { db } from './db';
import { getUncachableStripeClient } from './stripeClient';
import { getLocaleConfig, detectLocation } from './geolocationService';
import { addCredits, initializeWallet } from './creditService';
import { fulfillOrder, calculateRevenueSplit } from './fulfillmentService';
import { 
  users, 
  marketplaceListings, 
  bookEditions, 
  bookOrders,
  orderItems,
  creatorEarnings,
  creatorPayouts,
  creditWallets 
} from '@shared/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';
import type Stripe from 'stripe';

const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;

const CREDIT_PACKAGES = {
  starter: { credits: 100, priceUsd: 999, name: 'Starter Pack' },
  pro: { credits: 500, priceUsd: 3999, name: 'Pro Pack' },
  studio: { credits: 2000, priceUsd: 14999, name: 'Studio Pack' },
} as const;

type CreditPackageKey = keyof typeof CREDIT_PACKAGES;

interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

interface WebhookResult {
  success: boolean;
  error?: string;
}

export async function createCheckoutSession(
  userId: string,
  listingId: number,
  locale: string
): Promise<CheckoutResult> {
  try {
    const stripe = await getUncachableStripeClient();
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const [listing] = await db.select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, listingId));
    
    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }
    
    if (listing.status !== 'published') {
      return { success: false, error: 'Listing is not available for purchase' };
    }
    
    const editions = await db.select()
      .from(bookEditions)
      .where(and(
        eq(bookEditions.listingId, listingId),
        eq(bookEditions.isActive, true)
      ));
    
    if (!editions.length) {
      return { success: false, error: 'No editions available for this listing' };
    }
    
    const edition = editions[0];
    
    const countryCode = locale.split('-')[1]?.toUpperCase() || locale.toUpperCase() || 'US';
    const localeConfig = getLocaleConfig(countryCode);
    
    const platformFee = Math.round(edition.price * PLATFORM_FEE_PERCENT / 100);
    const creatorShare = edition.price - platformFee;
    
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      
      await db.update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId));
    }
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      automatic_tax: { enabled: true },
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: localeConfig.currency.toLowerCase(),
          product_data: {
            name: listing.title,
            description: listing.subtitle || listing.description.substring(0, 500),
            images: listing.coverImageUrl ? [listing.coverImageUrl] : undefined,
          },
          unit_amount: edition.price,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/marketplace/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/marketplace/listings/${listingId}`,
      metadata: {
        type: 'marketplace_purchase',
        listingId: listingId.toString(),
        editionId: edition.id.toString(),
        buyerId: userId,
        sellerId: listing.authorId,
        platformFee: platformFee.toString(),
        creatorEarnings: creatorShare.toString(),
        currency: localeConfig.currency,
      },
      customer_email: user.email || undefined,
    });
    
    return {
      success: true,
      checkoutUrl: session.url || undefined,
    };
  } catch (error) {
    console.error('Create checkout session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

export async function handleCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<WebhookResult> {
  try {
    const metadata = session.metadata;
    if (!metadata) {
      return { success: false, error: 'No metadata in session' };
    }
    
    const { type } = metadata;
    
    if (type === 'marketplace_purchase') {
      return await handleMarketplacePurchase(session, metadata);
    } else if (type === 'credit_purchase') {
      return await handleCreditPurchase(session, metadata);
    }
    
    return { success: false, error: `Unknown checkout type: ${type}` };
  } catch (error) {
    console.error('Handle checkout complete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process checkout',
    };
  }
}

async function handleMarketplacePurchase(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
): Promise<WebhookResult> {
  try {
    const listingId = parseInt(metadata.listingId);
    const editionId = parseInt(metadata.editionId);
    const buyerId = metadata.buyerId;
    const sellerId = metadata.sellerId;
    const platformFee = parseInt(metadata.platformFee);
    const creatorShare = parseInt(metadata.creatorEarnings);
    const currency = metadata.currency || 'USD';
    
    const [listing] = await db.select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, listingId));
    
    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }
    
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const [order] = await db.insert(bookOrders).values({
      orderNumber,
      customerId: buyerId,
      customerEmail: session.customer_email || session.customer_details?.email || '',
      customerName: session.customer_details?.name || 'Customer',
      status: 'paid',
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string || null,
      subtotal: session.amount_total || 0,
      shippingCost: 0,
      tax: session.total_details?.amount_tax || 0,
      total: session.amount_total || 0,
      currency,
      paidAt: new Date(),
    }).returning();
    
    await db.insert(orderItems).values({
      orderId: order.id,
      listingId,
      editionId,
      quantity: 1,
      unitPrice: session.amount_total || 0,
      authorRoyalty: creatorShare,
      subtotal: session.amount_total || 0,
    });
    
    await db.update(marketplaceListings)
      .set({
        totalSales: sql`${marketplaceListings.totalSales} + 1`,
        totalRevenue: sql`${marketplaceListings.totalRevenue} + ${session.amount_total || 0}`,
        updatedAt: new Date(),
      })
      .where(eq(marketplaceListings.id, listingId));
    
    await db.insert(creatorEarnings).values({
      creatorId: sellerId,
      orderId: order.id,
      productType: 'book',
      productId: listingId,
      productTitle: listing.title,
      saleAmount: session.amount_total || 0,
      platformFee,
      creatorShare,
      currency,
      status: 'pending',
      customerEmail: session.customer_email || session.customer_details?.email || null,
    });
    
    console.log(`Marketplace purchase completed: Order ${orderNumber}, Creator payout queued for ${sellerId}`);
    
    const fulfillmentResult = await fulfillOrder(order.id);
    if (!fulfillmentResult.success) {
      console.error(`Fulfillment failed for order ${order.id}:`, fulfillmentResult.error);
    } else {
      console.log(`Fulfillment initiated: Digital delivered: ${fulfillmentResult.digitalDelivered}, Print jobs: ${fulfillmentResult.printJobsCreated}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Handle marketplace purchase error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process marketplace purchase',
    };
  }
}

async function handleCreditPurchase(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
): Promise<WebhookResult> {
  try {
    const userId = metadata.userId;
    const credits = parseInt(metadata.credits);
    const packageName = metadata.packageName;
    
    await initializeWallet(userId);
    
    await addCredits(
      userId,
      credits,
      'purchase',
      `${packageName} - ${credits} credits purchased`,
      {
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        amountPaid: session.amount_total,
        currency: session.currency,
      }
    );
    
    console.log(`Credit purchase completed: ${credits} credits added to user ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Handle credit purchase error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process credit purchase',
    };
  }
}

export async function createCreditPurchaseSession(
  userId: string,
  creditPackage: CreditPackageKey,
  locale: string
): Promise<CheckoutResult> {
  try {
    const stripe = await getUncachableStripeClient();
    
    const packageDetails = CREDIT_PACKAGES[creditPackage];
    if (!packageDetails) {
      return { success: false, error: 'Invalid credit package' };
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const countryCode = locale.split('-')[1]?.toUpperCase() || locale.toUpperCase() || 'US';
    const localeConfig = getLocaleConfig(countryCode);
    
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      
      await db.update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId));
    }
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      automatic_tax: { enabled: true },
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: localeConfig.currency.toLowerCase(),
          product_data: {
            name: packageDetails.name,
            description: `${packageDetails.credits} AI Credits for content creation`,
          },
          unit_amount: packageDetails.priceUsd,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/credits/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        type: 'credit_purchase',
        userId,
        packageKey: creditPackage,
        packageName: packageDetails.name,
        credits: packageDetails.credits.toString(),
        priceUsd: packageDetails.priceUsd.toString(),
      },
      customer_email: user.email || undefined,
    });
    
    return {
      success: true,
      checkoutUrl: session.url || undefined,
    };
  } catch (error) {
    console.error('Create credit purchase session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create credit purchase session',
    };
  }
}

export async function processCreatorPayout(
  creatorId: string
): Promise<{ success: boolean; payoutId?: number; amount?: number; error?: string }> {
  try {
    const stripe = await getUncachableStripeClient();
    
    const [creator] = await db.select().from(users).where(eq(users.id, creatorId));
    if (!creator) {
      return { success: false, error: 'Creator not found' };
    }
    
    if (!creator.stripeConnectAccountId) {
      return { success: false, error: 'Creator does not have a Stripe Connect account' };
    }
    
    if (!creator.stripeConnectOnboarded) {
      return { success: false, error: 'Creator Stripe Connect account is not fully onboarded' };
    }
    
    const pendingEarnings = await db.select()
      .from(creatorEarnings)
      .where(and(
        eq(creatorEarnings.creatorId, creatorId),
        eq(creatorEarnings.status, 'available')
      ));
    
    if (!pendingEarnings.length) {
      return { success: false, error: 'No available earnings to payout' };
    }
    
    const totalAmount = pendingEarnings.reduce((sum, e) => sum + e.creatorShare, 0);
    const earningIds = pendingEarnings.map(e => e.id);
    
    const transfer = await stripe.transfers.create({
      amount: totalAmount,
      currency: 'usd',
      destination: creator.stripeConnectAccountId,
      metadata: {
        creatorId,
        earningIds: earningIds.join(','),
        earningCount: earningIds.length.toString(),
      },
    });
    
    const [payout] = await db.insert(creatorPayouts).values({
      creatorId,
      amount: totalAmount,
      currency: 'USD',
      status: 'processing',
      stripeTransferId: transfer.id,
      earningsIncluded: earningIds,
      periodStart: pendingEarnings[0]?.createdAt || new Date(),
      periodEnd: new Date(),
    }).returning();
    
    await db.update(creatorEarnings)
      .set({
        status: 'paid',
        stripeTransferId: transfer.id,
        payoutId: payout.id,
        paidAt: new Date(),
      })
      .where(inArray(creatorEarnings.id, earningIds));
    
    console.log(`Creator payout processed: ${totalAmount} cents to ${creatorId}, Payout ID: ${payout.id}`);
    
    return {
      success: true,
      payoutId: payout.id,
      amount: totalAmount,
    };
  } catch (error) {
    console.error('Process creator payout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process creator payout',
    };
  }
}

export async function markEarningsAvailable(earningIds: number[]): Promise<void> {
  if (!earningIds.length) return;
  
  await db.update(creatorEarnings)
    .set({ status: 'available' })
    .where(and(
      inArray(creatorEarnings.id, earningIds),
      eq(creatorEarnings.status, 'pending')
    ));
}

export async function getCreatorPendingEarnings(creatorId: string): Promise<{
  pendingAmount: number;
  availableAmount: number;
  pendingCount: number;
  availableCount: number;
}> {
  const earnings = await db.select()
    .from(creatorEarnings)
    .where(eq(creatorEarnings.creatorId, creatorId));
  
  const pending = earnings.filter(e => e.status === 'pending');
  const available = earnings.filter(e => e.status === 'available');
  
  return {
    pendingAmount: pending.reduce((sum, e) => sum + e.creatorShare, 0),
    availableAmount: available.reduce((sum, e) => sum + e.creatorShare, 0),
    pendingCount: pending.length,
    availableCount: available.length,
  };
}

export const checkoutService = {
  createCheckoutSession,
  handleCheckoutComplete,
  createCreditPurchaseSession,
  processCreatorPayout,
  markEarningsAvailable,
  getCreatorPendingEarnings,
};
