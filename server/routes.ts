import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { stripeService } from "./stripeService";
import { getStripeSync, getStripePublishableKey } from "./stripeClient";
import { runMigrations } from "stripe-replit-sync";
import { generateCoachResponse, getRandomQuote } from "./geminiService";
import { searchAmazonProducts, getAmazonProduct, isConfigured as isAmazonConfigured } from "./amazonService";
import { generateInstrumental, buildMusicPrompt, isLyriaConfigured, estimateCost } from "./lyriaService";
import { synthesizeSpeech, createVoiceClone, synthesizeWithClone, listVoices, isVoiceServiceConfigured, getVoiceStyles, getCharacterPresets, getGoogleVoices } from "./voiceService";
import { generateImage, generateMovieScript, generateStoryboard, isVideoServiceConfigured, getMovieStyles, movieStyles } from "./videoService";
import { createGoogleDoc, getGoogleDoc, updateGoogleDoc, createGoogleSlides, createGoogleSheet, createGoogleForm, exportDocument, isGoogleWorkspaceConfigured, getWorkspaceStatus } from "./googleWorkspaceService";
import { synthesizeSpeechTTS, synthesizeChapter, audiobookStyles, narratorVoices, estimateAudioDuration, estimateTTSCost, isTTSConfigured } from "./textToSpeechService";
import { getAllPresets, getMusicalScales, getMusicalKeys, calculateSyncedDelay } from "./audioProcessingService";
import { seedRecoveryData } from "./seedRecoveryData";
import { generate, generateStream, bookGenerator, marketingGenerator, screenplayGenerator, courseGenerator, researchGenerator, getUsageStats } from "./aiOrchestrator";
import { 
  generateChildStoryRequestSchema,
  generateCharacterPromptRequestSchema,
  generatePageIllustrationRequestSchema,
  rhymeConvertRequestSchema,
  readAloudAnalyzeRequestSchema,
  voiceClones,
  djPresets,
  audiobookProjects,
  audiobookChapters,
  mediaProjects,
  mediaAssets
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  generateCompleteScript, 
  generateSceneStoryboard, 
  synthesizeSceneDialogue,
  createMovieProductionPipeline,
  getCharacterVoiceOptions,
  getMovieGenreOptions
} from './movieStudioService';
import {
  createWorkflow,
  startWorkflow,
  getWorkflowStatus,
  estimateWorkflowCost,
  getAvailableWorkflows,
  cancelWorkflow,
  resumeWorkflow
} from './orchestrationService';

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not found, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stroke Recovery OS',
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve stock images from attached_assets
  app.use('/stock_images', express.static(path.join(process.cwd(), 'attached_assets', 'stock_images')));
  
  // Setup authentication
  await setupAuth(app);
  
  // Initialize Stripe
  await initStripe();

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json(null);
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stripe routes
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Error getting publishable key:", error);
      res.status(500).json({ message: "Failed to get publishable key" });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const products = await stripeService.listProducts();
      res.json({ data: products });
    } catch (error) {
      console.error("Error listing products:", error);
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.get('/api/products-with-prices', async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }
      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error listing products with prices:", error);
      res.status(500).json({ message: "Failed to list products with prices" });
    }
  });

  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { priceId, mode = 'payment' } = req.body;
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', user.id);
        await stripeService.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${req.protocol}://${req.get('host')}/checkout/success`,
        `${req.protocol}://${req.get('host')}/checkout/cancel`,
        mode
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  app.post('/api/customer-portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${req.protocol}://${req.get('host')}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      res.status(500).json({ message: "Failed to create customer portal session" });
    }
  });

  // ============================================================================
  // STRIPE CONNECT - Creator Onboarding & Payouts
  // ============================================================================

  // Create Connect account and get onboarding link
  app.post('/api/stripe/connect/onboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const returnUrl = `${req.protocol}://${req.get('host')}/creator/earnings`;
      const result = await stripeService.createConnectAccount(userId, user.email || '', returnUrl);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error creating Connect account:", error);
      res.status(500).json({ message: error.message || "Failed to create Connect account" });
    }
  });

  // Get Connect account status
  app.get('/api/stripe/connect/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await stripeService.getConnectAccountStatus(userId);
      res.json(status);
    } catch (error: any) {
      console.error("Error getting Connect status:", error);
      res.status(500).json({ message: error.message || "Failed to get Connect status" });
    }
  });

  // Get Connect dashboard login link
  app.get('/api/stripe/connect/login', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const url = await stripeService.createConnectLoginLink(userId);
      res.json({ url });
    } catch (error: any) {
      console.error("Error creating Connect login link:", error);
      res.status(500).json({ message: error.message || "Failed to create login link" });
    }
  });

  // Get creator earnings
  app.get('/api/creator/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = await stripeService.getCreatorEarnings(userId);
      res.json(data);
    } catch (error: any) {
      console.error("Error getting creator earnings:", error);
      res.status(500).json({ message: error.message || "Failed to get earnings" });
    }
  });

  // Get creator payouts
  app.get('/api/creator/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payouts = await stripeService.getCreatorPayouts(userId);
      res.json(payouts);
    } catch (error: any) {
      console.error("Error getting creator payouts:", error);
      res.status(500).json({ message: error.message || "Failed to get payouts" });
    }
  });

  // Request payout transfer
  app.post('/api/creator/payouts/transfer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { earningIds } = req.body;
      
      if (!earningIds?.length) {
        return res.status(400).json({ message: "Earning IDs required" });
      }

      const payout = await stripeService.transferToCreator(userId, earningIds);
      res.json(payout);
    } catch (error: any) {
      console.error("Error transferring to creator:", error);
      res.status(500).json({ message: error.message || "Failed to transfer funds" });
    }
  });

  // Forum routes
  app.get('/api/forum/categories', async (req, res) => {
    try {
      const categories = await storage.getForumCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching forum categories:", error);
      res.status(500).json({ message: "Failed to fetch forum categories" });
    }
  });

  app.get('/api/forum/threads', async (req, res) => {
    try {
      const { categoryId, limit = '20', offset = '0' } = req.query;
      const threads = await storage.getForumThreads(
        categoryId ? parseInt(categoryId as string) : undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(threads);
    } catch (error) {
      console.error("Error fetching forum threads:", error);
      res.status(500).json({ message: "Failed to fetch forum threads" });
    }
  });

  app.get('/api/forum/threads/:id', async (req, res) => {
    try {
      const thread = await storage.getForumThread(parseInt(req.params.id));
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      res.json(thread);
    } catch (error) {
      console.error("Error fetching forum thread:", error);
      res.status(500).json({ message: "Failed to fetch forum thread" });
    }
  });

  app.post('/api/forum/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId, title, content } = req.body;
      
      const thread = await storage.createForumThread({
        categoryId,
        authorId: userId,
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        isPinned: false,
        isLocked: false,
      });

      await storage.createForumPost({
        threadId: thread.id,
        authorId: userId,
        content,
      });

      res.json(thread);
    } catch (error) {
      console.error("Error creating forum thread:", error);
      res.status(500).json({ message: "Failed to create forum thread" });
    }
  });

  app.post('/api/forum/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { threadId, content } = req.body;
      
      const post = await storage.createForumPost({
        threadId,
        authorId: userId,
        content,
      });

      res.json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  // Get posts for a thread
  app.get('/api/forum/threads/:id/posts', async (req, res) => {
    try {
      const { limit = '50', offset = '0' } = req.query;
      const posts = await storage.getForumPosts(
        parseInt(req.params.id),
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  // Update a post (author or moderator)
  app.patch('/api/forum/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await storage.getUser(userId);
      if (post.authorId !== userId && !['moderator', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }
      
      const updatedPost = await storage.updateForumPost(postId, content);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating forum post:", error);
      res.status(500).json({ message: "Failed to update forum post" });
    }
  });

  // Delete a post (author or moderator)
  app.delete('/api/forum/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await storage.getUser(userId);
      if (post.authorId !== userId && !['moderator', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      await storage.deleteForumPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting forum post:", error);
      res.status(500).json({ message: "Failed to delete forum post" });
    }
  });

  // React to a post
  app.post('/api/forum/posts/:id/react', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const { reactionType = 'like' } = req.body;
      
      const result = await storage.togglePostReaction(postId, userId, reactionType);
      res.json(result);
    } catch (error) {
      console.error("Error reacting to post:", error);
      res.status(500).json({ message: "Failed to react to post" });
    }
  });

  // Get reactions for a post
  app.get('/api/forum/posts/:id/reactions', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const reactions = await storage.getPostReactions(postId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Moderation: Lock/unlock thread
  app.patch('/api/forum/threads/:id/moderate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!['moderator', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Moderator access required" });
      }
      
      const { isPinned, isLocked } = req.body;
      const thread = await storage.updateForumThread(parseInt(req.params.id), { isPinned, isLocked });
      res.json(thread);
    } catch (error) {
      console.error("Error moderating thread:", error);
      res.status(500).json({ message: "Failed to moderate thread" });
    }
  });

  // Delete thread (moderator only)
  app.delete('/api/forum/threads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!['moderator', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Moderator access required" });
      }
      
      await storage.deleteForumThread(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting thread:", error);
      res.status(500).json({ message: "Failed to delete thread" });
    }
  });

  // Admin: Create category
  app.post('/api/forum/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const category = await storage.createForumCategory(req.body);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Admin: Update category
  app.patch('/api/forum/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const category = await storage.updateForumCategory(parseInt(req.params.id), req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Admin: Delete category
  app.delete('/api/forum/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.deleteForumCategory(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Get category stats
  app.get('/api/forum/stats', async (req, res) => {
    try {
      const stats = await storage.getCategoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin: Update user role
  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { role } = req.body;
      if (!['member', 'subscriber', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Books routes
  app.get('/api/books', async (req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get('/api/books/:slug', async (req, res) => {
    try {
      const book = await storage.getBookBySlug(req.params.slug);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  // AI Creator Scribe routes
  app.post('/api/creator/chat', async (req, res) => {
    try {
      const { message, history = [], context = "creative assistant" } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const result = await generateCoachResponse(message, history, context);
      res.json(result);
    } catch (error) {
      console.error("Error in creator chat:", error);
      res.status(500).json({ 
        response: "Writer's block! I'm having trouble connecting right now, but don't let that stop your flow. Keep creating!",
        quote: getRandomQuote()
      });
    }
  });

  // AI Coach routes (Stroked Out Sasquatch)
  app.post('/api/coach/chat', async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const result = await generateCoachResponse(message, history);
      res.json(result);
    } catch (error) {
      console.error("Error in coach chat:", error);
      res.status(500).json({ 
        response: "Keep pushing, survivor! Technical difficulties won't stop your comeback!",
        quote: getRandomQuote()
      });
    }
  });

  app.get('/api/coach/quote', async (req, res) => {
    try {
      res.json({ quote: getRandomQuote() });
    } catch (error) {
      console.error("Error getting quote:", error);
      res.status(500).json({ quote: "Your recovery is possible. Your story matters." });
    }
  });

  // ============================================================================
  // STROKE LYFE MUSIC STUDIO API
  // ============================================================================

  // Generate lyrics using Gemini
  app.post('/api/music/generate-lyrics', isAuthenticated, async (req: any, res) => {
    try {
      const { genre, theme, mood } = req.body;
      
      const prompt = `You are a professional songwriter. Write original song lyrics for a ${genre} song about ${theme}. 
The mood should be ${mood}.

Format the lyrics with clear sections like:
[Verse 1]
...lyrics...

[Chorus]
...lyrics...

[Verse 2]
...lyrics...

[Bridge]
...lyrics...

[Chorus]
...lyrics...

Make the lyrics powerful, emotional, and authentic to the ${genre} genre. 
The theme is stroke recovery - rising from adversity, proving doubters wrong, reclaiming your life.
Include recovery metaphors and triumphant imagery.`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ lyrics: result.response });
    } catch (error) {
      console.error("Error generating lyrics:", error);
      res.status(500).json({ message: "Failed to generate lyrics" });
    }
  });

  // Generate instrumental using Vertex AI Lyria
  app.post('/api/music/generate-instrumental', isAuthenticated, async (req: any, res) => {
    try {
      const { genre, bpm, key, scale, description, seed } = req.body;
      
      if (!isLyriaConfigured()) {
        // Fallback: Return prompt for manual generation
        const { prompt, negativePrompt } = buildMusicPrompt(genre, bpm || 120, key || 'C', scale || 'minor', description);
        return res.json({
          success: false,
          message: "Lyria not configured. Use this prompt with Vertex AI Media Studio:",
          prompt,
          negativePrompt,
          estimatedCost: estimateCost(1)
        });
      }
      
      const result = await generateInstrumental(
        genre,
        bpm || 120,
        key || 'C',
        scale || 'minor',
        description,
        seed
      );
      
      if (result.success && result.audioBase64) {
        res.json({
          success: true,
          audioBase64: result.audioBase64,
          mimeType: result.mimeType,
          prompt: result.prompt,
          estimatedCost: estimateCost(1)
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || "Failed to generate instrumental",
          prompt: result.prompt
        });
      }
    } catch (error) {
      console.error("Error generating instrumental:", error);
      res.status(500).json({ message: "Failed to generate instrumental" });
    }
  });

  // Check Lyria configuration status
  app.get('/api/music/status', async (req, res) => {
    res.json({
      lyriaConfigured: isLyriaConfigured(),
      voiceConfigured: isVoiceServiceConfigured(),
      videoConfigured: isVideoServiceConfigured(),
      estimatedCostPer30Seconds: 0.06
    });
  });

  // ============================================================================
  // GOOGLE WORKSPACE INTEGRATION API
  // ============================================================================

  // Check Google Workspace configuration status
  app.get('/api/workspace/status', async (req, res) => {
    res.json({
      configured: isGoogleWorkspaceConfigured(),
      services: getWorkspaceStatus(),
      ttsConfigured: isTTSConfigured()
    });
  });

  // Create a new Google Doc for book writing
  app.post('/api/workspace/docs/create', isAuthenticated, async (req: any, res) => {
    try {
      const { title, content, templateId } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      const doc = await createGoogleDoc({ title, content, templateId });
      res.json(doc);
    } catch (error) {
      console.error("Error creating Google Doc:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Get Google Doc content
  app.get('/api/workspace/docs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const doc = await getGoogleDoc(req.params.id);
      res.json(doc);
    } catch (error) {
      console.error("Error getting Google Doc:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  // Update Google Doc content
  app.patch('/api/workspace/docs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      const success = await updateGoogleDoc(req.params.id, content);
      res.json({ success });
    } catch (error) {
      console.error("Error updating Google Doc:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Create Google Slides presentation
  app.post('/api/workspace/slides/create', isAuthenticated, async (req: any, res) => {
    try {
      const { title, slides } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      const presentation = await createGoogleSlides({ title, slides });
      res.json(presentation);
    } catch (error) {
      console.error("Error creating presentation:", error);
      res.status(500).json({ message: "Failed to create presentation" });
    }
  });

  // Create Google Sheet
  app.post('/api/workspace/sheets/create', isAuthenticated, async (req: any, res) => {
    try {
      const { title, sheets } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      const spreadsheet = await createGoogleSheet({ title, sheets });
      res.json(spreadsheet);
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      res.status(500).json({ message: "Failed to create spreadsheet" });
    }
  });

  // Create Google Form for quizzes
  app.post('/api/workspace/forms/create', isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, questions } = req.body;
      if (!title || !questions) {
        return res.status(400).json({ message: "Title and questions are required" });
      }
      const form = await createGoogleForm({ title, description, questions });
      res.json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      res.status(500).json({ message: "Failed to create form" });
    }
  });

  // Export document to various formats
  app.get('/api/workspace/export/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { format = 'pdf', type = 'document' } = req.query;
      const result = await exportDocument(req.params.id, format as any, type as any);
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      console.error("Error exporting document:", error);
      res.status(500).json({ message: "Failed to export document" });
    }
  });

  // ============================================================================
  // TEXT-TO-SPEECH / AUDIOBOOK NARRATION API
  // ============================================================================

  // Get available narrator voices
  app.get('/api/tts/voices', async (req, res) => {
    res.json({
      voices: audiobookStyles,
      configured: isTTSConfigured()
    });
  });

  // Synthesize text to speech
  app.post('/api/tts/synthesize', isAuthenticated, async (req: any, res) => {
    try {
      const { text, voiceId, speakingRate } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const result = await synthesizeChapter(text, voiceId, speakingRate);
      
      if (result.success) {
        res.json({
          success: true,
          audioBase64: result.audioBase64,
          mimeType: result.mimeType,
          estimatedDuration: estimateAudioDuration(text, speakingRate || 1.0),
          estimatedCost: estimateTTSCost(text.length)
        });
      } else {
        res.status(500).json({ success: false, message: result.error });
      }
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      res.status(500).json({ message: "Failed to synthesize speech" });
    }
  });

  // Estimate audiobook costs
  app.post('/api/tts/estimate', async (req, res) => {
    try {
      const { text, speakingRate } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      res.json({
        characterCount: text.length,
        estimatedDurationSeconds: estimateAudioDuration(text, speakingRate || 1.0),
        estimatedCost: estimateTTSCost(text.length)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to estimate" });
    }
  });

  // ============ BOOK STUDIO CHAT ANALYSIS ROUTES ============
  
  // Interactive AI chat for manuscript analysis
  app.post('/api/book/chat-analyze', async (req, res) => {
    try {
      const { message, content, fileName, bookTitle, genre, targetAudience, chatHistory, isInitialAnalysis } = req.body;
      
      let systemPrompt = `You are an expert book editor and publishing consultant for Stroke Lyfe Publishing. 
You help authors analyze and improve their manuscripts, especially recovery memoirs and self-help books.
You provide actionable, encouraging feedback while maintaining high editorial standards.
Keep responses conversational but substantive. Use markdown formatting for clarity.
Focus on what makes the content strong and specific improvements.`;

      let userPrompt = '';
      
      if (isInitialAnalysis && content) {
        const wordCount = content.split(/\s+/).length;
        const estimatedPages = Math.ceil(wordCount / 250);
        
        userPrompt = `I just received a manuscript upload. Here are the details:
- File: ${fileName || 'manuscript.txt'}
- Word count: ${wordCount.toLocaleString()} words
- Estimated pages: ~${estimatedPages} pages
- Genre: ${genre || 'memoir'}

Here's a sample of the content (first 10,000 characters):
"""
${content.substring(0, 10000)}
"""

Please provide an initial analysis including:
1. **First Impressions** - What stands out immediately
2. **Voice & Tone** - How does the author's voice come across
3. **Structure Assessment** - How is it organized
4. **Strengths** - What's working well
5. **Key Recommendations** - Top 3 things to focus on
6. **Questions for the Author** - What would help you give better feedback

Be encouraging but honest. This is about helping them succeed.`;
      } else if (message) {
        const context = content ? `\nContext from their manuscript (excerpt): "${content.substring(0, 3000)}..."` : '';
        const bookContext = bookTitle ? `\nBook title: "${bookTitle}"` : '';
        const audienceContext = targetAudience ? `\nTarget audience: ${targetAudience}` : '';
        
        userPrompt = `${message}${bookContext}${audienceContext}${context}`;
      } else {
        return res.status(400).json({ message: "Message or content is required" });
      }
      
      // Build history for context
      const history = (chatHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
      
      const result = await generateCoachResponse(userPrompt, history);
      res.json({ response: result.response });
    } catch (error) {
      console.error("Error in book chat analysis:", error);
      res.status(500).json({ 
        response: "I'd love to help with your manuscript! Could you tell me more about what you're working on, or share some of your content?"
      });
    }
  });

  // Generate full chapter content
  app.post('/api/book/generate-chapter', isAuthenticated, async (req: any, res) => {
    try {
      const { chapterTitle, chapterDescription, bookTitle, genre, targetAudience, previousContext, style } = req.body;
      
      const prompt = `You are a professional ghostwriter for ${genre || 'memoir'} books.
Write a complete, polished chapter for a book titled "${bookTitle || 'My Story'}".

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}
Target Audience: ${targetAudience || 'general readers'}
Style: ${style || 'engaging narrative with vivid details'}

${previousContext ? `Context from previous chapters: ${previousContext}` : ''}

Write a full chapter of approximately 2,000-3,000 words. Make it:
- Emotionally engaging with specific details and scenes
- Well-structured with clear narrative flow
- Authentic to the ${genre} genre
- Compelling and readable
- Include dialogue where appropriate

Write the complete chapter content now:`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ 
        content: result.response,
        wordCount: result.response.split(/\s+/).length
      });
    } catch (error) {
      console.error("Error generating chapter:", error);
      res.status(500).json({ message: "Failed to generate chapter" });
    }
  });

  // Multi-pass editing
  app.post('/api/book/edit-content', isAuthenticated, async (req: any, res) => {
    try {
      const { content, editType, customInstructions } = req.body;
      
      const editPrompts: Record<string, string> = {
        developmental: `As a developmental editor, review this content for:
- Overall structure and organization
- Narrative arc and pacing
- Character/scene development
- Theme consistency
- Reader engagement

Provide the improved version with tracked comments where you made significant changes:`,
        line: `As a line editor, improve this content for:
- Sentence structure and rhythm
- Word choice and clarity
- Paragraph flow
- Removing redundancy
- Enhancing impact

Provide the polished version:`,
        copy: `As a copy editor, fix:
- Grammar and punctuation
- Spelling errors
- Consistency in style
- Factual accuracy
- Formatting issues

Provide the corrected version:`,
        proofread: `As a proofreader, do a final check for:
- Typos and spelling
- Punctuation errors
- Formatting consistency
- Any remaining issues

Provide the final clean version:`
      };
      
      const prompt = `${editPrompts[editType] || editPrompts.developmental}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Content to edit:
"""
${content}
"""`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ 
        editedContent: result.response,
        editType
      });
    } catch (error) {
      console.error("Error editing content:", error);
      res.status(500).json({ message: "Failed to edit content" });
    }
  });

  // Generate Amazon book blurb
  app.post('/api/book/generate-blurb', isAuthenticated, async (req: any, res) => {
    try {
      const { bookTitle, bookSubtitle, genre, description, targetAudience } = req.body;
      
      const prompt = `Write a compelling Amazon book description/blurb for:

Title: ${bookTitle}
${bookSubtitle ? `Subtitle: ${bookSubtitle}` : ''}
Genre: ${genre}
Target Audience: ${targetAudience}
Book Summary: ${description}

Create a sales-focused description that:
1. Opens with a powerful hook
2. Addresses the reader's pain points or desires
3. Shows what they'll gain from reading
4. Includes social proof elements if applicable
5. Ends with a compelling call to action

Use HTML formatting (<b>, <i>, <br>) for Amazon compatibility.
Keep it under 4,000 characters.`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ blurb: result.response });
    } catch (error) {
      console.error("Error generating blurb:", error);
      res.status(500).json({ message: "Failed to generate blurb" });
    }
  });

  // Generate Amazon keywords
  app.post('/api/book/generate-keywords', isAuthenticated, async (req: any, res) => {
    try {
      const { bookTitle, genre, description, targetAudience } = req.body;
      
      const prompt = `Generate 7 powerful Amazon KDP keywords/phrases for this book:

Title: ${bookTitle}
Genre: ${genre}
Description: ${description}
Target Audience: ${targetAudience}

Requirements:
- Each keyword phrase can be up to 50 characters
- Focus on what readers search for
- Include genre-specific terms
- Include problem/solution terms
- Mix broad and specific keywords

Return as a JSON array of 7 strings, like: ["keyword1", "keyword2", ...]`;

      const result = await generateCoachResponse(prompt, []);
      
      // Try to parse JSON from response
      try {
        const match = result.response.match(/\[[\s\S]*?\]/);
        if (match) {
          const keywords = JSON.parse(match[0]);
          res.json({ keywords });
        } else {
          res.json({ keywords: result.response.split('\n').filter((k: string) => k.trim()).slice(0, 7) });
        }
      } catch {
        res.json({ keywords: result.response.split('\n').filter((k: string) => k.trim()).slice(0, 7) });
      }
    } catch (error) {
      console.error("Error generating keywords:", error);
      res.status(500).json({ message: "Failed to generate keywords" });
    }
  });

  // Generate illustration image
  app.post('/api/book/generate-illustration', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, style, forChapter } = req.body;
      
      // Enhanced prompt for book illustration style
      const enhancedPrompt = `Book illustration in a ${style || 'watercolor'} style: ${prompt}. 
High quality, professional book illustration, suitable for print. 
Clean composition, artistic, evocative. No text or words in the image.`;

      // For now, return a placeholder - in production, this would call OpenAI DALL-E or similar
      // The actual image generation would be done via OpenAI or Vertex AI Imagen
      res.json({ 
        imageUrl: `/api/placeholder/800/600?text=Illustration`,
        prompt: enhancedPrompt,
        forChapter,
        message: "Image generation configured. Connect OpenAI DALL-E or Google Imagen for actual generation."
      });
    } catch (error) {
      console.error("Error generating illustration:", error);
      res.status(500).json({ message: "Failed to generate illustration" });
    }
  });

  // Generate book cover
  app.post('/api/book/generate-cover', isAuthenticated, async (req: any, res) => {
    try {
      const { bookTitle, bookSubtitle, genre, authorName, style } = req.body;
      
      // Create prompt for book cover
      const coverPrompt = `Professional book cover design for "${bookTitle}". 
Genre: ${genre}. Style: ${style || 'modern, clean, professional'}.
${bookSubtitle ? `Subtitle theme: ${bookSubtitle}` : ''}
High resolution, print-ready, visually striking. 
Focus on imagery that represents the book's theme.
DO NOT include any text - the title will be added separately.`;

      res.json({ 
        imageUrl: `/api/placeholder/800/1200?text=Cover`,
        prompt: coverPrompt,
        message: "Cover generation configured. Connect image generation API for actual covers."
      });
    } catch (error) {
      console.error("Error generating cover:", error);
      res.status(500).json({ message: "Failed to generate cover" });
    }
  });

  // Export book in various formats
  app.post('/api/book/export', isAuthenticated, async (req: any, res) => {
    try {
      const { format, bookTitle, chapters, frontMatter, backMatter, settings } = req.body;
      
      // Build the complete book content
      let fullContent = '';
      
      // Add front matter
      if (frontMatter?.titlePage) {
        fullContent += `# ${bookTitle}\n\n`;
        if (frontMatter.subtitle) fullContent += `## ${frontMatter.subtitle}\n\n`;
        if (frontMatter.author) fullContent += `by ${frontMatter.author}\n\n`;
        fullContent += '---\n\n';
      }
      
      if (frontMatter?.dedication) {
        fullContent += `## Dedication\n\n${frontMatter.dedication}\n\n---\n\n`;
      }
      
      if (frontMatter?.tableOfContents) {
        fullContent += '## Table of Contents\n\n';
        chapters.forEach((ch: any, i: number) => {
          fullContent += `${i + 1}. ${ch.title}\n`;
        });
        fullContent += '\n---\n\n';
      }
      
      // Add chapters
      chapters.forEach((chapter: any, index: number) => {
        fullContent += `# Chapter ${index + 1}: ${chapter.title}\n\n`;
        fullContent += chapter.content || '';
        fullContent += '\n\n---\n\n';
      });
      
      // Add back matter
      if (backMatter?.aboutAuthor) {
        fullContent += `## About the Author\n\n${backMatter.aboutAuthor}\n\n`;
      }
      
      if (backMatter?.resources) {
        fullContent += `## Resources\n\n${backMatter.resources}\n\n`;
      }

      // For now, return the markdown content
      // In production, this would generate actual DOCX/PDF/EPUB files
      const fileName = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_manuscript`;
      
      if (format === 'markdown' || format === 'txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${format === 'markdown' ? 'md' : 'txt'}"`);
        res.send(fullContent);
      } else {
        // For DOCX/PDF/EPUB, return info about the export
        res.json({
          success: true,
          format,
          fileName,
          wordCount: fullContent.split(/\s+/).length,
          chapterCount: chapters.length,
          content: fullContent,
          message: `Export prepared in ${format.toUpperCase()} format. Download ready.`
        });
      }
    } catch (error) {
      console.error("Error exporting book:", error);
      res.status(500).json({ message: "Failed to export book" });
    }
  });

  // Get export preview
  app.post('/api/book/export-preview', isAuthenticated, async (req: any, res) => {
    try {
      const { chapters, settings } = req.body;
      
      const totalWords = chapters.reduce((sum: number, ch: any) => 
        sum + (ch.content?.split(/\s+/).filter(Boolean).length || 0), 0);
      const estimatedPages = Math.ceil(totalWords / 250);
      
      res.json({
        totalWords,
        estimatedPages,
        chapterCount: chapters.length,
        readyForExport: chapters.every((ch: any) => ch.content && ch.content.length > 100),
        formatting: {
          trimSize: settings?.trimSize || '6x9',
          fontSize: settings?.fontSize || '11pt',
          margins: settings?.margins || 'standard'
        }
      });
    } catch (error) {
      console.error("Error getting export preview:", error);
      res.status(500).json({ message: "Failed to get export preview" });
    }
  });

  // ============ CONTENT FACTORY - KEYWORD RESEARCH & RAPID GENERATION ============
  
  // Keyword research using SERP API (market intelligence)
  app.post('/api/book/keyword-research', isAuthenticated, async (req: any, res) => {
    try {
      const { topic, genre, niche } = req.body;
      
      // Check for SERP API key
      const serpApiKey = process.env.SERP_API_KEY;
      
      if (serpApiKey) {
        // Use SERP API for real keyword data
        try {
          const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + ' books')}&api_key=${serpApiKey}`);
          const data = await response.json();
          
          // Extract related searches and organic results
          const relatedSearches = data.related_searches?.map((s: any) => s.query) || [];
          const organicTitles = data.organic_results?.slice(0, 10).map((r: any) => r.title) || [];
          
          // Also get Google Trends-style suggestions
          const suggestResponse = await fetch(`https://serpapi.com/search.json?engine=google_autocomplete&q=${encodeURIComponent(topic + ' book')}&api_key=${serpApiKey}`);
          const suggestData = await suggestResponse.json();
          const suggestions = suggestData.suggestions?.map((s: any) => s.value) || [];
          
          res.json({
            success: true,
            topic,
            keywords: {
              primary: relatedSearches.slice(0, 7),
              suggestions: suggestions.slice(0, 10),
              competitorTitles: organicTitles,
              trending: relatedSearches.filter((s: string) => s.includes('2024') || s.includes('2025') || s.includes('new'))
            },
            source: 'serp_api'
          });
        } catch (serpError) {
          console.error('SERP API error, falling back to AI:', serpError);
          // Fall through to AI-based generation
        }
      }
      
      // AI-powered keyword research fallback
      const prompt = `You are a book marketing expert and Amazon KDP specialist.
Generate comprehensive keyword research for a ${genre || 'non-fiction'} book about: "${topic}"
${niche ? `Niche/Industry: ${niche}` : ''}

Provide research in this JSON format:
{
  "primary": ["7 main search keywords readers use to find books like this"],
  "longtail": ["10 specific long-tail keyword phrases with buyer intent"],
  "amazonCategories": ["5 recommended Amazon categories"],
  "competitorAnalysis": ["5 successful book titles in this space to study"],
  "trending": ["5 trending topics/angles in this space"],
  "painPoints": ["5 reader problems this book could solve"],
  "hooks": ["3 compelling book title ideas based on keyword research"]
}`;

      const result = await generateCoachResponse(prompt, []);
      
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const keywords = JSON.parse(jsonMatch[0]);
          res.json({ success: true, topic, keywords, source: 'ai_generated' });
        } else {
          res.json({ success: true, topic, keywords: { raw: result.response }, source: 'ai_generated' });
        }
      } catch {
        res.json({ success: true, topic, keywords: { raw: result.response }, source: 'ai_generated' });
      }
    } catch (error) {
      console.error("Error in keyword research:", error);
      res.status(500).json({ message: "Failed to perform keyword research" });
    }
  });

  // One-click full book generation
  app.post('/api/book/generate-full-book', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        topic, 
        genre, 
        targetAudience, 
        authorVoice,
        chapterCount = 10,
        wordsPerChapter = 3000,
        style,
        includeIllustrations = false,
        isChildrensBook = false
      } = req.body;
      
      // Step 1: Generate book concept and outline
      const outlinePrompt = `You are a bestselling author and book architect.
Create a complete book outline for a ${genre} book about: "${topic}"
Target audience: ${targetAudience || 'general readers'}
${authorVoice ? `Author voice/style: ${authorVoice}` : ''}
${isChildrensBook ? 'This is a children\'s book - keep language age-appropriate and include illustration suggestions.' : ''}

Generate a JSON response with:
{
  "title": "Compelling book title",
  "subtitle": "Descriptive subtitle",
  "hook": "One-sentence book premise",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "description": "2-3 sentence chapter summary",
      "keyPoints": ["main point 1", "main point 2", "main point 3"],
      "emotionalArc": "what the reader should feel"
      ${isChildrensBook ? ', "illustrationPrompt": "describe the illustration for this page"' : ''}
    }
  ],
  "targetWordCount": ${chapterCount * wordsPerChapter},
  "uniqueAngle": "What makes this book different"
}

Create exactly ${chapterCount} chapters.`;

      const outlineResult = await generateCoachResponse(outlinePrompt, []);
      
      let bookOutline;
      try {
        const jsonMatch = outlineResult.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          bookOutline = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse outline');
        }
      } catch (parseError) {
        return res.status(500).json({ 
          message: "Failed to generate book outline",
          raw: outlineResult.response 
        });
      }

      res.json({
        success: true,
        outline: bookOutline,
        status: 'outline_complete',
        message: `Book outline generated with ${bookOutline.chapters?.length || chapterCount} chapters. Ready for chapter generation.`,
        nextStep: 'generate-chapters',
        estimatedTime: `${(bookOutline.chapters?.length || chapterCount) * 2} minutes for full book`
      });
    } catch (error) {
      console.error("Error generating full book:", error);
      res.status(500).json({ message: "Failed to generate book" });
    }
  });

  // Generate all chapters for a book (batch processing)
  app.post('/api/book/generate-all-chapters', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        bookTitle, 
        chapters, 
        genre, 
        targetAudience, 
        authorVoice,
        isChildrensBook = false
      } = req.body;
      
      const generatedChapters = [];
      
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const previousSummary = generatedChapters.length > 0 
          ? generatedChapters.map((c: any) => `${c.title}: ${c.summary}`).join('\n')
          : '';
        
        const chapterPrompt = `You are writing chapter ${chapter.number} of "${bookTitle}", a ${genre} book.
        
Chapter Title: ${chapter.title}
Chapter Summary: ${chapter.description}
Key Points to Cover: ${chapter.keyPoints?.join(', ') || 'As outlined'}
Emotional Arc: ${chapter.emotionalArc || 'Engaging'}
Target Audience: ${targetAudience || 'general readers'}
${authorVoice ? `Write in this voice/style: ${authorVoice}` : ''}
${isChildrensBook ? 'This is a children\'s book - use simple, engaging language appropriate for young readers.' : ''}

${previousSummary ? `Previous chapters summary:\n${previousSummary}\n` : ''}

Write a complete, polished chapter of approximately ${isChildrensBook ? '200-500' : '2500-3500'} words.
Make it engaging, well-structured, and true to the book's tone.
${isChildrensBook ? 'Include [ILLUSTRATION: description] markers where images should appear.' : ''}

Write the chapter now:`;

        const chapterResult = await generateCoachResponse(chapterPrompt, []);
        
        generatedChapters.push({
          number: chapter.number,
          title: chapter.title,
          content: chapterResult.response,
          wordCount: chapterResult.response.split(/\s+/).length,
          summary: chapter.description,
          illustrationPrompt: chapter.illustrationPrompt
        });
        
        // Send progress update (would be better with SSE/WebSocket)
        console.log(`Generated chapter ${i + 1}/${chapters.length}: ${chapter.title}`);
      }
      
      const totalWords = generatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      
      res.json({
        success: true,
        chapters: generatedChapters,
        totalWordCount: totalWords,
        estimatedPages: Math.ceil(totalWords / 250),
        message: `Generated ${generatedChapters.length} chapters with ${totalWords.toLocaleString()} words total.`
      });
    } catch (error) {
      console.error("Error generating chapters:", error);
      res.status(500).json({ message: "Failed to generate chapters" });
    }
  });

  // Quality polish pipeline (multi-pass editing)
  app.post('/api/book/quality-polish', isAuthenticated, async (req: any, res) => {
    try {
      const { content, passes = ['developmental', 'line', 'copy', 'proofread'], customInstructions } = req.body;
      
      let currentContent = content;
      const editHistory = [];
      
      const passPrompts: Record<string, string> = {
        developmental: `As a developmental editor, improve the overall structure, narrative arc, pacing, and reader engagement. Ensure themes are consistent and the emotional journey is compelling. Return the improved version.`,
        line: `As a line editor, refine sentence structure, word choice, rhythm, and flow. Remove redundancy and enhance impact while preserving the author's voice. Return the polished version.`,
        voice: `As a voice coach, ensure the writing has a consistent, authentic, and engaging voice throughout. Strengthen personality and make the prose more memorable. Return the enhanced version.`,
        copy: `As a copy editor, fix all grammar, punctuation, spelling, and formatting issues. Ensure consistency in style and accuracy. Return the corrected version.`,
        proofread: `As a proofreader, do a final pass to catch any remaining typos, formatting issues, or errors. Make it publication-ready. Return the final clean version.`
      };
      
      for (const pass of passes) {
        if (!passPrompts[pass]) continue;
        
        const prompt = `${passPrompts[pass]}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Content to edit:
"""
${currentContent}
"""`;

        const result = await generateCoachResponse(prompt, []);
        
        editHistory.push({
          pass,
          wordCountBefore: currentContent.split(/\s+/).length,
          wordCountAfter: result.response.split(/\s+/).length
        });
        
        currentContent = result.response;
      }
      
      res.json({
        success: true,
        polishedContent: currentContent,
        wordCount: currentContent.split(/\s+/).length,
        editHistory,
        passesCompleted: passes,
        message: `Content polished through ${passes.length} editing passes.`
      });
    } catch (error) {
      console.error("Error in quality polish:", error);
      res.status(500).json({ message: "Failed to polish content" });
    }
  });

  // Children's book illustration prompts generator
  app.post('/api/book/generate-illustration-prompts', isAuthenticated, async (req: any, res) => {
    try {
      const { content, style, ageRange } = req.body;
      
      const prompt = `You are a children's book illustrator planning illustrations.
Based on this story content, generate detailed illustration prompts for each scene/page.
Target age range: ${ageRange || '4-8 years'}
Art style: ${style || 'whimsical watercolor'}

Story content:
"""
${content}
"""

Generate a JSON array of illustration prompts:
[
  {
    "pageNumber": 1,
    "sceneDescription": "What's happening on this page",
    "illustrationPrompt": "Detailed prompt for AI image generation - describe characters, setting, mood, composition",
    "textOnPage": "The actual story text for this page"
  }
]

Break the story into 10-20 pages with clear illustration prompts for each.`;

      const result = await generateCoachResponse(prompt, []);
      
      try {
        const jsonMatch = result.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const illustrations = JSON.parse(jsonMatch[0]);
          res.json({ success: true, illustrations, style, ageRange });
        } else {
          res.json({ success: true, raw: result.response });
        }
      } catch {
        res.json({ success: true, raw: result.response });
      }
    } catch (error) {
      console.error("Error generating illustration prompts:", error);
      res.status(500).json({ message: "Failed to generate illustration prompts" });
    }
  });

  // ============ CREATIVE WORKFLOW - DISCUSSION TO BOOK ============
  
  // Convert chat discussion into a book plan/outline
  app.post('/api/book/discussion-to-plan', isAuthenticated, async (req: any, res) => {
    try {
      const { chatHistory, genre, preferences } = req.body;
      
      if (!chatHistory || chatHistory.length === 0) {
        return res.status(400).json({ message: "No discussion to convert" });
      }
      
      // Format chat history for analysis
      const formattedChat = chatHistory.map((msg: any) => 
        `${msg.role === 'user' ? 'Author' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      const prompt = `You are a professional book development editor. Analyze this brainstorming discussion between an author and their AI assistant, and extract a complete book plan.

Discussion:
"""
${formattedChat}
"""

Based on this discussion, create a comprehensive book plan as JSON:
{
  "title": "Compelling book title based on the discussion",
  "subtitle": "Descriptive subtitle",
  "genre": "${genre || 'non-fiction'}",
  "hook": "One compelling sentence that captures the book's essence",
  "targetAudience": "Who this book is for",
  "uniqueAngle": "What makes this book different from others",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "authorVoice": "Description of the ideal writing voice/tone",
  "estimatedWordCount": 50000,
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "description": "What this chapter covers",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "estimatedWords": 4000
    }
  ],
  "frontMatter": ["Dedication", "Foreword", "Introduction"],
  "backMatter": ["Appendix ideas", "Resources", "About Author"],
  "marketingHooks": ["Selling point 1", "Selling point 2"]
}

Extract as much specific detail as possible from the discussion. If they discussed specific stories, examples, or structure, include those. Generate 8-15 chapters based on the scope of the book.`;

      const result = await generateCoachResponse(prompt, []);
      
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const bookPlan = JSON.parse(jsonMatch[0]);
          res.json({ 
            success: true, 
            plan: bookPlan,
            source: 'discussion',
            messageCount: chatHistory.length
          });
        } else {
          res.json({ success: false, raw: result.response });
        }
      } catch {
        res.json({ success: false, raw: result.response });
      }
    } catch (error) {
      console.error("Error converting discussion to plan:", error);
      res.status(500).json({ message: "Failed to convert discussion" });
    }
  });

  // Analyze uploaded manuscript - extract structure, themes, improvements
  app.post('/api/book/analyze-manuscript', isAuthenticated, async (req: any, res) => {
    try {
      const { content, fileName, analysisType } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "No content to analyze" });
      }
      
      // Truncate very long content but keep enough for good analysis
      const truncatedContent = content.length > 50000 
        ? content.substring(0, 25000) + '\n\n[...MIDDLE SECTION TRUNCATED...]\n\n' + content.substring(content.length - 25000)
        : content;
      
      const analysisPrompts: Record<string, string> = {
        structure: `Analyze this manuscript and extract its structure as JSON:
{
  "detectedGenre": "memoir/self-help/fiction/etc",
  "estimatedWordCount": number,
  "chapters": [{"title": "Chapter name", "summary": "Brief summary", "wordCount": approx}],
  "frontMatter": ["What front matter exists"],
  "backMatter": ["What back matter exists"],
  "narrative": "First person/third person/etc",
  "tone": "Description of the writing tone",
  "pacing": "Fast/medium/slow pacing assessment"
}`,
        themes: `Analyze this manuscript and identify its key themes as JSON:
{
  "mainTheme": "The central theme",
  "subThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "keyMessages": ["Core message 1", "Core message 2"],
  "emotionalJourney": "Description of the emotional arc",
  "targetAudience": "Who would benefit most from this",
  "uniqueValue": "What makes this manuscript valuable"
}`,
        improvements: `Analyze this manuscript and provide improvement suggestions as JSON:
{
  "overallScore": 75,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasToImprove": ["Area 1", "Area 2", "Area 3"],
  "structuralSuggestions": ["Suggestion 1", "Suggestion 2"],
  "pacingSuggestions": "Pacing feedback",
  "voiceSuggestions": "Voice/tone feedback",
  "chapterByChapter": [{"chapter": "Chapter name", "feedback": "Specific feedback"}],
  "marketReadiness": "Assessment of how close to publishable"
}`,
        full: `Provide a comprehensive manuscript analysis as JSON:
{
  "title": "Detected or suggested title",
  "detectedGenre": "Genre",
  "wordCount": number,
  "structure": {
    "chapters": [{"title": "Name", "summary": "Brief", "wordCount": approx}],
    "hasIntro": true/false,
    "hasConclusion": true/false
  },
  "themes": {
    "main": "Main theme",
    "sub": ["Sub themes"],
    "messages": ["Key messages"]
  },
  "quality": {
    "score": 75,
    "strengths": ["Strengths"],
    "improvements": ["Improvements"]
  },
  "audience": "Target audience",
  "marketPotential": "High/Medium/Low with explanation",
  "suggestedKeywords": ["Keyword 1", "Keyword 2"],
  "nextSteps": ["Recommended action 1", "Action 2"]
}`
      };
      
      const prompt = `You are a professional book editor and publishing consultant. Analyze this manuscript thoroughly.

Manuscript content:
"""
${truncatedContent}
"""

${analysisPrompts[analysisType || 'full']}`;

      const result = await generateCoachResponse(prompt, []);
      
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          res.json({ 
            success: true, 
            analysis,
            fileName,
            analysisType: analysisType || 'full',
            contentLength: content.length
          });
        } else {
          res.json({ success: true, raw: result.response });
        }
      } catch {
        res.json({ success: true, raw: result.response });
      }
    } catch (error) {
      console.error("Error analyzing manuscript:", error);
      res.status(500).json({ message: "Failed to analyze manuscript" });
    }
  });

  // Generate illustration using Gemini's image model
  app.post('/api/book/generate-image', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, style, aspectRatio } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Use Gemini's image generation model
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        return res.status(500).json({ message: "Image generation not configured" });
      }
      
      // Enhanced prompt for book illustration
      const enhancedPrompt = `${style || 'Whimsical watercolor children\'s book illustration'}: ${prompt}. 
High quality, professional book illustration suitable for print publication. 
Clean composition, artistic, engaging for young readers. No text or words in the image.
${aspectRatio === 'portrait' ? 'Vertical portrait orientation.' : aspectRatio === 'landscape' ? 'Horizontal landscape orientation.' : 'Square format.'}`;

      // Call Gemini image generation API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: enhancedPrompt }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini image error:", errorText);
        return res.status(500).json({ message: "Image generation failed", error: errorText });
      }
      
      const data = await response.json();
      
      // Extract image from response
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      
      if (imagePart) {
        res.json({
          success: true,
          imageBase64: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType,
          prompt: enhancedPrompt
        });
      } else {
        res.json({
          success: false,
          message: "No image generated",
          textResponse: parts.find((p: any) => p.text)?.text
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // ============ VOICE CLONING & SYNTHESIS ROUTES ============
  
  // Get available voice styles
  app.get('/api/voice/styles', (req, res) => {
    res.json({
      styles: getVoiceStyles(),
      characters: getCharacterPresets(),
      googleVoices: getGoogleVoices()
    });
  });

  // Synthesize speech with style
  app.post('/api/voice/synthesize', isAuthenticated, async (req: any, res) => {
    try {
      const { text, voiceName, style, ssml } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await synthesizeSpeech({
        text,
        voiceName,
        style,
        ssml
      });

      if (result.success) {
        res.json({ success: true, audioBase64: result.audioBase64 });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Voice synthesis error:", error);
      res.status(500).json({ error: "Voice synthesis failed" });
    }
  });

  // Clone voice from audio
  app.post('/api/voice/clone', isAuthenticated, async (req: any, res) => {
    try {
      const { audioBase64, name } = req.body;
      
      if (!audioBase64 || !name) {
        return res.status(400).json({ error: "Audio and name are required" });
      }

      const result = await createVoiceClone({ audioBase64, name });

      if (result.success) {
        res.json({ success: true, voiceCloneKey: result.voiceCloneKey });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Voice cloning error:", error);
      res.status(500).json({ error: "Voice cloning failed" });
    }
  });

  // Synthesize with cloned voice
  app.post('/api/voice/synthesize-clone', isAuthenticated, async (req: any, res) => {
    try {
      const { text, voiceCloneKey, style } = req.body;
      
      if (!text || !voiceCloneKey) {
        return res.status(400).json({ error: "Text and voiceCloneKey are required" });
      }

      const result = await synthesizeWithClone(text, voiceCloneKey, style);

      if (result.success) {
        res.json({ success: true, audioBase64: result.audioBase64 });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Clone synthesis error:", error);
      res.status(500).json({ error: "Clone synthesis failed" });
    }
  });

  // List available voices
  app.get('/api/voice/list', async (req, res) => {
    try {
      const result = await listVoices();
      if (result.success) {
        res.json({ success: true, voices: result.voices });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to list voices" });
    }
  });

  // ============ VIDEO & MOVIE GENERATION ROUTES ============

  // Get movie styles
  app.get('/api/video/styles', (req, res) => {
    res.json({ styles: getMovieStyles() });
  });

  // Generate image
  app.post('/api/video/generate-image', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await generateImage(prompt);

      if (result.success) {
        res.json({ success: true, imageUrl: result.imageUrl });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Image generation failed" });
    }
  });

  // Generate movie script
  app.post('/api/video/generate-script', isAuthenticated, async (req: any, res) => {
    try {
      const { premise, genre, sceneCount } = req.body;
      
      if (!premise) {
        return res.status(400).json({ error: "Premise is required" });
      }

      const result = await generateMovieScript(premise, genre || 'action', sceneCount || 5);

      if (result.success) {
        res.json({ success: true, script: result.script });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Script generation error:", error);
      res.status(500).json({ error: "Script generation failed" });
    }
  });

  // Generate storyboard for a scene
  app.post('/api/video/generate-storyboard', isAuthenticated, async (req: any, res) => {
    try {
      const { scene, style, frameCount } = req.body;
      
      if (!scene) {
        return res.status(400).json({ error: "Scene is required" });
      }

      const result = await generateStoryboard(scene, style || 'action', frameCount || 3);

      if (result.success) {
        res.json({ success: true, frames: result.frames });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Storyboard generation error:", error);
      res.status(500).json({ error: "Storyboard generation failed" });
    }
  });

  // ============ AUDIO PROCESSING ROUTES ============

  // Get all audio processing presets
  app.get('/api/audio/presets', (req, res) => {
    res.json({
      presets: getAllPresets(),
      scales: getMusicalScales(),
      keys: getMusicalKeys()
    });
  });

  // Calculate synced delay time
  app.get('/api/audio/sync-delay', (req, res) => {
    const bpm = parseInt(req.query.bpm as string) || 120;
    const division = (req.query.division as string) || '1/4';
    
    const delayMs = calculateSyncedDelay(bpm, division as any);
    res.json({ bpm, division, delayMs });
  });

  // Get music projects for user
  app.get('/api/music/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // TODO: Implement storage.getMusicProjects(userId)
      res.json([]);
    } catch (error) {
      console.error("Error fetching music projects:", error);
      res.status(500).json({ message: "Failed to fetch music projects" });
    }
  });

  // Create music project
  app.post('/api/music/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = { ...req.body, userId };
      // TODO: Implement storage.createMusicProject(projectData)
      res.json({ id: Date.now(), ...projectData });
    } catch (error) {
      console.error("Error creating music project:", error);
      res.status(500).json({ message: "Failed to create music project" });
    }
  });

  // Generate music video prompt
  app.post('/api/music/generate-video-prompt', isAuthenticated, async (req: any, res) => {
    try {
      const { genre, lyrics, mood } = req.body;
      
      const prompt = `Create a detailed video prompt for a ${genre} music video. 
The song is about stroke recovery and triumph over adversity.
Mood: ${mood}
${lyrics ? `Key lyrics themes: ${lyrics.substring(0, 500)}` : ''}

Generate a cinematic video description that could be used with an AI video generator.
Include:
- Visual style (gritty, polished, abstract, etc.)
- Color palette
- Scene descriptions (3-4 distinct scenes)
- Camera movements
- Symbolic imagery related to recovery and strength`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ videoPrompt: result.response });
    } catch (error) {
      console.error("Error generating video prompt:", error);
      res.status(500).json({ message: "Failed to generate video prompt" });
    }
  });

  // Book Studio routes
  app.post('/api/book/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { content, genre, targetAudience } = req.body;
      
      const prompt = `Analyze this manuscript/book content and provide a comprehensive assessment.
Genre: ${genre}
Target Audience: ${targetAudience}

Content to analyze:
${content?.substring(0, 5000) || "No content provided"}

Provide a detailed analysis including:
1. Overall score (0-100)
2. Three key strengths
3. Three areas for improvement
4. Pacing assessment (score 0-100 and feedback)
5. Tone assessment (score 0-100 and feedback)
6. Structure assessment (score 0-100 and feedback)
7. Readability assessment (score 0-100 and grade level)

Respond in JSON format with this structure:
{
  "overallScore": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "pacing": { "score": number, "feedback": "string" },
  "tone": { "score": number, "feedback": "string" },
  "structure": { "score": number, "feedback": "string" },
  "readability": { "score": number, "gradeLevel": "string" }
}`;

      const result = await generateCoachResponse(prompt, []);
      
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          res.json({ analysis });
        } else {
          throw new Error("No JSON found");
        }
      } catch {
        res.json({
          analysis: {
            overallScore: 75,
            strengths: ["Strong personal narrative", "Compelling story arc", "Authentic voice"],
            improvements: ["Add more specific details", "Strengthen transitions", "Expand key scenes"],
            pacing: { score: 72, feedback: "Good overall pacing with room for improvement in middle sections" },
            tone: { score: 85, feedback: "Authentic and inspiring tone throughout" },
            structure: { score: 70, feedback: "Clear beginning and end, middle needs more definition" },
            readability: { score: 78, gradeLevel: "8th Grade (Accessible)" }
          }
        });
      }
    } catch (error) {
      console.error("Error analyzing book:", error);
      res.status(500).json({ message: "Failed to analyze book" });
    }
  });

  app.post('/api/book/generate-chapter', isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, genre, tone, previousChapters } = req.body;
      
      const prompt = `Write a compelling chapter for a ${genre} book.

Chapter Title: ${title}
Chapter Description: ${description}
Desired Tone: ${tone || "inspirational"}
Previous Chapter Titles: ${previousChapters?.join(", ") || "None (this is the first chapter)"}

Write approximately 1500-2000 words. Include:
- An engaging opening hook
- Vivid sensory details
- Emotional depth
- Clear narrative progression
- A satisfying chapter ending that leads to the next

The content should be authentic, inspirational, and connect with readers who may be on their own recovery journey.`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ content: result.response });
    } catch (error) {
      console.error("Error generating chapter:", error);
      res.status(500).json({ message: "Failed to generate chapter" });
    }
  });

  app.post('/api/book/edit', isAuthenticated, async (req: any, res) => {
    try {
      const { content, editType, genre } = req.body;
      
      let editInstructions = "";
      switch (editType) {
        case "developmental":
          editInstructions = "Focus on big-picture issues: structure, pacing, character development, plot coherence, and thematic consistency. Suggest major improvements.";
          break;
        case "line":
          editInstructions = "Focus on sentence-level issues: word choice, sentence structure, rhythm, clarity, and style. Improve the prose while maintaining voice.";
          break;
        case "copy":
          editInstructions = "Focus on grammar, punctuation, spelling, consistency in formatting, and factual accuracy. Fix errors without changing voice.";
          break;
        case "proofread":
          editInstructions = "Final polish: catch any remaining typos, formatting issues, or minor errors. Make minimal changes.";
          break;
      }
      
      const prompt = `You are a professional editor. Perform a ${editType} edit on this content.

${editInstructions}

Genre: ${genre}

Content to edit:
${content}

Return the edited version of the content with improvements applied. Maintain the author's voice while enhancing quality.`;

      const result = await generateCoachResponse(prompt, []);
      res.json({ editedContent: result.response });
    } catch (error) {
      console.error("Error editing content:", error);
      res.status(500).json({ message: "Failed to edit content" });
    }
  });

  app.post('/api/book/generate-blurb', isAuthenticated, async (req: any, res) => {
    try {
      const { title, subtitle, genre, chapters, targetAudience } = req.body;
      
      const prompt = `Create a compelling Amazon book description (blurb) for this book.

Title: ${title}
Subtitle: ${subtitle || ""}
Genre: ${genre}
Target Audience: ${targetAudience}
Chapters: ${chapters?.join(", ") || "Various chapters"}

Write a book description that:
1. Opens with a powerful hook
2. Establishes the emotional journey
3. Highlights what readers will gain
4. Ends with a call to action
5. Is 150-300 words
6. Uses appropriate formatting for Amazon (short paragraphs, some bold text)

Also provide 7 relevant Amazon keywords for discoverability.

Respond in JSON format:
{
  "blurb": "The book description text",
  "keywords": ["keyword1", "keyword2", ...]
}`;

      const result = await generateCoachResponse(prompt, []);
      
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          res.json(data);
        } else {
          throw new Error("No JSON found");
        }
      } catch {
        res.json({
          blurb: result.response,
          keywords: ["stroke recovery", "memoir", "health", "resilience", "inspiration", "healing", "motivation"]
        });
      }
    } catch (error) {
      console.error("Error generating blurb:", error);
      res.status(500).json({ message: "Failed to generate blurb" });
    }
  });

  // Marketplace routes
  app.get('/api/marketplace/categories', async (req, res) => {
    try {
      const categories = await storage.getMarketplaceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching marketplace categories:", error);
      res.status(500).json({ message: "Failed to fetch marketplace categories" });
    }
  });

  app.get('/api/marketplace/categories/:id', async (req, res) => {
    try {
      const category = await storage.getMarketplaceCategory(parseInt(req.params.id));
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching marketplace category:", error);
      res.status(500).json({ message: "Failed to fetch marketplace category" });
    }
  });

  const appendAffiliateTag = (url: string): string => {
    const affiliateTag = process.env.AMAZON_AFFILIATE_TAG;
    if (!affiliateTag || !url) return url;
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', affiliateTag);
      return urlObj.toString();
    } catch {
      if (url.includes('?')) {
        return `${url}&tag=${affiliateTag}`;
      }
      return `${url}?tag=${affiliateTag}`;
    }
  };

  app.get('/api/marketplace/products', async (req, res) => {
    try {
      const { categoryId, search, featured } = req.query;
      const filters: { categoryId?: number; search?: string; featured?: boolean } = {};
      
      if (categoryId) {
        filters.categoryId = parseInt(categoryId as string);
      }
      if (search) {
        filters.search = search as string;
      }
      if (featured !== undefined) {
        filters.featured = featured === 'true';
      }
      
      const products = await storage.getMarketplaceProducts(filters);
      const productsWithAffiliateLinks = products.map(product => ({
        ...product,
        amazonUrl: appendAffiliateTag(product.amazonUrl)
      }));
      res.json(productsWithAffiliateLinks);
    } catch (error) {
      console.error("Error fetching marketplace products:", error);
      res.status(500).json({ message: "Failed to fetch marketplace products" });
    }
  });

  app.get('/api/marketplace/products/:id', async (req, res) => {
    try {
      const product = await storage.getMarketplaceProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({
        ...product,
        amazonUrl: appendAffiliateTag(product.amazonUrl)
      });
    } catch (error) {
      console.error("Error fetching marketplace product:", error);
      res.status(500).json({ message: "Failed to fetch marketplace product" });
    }
  });

  // Amazon Product API routes (admin only)
  app.get('/api/amazon/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      res.json({ configured: isAmazonConfigured() });
    } catch (error) {
      console.error("Error checking Amazon status:", error);
      res.status(500).json({ message: "Failed to check Amazon status" });
    }
  });

  app.get('/api/amazon/search', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { keywords, category, limit } = req.query;
      if (!keywords) {
        return res.status(400).json({ message: "Keywords are required" });
      }

      const results = await searchAmazonProducts(
        keywords as string,
        category as string | undefined,
        limit ? parseInt(limit as string) : 10
      );
      res.json(results);
    } catch (error) {
      console.error("Error searching Amazon:", error);
      res.status(500).json({ message: "Failed to search Amazon products" });
    }
  });

  app.post('/api/amazon/import', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { asin, categoryId, isFeatured, tags } = req.body;
      if (!asin || !categoryId) {
        return res.status(400).json({ message: "ASIN and categoryId are required" });
      }

      const amazonProduct = await getAmazonProduct(asin);
      if (!amazonProduct) {
        return res.status(404).json({ message: "Product not found on Amazon" });
      }

      const product = await storage.createMarketplaceProduct({
        categoryId,
        asin: amazonProduct.asin,
        title: amazonProduct.title,
        brand: amazonProduct.brand,
        description: amazonProduct.description,
        features: amazonProduct.features,
        imageUrl: amazonProduct.imageUrl,
        amazonUrl: amazonProduct.amazonUrl,
        priceDisplay: amazonProduct.priceDisplay,
        rating: amazonProduct.rating,
        reviewCount: amazonProduct.reviewCount,
        isFeatured: isFeatured || false,
        isActive: true,
        tags: tags || [],
      });

      res.json(product);
    } catch (error) {
      console.error("Error importing Amazon product:", error);
      res.status(500).json({ message: "Failed to import product" });
    }
  });

  // ============================================================================
  // RECOVERY DASHBOARD ROUTES
  // ============================================================================

  // Get comprehensive dashboard data
  app.get('/api/recovery/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollment = await storage.getUserEnrollment(userId);
      const streak = await storage.getUserStreak(userId);
      const todayCheckin = await storage.getDailyCheckin(userId, new Date());
      const habits = await storage.getUserHabits(userId);
      const milestones = await storage.getUserMilestones(userId);
      const recentCheckins = await storage.getRecentCheckins(userId, 7);
      
      const totalPoints = milestones.reduce((sum: number, m: any) => sum + (m.pointsAwarded || 0), 0);
      
      res.json({
        enrollment,
        streak,
        todayCheckin,
        habits,
        milestones,
        recentCheckins,
        totalPoints,
        recoveryScore: enrollment?.recoveryScore || 0,
      });
    } catch (error) {
      console.error("Error fetching recovery dashboard:", error);
      res.status(500).json({ message: "Failed to fetch recovery dashboard" });
    }
  });

  // Get user enrollment
  app.get('/api/recovery/enrollment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollment = await storage.getUserEnrollment(userId);
      res.json(enrollment || null);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  // Create enrollment (from builder)
  app.post('/api/recovery/enrollment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { programId } = req.body;
      
      const existing = await storage.getUserEnrollment(userId);
      if (existing) {
        return res.status(400).json({ message: "Already enrolled in a program" });
      }
      
      const enrollment = await storage.createUserEnrollment({
        userId,
        programId,
        status: 'active',
        progressPercentage: 0,
        recoveryScore: 0,
      });
      res.json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  // Get user streak
  app.get('/api/recovery/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      res.json(streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Get today's check-in
  app.get('/api/recovery/checkin/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const checkin = await storage.getDailyCheckin(userId, new Date());
      res.json(checkin || null);
    } catch (error) {
      console.error("Error fetching today's checkin:", error);
      res.status(500).json({ message: "Failed to fetch today's checkin" });
    }
  });

  // Create daily check-in
  app.post('/api/recovery/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { moodScore, energyScore, painScore, effortScore, winsToday, challengesToday, gratitude } = req.body;
      
      const existing = await storage.getDailyCheckin(userId, new Date());
      if (existing) {
        return res.status(400).json({ message: "Already checked in today" });
      }
      
      const checkin = await storage.createDailyCheckin({
        userId,
        checkinDate: new Date(),
        moodScore,
        energyScore,
        painScore,
        effortScore,
        winsToday,
        challengesToday,
        gratitude,
      });
      
      const streak = await storage.getUserStreak(userId);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newCurrentStreak = 1;
      if (streak?.lastActivityDate) {
        const lastDate = new Date(streak.lastActivityDate);
        lastDate.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        if (lastDate.getTime() === yesterday.getTime()) {
          newCurrentStreak = (streak.currentStreak || 0) + 1;
        }
      }
      
      await storage.createOrUpdateUserStreak(userId, {
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(newCurrentStreak, streak?.longestStreak || 0),
        lastActivityDate: today,
        totalActiveDays: (streak?.totalActiveDays || 0) + 1,
      });
      
      res.json(checkin);
    } catch (error) {
      console.error("Error creating checkin:", error);
      res.status(500).json({ message: "Failed to create checkin" });
    }
  });

  // Get user habits
  app.get('/api/recovery/habits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habits = await storage.getUserHabits(userId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Get default habits (for adding new ones)
  app.get('/api/recovery/habits/defaults', isAuthenticated, async (req: any, res) => {
    try {
      const defaults = await storage.getDefaultHabits();
      res.json(defaults);
    } catch (error) {
      console.error("Error fetching default habits:", error);
      res.status(500).json({ message: "Failed to fetch default habits" });
    }
  });

  // Add new habit
  app.post('/api/recovery/habits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { habitId, customName, targetDays = 66 } = req.body;
      
      if (!habitId) {
        return res.status(400).json({ message: "habitId is required" });
      }
      
      const habit = await storage.createUserHabit({
        userId,
        habitId,
        customName: customName || null,
        targetDays,
        startDate: new Date(),
        status: 'active',
      });
      res.json(habit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  // Log habit completion
  app.post('/api/recovery/habits/:id/log', isAuthenticated, async (req: any, res) => {
    try {
      const userHabitId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const log = await storage.logHabitCompletion(userHabitId, new Date(), notes);
      res.json(log);
    } catch (error) {
      console.error("Error logging habit:", error);
      res.status(500).json({ message: "Failed to log habit" });
    }
  });

  // Get user milestones
  app.get('/api/recovery/milestones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const milestones = await storage.getUserMilestones(userId);
      const allMilestones = await storage.getRecoveryMilestones();
      res.json({ earned: milestones, available: allMilestones });
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Get recovery programs (for enrollment)
  app.get('/api/recovery/programs', async (req, res) => {
    try {
      const programs = await storage.getRecoveryPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  // ============================================================================
  // STROKE LYFE PUBLISHING ROUTES
  // ============================================================================

  // Get user's publishing projects
  app.get('/api/publishing/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getPublishingProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching publishing projects:", error);
      res.status(500).json({ message: "Failed to fetch publishing projects" });
    }
  });

  // Create new publishing project
  app.post('/api/publishing/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, subtitle, description, genre, targetAudience } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const project = await storage.createPublishingProject({
        authorId: userId,
        title,
        subtitle: subtitle || null,
        description: description || null,
        genre: genre || null,
        targetAudience: targetAudience || null,
        status: 'draft',
        isPublished: false,
      });
      
      res.json(project);
    } catch (error) {
      console.error("Error creating publishing project:", error);
      res.status(500).json({ message: "Failed to create publishing project" });
    }
  });

  // Get single publishing project
  app.get('/api/publishing/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getPublishingProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this project" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching publishing project:", error);
      res.status(500).json({ message: "Failed to fetch publishing project" });
    }
  });

  // Update publishing project
  app.patch('/api/publishing/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getPublishingProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this project" });
      }
      
      const { title, subtitle, description, genre, targetAudience, status, coverImageUrl, wordCount, chapterCount } = req.body;
      
      const updatedProject = await storage.updatePublishingProject(projectId, {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(genre !== undefined && { genre }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(status !== undefined && { status }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(wordCount !== undefined && { wordCount }),
        ...(chapterCount !== undefined && { chapterCount }),
      });
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating publishing project:", error);
      res.status(500).json({ message: "Failed to update publishing project" });
    }
  });

  // Delete publishing project
  app.delete('/api/publishing/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getPublishingProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
      }
      
      await storage.deletePublishingProject(projectId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting publishing project:", error);
      res.status(500).json({ message: "Failed to delete publishing project" });
    }
  });

  // Image proxy for external product images
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        // Return 1x1 transparent pixel on missing URL
        const transparentPixel = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64'
        );
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(transparentPixel);
      }

      const decodedUrl = decodeURIComponent(url);
      
      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(decodedUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        const transparentPixel = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64'
        );
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(transparentPixel);
      }

      // Fetch image with proper headers
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': parsedUrl.origin,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());

      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('X-Content-Type-Options', 'nosniff');
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying image:", error);
      // Return 1x1 transparent pixel on error
      const transparentPixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(transparentPixel);
    }
  });

  // Recovery enrollment endpoint
  app.post('/api/recovery/enrollment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strokeDate, strokeType, affectedSide, mobilityLevel, handFunction, speechAbility, goals, dailyTime } = req.body;
      
      // 1. Update or create user profile
      const existingProfile = await storage.getUserProfile(userId);
      if (existingProfile) {
        await storage.updateUserProfile(userId, {
          strokeDate: strokeDate ? new Date(strokeDate) : null,
          strokeType,
          affectedSide,
          recoveryGoals: goals,
        });
      } else {
        await storage.createUserProfile({
          userId,
          strokeDate: strokeDate ? new Date(strokeDate) : null,
          strokeType,
          affectedSide,
          recoveryGoals: goals,
        });
      }
      
      // 2. Determine program tier based on assessment
      let tier = 'explorer';
      if (mobilityLevel === 'independent' && (dailyTime === '60-90' || dailyTime === '90+')) {
        tier = 'champion';
      } else if ((mobilityLevel === 'cane' || mobilityLevel === 'independent-limited') && (dailyTime === '30-60' || dailyTime === '60-90')) {
        tier = 'warrior';
      }
      
      // 3. Find or create program for tier
      const program = await storage.getRecoveryProgramBySlug(`recovery-university-${tier}`);
      
      // 4. Check for existing enrollment
      const existingEnrollment = await storage.getUserEnrollment(userId);
      let enrollment;
      if (existingEnrollment) {
        enrollment = await storage.updateUserEnrollment(existingEnrollment.id, {
          programId: program?.id || 1,
          status: 'active',
        });
      } else {
        enrollment = await storage.createUserEnrollment({
          userId,
          programId: program?.id || 1,
          status: 'active',
          recoveryScore: 0,
          progressPercentage: 0,
        });
      }
      
      // 5. Create initial user streak
      await storage.createOrUpdateUserStreak(userId, {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
      });
      
      // 6. Create initial habits based on goals
      const defaultHabits = await storage.getDefaultHabits();
      const existingHabits = await storage.getUserHabits(userId);
      if (existingHabits.length === 0) {
        for (const habit of defaultHabits.slice(0, 3)) {
          await storage.createUserHabit({
            userId,
            habitId: habit.id,
            targetDays: 66,
            status: 'active',
          });
        }
      }
      
      res.json({ enrollment, tier, programName: program?.name || `Recovery University ${tier.charAt(0).toUpperCase() + tier.slice(1)}` });
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  // ============================================================================
  // ACHIEVEMENTS API
  // ============================================================================

  // Get user's earned achievements
  app.get('/api/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get all available milestones
  app.get('/api/achievements/available', isAuthenticated, async (req: any, res) => {
    try {
      const milestones = await storage.getAvailableMilestones();
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching available milestones:", error);
      res.status(500).json({ message: "Failed to fetch available milestones" });
    }
  });

  // Check and award streak-based milestones
  app.get('/api/achievements/check-streaks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      const currentStreak = streak?.currentStreak || 0;
      const awarded = await storage.checkAndAwardStreakMilestones(userId, currentStreak);
      res.json({ awarded, currentStreak });
    } catch (error) {
      console.error("Error checking streak milestones:", error);
      res.status(500).json({ message: "Failed to check streak milestones" });
    }
  });

  // Claim a milestone achievement
  app.post('/api/achievements/:milestoneId/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const milestoneId = parseInt(req.params.milestoneId);
      const { notes } = req.body;
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid milestone ID" });
      }
      
      const awarded = await storage.awardMilestone(userId, milestoneId, notes);
      const milestones = await storage.getAvailableMilestones();
      const milestone = milestones.find(m => m.id === milestoneId);
      
      res.json({
        ...awarded,
        name: milestone?.name,
        description: milestone?.description,
        category: milestone?.category,
        pointsAwarded: milestone?.pointsAwarded,
      });
    } catch (error) {
      console.error("Error claiming milestone:", error);
      res.status(500).json({ message: "Failed to claim milestone" });
    }
  });

  // Get achievement stats for report card
  app.get('/api/achievements/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      const streak = await storage.getUserStreak(userId);
      const milestones = await storage.getAvailableMilestones();
      
      const totalPoints = achievements.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
      const badgesEarned = achievements.length;
      const currentStreak = streak?.currentStreak || 0;
      const longestStreak = streak?.longestStreak || 0;
      const totalActiveDays = streak?.totalActiveDays || 0;
      
      const categoryStats = {
        physical: achievements.filter(a => a.category === 'physical').length,
        emotional: achievements.filter(a => a.category === 'emotional').length,
        cognitive: achievements.filter(a => a.category === 'cognitive').length,
        social: achievements.filter(a => a.category === 'social' || a.category === 'streak').length,
      };
      
      res.json({
        totalPoints,
        badgesEarned,
        totalMilestones: milestones.length,
        currentStreak,
        longestStreak,
        totalActiveDays,
        categoryStats,
      });
    } catch (error) {
      console.error("Error fetching achievement stats:", error);
      res.status(500).json({ message: "Failed to fetch achievement stats" });
    }
  });

  // ============================================================================
  // ACCOUNTABILITY PODS API
  // ============================================================================

  // Get open pods for joining
  app.get('/api/pods', isAuthenticated, async (req: any, res) => {
    try {
      const pods = await storage.getOpenPods();
      res.json(pods);
    } catch (error) {
      console.error("Error fetching pods:", error);
      res.status(500).json({ message: "Failed to fetch pods" });
    }
  });

  // Get user's current pod
  app.get('/api/user/pod', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pod = await storage.getUserPod(userId);
      if (!pod) {
        return res.json(null);
      }
      const members = await storage.getPodMembers(pod.id);
      res.json({ ...pod, members });
    } catch (error) {
      console.error("Error fetching user pod:", error);
      res.status(500).json({ message: "Failed to fetch user pod" });
    }
  });

  // Get pod details
  app.get('/api/pods/:id', isAuthenticated, async (req: any, res) => {
    try {
      const podId = parseInt(req.params.id);
      const pod = await storage.getAccountabilityPod(podId);
      if (!pod) {
        return res.status(404).json({ message: "Pod not found" });
      }
      res.json(pod);
    } catch (error) {
      console.error("Error fetching pod:", error);
      res.status(500).json({ message: "Failed to fetch pod" });
    }
  });

  // Get pod members
  app.get('/api/pods/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const podId = parseInt(req.params.id);
      const members = await storage.getPodMembers(podId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching pod members:", error);
      res.status(500).json({ message: "Failed to fetch pod members" });
    }
  });

  // Get pod activity feed
  app.get('/api/pods/:id/activity', isAuthenticated, async (req: any, res) => {
    try {
      const podId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getRecentPodActivity(podId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching pod activity:", error);
      res.status(500).json({ message: "Failed to fetch pod activity" });
    }
  });

  // Create a new pod
  app.post('/api/pods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, focusArea, meetingSchedule, isPrivate, maxMembers } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Pod name is required" });
      }
      
      const pod = await storage.createPod({
        name,
        description: description || null,
        leaderId: userId,
        focusArea: focusArea || null,
        meetingSchedule: meetingSchedule || null,
        isPrivate: isPrivate || false,
        maxMembers: maxMembers || 6,
        isActive: true,
      });
      
      // Automatically join the pod as creator
      await storage.joinPod(userId, pod.id);
      
      res.json(pod);
    } catch (error) {
      console.error("Error creating pod:", error);
      res.status(500).json({ message: "Failed to create pod" });
    }
  });

  // Join a pod
  app.post('/api/pods/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const podId = parseInt(req.params.id);
      
      // Check if pod exists and has space
      const pod = await storage.getAccountabilityPod(podId);
      if (!pod) {
        return res.status(404).json({ message: "Pod not found" });
      }
      
      if (pod.memberCount >= pod.maxMembers) {
        return res.status(400).json({ message: "Pod is full" });
      }
      
      // Check if user is already in a pod
      const existingPod = await storage.getUserPod(userId);
      if (existingPod) {
        return res.status(400).json({ message: "You are already in a pod. Leave your current pod first." });
      }
      
      const member = await storage.joinPod(userId, podId);
      res.json(member);
    } catch (error) {
      console.error("Error joining pod:", error);
      res.status(500).json({ message: "Failed to join pod" });
    }
  });

  // Leave a pod
  app.post('/api/pods/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const podId = parseInt(req.params.id);
      
      await storage.leavePod(userId, podId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving pod:", error);
      res.status(500).json({ message: "Failed to leave pod" });
    }
  });

  // Reminders
  app.get('/api/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getUserReminders(userId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post('/api/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminder = await storage.createReminder({ ...req.body, userId });
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.patch('/api/reminders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const reminder = await storage.updateReminder(parseInt(req.params.id), req.body);
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete('/api/reminders/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteReminder(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Stand Goals
  app.get('/api/wellness/stand-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.getUserStandGoal(userId);
      const count = await storage.getTodayStandCount(userId);
      res.json({ goal, todayCount: count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stand goal" });
    }
  });

  app.post('/api/wellness/stand-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.createOrUpdateStandGoal(userId, req.body);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to save stand goal" });
    }
  });

  app.post('/api/wellness/stand-log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const log = await storage.logStand(userId, req.body.duration);
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to log stand" });
    }
  });

  // Hydration Goals
  app.get('/api/wellness/hydration-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.getUserHydrationGoal(userId);
      const amount = await storage.getTodayHydration(userId);
      res.json({ goal, todayAmount: amount });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hydration goal" });
    }
  });

  app.post('/api/wellness/hydration-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.createOrUpdateHydrationGoal(userId, req.body);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to save hydration goal" });
    }
  });

  app.post('/api/wellness/hydration-log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const log = await storage.logHydration(userId, req.body.amount);
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to log hydration" });
    }
  });

  // Exercise Goals
  app.get('/api/wellness/exercise-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.getUserExerciseGoal(userId);
      const duration = await storage.getTodayExercise(userId);
      res.json({ goal, todayDuration: duration });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise goal" });
    }
  });

  app.post('/api/wellness/exercise-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.createOrUpdateExerciseGoal(userId, req.body);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to save exercise goal" });
    }
  });

  app.post('/api/wellness/exercise-log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const log = await storage.logExercise(userId, req.body.type, req.body.duration, req.body.intensity);
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to log exercise" });
    }
  });

  app.post('/api/admin/seed-recovery-data', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const result = await seedRecoveryData();
      res.json({ 
        success: true, 
        message: "Recovery data seeded successfully",
        ...result
      });
    } catch (error) {
      console.error("Error seeding recovery data:", error);
      res.status(500).json({ message: "Failed to seed recovery data" });
    }
  });

  // ============================================================================
  // USER SETTINGS
  // ============================================================================

  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.createOrUpdateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post('/api/settings/username', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username } = req.body;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      
      const available = await storage.isUsernameAvailable(username);
      if (!available) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      
      const settings = await storage.createOrUpdateUserSettings(userId, { username });
      res.json(settings);
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  app.get('/api/settings/username/check', async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ available: false });
      }
      const available = await storage.isUsernameAvailable(username);
      res.json({ available });
    } catch (error) {
      res.status(500).json({ available: false });
    }
  });

  // ============================================================================
  // ACTIVITY WALL
  // ============================================================================

  app.get('/api/activity', async (req: any, res) => {
    try {
      const { limit, offset, visibility, podId, authorId } = req.query;
      const posts = await storage.getActivityPosts({
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        visibility: visibility as string,
        podId: podId ? parseInt(podId) : undefined,
        authorId: authorId as string,
      });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching activity posts:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get('/api/activity/:id', async (req, res) => {
    try {
      const post = await storage.getActivityPost(parseInt(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const media = await storage.getActivityMedia(post.id);
      const reactions = await storage.getActivityReactions(post.id);
      const comments = await storage.getActivityComments(post.id);
      res.json({ ...post, media, reactions, comments });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, postType, visibility, podId, media } = req.body;
      
      const post = await storage.createActivityPost({
        authorId: userId,
        content,
        postType: postType || 'update',
        visibility: visibility || 'public',
        podId,
      });
      
      if (media && Array.isArray(media)) {
        for (let i = 0; i < media.length; i++) {
          await storage.addActivityMedia({
            postId: post.id,
            ...media[i],
            order: i,
          });
        }
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/activity/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const post = await storage.getActivityPost(parseInt(req.params.id));
      if (!post || post.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteActivityPost(post.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post('/api/activity/:id/react', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reactionType } = req.body;
      const result = await storage.toggleActivityReaction(parseInt(req.params.id), userId, reactionType || 'like');
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to react" });
    }
  });

  app.post('/api/activity/:id/comment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, parentId } = req.body;
      const comment = await storage.createActivityComment({
        postId: parseInt(req.params.id),
        authorId: userId,
        content,
        parentId,
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // ============================================================================
  // THERAPIST SYSTEM
  // ============================================================================

  app.get('/api/therapist/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getTherapistProfile(userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch therapist profile" });
    }
  });

  app.post('/api/therapist/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await storage.getTherapistProfile(userId);
      if (existing) {
        const profile = await storage.updateTherapistProfile(userId, req.body);
        return res.json(profile);
      }
      const profile = await storage.createTherapistProfile({ ...req.body, userId });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to save therapist profile" });
    }
  });

  app.get('/api/therapists', async (req, res) => {
    try {
      const { acceptingPatients } = req.query;
      const therapists = await storage.getVerifiedTherapists({
        acceptingPatients: acceptingPatients === 'true' ? true : undefined,
      });
      res.json(therapists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch therapists" });
    }
  });

  app.get('/api/therapist/patients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getPatientAssignments(userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get('/api/patient/therapist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignment = await storage.getTherapistForPatient(userId);
      res.json(assignment || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch therapist" });
    }
  });

  app.post('/api/therapist/assign', isAuthenticated, async (req: any, res) => {
    try {
      const therapistId = req.user.claims.sub;
      const { patientId, goals, sessionFrequency } = req.body;
      const assignment = await storage.createPatientAssignment({
        therapistId,
        patientId,
        goals,
        sessionFrequency,
      });
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.get('/api/therapy/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { assignmentId } = req.query;
      const sessions = await storage.getTherapySessions(
        assignmentId ? parseInt(assignmentId) : undefined,
        userId
      );
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/therapy/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createTherapySession({
        ...req.body,
        therapistId: userId,
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get('/api/patient/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prescriptions = await storage.getExercisePrescriptions(userId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.post('/api/therapist/prescribe', isAuthenticated, async (req: any, res) => {
    try {
      const therapistId = req.user.claims.sub;
      const prescription = await storage.createExercisePrescription({
        ...req.body,
        therapistId,
      });
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  // ============================================================================
  // THERAPEUTIC EXERCISES
  // ============================================================================

  app.get('/api/exercises', async (req, res) => {
    try {
      const { category, difficulty } = req.query;
      const exercises = await storage.getTherapeuticExercises({
        category: category as string,
        difficulty: difficulty as string,
      });
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.get('/api/exercises/:slug', async (req, res) => {
    try {
      const exercise = await storage.getTherapeuticExerciseBySlug(req.params.slug);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise" });
    }
  });

  app.post('/api/exercises/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.recordExerciseSession({
        userId,
        ...req.body,
      });
      
      if (req.body.score !== undefined) {
        await storage.updateExerciseScore(
          userId,
          req.body.exerciseId,
          req.body.score,
          req.body.accuracy || 0,
          req.body.duration || 0
        );
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error recording exercise session:", error);
      res.status(500).json({ message: "Failed to record session" });
    }
  });

  app.get('/api/exercises/sessions/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { exerciseId } = req.query;
      const sessions = await storage.getExerciseSessions(userId, exerciseId ? parseInt(exerciseId) : undefined);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/exercises/scores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const scores = await storage.getUserExerciseScores(userId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  app.get('/api/speech-exercises', async (req, res) => {
    try {
      const { category } = req.query;
      const exercises = await storage.getSpeechExercises(category as string);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speech exercises" });
    }
  });

  app.get('/api/cognitive-exercises', async (req, res) => {
    try {
      const { category } = req.query;
      const exercises = await storage.getCognitiveExercises(category as string);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cognitive exercises" });
    }
  });

  // ============================================================================
  // DIRECT MESSAGING
  // ============================================================================

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds, type, name } = req.body;
      const conversation = await storage.createConversation(
        { createdById: userId, type: type || 'direct', name },
        [userId, ...participantIds]
      );
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit, offset } = req.query;
      const messages = await storage.getConversationMessages(
        parseInt(req.params.id),
        limit ? parseInt(limit) : 50,
        offset ? parseInt(offset) : 0
      );
      await storage.markMessagesAsRead(parseInt(req.params.id), userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const message = await storage.sendDirectMessage({
        conversationId: parseInt(req.params.id),
        senderId: userId,
        ...req.body,
      });
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============================================================================
  // VIDEO SESSIONS
  // ============================================================================

  app.get('/api/video-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.query;
      const sessions = await storage.getVideoSessions(userId, status as string);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video sessions" });
    }
  });

  app.post('/api/video-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createVideoSession({
        hostId: userId,
        ...req.body,
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create video session" });
    }
  });

  app.patch('/api/video-sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.updateVideoSession(parseInt(req.params.id), req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update video session" });
    }
  });

  // ============================================================================
  // VITALS TRACKING
  // ============================================================================

  app.get('/api/vitals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vitals = await storage.getVitals(userId);
      res.json(vitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vitals" });
    }
  });

  app.post('/api/vitals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vital = await storage.createVital({ userId, ...req.body });
      res.json(vital);
    } catch (error) {
      res.status(500).json({ message: "Failed to create vital" });
    }
  });

  // ============================================================================
  // WEARABLES
  // ============================================================================

  app.get('/api/wearables/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getWearableConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wearable connections" });
    }
  });

  app.post('/api/wearables/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider } = req.body;
      const connection = await storage.createWearableConnection({
        userId,
        provider,
        deviceName: `${provider} Device`,
        syncEnabled: true,
        metricsEnabled: { steps: true, heart_rate: true, sleep: true, calories: true, active_minutes: true },
      });
      res.json(connection);
    } catch (error) {
      res.status(500).json({ message: "Failed to connect wearable" });
    }
  });

  app.delete('/api/wearables/connections/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteWearableConnection(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect wearable" });
    }
  });

  app.post('/api/wearables/connections/:id/sync', isAuthenticated, async (req: any, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      await storage.syncWearableData(connectionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync wearable" });
    }
  });

  app.get('/api/wearables/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getWearableMetrics(userId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get('/api/wearables/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = await storage.getWearableTodayStats(userId);
      res.json(today);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today stats" });
    }
  });

  // ============================================================================
  // SOCIAL NETWORK
  // ============================================================================

  app.get('/api/social/followers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/social/following', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.post('/api/social/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      await storage.followUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/social/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      await storage.unfollowUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/search', async (req: any, res) => {
    try {
      const { q } = req.query;
      const users = await storage.searchUsers(q as string);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // ============================================================================
  // MESSAGES (updating existing routes for frontend compatibility)
  // ============================================================================

  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds } = req.body;
      const conversation = await storage.createConversation(userId, participantIds);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/messages/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      const message = await storage.createMessage({ conversationId, senderId: userId, content });
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============================================================================
  // VIDEO SESSIONS (frontend compatibility)
  // ============================================================================

  app.get('/api/video/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getVideoSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video sessions" });
    }
  });

  app.post('/api/video/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createVideoSession({ hostId: userId, ...req.body });
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create video session" });
    }
  });

  app.post('/api/video/sessions/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.id);
      await storage.joinVideoSession(sessionId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to join session" });
    }
  });

  app.post('/api/video/sessions/:id/end', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.endVideoSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // ============================================================================
  // THERAPIST MARKETPLACE
  // ============================================================================

  app.get('/api/therapist-marketplace', async (req, res) => {
    try {
      const storefronts = await storage.getTherapistStorefronts();
      res.json(storefronts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storefronts" });
    }
  });

  app.get('/api/therapist-marketplace/my-products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getTherapistProducts(userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/therapist-marketplace/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const product = await storage.createTherapistProduct({ therapistId: userId, ...req.body });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/therapist-marketplace/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const earnings = await storage.getTherapistEarnings(userId);
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  app.post('/api/therapist-marketplace/products/:id/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.id);
      const checkoutUrl = await storage.purchaseTherapistProduct(userId, productId);
      res.json({ checkoutUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to initiate purchase" });
    }
  });

  // ============================================================================
  // ADMIN PLAN BUILDER
  // ============================================================================

  app.get('/api/admin/plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const plans = await storage.getRecoveryPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post('/api/admin/plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const plan = await storage.createRecoveryPlan({ createdBy: userId, ...req.body });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create plan" });
    }
  });

  app.delete('/api/admin/plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      await storage.deleteRecoveryPlan(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  app.post('/api/admin/plans/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const planId = parseInt(req.params.id);
      const { userIds } = req.body;
      await storage.assignRecoveryPlan(planId, userIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign plan" });
    }
  });

  // ============================================================================
  // SEO PAGES
  // ============================================================================

  app.get('/api/seo/:slug', async (req, res) => {
    try {
      const page = await storage.getSeoPage(req.params.slug);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO data" });
    }
  });

  app.get('/api/sitemap', async (req, res) => {
    try {
      const pages = await storage.getAllSeoPages();
      res.json(pages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sitemap" });
    }
  });

  // ============================================================================
  // BLOGGING SUITE - USER STORIES
  // ============================================================================

  app.get('/api/blog', async (req, res) => {
    try {
      const { authorId, status, featured } = req.query;
      const posts = await storage.getBlogPosts({
        authorId: authorId as string,
        status: status as string || 'published',
        featured: featured === 'true'
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog/featured', async (req, res) => {
    try {
      const posts = await storage.getBlogPosts({ status: 'published', featured: true });
      res.json(posts.slice(0, 6));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured posts" });
    }
  });

  app.get('/api/blog/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getUserBlogPosts(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your posts" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      await storage.incrementBlogViews(post.id);
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/blog', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const post = await storage.createBlogPost({ ...req.body, authorId: userId });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.patch('/api/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const existing = await storage.getBlogPost(postId);
      if (!existing || existing.authorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const post = await storage.updateBlogPost(postId, req.body);
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.post('/api/blog/:id/publish', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const existing = await storage.getBlogPost(postId);
      if (!existing || existing.authorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const post = await storage.publishBlogPost(postId);
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to publish post" });
    }
  });

  app.delete('/api/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const existing = await storage.getBlogPost(postId);
      if (!existing || existing.authorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      await storage.deleteBlogPost(postId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post('/api/blog/:id/react', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const { reactionType } = req.body;
      const result = await storage.toggleBlogReaction(postId, userId, reactionType || 'like');
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to react to post" });
    }
  });

  app.get('/api/blog/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getBlogComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/blog/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const comment = await storage.createBlogComment({
        postId,
        authorId: userId,
        content: req.body.content,
        parentId: req.body.parentId
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.delete('/api/blog/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBlogComment(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ============================================================================
  // BOOK MARKETPLACE ROUTES
  // ============================================================================

  // Get all published marketplace listings
  app.get('/api/marketplace/books', async (req, res) => {
    try {
      const { genre, sort, featured } = req.query;
      const listings = await storage.getMarketplaceListings({
        genre: genre as string,
        sortBy: sort as string,
        featuredOnly: featured === 'true',
        status: 'published'
      });
      res.json(listings);
    } catch (error) {
      console.error("Error fetching marketplace listings:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Get single book listing with editions
  app.get('/api/marketplace/books/:id', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Book not found" });
      }
      const editions = await storage.getBookEditions(listingId);
      const reviews = await storage.getBookReviews(listingId);
      res.json({ ...listing, editions, reviews });
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  // Get author's listings
  app.get('/api/marketplace/my-books', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const listings = await storage.getAuthorListings(authorId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching author listings:", error);
      res.status(500).json({ message: "Failed to fetch your books" });
    }
  });

  // Create marketplace listing from publishing project
  app.post('/api/marketplace/publish', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const { projectId, title, subtitle, description, coverImageUrl, genre, tags, editions } = req.body;

      if (!projectId || !title || !description || !genre) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify project ownership
      const project = await storage.getPublishingProject(projectId);
      if (!project || project.authorId !== authorId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Create the marketplace listing
      const listing = await storage.createMarketplaceListing({
        projectId,
        authorId,
        title,
        subtitle,
        description,
        coverImageUrl,
        genre,
        tags,
        pageCount: project.wordCount ? Math.ceil(project.wordCount / 250) : undefined,
        wordCount: project.wordCount,
        status: 'pending_review'
      });

      // Create editions if provided
      if (editions && editions.length > 0) {
        for (const edition of editions) {
          await storage.createBookEdition({
            listingId: listing.id,
            ...edition
          });
        }
      }

      res.json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to publish book" });
    }
  });

  // Update marketplace listing
  app.patch('/api/marketplace/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      const existing = await storage.getMarketplaceListing(listingId);
      if (!existing || existing.authorId !== authorId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateMarketplaceListing(listingId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  // Add/update book edition
  app.post('/api/marketplace/books/:id/editions', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing || listing.authorId !== authorId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const edition = await storage.createBookEdition({
        listingId,
        ...req.body
      });
      res.json(edition);
    } catch (error) {
      console.error("Error adding edition:", error);
      res.status(500).json({ message: "Failed to add edition" });
    }
  });

  // Get print cost estimate
  app.post('/api/marketplace/print-cost', isAuthenticated, async (req: any, res) => {
    try {
      const { pageCount, trimSize, bindingType, paperType, colorInterior, quantity } = req.body;
      
      const { calculatePrintCost, suggestRetailPrice } = await import('./luluService');
      const printCost = calculatePrintCost({
        pageCount: pageCount || 200,
        trimSize: trimSize || 'us_trade',
        bindingType: bindingType || 'perfect',
        paperType: paperType || 'standard_white',
        colorInterior: colorInterior || false
      });
      
      const pricing = suggestRetailPrice(printCost);
      
      res.json({
        printCost,
        quantity: quantity || 1,
        totalPrintCost: printCost * (quantity || 1),
        ...pricing
      });
    } catch (error) {
      console.error("Error calculating print cost:", error);
      res.status(500).json({ message: "Failed to calculate print cost" });
    }
  });

  // Get shipping options
  app.post('/api/marketplace/shipping-options', async (req, res) => {
    try {
      const { countryCode, pageCount, quantity } = req.body;
      
      const { getShippingOptions } = await import('./luluService');
      const options = await getShippingOptions(
        countryCode || 'US',
        pageCount || 200,
        quantity || 1
      );
      
      res.json(options);
    } catch (error) {
      console.error("Error getting shipping options:", error);
      res.status(500).json({ message: "Failed to get shipping options" });
    }
  });

  // Create checkout session for book purchase
  app.post('/api/marketplace/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user.claims.sub;
      const customerEmail = req.user.claims.email;
      const customerName = req.user.claims.name || 'Customer';
      const { items, shippingAddress } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items in cart" });
      }

      const { generateOrderNumber, estimateShippingCost } = await import('./luluService');
      const orderNumber = generateOrderNumber();

      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const edition = await storage.getBookEdition(item.editionId);
        if (!edition) {
          return res.status(400).json({ message: `Edition ${item.editionId} not found` });
        }
        
        const itemSubtotal = edition.price * item.quantity;
        subtotal += itemSubtotal;
        
        orderItems.push({
          editionId: edition.id,
          listingId: edition.listingId,
          quantity: item.quantity,
          unitPrice: edition.price,
          printCost: edition.printCost,
          authorRoyalty: edition.authorRoyalty,
          subtotal: itemSubtotal
        });
      }

      // Calculate shipping for print orders
      let shippingCost = 0;
      const hasPrintItems = orderItems.some(item => item.printCost);
      if (hasPrintItems && shippingAddress) {
        shippingCost = estimateShippingCost(
          shippingAddress.countryCode || 'US',
          orderItems.reduce((sum, item) => sum + item.quantity, 0),
          'GROUND'
        );
      }

      const total = subtotal + shippingCost;

      // Create order in database
      const order = await storage.createBookOrder({
        orderNumber,
        customerId,
        customerEmail,
        customerName,
        status: 'pending',
        subtotal,
        shippingCost,
        tax: 0,
        total,
        shippingName: shippingAddress?.name,
        shippingStreet1: shippingAddress?.street1,
        shippingStreet2: shippingAddress?.street2,
        shippingCity: shippingAddress?.city,
        shippingState: shippingAddress?.state,
        shippingPostcode: shippingAddress?.postcode,
        shippingCountry: shippingAddress?.countryCode,
        shippingPhone: shippingAddress?.phone
      });

      // Create order items
      for (const item of orderItems) {
        await storage.createOrderItem({
          orderId: order.id,
          ...item
        });
      }

      // Create Stripe checkout session
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        return res.status(500).json({ message: "Payment not configured" });
      }

      const lineItems = await Promise.all(orderItems.map(async (item) => {
        const listing = await storage.getMarketplaceListing(item.listingId);
        const edition = await storage.getBookEdition(item.editionId);
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing?.title || 'Book',
              description: edition?.editionType || 'Edition',
            },
            unit_amount: item.unitPrice,
          },
          quantity: item.quantity,
        };
      }));

      if (shippingCost > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
              description: 'Ground shipping',
            },
            unit_amount: shippingCost,
          },
          quantity: 1,
        });
      }

      const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${domain}/marketplace/order/${order.id}?success=true`,
        cancel_url: `${domain}/marketplace/cart?cancelled=true`,
        metadata: {
          orderId: order.id.toString(),
          orderNumber,
        },
      });

      // Update order with Stripe session ID
      await storage.updateBookOrder(order.id, {
        stripeCheckoutSessionId: session.id
      });

      res.json({ 
        orderId: order.id,
        orderNumber,
        checkoutUrl: session.url 
      });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create checkout" });
    }
  });

  // Get order details
  app.get('/api/marketplace/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user.claims.sub;
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getBookOrder(orderId);
      if (!order || order.customerId !== customerId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await storage.getOrderItems(orderId);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get customer's orders
  app.get('/api/marketplace/my-orders', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user.claims.sub;
      const orders = await storage.getCustomerOrders(customerId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Author dashboard - earnings
  app.get('/api/marketplace/author/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const earnings = await storage.getAuthorEarnings(authorId);
      const totals = await storage.getAuthorEarningsSummary(authorId);
      res.json({ earnings, totals });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // Author dashboard - sales analytics
  app.get('/api/marketplace/author/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const analytics = await storage.getAuthorAnalytics(authorId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Submit book review
  app.post('/api/marketplace/books/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      const { rating, title, content, orderId } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating" });
      }

      // Check if verified purchase
      let isVerifiedPurchase = false;
      if (orderId) {
        const order = await storage.getBookOrder(orderId);
        if (order && order.customerId === reviewerId && order.status !== 'cancelled') {
          const items = await storage.getOrderItems(orderId);
          isVerifiedPurchase = items.some(item => item.listingId === listingId);
        }
      }

      const review = await storage.createBookReview({
        listingId,
        reviewerId,
        orderId: orderId || null,
        rating,
        title,
        content,
        isVerifiedPurchase
      });

      // Update listing's average rating
      await storage.updateListingRating(listingId);

      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Lulu print specifications
  app.get('/api/marketplace/print-specs', (req, res) => {
    const { trimSizes, bindingTypes, paperTypes } = require('./luluService');
    res.json({ trimSizes, bindingTypes, paperTypes });
  });

  // ============================================================================
  // AI ORCHESTRATOR ROUTES - Unified Content Generation
  // ============================================================================

  // Unified content generation endpoint
  app.post('/api/ai/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, systemPrompt, taskType, maxTokens, temperature, jsonMode } = req.body;

      if (!prompt || !taskType) {
        return res.status(400).json({ message: "prompt and taskType are required" });
      }

      const result = await generate({
        prompt,
        systemPrompt,
        taskType,
        userId,
        maxTokens,
        temperature,
        jsonMode,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error in AI generate:", error);
      res.status(500).json({ message: error.message || "Failed to generate content" });
    }
  });

  // Streaming content generation with Server-Sent Events
  app.post('/api/ai/generate-stream', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, systemPrompt, taskType, maxTokens, temperature } = req.body;

      if (!prompt || !taskType) {
        return res.status(400).json({ message: "prompt and taskType are required" });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const result = await generateStream(
        {
          prompt,
          systemPrompt,
          taskType,
          userId,
          maxTokens,
          temperature,
        },
        (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Error in AI stream:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "Stream failed" })}\n\n`);
      res.end();
    }
  });

  // Book outline generation
  app.post('/api/ai/book/outline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, genre, description, chapterCount } = req.body;

      if (!title || !genre || !description) {
        return res.status(400).json({ message: "title, genre, and description are required" });
      }

      const result = await bookGenerator.generateOutline(title, genre, description, chapterCount || 12, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating book outline:", error);
      res.status(500).json({ message: error.message || "Failed to generate outline" });
    }
  });

  // Book chapter generation
  app.post('/api/ai/book/chapter', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookTitle, chapterNumber, chapterTitle, outline, previousContext, targetWords } = req.body;

      if (!bookTitle || !chapterNumber || !chapterTitle || !outline) {
        return res.status(400).json({ message: "bookTitle, chapterNumber, chapterTitle, and outline are required" });
      }

      const result = await bookGenerator.generateChapter(
        bookTitle,
        chapterNumber,
        chapterTitle,
        outline,
        previousContext || "",
        targetWords || 3000,
        userId
      );
      res.json(result);
    } catch (error: any) {
      console.error("Error generating book chapter:", error);
      res.status(500).json({ message: error.message || "Failed to generate chapter" });
    }
  });

  // Content refinement
  app.post('/api/ai/book/refine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, instructions } = req.body;

      if (!content || !instructions) {
        return res.status(400).json({ message: "content and instructions are required" });
      }

      const result = await bookGenerator.refineContent(content, instructions, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error refining content:", error);
      res.status(500).json({ message: error.message || "Failed to refine content" });
    }
  });

  // Book blurb generation
  app.post('/api/ai/marketing/blurb', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, genre, synopsis, targetAudience } = req.body;

      if (!title || !genre || !synopsis || !targetAudience) {
        return res.status(400).json({ message: "title, genre, synopsis, and targetAudience are required" });
      }

      const result = await marketingGenerator.generateBookBlurb(title, genre, synopsis, targetAudience, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating blurb:", error);
      res.status(500).json({ message: error.message || "Failed to generate blurb" });
    }
  });

  // Social media posts generation
  app.post('/api/ai/marketing/social', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookTitle, blurb, platforms } = req.body;

      if (!bookTitle || !blurb || !platforms || !Array.isArray(platforms)) {
        return res.status(400).json({ message: "bookTitle, blurb, and platforms array are required" });
      }

      const result = await marketingGenerator.generateSocialPosts(bookTitle, blurb, platforms, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating social posts:", error);
      res.status(500).json({ message: error.message || "Failed to generate social posts" });
    }
  });

  // Screenplay treatment generation
  app.post('/api/ai/screenplay/treatment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, logline, genre, targetLength } = req.body;

      if (!title || !logline || !genre || !targetLength) {
        return res.status(400).json({ message: "title, logline, genre, and targetLength are required" });
      }

      const result = await screenplayGenerator.generateTreatment(title, logline, genre, targetLength, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating treatment:", error);
      res.status(500).json({ message: error.message || "Failed to generate treatment" });
    }
  });

  // Screenplay scene generation
  app.post('/api/ai/screenplay/scene', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { context, sceneDescription, characters } = req.body;

      if (!context || !sceneDescription || !characters || !Array.isArray(characters)) {
        return res.status(400).json({ message: "context, sceneDescription, and characters array are required" });
      }

      const result = await screenplayGenerator.generateScene(context, sceneDescription, characters, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating scene:", error);
      res.status(500).json({ message: error.message || "Failed to generate scene" });
    }
  });

  // Course curriculum generation
  app.post('/api/ai/course/curriculum', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseName, description, targetAudience, duration } = req.body;

      if (!courseName || !description || !targetAudience || !duration) {
        return res.status(400).json({ message: "courseName, description, targetAudience, and duration are required" });
      }

      const result = await courseGenerator.generateCurriculum(courseName, description, targetAudience, duration, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating curriculum:", error);
      res.status(500).json({ message: error.message || "Failed to generate curriculum" });
    }
  });

  // Course lesson generation
  app.post('/api/ai/course/lesson', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { moduleName, lessonTitle, learningObjectives, duration } = req.body;

      if (!moduleName || !lessonTitle || !learningObjectives || !Array.isArray(learningObjectives) || !duration) {
        return res.status(400).json({ message: "moduleName, lessonTitle, learningObjectives array, and duration are required" });
      }

      const result = await courseGenerator.generateLesson(moduleName, lessonTitle, learningObjectives, duration, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating lesson:", error);
      res.status(500).json({ message: error.message || "Failed to generate lesson" });
    }
  });

  // Research synthesis
  app.post('/api/ai/research/synthesize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, sources, outputFormat } = req.body;

      if (!topic || !sources || !Array.isArray(sources) || !outputFormat) {
        return res.status(400).json({ message: "topic, sources array, and outputFormat are required" });
      }

      if (!['summary', 'report', 'article'].includes(outputFormat)) {
        return res.status(400).json({ message: "outputFormat must be 'summary', 'report', or 'article'" });
      }

      const result = await researchGenerator.synthesize(topic, sources, outputFormat, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error synthesizing research:", error);
      res.status(500).json({ message: error.message || "Failed to synthesize research" });
    }
  });

  // AI usage statistics
  app.get('/api/ai/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 30;

      const stats = await getUsageStats(userId, days);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching AI usage:", error);
      res.status(500).json({ message: error.message || "Failed to fetch usage stats" });
    }
  });

  // ============================================================================
  // CHILDREN'S BOOK CREATION ROUTES
  // ============================================================================

  // Age band configuration for word counts and complexity
  const ageBandConfig = {
    "board-book": { minWords: 50, maxWords: 200, pageCount: 12, sentenceLength: "very short", vocabulary: "basic" },
    "picture-book": { minWords: 500, maxWords: 1000, pageCount: 32, sentenceLength: "short", vocabulary: "simple" },
    "early-reader": { minWords: 200, maxWords: 1500, pageCount: 24, sentenceLength: "short", vocabulary: "controlled" },
    "chapter-book": { minWords: 4000, maxWords: 15000, pageCount: 80, sentenceLength: "medium", vocabulary: "growing" },
    "middle-grade": { minWords: 20000, maxWords: 50000, pageCount: 200, sentenceLength: "varied", vocabulary: "advanced" },
  };

  // Generate complete children's story with pages
  app.post('/api/books/childrens/generate-story', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const parseResult = generateChildStoryRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: parseResult.error.errors
        });
      }
      
      const { 
        ageBand, 
        themes, 
        educationalTags,
        mainCharacter, 
        storyPremise, 
        rhymingMode,
        targetPageCount,
        illustrationStyle 
      } = parseResult.data;

      const config = ageBandConfig[ageBand as keyof typeof ageBandConfig] || ageBandConfig["picture-book"];
      const pageCount = targetPageCount || config.pageCount;

      const systemPrompt = `You are an expert children's book author specializing in ${ageBand} books. 
You create engaging, age-appropriate stories with clear moral lessons.

CRITICAL REQUIREMENTS for ${ageBand} books:
- Word count: ${config.minWords}-${config.maxWords} words total
- Page count: ${pageCount} pages (including front matter)
- Sentence length: ${config.sentenceLength}
- Vocabulary level: ${config.vocabulary}
${rhymingMode ? '- MUST use rhyming text with consistent meter and AABB or ABAB rhyme scheme' : '- Use clear, rhythmic prose'}
- Each page should have 1-4 sentences maximum
- Include sensory details children can relate to
- End with a satisfying resolution that reinforces the moral

THEMES TO INCORPORATE: ${themes.join(', ')}
${educationalTags ? `EDUCATIONAL FOCUS: ${educationalTags.join(', ')}` : ''}

CHARACTER: ${mainCharacter.name} (${mainCharacter.species}) - ${mainCharacter.traits.join(', ')}

OUTPUT FORMAT: Return valid JSON with this structure:
{
  "title": "Book title",
  "targetAge": "${ageBand}",
  "totalWordCount": number,
  "moralLesson": "The main lesson",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Page text...",
      "readAloudHints": "Emphasis words, pause points",
      "illustrationDescription": "What should be illustrated",
      "emotionalTone": "happy/curious/worried/etc",
      "charactersPresent": ["${mainCharacter.name}"]
    }
  ]
}`;

      const prompt = `Create a ${pageCount}-page children's ${ageBand} story based on this premise:

"${storyPremise}"

Main character: ${mainCharacter.name}, a ${mainCharacter.species} who is ${mainCharacter.traits.join(' and ')}.

Themes: ${themes.join(', ')}

${rhymingMode ? 'Write the entire story in rhyming verse with consistent meter.' : 'Use engaging, rhythmic prose.'}

Generate the complete story with all ${pageCount} pages.`;

      const result = await generate({
        prompt,
        systemPrompt,
        taskType: "draft",
        userId,
        maxTokens: 8000,
        temperature: 0.8,
        jsonMode: true,
      });

      // Parse the generated story
      let story;
      try {
        // Extract JSON from response
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          story = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse story JSON:", parseError);
        return res.status(500).json({ 
          message: "Failed to parse generated story",
          raw: result.content
        });
      }

      res.json({
        success: true,
        story,
        model: result.model,
        cached: result.cached,
        costCents: result.costCents,
      });
    } catch (error: any) {
      console.error("Error generating children's story:", error);
      res.status(500).json({ message: error.message || "Failed to generate story" });
    }
  });

  // Generate consistent character illustration prompt
  app.post('/api/books/childrens/character-prompt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { character, illustrationStyle } = req.body;

      if (!character || !illustrationStyle) {
        return res.status(400).json({ 
          message: "character and illustrationStyle are required" 
        });
      }

      const systemPrompt = `You are an expert at creating consistent character descriptions for children's book illustrators.
Your prompts must ensure the character looks IDENTICAL across all illustrations.
Focus on specific, measurable visual details.`;

      const prompt = `Create a detailed illustration prompt for this character that will ensure visual consistency across all pages:

Character Name: ${character.name}
Role: ${character.role}
Description: ${character.description}

Visual Traits:
- Species: ${character.visualTraits?.species || 'human'}
- Age: ${character.visualTraits?.age || 'child'}
- Height: ${character.visualTraits?.height || 'average'}
- Body Type: ${character.visualTraits?.bodyType || 'normal'}
${character.visualTraits?.skinTone ? `- Skin Tone: ${character.visualTraits.skinTone}` : ''}
${character.visualTraits?.hairColor ? `- Hair Color: ${character.visualTraits.hairColor}` : ''}
${character.visualTraits?.hairStyle ? `- Hair Style: ${character.visualTraits.hairStyle}` : ''}
${character.visualTraits?.eyeColor ? `- Eye Color: ${character.visualTraits.eyeColor}` : ''}
- Clothing Style: ${character.visualTraits?.clothingStyle || 'casual'}
- Distinctive Features: ${character.visualTraits?.distinctiveFeatures?.join(', ') || 'none'}

Personality: ${character.personalityTraits?.join(', ') || 'friendly'}

Illustration Style: ${illustrationStyle}

OUTPUT FORMAT: Return valid JSON:
{
  "basePrompt": "Detailed prompt for consistent character rendering...",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keyFeatures": ["Feature that must appear in every illustration"],
  "expressionVariants": {
    "happy": "Modification for happy expression",
    "sad": "Modification for sad expression",
    "curious": "Modification for curious expression",
    "scared": "Modification for scared expression",
    "determined": "Modification for determined expression"
  },
  "poseVariants": {
    "standing": "Pose modification",
    "sitting": "Pose modification",
    "running": "Pose modification",
    "sleeping": "Pose modification"
  }
}`;

      const result = await generate({
        prompt,
        systemPrompt,
        taskType: "image_prompt",
        userId,
        maxTokens: 2000,
        temperature: 0.6,
        jsonMode: true,
      });

      let characterPrompt;
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          characterPrompt = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse character prompt JSON:", parseError);
        return res.status(500).json({ 
          message: "Failed to parse character prompt",
          raw: result.content
        });
      }

      res.json({
        success: true,
        characterPrompt,
        model: result.model,
        cached: result.cached,
      });
    } catch (error: any) {
      console.error("Error generating character prompt:", error);
      res.status(500).json({ message: error.message || "Failed to generate character prompt" });
    }
  });

  // Generate page illustration prompt
  app.post('/api/books/childrens/page-illustration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { spread, characters, illustrationStyle, projectColorPalette } = req.body;

      if (!spread || !illustrationStyle) {
        return res.status(400).json({ 
          message: "spread and illustrationStyle are required" 
        });
      }

      const characterPrompts = characters?.map((c: any) => 
        `${c.name}: ${c.illustrationPrompt || c.description}`
      ).join('\n') || '';

      const systemPrompt = `You are an expert at creating illustration prompts for children's book pages.
Your prompts must be detailed enough for AI image generation to create consistent, beautiful illustrations.
Style: ${illustrationStyle}
${projectColorPalette ? `Color Palette: ${projectColorPalette.join(', ')}` : ''}`;

      const prompt = `Create a detailed illustration prompt for this page:

Page Number: ${spread.pageNumber}
Layout: ${spread.layout}
Page Text: "${spread.text}"
Emotional Tone: ${spread.emotionalTone || 'neutral'}
${spread.actionDescription ? `Action: ${spread.actionDescription}` : ''}

Characters in scene:
${characterPrompts || 'No specific characters defined'}

OUTPUT FORMAT: Return valid JSON:
{
  "illustrationPrompt": "Complete prompt for image generation...",
  "negativePrompt": "Things to avoid in the image",
  "composition": "Description of layout and focal points",
  "lightingMood": "Description of lighting",
  "backgroundElements": ["List of background elements"],
  "suggestedAspectRatio": "4:3 or 3:2 or 1:1"
}`;

      const result = await generate({
        prompt,
        systemPrompt,
        taskType: "image_prompt",
        userId,
        maxTokens: 1500,
        temperature: 0.7,
        jsonMode: true,
      });

      let pagePrompt;
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          pagePrompt = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse page prompt JSON:", parseError);
        return res.status(500).json({ 
          message: "Failed to parse page prompt",
          raw: result.content
        });
      }

      res.json({
        success: true,
        pagePrompt,
        model: result.model,
        cached: result.cached,
      });
    } catch (error: any) {
      console.error("Error generating page illustration:", error);
      res.status(500).json({ message: error.message || "Failed to generate page illustration" });
    }
  });

  // Convert prose to rhyming text
  app.post('/api/books/childrens/rhyme-convert', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const parseResult = rhymeConvertRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: parseResult.error.errors
        });
      }
      
      const { text, rhymeScheme, ageBand } = parseResult.data;

      const systemPrompt = `You are an expert children's book poet. Convert prose into rhyming verse.
Maintain the meaning while adding rhythm and rhyme.
Use age-appropriate vocabulary for ${ageBand || 'picture-book'} readers.
Rhyme scheme: ${rhymeScheme || 'AABB'}`;

      const prompt = `Convert this children's book prose into rhyming verse:

Original text:
"${text}"

Requirements:
- Maintain the same story and message
- Use ${rhymeScheme || 'AABB'} rhyme scheme
- Keep it age-appropriate for ${ageBand || 'picture-book'} readers
- Ensure consistent meter/rhythm
- Each verse should be 4-8 lines

Return the rhyming version only, no explanation.`;

      const result = await generate({
        prompt,
        systemPrompt,
        taskType: "draft",
        userId,
        maxTokens: 2000,
        temperature: 0.8,
      });

      res.json({
        success: true,
        rhymingText: result.content,
        model: result.model,
        cached: result.cached,
      });
    } catch (error: any) {
      console.error("Error converting to rhyme:", error);
      res.status(500).json({ message: error.message || "Failed to convert to rhyme" });
    }
  });

  // Analyze text for read-aloud optimization
  app.post('/api/books/childrens/read-aloud-analyze', isAuthenticated, async (req: any, res) => {
    try {
      // Validate request body with Zod
      const parseResult = readAloudAnalyzeRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: parseResult.error.errors
        });
      }
      
      const { text, ageBand } = parseResult.data;

      const words = text.split(/\s+/).filter(Boolean);
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
      
      // Simple syllable estimation
      const syllableCount = words.reduce((count: number, word: string) => {
        const syllables = word.toLowerCase().replace(/[^a-z]/g, '')
          .replace(/e$/, '').match(/[aeiouy]+/g);
        return count + (syllables ? syllables.length : 1);
      }, 0);

      // Estimate reading time (younger readers = slower)
      const readingSpeed = {
        "board-book": 30,
        "picture-book": 60,
        "early-reader": 80,
        "chapter-book": 100,
        "middle-grade": 120,
      };
      const wpm = readingSpeed[ageBand as keyof typeof readingSpeed] || 60;
      const readingTimeSeconds = Math.ceil((words.length / wpm) * 60);

      res.json({
        success: true,
        analysis: {
          wordCount: words.length,
          sentenceCount: sentences.length,
          avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
          syllableCount,
          estimatedReadingTimeSeconds: readingTimeSeconds,
          readingTimeFormatted: `${Math.floor(readingTimeSeconds / 60)}:${String(readingTimeSeconds % 60).padStart(2, '0')}`,
          complexWords: words.filter((w: string) => w.length > 8).slice(0, 10),
          suggestions: [
            avgWordsPerSentence > 12 ? "Consider shorter sentences for easier reading" : null,
            words.some((w: string) => w.length > 10) ? "Some long words may be difficult for young readers" : null,
          ].filter(Boolean),
        }
      });
    } catch (error: any) {
      console.error("Error analyzing text:", error);
      res.status(500).json({ message: error.message || "Failed to analyze text" });
    }
  });

  // ============================================================================
  // ULTRA-PREMIUM CREATOR GRAPH API
  // Cross-Studio Orchestration, Movie Studio, Voice Cloning
  // ============================================================================

  // ============ MOVIE STUDIO API ============

  // Get movie production options
  app.get('/api/movie/options', (req: any, res) => {
    res.json({
      genres: getMovieGenreOptions(),
      voiceOptions: getCharacterVoiceOptions()
    });
  });

  // Generate complete movie script
  app.post('/api/movie/generate-script', isAuthenticated, async (req: any, res) => {
    try {
      const { premise, genre, characters, targetScenes } = req.body;
      
      if (!premise || !genre) {
        return res.status(400).json({ message: "Premise and genre are required" });
      }

      const result = await generateCompleteScript(premise, genre, characters || [], targetScenes || 5);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error generating script:", error);
      res.status(500).json({ message: error.message || "Failed to generate script" });
    }
  });

  // Generate scene storyboard
  app.post('/api/movie/scene/storyboard', isAuthenticated, async (req: any, res) => {
    try {
      const { scene, characters, style } = req.body;
      
      if (!scene || !style) {
        return res.status(400).json({ message: "Scene and style are required" });
      }

      const result = await generateSceneStoryboard(scene, characters || [], style);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error generating storyboard:", error);
      res.status(500).json({ message: error.message || "Failed to generate storyboard" });
    }
  });

  // Synthesize scene dialogue
  app.post('/api/movie/scene/dialogue', isAuthenticated, async (req: any, res) => {
    try {
      const { scene, characters } = req.body;
      
      if (!scene || !characters) {
        return res.status(400).json({ message: "Scene and characters are required" });
      }

      const result = await synthesizeSceneDialogue(scene, characters);
      
      if (result.success) {
        // Convert Map to object for JSON response
        const audioUrls: Record<string, string> = {};
        result.audioUrls?.forEach((url: string, key: string) => {
          audioUrls[key] = url;
        });
        
        res.json({
          success: true,
          audioUrls,
          totalDuration: result.totalDuration
        });
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error synthesizing dialogue:", error);
      res.status(500).json({ message: error.message || "Failed to synthesize dialogue" });
    }
  });

  // Create full movie production pipeline
  app.post('/api/movie/pipeline', isAuthenticated, async (req: any, res) => {
    try {
      const { premise, genre, mainCharacter, antagonist } = req.body;
      
      if (!premise || !genre || !mainCharacter) {
        return res.status(400).json({ message: "Premise, genre, and mainCharacter are required" });
      }

      const result = await createMovieProductionPipeline(premise, genre, mainCharacter, antagonist);
      
      if (result.success) {
        // Convert Maps to objects for JSON response
        const assets: Record<string, any> = {};
        if (result.assets?.storyboards) {
          assets.storyboards = {};
          result.assets.storyboards.forEach((urls: string[], key: string) => {
            assets.storyboards[key] = urls;
          });
        }
        if (result.assets?.dialogueAudio) {
          assets.dialogueAudio = {};
          result.assets.dialogueAudio.forEach((url: string, key: string) => {
            assets.dialogueAudio[key] = url;
          });
        }
        
        res.json({
          success: true,
          project: result.project,
          assets,
          estimatedCost: result.estimatedCost
        });
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error creating movie pipeline:", error);
      res.status(500).json({ message: error.message || "Failed to create movie pipeline" });
    }
  });

  // ============ CROSS-STUDIO ORCHESTRATION API ============

  // Get available workflow templates
  app.get('/api/workflows/templates', (req: any, res) => {
    res.json({
      templates: getAvailableWorkflows()
    });
  });

  // Estimate workflow cost
  app.get('/api/workflows/estimate/:type', (req: any, res) => {
    const { type } = req.params;
    const estimate = estimateWorkflowCost(type);
    res.json(estimate);
  });

  // Create a new workflow
  app.post('/api/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { workflowType, sourceType, sourceId, customName } = req.body;
      
      if (!workflowType || !sourceType || !sourceId) {
        return res.status(400).json({ message: "workflowType, sourceType, and sourceId are required" });
      }

      const result = await createWorkflow(userId, workflowType, sourceType, sourceId, customName);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ message: error.message || "Failed to create workflow" });
    }
  });

  // Start a workflow
  app.post('/api/workflows/:id/start', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await startWorkflow(parseInt(id));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error starting workflow:", error);
      res.status(500).json({ message: error.message || "Failed to start workflow" });
    }
  });

  // Get workflow status
  app.get('/api/workflows/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await getWorkflowStatus(parseInt(id));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error getting workflow status:", error);
      res.status(500).json({ message: error.message || "Failed to get workflow status" });
    }
  });

  // Cancel a workflow
  app.post('/api/workflows/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await cancelWorkflow(parseInt(id));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error cancelling workflow:", error);
      res.status(500).json({ message: error.message || "Failed to cancel workflow" });
    }
  });

  // Resume a paused workflow
  app.post('/api/workflows/:id/resume', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await resumeWorkflow(parseInt(id));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: any) {
      console.error("Error resuming workflow:", error);
      res.status(500).json({ message: error.message || "Failed to resume workflow" });
    }
  });

  // ============ VOICE CLONING LIBRARY API ============

  // Get user's voice clones
  app.get('/api/voices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userVoices = await db.select().from(voiceClones).where(eq(voiceClones.ownerId, userId));
      res.json({ voices: userVoices });
    } catch (error: any) {
      console.error("Error getting voices:", error);
      res.status(500).json({ message: error.message || "Failed to get voices" });
    }
  });

  // Create a new voice clone
  app.post('/api/voices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, voiceType, gender, ageRange, accent, sourceAudioUrl, styleSettings } = req.body;
      
      if (!name || !voiceType) {
        return res.status(400).json({ message: "Name and voiceType are required" });
      }

      const [voice] = await db.insert(voiceClones).values({
        ownerId: userId,
        name,
        description,
        voiceType,
        gender,
        ageRange,
        accent,
        sourceAudioUrl,
        styleSettings,
        status: 'processing'
      }).returning();

      res.json({ success: true, voice });
    } catch (error: any) {
      console.error("Error creating voice clone:", error);
      res.status(500).json({ message: error.message || "Failed to create voice clone" });
    }
  });

  // Get public voice clones
  app.get('/api/voices/public', async (req: any, res) => {
    try {
      const publicVoices = await db.select().from(voiceClones).where(eq(voiceClones.isPublic, true));
      res.json({ voices: publicVoices });
    } catch (error: any) {
      console.error("Error getting public voices:", error);
      res.status(500).json({ message: error.message || "Failed to get public voices" });
    }
  });

  // ============ DJ PRESETS API ============

  // Get user's DJ presets
  app.get('/api/dj/presets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userPresets = await db.select().from(djPresets).where(eq(djPresets.creatorId, userId));
      res.json({ presets: userPresets });
    } catch (error: any) {
      console.error("Error getting DJ presets:", error);
      res.status(500).json({ message: error.message || "Failed to get DJ presets" });
    }
  });

  // Save a DJ preset
  app.post('/api/dj/presets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, category, settings, isPublic } = req.body;
      
      if (!name || !category || !settings) {
        return res.status(400).json({ message: "Name, category, and settings are required" });
      }

      const [preset] = await db.insert(djPresets).values({
        creatorId: userId,
        name,
        category,
        settings,
        isPublic: isPublic || false
      }).returning();

      res.json({ success: true, preset });
    } catch (error: any) {
      console.error("Error saving DJ preset:", error);
      res.status(500).json({ message: error.message || "Failed to save DJ preset" });
    }
  });

  // Get public DJ presets
  app.get('/api/dj/presets/public', async (req: any, res) => {
    try {
      const publicPresets = await db.select().from(djPresets).where(eq(djPresets.isPublic, true));
      res.json({ presets: publicPresets });
    } catch (error: any) {
      console.error("Error getting public presets:", error);
      res.status(500).json({ message: error.message || "Failed to get public presets" });
    }
  });

  // ============ AUDIOBOOK FACTORY API ============

  // Get user's audiobook projects
  app.get('/api/audiobooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAudiobooks = await db.select().from(audiobookProjects).where(eq(audiobookProjects.creatorId, userId));
      res.json({ audiobooks: userAudiobooks });
    } catch (error: any) {
      console.error("Error getting audiobooks:", error);
      res.status(500).json({ message: error.message || "Failed to get audiobooks" });
    }
  });

  // Create audiobook from manuscript
  app.post('/api/audiobooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, author, sourceProjectId, narratorVoiceId, masteringPreset } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const [audiobook] = await db.insert(audiobookProjects).values({
        creatorId: userId,
        title,
        author,
        sourceProjectId,
        narratorVoiceId,
        masteringPreset: masteringPreset || 'audiobook',
        status: 'setup'
      }).returning();

      res.json({ success: true, audiobook });
    } catch (error: any) {
      console.error("Error creating audiobook:", error);
      res.status(500).json({ message: error.message || "Failed to create audiobook" });
    }
  });

  // Get audiobook chapters
  app.get('/api/audiobooks/:id/chapters', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const chapters = await db.select().from(audiobookChapters).where(eq(audiobookChapters.audiobookId, parseInt(id)));
      res.json({ chapters });
    } catch (error: any) {
      console.error("Error getting audiobook chapters:", error);
      res.status(500).json({ message: error.message || "Failed to get chapters" });
    }
  });

  // ============ MEDIA STUDIO API ============

  // Remove background using Remove.bg API
  app.post('/api/image/remove-background', isAuthenticated, async (req: any, res) => {
    try {
      const { imageUrl, imageBase64 } = req.body;
      
      if (!imageUrl && !imageBase64) {
        return res.status(400).json({ message: "Either imageUrl or imageBase64 is required" });
      }

      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Remove.bg API key not configured" });
      }

      const formData = new FormData();
      if (imageUrl) {
        formData.append('image_url', imageUrl);
      } else if (imageBase64) {
        // Convert base64 to blob
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        formData.append('image_file', new Blob([buffer]), 'image.png');
      }
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Remove.bg error:', error);
        return res.status(response.status).json({ message: "Background removal failed", error });
      }

      const resultBuffer = await response.arrayBuffer();
      const base64Result = Buffer.from(resultBuffer).toString('base64');
      
      res.json({ 
        success: true, 
        imageData: `data:image/png;base64,${base64Result}` 
      });
    } catch (error: any) {
      console.error("Remove background error:", error);
      res.status(500).json({ message: error.message || "Failed to remove background" });
    }
  });

  // Get user's media projects
  app.get('/api/media/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await db.select().from(mediaProjects).where(eq(mediaProjects.ownerId, userId));
      res.json({ projects });
    } catch (error: any) {
      console.error("Error getting media projects:", error);
      res.status(500).json({ message: error.message || "Failed to get projects" });
    }
  });

  // Create media project
  app.post('/api/media/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, mode, projectData, width, height, duration } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Project name is required" });
      }

      const [project] = await db.insert(mediaProjects).values({
        ownerId: userId,
        name,
        mode: mode || 'image',
        projectData,
        width,
        height,
        duration,
        status: 'draft'
      }).returning();

      res.json({ success: true, project });
    } catch (error: any) {
      console.error("Error creating media project:", error);
      res.status(500).json({ message: error.message || "Failed to create project" });
    }
  });

  // Update media project
  app.patch('/api/media/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { name, projectData, thumbnailUrl, status, width, height, duration } = req.body;

      const [project] = await db.update(mediaProjects)
        .set({ 
          name, 
          projectData, 
          thumbnailUrl, 
          status,
          width,
          height,
          duration,
          updatedAt: new Date() 
        })
        .where(eq(mediaProjects.id, parseInt(id)))
        .returning();

      res.json({ success: true, project });
    } catch (error: any) {
      console.error("Error updating media project:", error);
      res.status(500).json({ message: error.message || "Failed to update project" });
    }
  });

  // Delete media project
  app.delete('/api/media/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await db.delete(mediaProjects).where(eq(mediaProjects.id, parseInt(id)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting media project:", error);
      res.status(500).json({ message: error.message || "Failed to delete project" });
    }
  });

  // Upload media asset
  app.post('/api/media/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type, url, thumbnailUrl, duration, width, height, fileSize, mimeType, metadata, projectId } = req.body;
      
      if (!name || !type || !url) {
        return res.status(400).json({ message: "Name, type, and url are required" });
      }

      const [asset] = await db.insert(mediaAssets).values({
        ownerId: userId,
        projectId,
        name,
        type,
        url,
        thumbnailUrl,
        duration,
        width,
        height,
        fileSize,
        mimeType,
        metadata
      }).returning();

      res.json({ success: true, asset });
    } catch (error: any) {
      console.error("Error creating media asset:", error);
      res.status(500).json({ message: error.message || "Failed to create asset" });
    }
  });

  // Get user's media assets
  app.get('/api/media/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assets = await db.select().from(mediaAssets).where(eq(mediaAssets.ownerId, userId));
      res.json({ assets });
    } catch (error: any) {
      console.error("Error getting media assets:", error);
      res.status(500).json({ message: error.message || "Failed to get assets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
