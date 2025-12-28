import { db } from './db';
import { revenueEvents, userSubscriptions, users, subscriptionTiers, creditWallets } from '@shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { addCredits } from './creditService';

const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;
const STRIPE_FEE_PERCENT = 2.9;
const STRIPE_FEE_FIXED_CENTS = 30;

export interface RevenueMetrics {
  totalRevenue: number;
  mrr: number;
  subscriptionRevenue: number;
  creditPurchases: number;
  marketplaceSales: number;
  creatorPayouts: number;
  platformFees: number;
  transactionCount: number;
}

export interface SubscriptionMetrics {
  activeSubscriptions: number;
  newThisMonth: number;
  churned: number;
  byTier: Record<string, number>;
}

function calculateStripeFee(amountCents: number): number {
  return Math.round(amountCents * (STRIPE_FEE_PERCENT / 100) + STRIPE_FEE_FIXED_CENTS);
}

function calculateMarketplaceSplit(amountCents: number): { platform: number; creator: number; net: number } {
  const stripeFee = calculateStripeFee(amountCents);
  const net = amountCents - stripeFee;
  const platform = Math.round(net * (PLATFORM_FEE_PERCENT / 100));
  const creator = net - platform;
  return { platform, creator, net };
}

export async function recordRevenueEvent(params: {
  userId?: string;
  stripeEventId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  eventType: string;
  amountCents: number;
  currency?: string;
  creatorId?: string;
  productType?: string;
  productId?: string;
  tierName?: string;
  creditsGranted?: number;
  billingPeriod?: string;
  status?: string;
  metadata?: Record<string, any>;
}): Promise<{ id: number }> {
  const stripeFee = calculateStripeFee(params.amountCents);
  const netAmount = params.amountCents - stripeFee;
  
  let platformFee = 0;
  let creatorPayout = 0;
  
  if (params.eventType === 'marketplace_sale' && params.creatorId) {
    const split = calculateMarketplaceSplit(params.amountCents);
    platformFee = split.platform;
    creatorPayout = split.creator;
  }
  
  const [event] = await db.insert(revenueEvents).values({
    userId: params.userId,
    stripeEventId: params.stripeEventId,
    stripePaymentIntentId: params.stripePaymentIntentId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripeCustomerId: params.stripeCustomerId,
    eventType: params.eventType,
    amountCents: params.amountCents,
    currency: params.currency || 'usd',
    netAmountCents: netAmount,
    platformFeeCents: platformFee || null,
    creatorPayoutCents: creatorPayout || null,
    creatorId: params.creatorId,
    productType: params.productType,
    productId: params.productId,
    tierName: params.tierName,
    creditsGranted: params.creditsGranted,
    billingPeriod: params.billingPeriod,
    status: params.status || 'succeeded',
    metadata: params.metadata,
  }).returning({ id: revenueEvents.id });
  
  return { id: event.id };
}

export async function processSubscriptionPayment(params: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripeEventId: string;
  amountCents: number;
  tierName: string;
  creditsToGrant: number;
  billingPeriod: 'monthly' | 'annual';
  isRenewal: boolean;
}): Promise<void> {
  await recordRevenueEvent({
    userId: params.userId,
    stripeEventId: params.stripeEventId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripeCustomerId: params.stripeCustomerId,
    eventType: params.isRenewal ? 'subscription_renewal' : 'subscription_new',
    amountCents: params.amountCents,
    productType: 'subscription',
    tierName: params.tierName,
    creditsGranted: params.creditsToGrant,
    billingPeriod: params.billingPeriod,
  });
  
  if (params.creditsToGrant > 0) {
    await addCredits(
      params.userId,
      params.creditsToGrant,
      'purchase',
      `${params.tierName} subscription ${params.isRenewal ? 'renewal' : 'activation'} - ${params.creditsToGrant} credits`,
      { subscriptionId: params.stripeSubscriptionId, billingPeriod: params.billingPeriod }
    );
  }
  
  await db.update(userSubscriptions)
    .set({
      lastCreditGrantAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, params.stripeSubscriptionId));
}

export async function upsertUserSubscription(params: {
  userId: string;
  tierId?: number;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  billingPeriod: 'monthly' | 'annual';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  monthlyCreditsQuota: number;
}): Promise<void> {
  const existing = await db.select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, params.stripeSubscriptionId))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(userSubscriptions)
      .set({
        tierId: params.tierId,
        status: params.status,
        billingPeriod: params.billingPeriod,
        currentPeriodStart: params.currentPeriodStart,
        currentPeriodEnd: params.currentPeriodEnd,
        monthlyCreditsQuota: params.monthlyCreditsQuota,
        canceledAt: params.status === 'canceled' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, params.stripeSubscriptionId));
  } else {
    await db.insert(userSubscriptions).values({
      userId: params.userId,
      tierId: params.tierId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripeCustomerId: params.stripeCustomerId,
      status: params.status,
      billingPeriod: params.billingPeriod,
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      monthlyCreditsQuota: params.monthlyCreditsQuota,
    });
  }
}

export async function getRevenueMetrics(startDate?: Date, endDate?: Date): Promise<RevenueMetrics> {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate || now;
  
  const results = await db.select({
    totalRevenue: sql<number>`COALESCE(SUM(${revenueEvents.amountCents}), 0)`,
    subscriptionRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${revenueEvents.eventType} IN ('subscription_new', 'subscription_renewal') THEN ${revenueEvents.amountCents} ELSE 0 END), 0)`,
    creditPurchases: sql<number>`COALESCE(SUM(CASE WHEN ${revenueEvents.eventType} = 'credit_purchase' THEN ${revenueEvents.amountCents} ELSE 0 END), 0)`,
    marketplaceSales: sql<number>`COALESCE(SUM(CASE WHEN ${revenueEvents.eventType} = 'marketplace_sale' THEN ${revenueEvents.amountCents} ELSE 0 END), 0)`,
    creatorPayouts: sql<number>`COALESCE(SUM(${revenueEvents.creatorPayoutCents}), 0)`,
    platformFees: sql<number>`COALESCE(SUM(${revenueEvents.platformFeeCents}), 0)`,
    transactionCount: sql<number>`COUNT(*)`,
  })
  .from(revenueEvents)
  .where(
    and(
      gte(revenueEvents.createdAt, start),
      lte(revenueEvents.createdAt, end),
      eq(revenueEvents.status, 'succeeded')
    )
  );
  
  const mrrResult = await db.select({
    mrr: sql<number>`COALESCE(SUM(CASE WHEN ${revenueEvents.billingPeriod} = 'annual' THEN ${revenueEvents.amountCents} / 12 ELSE ${revenueEvents.amountCents} END), 0)`,
  })
  .from(revenueEvents)
  .where(
    and(
      eq(revenueEvents.eventType, 'subscription_renewal'),
      gte(revenueEvents.createdAt, new Date(now.getFullYear(), now.getMonth(), 1)),
      eq(revenueEvents.status, 'succeeded')
    )
  );
  
  const r = results[0];
  return {
    totalRevenue: r?.totalRevenue || 0,
    mrr: mrrResult[0]?.mrr || 0,
    subscriptionRevenue: r?.subscriptionRevenue || 0,
    creditPurchases: r?.creditPurchases || 0,
    marketplaceSales: r?.marketplaceSales || 0,
    creatorPayouts: r?.creatorPayouts || 0,
    platformFees: r?.platformFees || 0,
    transactionCount: r?.transactionCount || 0,
  };
}

export async function getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const activeResult = await db.select({
    count: sql<number>`COUNT(*)`,
  })
  .from(userSubscriptions)
  .where(eq(userSubscriptions.status, 'active'));
  
  const newResult = await db.select({
    count: sql<number>`COUNT(*)`,
  })
  .from(userSubscriptions)
  .where(
    and(
      eq(userSubscriptions.status, 'active'),
      gte(userSubscriptions.createdAt, monthStart)
    )
  );
  
  const churnedResult = await db.select({
    count: sql<number>`COUNT(*)`,
  })
  .from(userSubscriptions)
  .where(
    and(
      eq(userSubscriptions.status, 'canceled'),
      gte(userSubscriptions.canceledAt, monthStart)
    )
  );
  
  const tierBreakdown = await db.select({
    tierName: subscriptionTiers.name,
    count: sql<number>`COUNT(*)`,
  })
  .from(userSubscriptions)
  .leftJoin(subscriptionTiers, eq(userSubscriptions.tierId, subscriptionTiers.id))
  .where(eq(userSubscriptions.status, 'active'))
  .groupBy(subscriptionTiers.name);
  
  const byTier: Record<string, number> = {};
  for (const row of tierBreakdown) {
    if (row.tierName) {
      byTier[row.tierName] = row.count;
    }
  }
  
  return {
    activeSubscriptions: activeResult[0]?.count || 0,
    newThisMonth: newResult[0]?.count || 0,
    churned: churnedResult[0]?.count || 0,
    byTier,
  };
}

export async function getRecentRevenue(limit: number = 20): Promise<any[]> {
  const events = await db.select({
    id: revenueEvents.id,
    eventType: revenueEvents.eventType,
    amountCents: revenueEvents.amountCents,
    productType: revenueEvents.productType,
    tierName: revenueEvents.tierName,
    status: revenueEvents.status,
    createdAt: revenueEvents.createdAt,
  })
  .from(revenueEvents)
  .orderBy(desc(revenueEvents.createdAt))
  .limit(limit);
  
  return events;
}

export async function getCreditUsageAnalytics(startDate?: Date, endDate?: Date): Promise<{
  totalCreditsUsed: number;
  totalCreditsGranted: number;
  byFeature: Record<string, number>;
  byStudio: Record<string, number>;
}> {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate || now;
  
  const { usageEvents } = await import('@shared/schema');
  
  const usageResult = await db.select({
    totalUsed: sql<number>`COALESCE(SUM(${usageEvents.creditsCost}), 0)`,
  })
  .from(usageEvents)
  .where(
    and(
      gte(usageEvents.createdAt, start),
      lte(usageEvents.createdAt, end)
    )
  );
  
  const grantedResult = await db.select({
    totalGranted: sql<number>`COALESCE(SUM(${revenueEvents.creditsGranted}), 0)`,
  })
  .from(revenueEvents)
  .where(
    and(
      gte(revenueEvents.createdAt, start),
      lte(revenueEvents.createdAt, end),
      eq(revenueEvents.status, 'succeeded')
    )
  );
  
  const byFeatureResult = await db.select({
    feature: usageEvents.featureKey,
    credits: sql<number>`COALESCE(SUM(${usageEvents.creditsCost}), 0)`,
  })
  .from(usageEvents)
  .where(
    and(
      gte(usageEvents.createdAt, start),
      lte(usageEvents.createdAt, end)
    )
  )
  .groupBy(usageEvents.featureKey);
  
  const byStudioResult = await db.select({
    studio: usageEvents.studioType,
    credits: sql<number>`COALESCE(SUM(${usageEvents.creditsCost}), 0)`,
  })
  .from(usageEvents)
  .where(
    and(
      gte(usageEvents.createdAt, start),
      lte(usageEvents.createdAt, end)
    )
  )
  .groupBy(usageEvents.studioType);
  
  const byFeature: Record<string, number> = {};
  for (const row of byFeatureResult) {
    if (row.feature) {
      byFeature[row.feature] = row.credits;
    }
  }
  
  const byStudio: Record<string, number> = {};
  for (const row of byStudioResult) {
    if (row.studio) {
      byStudio[row.studio] = row.credits;
    }
  }
  
  return {
    totalCreditsUsed: usageResult[0]?.totalUsed || 0,
    totalCreditsGranted: grantedResult[0]?.totalGranted || 0,
    byFeature,
    byStudio,
  };
}
