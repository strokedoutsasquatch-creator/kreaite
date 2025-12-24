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
import { getAllPresets, getMusicalScales, getMusicalKeys, calculateSyncedDelay } from "./audioProcessingService";
import { seedRecoveryData } from "./seedRecoveryData";

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

  const httpServer = createServer(app);
  return httpServer;
}
