import { db } from './db';
import * as creditService from './creditService';
import { aiQualityTiers } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Fallback costs if the database lookup fails or for quick estimation
 */
const TIER_COSTS: Record<string, number> = {
  'Draft': 1,
  'Standard': 3,
  'Premium': 7,
  'Ultra': 15
};

/**
 * Content type multipliers for credit calculation
 */
const CONTENT_TYPE_MULTIPLIERS: Record<string, number> = {
  'text': 1.0,
  'image': 5.0,
  'audio': 3.0,
  'video': 10.0,
  'code': 1.5
};

/**
 * Get credit cost with content type multiplier
 */
export async function getCreditCostForGeneration(qualityTier: string, contentType: string): Promise<number> {
  const baseCost = await estimateCost(qualityTier);
  const multiplier = CONTENT_TYPE_MULTIPLIERS[contentType.toLowerCase()] || 1.0;
  return Math.ceil(baseCost * multiplier);
}

/**
 * Returns the credit cost for a tier
 */
export async function estimateCost(qualityTier: string): Promise<number> {
  try {
    const tier = await db.select()
      .from(aiQualityTiers)
      .where(eq(aiQualityTiers.name, qualityTier))
      .limit(1);

    if (tier.length > 0) {
      return tier[0].creditCost;
    }
  } catch (error) {
    console.error(`Error fetching credit cost for tier ${qualityTier}:`, error);
  }

  // Fallback to constants
  return TIER_COSTS[qualityTier] || 1;
}

/**
 * A wrapper that handles credit checking, deduction, and usage recording
 */
export async function withCredits<T>(
  userId: string,
  featureKey: string,
  qualityTier: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  // 1. Look up credit cost
  const cost = await estimateCost(qualityTier);

  // 2. Check if user has enough credits
  const hasEnough = await creditService.hasEnoughCredits(userId, cost);
  if (!hasEnough) {
    throw new Error(`Insufficient credits. This operation requires ${cost} credits.`);
  }

  try {
    // 3. Proceed with the operation
    const result = await operation();

    // 4. On success, deduct credits
    await creditService.deductCredits(
      userId,
      cost,
      `AI Generation: ${qualityTier} - ${featureKey}`,
      featureKey,
      metadata
    );

    // 5. Record the usage
    // Note: creditService.recordUsageEvent is used for usage tracking
    await creditService.recordUsageEvent(
      userId,
      featureKey,
      'ai_orchestrator',
      cost,
      undefined,
      undefined,
      undefined,
      metadata
    );

    return result;
  } catch (error) {
    // On failure, we do NOT deduct credits, just rethrow
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AI Generation failed during orchestrated operation.');
  }
}
