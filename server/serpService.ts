import { db } from './db';
import { researchQueries, trendingTopics } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { generateCoachResponse } from './geminiService';

const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_API_BASE = 'https://serpapi.com/search';

const CACHE_DURATION_HOURS = 24;
const TRENDING_CACHE_HOURS = 6;

export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  source?: string;
  date?: string;
  thumbnail?: string;
}

export interface SerpResponse {
  query: string;
  totalResults: number;
  results: SerpResult[];
  relatedSearches?: string[];
  cached: boolean;
  cacheExpiry?: Date;
}

export interface TrendingResult {
  topic: string;
  searchVolume?: number;
  trend?: string;
  relatedKeywords?: string[];
  category: string;
}

export interface InsightAnalysis {
  summary: string;
  keyFindings: string[];
  marketOpportunities: string[];
  competitorAnalysis?: string;
  contentGaps?: string[];
  recommendations: string[];
  confidenceScore: number;
}

export function isConfigured(): boolean {
  return !!SERP_API_KEY;
}

async function fetchFromSerpApi(params: Record<string, string>): Promise<any> {
  if (!isConfigured()) {
    throw new Error('SERP_API_KEY is not configured');
  }

  const url = new URL(SERP_API_BASE);
  url.searchParams.set('api_key', SERP_API_KEY!);
  url.searchParams.set('engine', 'google');
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function searchGoogle(
  query: string,
  userId: string,
  options: {
    market?: string;
    num?: number;
    skipCache?: boolean;
  } = {}
): Promise<{ result: SerpResponse; fromCache: boolean; creditCharged: boolean }> {
  const { market = 'us', num = 10, skipCache = false } = options;

  if (!skipCache) {
    const cached = await getCachedQuery(query, userId, market);
    if (cached) {
      return {
        result: {
          query,
          totalResults: (cached.serpResult as any)?.totalResults || 0,
          results: (cached.serpResult as any)?.results || [],
          relatedSearches: (cached.serpResult as any)?.relatedSearches,
          cached: true,
          cacheExpiry: cached.expiresAt || undefined,
        },
        fromCache: true,
        creditCharged: false,
      };
    }
  }

  const serpData = await fetchFromSerpApi({
    q: query,
    gl: market,
    num: num.toString(),
  });

  const results: SerpResult[] = (serpData.organic_results || []).map((r: any, index: number) => ({
    title: r.title || '',
    link: r.link || '',
    snippet: r.snippet || '',
    position: r.position || index + 1,
    source: r.source,
    date: r.date,
    thumbnail: r.thumbnail,
  }));

  const relatedSearches = (serpData.related_searches || []).map((r: any) => r.query);

  const serpResult = {
    totalResults: serpData.search_information?.total_results || results.length,
    results,
    relatedSearches,
  };

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);

  await db.insert(researchQueries).values({
    userId,
    query,
    market,
    serpResult,
    creditCost: 1,
    expiresAt,
  });

  return {
    result: {
      query,
      ...serpResult,
      cached: false,
    },
    fromCache: false,
    creditCharged: true,
  };
}

async function getCachedQuery(
  query: string,
  userId: string,
  market: string
): Promise<typeof researchQueries.$inferSelect | null> {
  const now = new Date();
  
  const cached = await db.select()
    .from(researchQueries)
    .where(
      and(
        eq(researchQueries.userId, userId),
        eq(researchQueries.query, query),
        eq(researchQueries.market, market),
        gte(researchQueries.expiresAt, now)
      )
    )
    .orderBy(desc(researchQueries.createdAt))
    .limit(1);

  return cached[0] || null;
}

export async function getTrendingTopics(
  category: string,
  options: { skipCache?: boolean } = {}
): Promise<TrendingResult[]> {
  const { skipCache = false } = options;

  if (!skipCache) {
    const cached = await getCachedTrending(category);
    if (cached.length > 0) {
      return cached.map(t => ({
        topic: t.topic,
        searchVolume: t.searchVolume || undefined,
        trend: t.trend || undefined,
        relatedKeywords: t.relatedKeywords || undefined,
        category: t.category,
      }));
    }
  }

  const trendingQuery = getTrendingQueryForCategory(category);
  
  const serpData = await fetchFromSerpApi({
    q: trendingQuery,
    engine: 'google_trends',
    data_type: 'RELATED_QUERIES',
  });

  const results: TrendingResult[] = [];
  
  const risingQueries = serpData.related_queries?.rising || [];
  const topQueries = serpData.related_queries?.top || [];

  for (const item of [...risingQueries.slice(0, 5), ...topQueries.slice(0, 5)]) {
    const topic = item.query || item.value;
    if (!topic) continue;

    results.push({
      topic,
      searchVolume: item.extracted_value || item.value,
      trend: risingQueries.includes(item) ? 'rising' : 'stable',
      category,
    });
  }

  if (results.length === 0) {
    const googleResults = await fetchFromSerpApi({
      q: `trending ${category} 2025`,
      num: '10',
    });

    for (const result of (googleResults.organic_results || []).slice(0, 10)) {
      results.push({
        topic: result.title,
        trend: 'stable',
        category,
      });
    }
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TRENDING_CACHE_HOURS);

  for (const result of results) {
    await db.insert(trendingTopics).values({
      category,
      topic: result.topic,
      searchVolume: result.searchVolume,
      trend: result.trend,
      relatedKeywords: result.relatedKeywords,
      source: 'serp',
      expiresAt,
    });
  }

  return results;
}

async function getCachedTrending(category: string): Promise<typeof trendingTopics.$inferSelect[]> {
  const now = new Date();
  
  return db.select()
    .from(trendingTopics)
    .where(
      and(
        eq(trendingTopics.category, category),
        gte(trendingTopics.expiresAt, now)
      )
    )
    .orderBy(desc(trendingTopics.fetchedAt))
    .limit(20);
}

function getTrendingQueryForCategory(category: string): string {
  const queries: Record<string, string> = {
    books: 'best books to read',
    music: 'trending music',
    courses: 'popular online courses',
    movies: 'trending movies',
  };
  return queries[category.toLowerCase()] || `trending ${category}`;
}

export async function analyzeSearchResults(
  results: SerpResult[],
  query: string,
  context?: string
): Promise<InsightAnalysis> {
  const resultsContext = results.slice(0, 10).map((r, i) => 
    `${i + 1}. "${r.title}"\n   URL: ${r.link}\n   Snippet: ${r.snippet}`
  ).join('\n\n');

  const prompt = `Analyze these Google search results for the query "${query}"${context ? ` in the context of ${context}` : ''}:

${resultsContext}

Provide a structured analysis with:
1. Summary: A brief overview of what these results reveal about the search landscape
2. Key Findings: 3-5 important insights from the results
3. Market Opportunities: What gaps or opportunities do you see?
4. Content Gaps: What content seems to be missing that could be created?
5. Recommendations: 3-5 actionable recommendations based on this analysis
6. Confidence Score: Rate your confidence in this analysis from 0-100

Format your response as JSON with keys: summary, keyFindings (array), marketOpportunities (array), contentGaps (array), recommendations (array), confidenceScore (number)`;

  const response = await generateCoachResponse(prompt, [], "creative assistant");
  
  try {
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || 'Analysis completed',
        keyFindings: parsed.keyFindings || [],
        marketOpportunities: parsed.marketOpportunities || [],
        competitorAnalysis: parsed.competitorAnalysis,
        contentGaps: parsed.contentGaps || [],
        recommendations: parsed.recommendations || [],
        confidenceScore: parsed.confidenceScore || 70,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI analysis:', e);
  }

  return {
    summary: response.response.slice(0, 500),
    keyFindings: [],
    marketOpportunities: [],
    contentGaps: [],
    recommendations: [],
    confidenceScore: 50,
  };
}

export async function getResearchHistory(
  userId: string,
  limit: number = 50
): Promise<typeof researchQueries.$inferSelect[]> {
  return db.select()
    .from(researchQueries)
    .where(eq(researchQueries.userId, userId))
    .orderBy(desc(researchQueries.createdAt))
    .limit(limit);
}

export async function saveInsightsToQuery(
  queryId: number,
  insights: InsightAnalysis
): Promise<void> {
  await db.update(researchQueries)
    .set({
      insights,
      insightScore: insights.confidenceScore,
    })
    .where(eq(researchQueries.id, queryId));
}
