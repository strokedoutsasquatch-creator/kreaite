import { db } from './db';
import { creditWallets, creditLedger, usageEvents } from '@shared/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

export interface CreditBalance {
  balance: number;
  bonusCredits: number;
  total: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface CreditTransaction {
  id: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  featureKey: string | null;
  createdAt: Date;
}

const STARTER_CREDITS = 50;

export async function getBalance(userId: string): Promise<CreditBalance> {
  const wallet = await db.select().from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);
  
  if (wallet.length === 0) {
    await initializeWallet(userId);
    return {
      balance: STARTER_CREDITS,
      bonusCredits: 0,
      total: STARTER_CREDITS,
      lifetimeEarned: STARTER_CREDITS,
      lifetimeSpent: 0,
    };
  }
  
  const w = wallet[0];
  return {
    balance: w.balance,
    bonusCredits: w.bonusCredits,
    total: w.balance + w.bonusCredits,
    lifetimeEarned: w.lifetimeEarned,
    lifetimeSpent: w.lifetimeSpent,
  };
}

export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance.total >= amount;
}

export async function initializeWallet(userId: string): Promise<void> {
  const existing = await db.select().from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);
  
  if (existing.length === 0) {
    await db.insert(creditWallets).values({
      userId,
      balance: STARTER_CREDITS,
      bonusCredits: 0,
      lifetimeEarned: STARTER_CREDITS,
      lifetimeSpent: 0,
    });
    
    await db.insert(creditLedger).values({
      userId,
      transactionType: 'bonus',
      amount: STARTER_CREDITS,
      balanceAfter: STARTER_CREDITS,
      description: 'Welcome bonus - starter credits',
      featureKey: 'signup_bonus',
    });
  }
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  featureKey: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const balance = await getBalance(userId);
  
  if (balance.total < amount) {
    return { success: false, newBalance: balance.total, error: 'Insufficient credits' };
  }
  
  let bonusDeduction = 0;
  let balanceDeduction = 0;
  
  if (balance.bonusCredits >= amount) {
    bonusDeduction = amount;
  } else {
    bonusDeduction = balance.bonusCredits;
    balanceDeduction = amount - bonusDeduction;
  }
  
  const newBonusCredits = balance.bonusCredits - bonusDeduction;
  const newBalance = balance.balance - balanceDeduction;
  const newTotal = newBalance + newBonusCredits;
  
  await db.update(creditWallets)
    .set({
      balance: newBalance,
      bonusCredits: newBonusCredits,
      lifetimeSpent: balance.lifetimeSpent + amount,
      updatedAt: new Date(),
    })
    .where(eq(creditWallets.userId, userId));
  
  await db.insert(creditLedger).values({
    userId,
    transactionType: 'deduction',
    amount: -amount,
    balanceAfter: newTotal,
    description,
    featureKey,
    metadata: metadata || null,
  });
  
  return { success: true, newBalance: newTotal };
}

export async function addCredits(
  userId: string,
  amount: number,
  transactionType: 'purchase' | 'refund' | 'bonus' | 'earning',
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number }> {
  const balance = await getBalance(userId);
  
  const isBonus = transactionType === 'bonus';
  const newBonusCredits = isBonus ? balance.bonusCredits + amount : balance.bonusCredits;
  const newBalanceAmount = isBonus ? balance.balance : balance.balance + amount;
  const newTotal = newBalanceAmount + newBonusCredits;
  
  await db.update(creditWallets)
    .set({
      balance: newBalanceAmount,
      bonusCredits: newBonusCredits,
      lifetimeEarned: balance.lifetimeEarned + amount,
      updatedAt: new Date(),
    })
    .where(eq(creditWallets.userId, userId));
  
  await db.insert(creditLedger).values({
    userId,
    transactionType,
    amount,
    balanceAfter: newTotal,
    description,
    metadata: metadata || null,
  });
  
  return { success: true, newBalance: newTotal };
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const transactions = await db.select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit);
  
  return transactions.map(t => ({
    id: t.id,
    transactionType: t.transactionType,
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    description: t.description,
    featureKey: t.featureKey,
    createdAt: t.createdAt,
  }));
}

export async function recordUsageEvent(
  userId: string,
  featureKey: string,
  studioType: string,
  creditsCost: number,
  inputTokens?: number,
  outputTokens?: number,
  durationMs?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await db.insert(usageEvents).values({
    userId,
    featureKey,
    studioType,
    creditsCost,
    inputTokens: inputTokens || null,
    outputTokens: outputTokens || null,
    durationMs: durationMs || null,
    metadata: metadata || null,
  });
}

export async function getDailyUsageStats(userId: string): Promise<{
  creditsUsedToday: number;
  generationsToday: number;
  tokensUsedToday: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await db.select({
    creditsUsed: sql<number>`COALESCE(SUM(${usageEvents.creditsCost}), 0)`,
    generations: sql<number>`COUNT(*)`,
    tokens: sql<number>`COALESCE(SUM(COALESCE(${usageEvents.inputTokens}, 0) + COALESCE(${usageEvents.outputTokens}, 0)), 0)`,
  })
  .from(usageEvents)
  .where(
    and(
      eq(usageEvents.userId, userId),
      gte(usageEvents.createdAt, today)
    )
  );
  
  return {
    creditsUsedToday: stats[0]?.creditsUsed || 0,
    generationsToday: stats[0]?.generations || 0,
    tokensUsedToday: stats[0]?.tokens || 0,
  };
}
