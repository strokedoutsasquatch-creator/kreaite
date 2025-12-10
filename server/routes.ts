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

  const httpServer = createServer(app);
  return httpServer;
}
