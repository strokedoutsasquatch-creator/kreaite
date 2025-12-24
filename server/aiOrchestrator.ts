import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import crypto from "crypto";
import { db } from "./db";
import { aiProviderUsage } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

// Provider configurations with cost per 1M tokens (in cents)
const PROVIDER_COSTS = {
  "gemini-2.5-flash": { input: 35, output: 105 },      // $0.35/$1.05 per 1M - PRIMARY WORKHORSE
  "gemini-2.5-pro": { input: 125, output: 500 },       // $1.25/$5.00 per 1M - Complex reasoning
  "gpt-5-mini": { input: 150, output: 600 },           // $1.50/$6.00 per 1M - Quality refinement
  "gpt-5-nano": { input: 10, output: 40 },             // $0.10/$0.40 per 1M - Ultra cheap tasks
  "gpt-4o-mini": { input: 15, output: 60 },            // $0.15/$0.60 per 1M - Fallback cheap
} as const;

// Task complexity routing
type TaskType = 
  | "outline"           // Book/chapter outlines - CHEAP
  | "draft"             // First draft content - CHEAP
  | "expand"            // Expand content - MEDIUM
  | "refine"            // Quality refinement - PREMIUM
  | "research"          // Research synthesis - MEDIUM
  | "marketing"         // Marketing copy - CHEAP
  | "screenplay"        // Screenplay writing - MEDIUM
  | "course"            // Course content - CHEAP
  | "chat"              // Interactive chat - CHEAP
  | "compliance"        // Medical/legal review - PREMIUM
  | "image_prompt";     // Image generation prompts - CHEAP

const TASK_TO_MODEL: Record<TaskType, string> = {
  outline: "gemini-2.5-flash",
  draft: "gemini-2.5-flash",
  expand: "gemini-2.5-flash",
  refine: "gpt-5-mini",
  research: "gemini-2.5-flash",
  marketing: "gemini-2.5-flash",
  screenplay: "gemini-2.5-flash",
  course: "gemini-2.5-flash",
  chat: "gemini-2.5-flash",
  compliance: "gpt-5-mini",
  image_prompt: "gpt-5-nano",
};

// In-memory cache with TTL
interface CacheEntry {
  response: string;
  timestamp: number;
  tokens: { input: number; output: number };
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Initialize clients
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Generate cache key from prompt hash
function getCacheKey(prompt: string, systemPrompt: string, model: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(prompt + systemPrompt + model);
  return hash.digest("hex").substring(0, 32);
}

// Clean expired cache entries
function cleanCache() {
  const now = Date.now();
  const entries = Array.from(responseCache.entries());
  for (const [key, entry] of entries) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}

// Estimate tokens (rough approximation: 1 token ≈ 4 chars)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Track usage in database
async function trackUsage(
  userId: string | null,
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  operation: string,
  cached: boolean
) {
  const costs = PROVIDER_COSTS[model as keyof typeof PROVIDER_COSTS] || { input: 100, output: 400 };
  const costCents = Math.ceil(
    (inputTokens * costs.input + outputTokens * costs.output) / 1000000
  );

  try {
    await db.insert(aiProviderUsage).values({
      userId: userId || undefined,
      provider,
      model,
      operation,
      inputTokens,
      outputTokens,
      costCents,
      cached,
    });
  } catch (error) {
    console.error("Failed to track AI usage:", error);
  }
}

// Get user's daily token usage
async function getDailyUsage(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${aiProviderUsage.inputTokens} + ${aiProviderUsage.outputTokens}), 0)`,
    })
    .from(aiProviderUsage)
    .where(
      and(
        eq(aiProviderUsage.userId, userId),
        gte(aiProviderUsage.createdAt, today)
      )
    );

  return result[0]?.total || 0;
}

// Main generation interface
export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  taskType: TaskType;
  userId?: string;
  maxTokens?: number;
  temperature?: number;
  forceModel?: string;
  skipCache?: boolean;
  jsonMode?: boolean;
}

export interface GenerateResult {
  content: string;
  model: string;
  cached: boolean;
  tokens: { input: number; output: number };
  costCents: number;
}

// Unified AI generation with smart routing
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const {
    prompt,
    systemPrompt = "",
    taskType,
    userId,
    maxTokens = 4096,
    temperature = 0.7,
    forceModel,
    skipCache = false,
    jsonMode = false,
  } = options;

  // Check daily budget if user specified (150k tokens/day default)
  if (userId) {
    const dailyUsage = await getDailyUsage(userId);
    const DAILY_LIMIT = 150000;
    if (dailyUsage > DAILY_LIMIT) {
      throw new Error("Daily token limit exceeded. Limit resets at midnight.");
    }
  }

  // Select model based on task type or force override
  const model = forceModel || TASK_TO_MODEL[taskType];
  const isGemini = model.startsWith("gemini");

  // Check cache first
  const cacheKey = getCacheKey(prompt, systemPrompt, model);
  if (!skipCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      await trackUsage(userId || null, isGemini ? "gemini" : "openai", model, 0, 0, taskType, true);
      return {
        content: cached.response,
        model,
        cached: true,
        tokens: cached.tokens,
        costCents: 0,
      };
    }
  }

  // Clean cache periodically
  if (Math.random() < 0.01) cleanCache();

  let content: string;
  let inputTokens: number;
  let outputTokens: number;

  try {
    if (isGemini) {
      // Use Gemini
      const contents = [];
      if (systemPrompt) {
        contents.push({ role: "user" as const, parts: [{ text: systemPrompt }] });
        contents.push({ role: "model" as const, parts: [{ text: "Understood. I'll follow these instructions." }] });
      }
      contents.push({ role: "user" as const, parts: [{ text: prompt }] });

      const response = await gemini.models.generateContent({
        model,
        contents,
        config: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      });

      content = response.text || "";
      inputTokens = estimateTokens(systemPrompt + prompt);
      outputTokens = estimateTokens(content);
    } else {
      // Use OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await openai.chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: "json_object" } }),
      });

      content = response.choices[0]?.message?.content || "";
      inputTokens = response.usage?.prompt_tokens || estimateTokens(systemPrompt + prompt);
      outputTokens = response.usage?.completion_tokens || estimateTokens(content);
    }
  } catch (error) {
    console.error(`AI generation failed with ${model}:`, error);
    
    // Fallback to alternative provider
    const fallbackModel = isGemini ? "gpt-4o-mini" : "gemini-2.5-flash";
    console.log(`Falling back to ${fallbackModel}`);
    
    return generate({
      ...options,
      forceModel: fallbackModel,
      skipCache: true,
    });
  }

  // Calculate cost
  const costs = PROVIDER_COSTS[model as keyof typeof PROVIDER_COSTS] || { input: 100, output: 400 };
  const costCents = Math.ceil(
    (inputTokens * costs.input + outputTokens * costs.output) / 1000000
  );

  // Cache the response
  if (!skipCache) {
    responseCache.set(cacheKey, {
      response: content,
      timestamp: Date.now(),
      tokens: { input: inputTokens, output: outputTokens },
    });
  }

  // Track usage
  await trackUsage(userId || null, isGemini ? "gemini" : "openai", model, inputTokens, outputTokens, taskType, false);

  return {
    content,
    model,
    cached: false,
    tokens: { input: inputTokens, output: outputTokens },
    costCents,
  };
}

// Streaming generation for real-time content
export async function generateStream(
  options: GenerateOptions,
  onChunk: (chunk: string) => void
): Promise<GenerateResult> {
  const {
    prompt,
    systemPrompt = "",
    taskType,
    userId,
    maxTokens = 4096,
    temperature = 0.7,
    forceModel,
  } = options;

  const model = forceModel || TASK_TO_MODEL[taskType];
  const isGemini = model.startsWith("gemini");

  let content = "";
  let inputTokens: number;
  let outputTokens: number;

  try {
    if (isGemini) {
      const contents = [];
      if (systemPrompt) {
        contents.push({ role: "user" as const, parts: [{ text: systemPrompt }] });
        contents.push({ role: "model" as const, parts: [{ text: "Understood." }] });
      }
      contents.push({ role: "user" as const, parts: [{ text: prompt }] });

      const response = await gemini.models.generateContentStream({
        model,
        contents,
        config: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      });

      for await (const chunk of response) {
        const text = chunk.text || "";
        content += text;
        onChunk(text);
      }

      inputTokens = estimateTokens(systemPrompt + prompt);
      outputTokens = estimateTokens(content);
    } else {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const stream = await openai.chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        content += text;
        onChunk(text);
      }

      inputTokens = estimateTokens(systemPrompt + prompt);
      outputTokens = estimateTokens(content);
    }
  } catch (error) {
    console.error(`Streaming failed with ${model}:`, error);
    throw error;
  }

  const costs = PROVIDER_COSTS[model as keyof typeof PROVIDER_COSTS] || { input: 100, output: 400 };
  const costCents = Math.ceil(
    (inputTokens * costs.input + outputTokens * costs.output) / 1000000
  );

  await trackUsage(userId || null, isGemini ? "gemini" : "openai", model, inputTokens, outputTokens, taskType, false);

  return {
    content,
    model,
    cached: false,
    tokens: { input: inputTokens, output: outputTokens },
    costCents,
  };
}

// Batch processing for multiple chapters/sections
export async function generateBatch(
  items: { id: string; prompt: string }[],
  options: Omit<GenerateOptions, "prompt">,
  onProgress?: (completed: number, total: number, id: string) => void
): Promise<Map<string, GenerateResult>> {
  const results = new Map<string, GenerateResult>();
  const concurrency = 3;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const promises = batch.map(async (item) => {
      const result = await generate({ ...options, prompt: item.prompt });
      results.set(item.id, result);
      onProgress?.(results.size, items.length, item.id);
      return result;
    });

    await Promise.all(promises);
  }

  return results;
}

// Content-specific generation functions

// Book content generation
export const bookGenerator = {
  async generateOutline(
    title: string,
    genre: string,
    description: string,
    chapterCount: number = 12,
    userId?: string
  ): Promise<GenerateResult> {
    const prompt = `Create a detailed book outline for:
Title: "${title}"
Genre: ${genre}
Description: ${description}

Generate exactly ${chapterCount} chapters with:
1. Chapter title
2. 3-5 key scenes/sections per chapter
3. Brief summary (2-3 sentences)
4. Emotional arc for the chapter

Format as JSON: { "chapters": [{ "number": 1, "title": "", "scenes": [], "summary": "", "emotionalArc": "" }] }`;

    return generate({
      prompt,
      taskType: "outline",
      userId,
      jsonMode: true,
      systemPrompt: "You are a bestselling author and story architect. Create compelling, well-structured book outlines.",
    });
  },

  async generateChapter(
    bookTitle: string,
    chapterNumber: number,
    chapterTitle: string,
    outline: string,
    previousContext: string,
    targetWords: number = 3000,
    userId?: string
  ): Promise<GenerateResult> {
    const prompt = `Write Chapter ${chapterNumber}: "${chapterTitle}" for the book "${bookTitle}".

Outline for this chapter:
${outline}

Previous context:
${previousContext || "This is the first chapter."}

Write approximately ${targetWords} words. Include:
- Vivid sensory details
- Natural dialogue
- Strong emotional beats
- Clear scene transitions
- Engaging opening and compelling ending

Write the full chapter content now:`;

    return generate({
      prompt,
      taskType: "draft",
      userId,
      maxTokens: Math.min(8192, Math.ceil(targetWords * 1.5)),
      systemPrompt: "You are a masterful novelist. Write compelling, immersive prose that captivates readers.",
    });
  },

  async refineContent(
    content: string,
    instructions: string,
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Refine the following content according to these instructions:

Instructions: ${instructions}

Content to refine:
${content}

Provide the refined version:`,
      taskType: "refine",
      userId,
      maxTokens: 8192,
      systemPrompt: "You are an expert editor. Improve prose quality, fix issues, and enhance readability while preserving the author's voice.",
    });
  },
};

// Marketing content generation
export const marketingGenerator = {
  async generateBookBlurb(
    title: string,
    genre: string,
    synopsis: string,
    targetAudience: string,
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Create a compelling book blurb for:
Title: "${title}"
Genre: ${genre}
Synopsis: ${synopsis}
Target Audience: ${targetAudience}

Write 3 versions:
1. Short (50 words) - for social media
2. Medium (150 words) - for Amazon/retailers
3. Long (250 words) - for author website

Format as JSON: { "short": "", "medium": "", "long": "" }`,
      taskType: "marketing",
      userId,
      jsonMode: true,
      systemPrompt: "You are an expert book marketer. Write compelling, hook-driven copy that sells.",
    });
  },

  async generateSocialPosts(
    bookTitle: string,
    blurb: string,
    platforms: string[],
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Create social media posts for the book "${bookTitle}":
Blurb: ${blurb}

Create posts for: ${platforms.join(", ")}

For each platform, provide:
- 3 different post variations
- Relevant hashtags
- Best time to post suggestion

Format as JSON: { "platform": [{ "post": "", "hashtags": [], "timing": "" }] }`,
      taskType: "marketing",
      userId,
      jsonMode: true,
      systemPrompt: "You are a social media marketing expert specializing in book launches.",
    });
  },
};

// Screenplay generation
export const screenplayGenerator = {
  async generateTreatment(
    title: string,
    logline: string,
    genre: string,
    targetLength: string,
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Create a screenplay treatment for:
Title: "${title}"
Logline: ${logline}
Genre: ${genre}
Target Length: ${targetLength}

Include:
1. Opening image and hook
2. Act I setup (characters, world, inciting incident)
3. Act II confrontation (rising action, midpoint, complications)
4. Act III resolution (climax, resolution, final image)
5. Key character arcs
6. Major set pieces

Write a detailed 2-3 page treatment:`,
      taskType: "screenplay",
      userId,
      maxTokens: 4096,
      systemPrompt: "You are an experienced screenwriter. Create compelling visual stories with strong structure.",
    });
  },

  async generateScene(
    context: string,
    sceneDescription: string,
    characters: string[],
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Write a screenplay scene:
Context: ${context}
Scene: ${sceneDescription}
Characters: ${characters.join(", ")}

Format in proper screenplay format with:
- Scene heading (INT./EXT. LOCATION - TIME)
- Action lines
- Character names (centered, caps)
- Dialogue (indented)
- Parentheticals where needed

Write the complete scene:`,
      taskType: "screenplay",
      userId,
      maxTokens: 2048,
      systemPrompt: "You are a professional screenwriter. Write visually compelling scenes with sharp dialogue.",
    });
  },
};

// Course content generation
export const courseGenerator = {
  async generateCurriculum(
    courseName: string,
    description: string,
    targetAudience: string,
    duration: string,
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Create a comprehensive course curriculum for:
Course: "${courseName}"
Description: ${description}
Target Audience: ${targetAudience}
Duration: ${duration}

Generate:
1. Course overview and learning objectives
2. Module breakdown (6-12 modules)
3. For each module:
   - Title and description
   - 3-5 lessons with titles
   - Key takeaways
   - Assignments/exercises
4. Assessment strategy
5. Bonus materials suggestions

Format as JSON with full structure.`,
      taskType: "course",
      userId,
      jsonMode: true,
      maxTokens: 4096,
      systemPrompt: "You are an instructional designer. Create engaging, effective learning experiences.",
    });
  },

  async generateLesson(
    moduleName: string,
    lessonTitle: string,
    learningObjectives: string[],
    duration: number,
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Create lesson content for:
Module: ${moduleName}
Lesson: "${lessonTitle}"
Learning Objectives: ${learningObjectives.join("; ")}
Duration: ${duration} minutes

Include:
1. Engaging introduction/hook
2. Core content with examples
3. Key concepts explained clearly
4. Practical exercises
5. Summary and next steps
6. Quiz questions (3-5)

Write the complete lesson content:`,
      taskType: "course",
      userId,
      maxTokens: 4096,
      systemPrompt: "You are an expert educator. Create clear, engaging, and practical learning content.",
    });
  },
};

// Research synthesis
export const researchGenerator = {
  async synthesize(
    topic: string,
    sources: string[],
    outputFormat: "summary" | "report" | "article",
    userId?: string
  ): Promise<GenerateResult> {
    return generate({
      prompt: `Synthesize research on: "${topic}"

Sources/Information:
${sources.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Create a ${outputFormat} that:
1. Identifies key themes and findings
2. Highlights consensus and disagreements
3. Notes gaps in current knowledge
4. Provides actionable insights
5. Cites sources appropriately

Write the ${outputFormat}:`,
      taskType: "research",
      userId,
      maxTokens: 4096,
      systemPrompt: "You are a research analyst. Synthesize complex information into clear, actionable insights.",
    });
  },
};

// Get usage statistics
export async function getUsageStats(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await db
    .select({
      provider: aiProviderUsage.provider,
      model: aiProviderUsage.model,
      totalInputTokens: sql<number>`SUM(${aiProviderUsage.inputTokens})`,
      totalOutputTokens: sql<number>`SUM(${aiProviderUsage.outputTokens})`,
      totalCostCents: sql<number>`SUM(${aiProviderUsage.costCents})`,
      cachedRequests: sql<number>`SUM(CASE WHEN ${aiProviderUsage.cached} THEN 1 ELSE 0 END)`,
      totalRequests: sql<number>`COUNT(*)`,
    })
    .from(aiProviderUsage)
    .where(
      and(
        eq(aiProviderUsage.userId, userId),
        gte(aiProviderUsage.createdAt, startDate)
      )
    )
    .groupBy(aiProviderUsage.provider, aiProviderUsage.model);

  return stats;
}

export { PROVIDER_COSTS, TASK_TO_MODEL };
