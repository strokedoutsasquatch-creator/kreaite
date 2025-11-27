import { 
  type User, type UpsertUser,
  type ForumCategory, type InsertForumCategory,
  type ForumThread, type InsertForumThread,
  type ForumPost, type InsertForumPost,
  type Book, type InsertBook,
  type AiChatSession, type InsertAiChatSession,
  type AiChatMessage, type InsertAiChatMessage,
  type MarketplaceCategory, type InsertMarketplaceCategory,
  type MarketplaceProduct, type InsertMarketplaceProduct,
  type PublishingProject, type InsertPublishingProject,
} from "@shared/schema";
import { 
  users, forumCategories, forumThreads, forumPosts, forumReactions,
  books, aiChatSessions, aiChatMessages,
  marketplaceCategories, marketplaceProducts,
  publishingProjects,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, ilike, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  getForumCategories(): Promise<ForumCategory[]>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  updateForumCategory(id: number, updates: Partial<InsertForumCategory>): Promise<ForumCategory | undefined>;
  deleteForumCategory(id: number): Promise<boolean>;
  getForumThreads(categoryId?: number, limit?: number, offset?: number): Promise<ForumThread[]>;
  getForumThread(id: number): Promise<ForumThread | undefined>;
  createForumThread(thread: InsertForumThread): Promise<ForumThread>;
  updateForumThread(id: number, updates: Partial<InsertForumThread>): Promise<ForumThread | undefined>;
  deleteForumThread(id: number): Promise<boolean>;
  getForumPosts(threadId: number, limit?: number, offset?: number): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, content: string): Promise<ForumPost | undefined>;
  deleteForumPost(id: number): Promise<boolean>;
  togglePostReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }>;
  getPostReactions(postId: number): Promise<{ reactionType: string; count: number }[]>;
  getUserReaction(postId: number, userId: string): Promise<string | null>;
  getBooks(): Promise<Book[]>;
  getBookBySlug(slug: string): Promise<Book | undefined>;
  createChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  getChatSession(id: number): Promise<AiChatSession | undefined>;
  getChatMessages(sessionId: number): Promise<AiChatMessage[]>;
  createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  getCategoryStats(): Promise<{ categoryId: number; threadCount: number; postCount: number }[]>;
  getMarketplaceCategories(): Promise<MarketplaceCategory[]>;
  getMarketplaceCategory(id: number): Promise<MarketplaceCategory | undefined>;
  getMarketplaceProducts(filters?: { categoryId?: number; search?: string; featured?: boolean }): Promise<MarketplaceProduct[]>;
  getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined>;
  createMarketplaceCategory(data: InsertMarketplaceCategory): Promise<MarketplaceCategory>;
  createMarketplaceProduct(data: InsertMarketplaceProduct): Promise<MarketplaceProduct>;
  getPublishingProjects(userId: string): Promise<PublishingProject[]>;
  createPublishingProject(project: InsertPublishingProject): Promise<PublishingProject>;
  getPublishingProject(id: number): Promise<PublishingProject | undefined>;
  updatePublishingProject(id: number, updates: Partial<PublishingProject>): Promise<PublishingProject | undefined>;
  deletePublishingProject(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getForumCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories).orderBy(forumCategories.order);
  }

  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const [newCategory] = await db.insert(forumCategories).values(category).returning();
    return newCategory;
  }

  async updateForumCategory(id: number, updates: Partial<InsertForumCategory>): Promise<ForumCategory | undefined> {
    const [category] = await db.update(forumCategories)
      .set(updates)
      .where(eq(forumCategories.id, id))
      .returning();
    return category;
  }

  async deleteForumCategory(id: number): Promise<boolean> {
    const result = await db.delete(forumCategories).where(eq(forumCategories.id, id));
    return true;
  }

  async getForumThreads(categoryId?: number, limit = 20, offset = 0): Promise<ForumThread[]> {
    if (categoryId) {
      return db.select().from(forumThreads)
        .where(eq(forumThreads.categoryId, categoryId))
        .orderBy(desc(forumThreads.lastActivityAt))
        .limit(limit)
        .offset(offset);
    }
    return db.select().from(forumThreads)
      .orderBy(desc(forumThreads.lastActivityAt))
      .limit(limit)
      .offset(offset);
  }

  async getForumThread(id: number): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    if (thread) {
      await db.update(forumThreads)
        .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
        .where(eq(forumThreads.id, id));
    }
    return thread;
  }

  async createForumThread(thread: InsertForumThread): Promise<ForumThread> {
    const [newThread] = await db.insert(forumThreads).values(thread).returning();
    return newThread;
  }

  async updateForumThread(id: number, updates: Partial<InsertForumThread>): Promise<ForumThread | undefined> {
    const [thread] = await db.update(forumThreads)
      .set(updates)
      .where(eq(forumThreads.id, id))
      .returning();
    return thread;
  }

  async deleteForumThread(id: number): Promise<boolean> {
    await db.delete(forumThreads).where(eq(forumThreads.id, id));
    return true;
  }

  async getForumPosts(threadId: number, limit = 50, offset = 0): Promise<ForumPost[]> {
    return db.select().from(forumPosts)
      .where(eq(forumPosts.threadId, threadId))
      .orderBy(forumPosts.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    await db.update(forumThreads)
      .set({ 
        replyCount: sql`${forumThreads.replyCount} + 1`,
        lastActivityAt: new Date()
      })
      .where(eq(forumThreads.id, post.threadId));
    return newPost;
  }

  async updateForumPost(id: number, content: string): Promise<ForumPost | undefined> {
    const [post] = await db.update(forumPosts)
      .set({ content, isEdited: true, editedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    return post;
  }

  async deleteForumPost(id: number): Promise<boolean> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    if (post) {
      await db.delete(forumPosts).where(eq(forumPosts.id, id));
      await db.update(forumThreads)
        .set({ replyCount: sql`GREATEST(${forumThreads.replyCount} - 1, 0)` })
        .where(eq(forumThreads.id, post.threadId));
    }
    return true;
  }

  async togglePostReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }> {
    const existing = await db.select().from(forumReactions)
      .where(and(
        eq(forumReactions.postId, postId),
        eq(forumReactions.userId, userId)
      ));
    
    if (existing.length > 0) {
      if (existing[0].reactionType === reactionType) {
        await db.delete(forumReactions).where(eq(forumReactions.id, existing[0].id));
        await db.update(forumPosts)
          .set({ likeCount: sql`GREATEST(${forumPosts.likeCount} - 1, 0)` })
          .where(eq(forumPosts.id, postId));
        return { added: false };
      } else {
        await db.update(forumReactions)
          .set({ reactionType })
          .where(eq(forumReactions.id, existing[0].id));
        return { added: true };
      }
    } else {
      await db.insert(forumReactions).values({ postId, userId, reactionType });
      if (reactionType === 'like') {
        await db.update(forumPosts)
          .set({ likeCount: sql`${forumPosts.likeCount} + 1` })
          .where(eq(forumPosts.id, postId));
      }
      return { added: true };
    }
  }

  async getPostReactions(postId: number): Promise<{ reactionType: string; count: number }[]> {
    const result = await db.select({
      reactionType: forumReactions.reactionType,
      count: count()
    })
      .from(forumReactions)
      .where(eq(forumReactions.postId, postId))
      .groupBy(forumReactions.reactionType);
    
    return result.map(r => ({ reactionType: r.reactionType, count: Number(r.count) }));
  }

  async getUserReaction(postId: number, userId: string): Promise<string | null> {
    const [reaction] = await db.select().from(forumReactions)
      .where(and(
        eq(forumReactions.postId, postId),
        eq(forumReactions.userId, userId)
      ));
    return reaction?.reactionType || null;
  }

  async getBooks(): Promise<Book[]> {
    return db.select().from(books)
      .where(eq(books.isPublished, true))
      .orderBy(books.order);
  }

  async getBookBySlug(slug: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.slug, slug));
    return book;
  }

  async createChatSession(session: InsertAiChatSession): Promise<AiChatSession> {
    const [newSession] = await db.insert(aiChatSessions).values(session).returning();
    return newSession;
  }

  async getChatSession(id: number): Promise<AiChatSession | undefined> {
    const [session] = await db.select().from(aiChatSessions).where(eq(aiChatSessions.id, id));
    return session;
  }

  async getChatMessages(sessionId: number): Promise<AiChatMessage[]> {
    return db.select().from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt);
  }

  async createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const [newMessage] = await db.insert(aiChatMessages).values(message).returning();
    await db.update(aiChatSessions)
      .set({ 
        messageCount: sql`${aiChatSessions.messageCount} + 1`,
        lastMessageAt: new Date()
      })
      .where(eq(aiChatSessions.id, message.sessionId));
    return newMessage;
  }

  async getCategoryStats(): Promise<{ categoryId: number; threadCount: number; postCount: number }[]> {
    const stats = await db.select({
      categoryId: forumCategories.id,
      threadCount: sql<number>`(SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.categoryId} = ${forumCategories.id})::int`,
      postCount: sql<number>`(SELECT COUNT(*) FROM ${forumPosts} p JOIN ${forumThreads} t ON p.thread_id = t.id WHERE t.category_id = ${forumCategories.id})::int`
    }).from(forumCategories);
    
    return stats.map(s => ({
      categoryId: s.categoryId,
      threadCount: Number(s.threadCount),
      postCount: Number(s.postCount)
    }));
  }

  async getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
    return db.select().from(marketplaceCategories)
      .where(eq(marketplaceCategories.isActive, true))
      .orderBy(marketplaceCategories.order);
  }

  async getMarketplaceCategory(id: number): Promise<MarketplaceCategory | undefined> {
    const [category] = await db.select().from(marketplaceCategories)
      .where(eq(marketplaceCategories.id, id));
    return category;
  }

  async getMarketplaceProducts(filters?: { categoryId?: number; search?: string; featured?: boolean }): Promise<MarketplaceProduct[]> {
    const conditions = [eq(marketplaceProducts.isActive, true)];

    if (filters?.categoryId) {
      conditions.push(eq(marketplaceProducts.categoryId, filters.categoryId));
    }

    if (filters?.featured !== undefined) {
      conditions.push(eq(marketplaceProducts.isFeatured, filters.featured));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(marketplaceProducts.title, searchTerm),
          ilike(marketplaceProducts.description, searchTerm),
          ilike(marketplaceProducts.brand, searchTerm)
        )!
      );
    }

    return db.select().from(marketplaceProducts)
      .where(and(...conditions))
      .orderBy(desc(marketplaceProducts.isFeatured), marketplaceProducts.title);
  }

  async getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined> {
    const [product] = await db.select().from(marketplaceProducts)
      .where(eq(marketplaceProducts.id, id));
    return product;
  }

  async createMarketplaceCategory(data: InsertMarketplaceCategory): Promise<MarketplaceCategory> {
    const [category] = await db.insert(marketplaceCategories).values(data).returning();
    return category;
  }

  async createMarketplaceProduct(data: InsertMarketplaceProduct): Promise<MarketplaceProduct> {
    const [product] = await db.insert(marketplaceProducts).values(data).returning();
    return product;
  }

  async getPublishingProjects(userId: string): Promise<PublishingProject[]> {
    return db.select().from(publishingProjects)
      .where(eq(publishingProjects.authorId, userId))
      .orderBy(desc(publishingProjects.updatedAt));
  }

  async createPublishingProject(project: InsertPublishingProject): Promise<PublishingProject> {
    const [newProject] = await db.insert(publishingProjects).values(project).returning();
    return newProject;
  }

  async getPublishingProject(id: number): Promise<PublishingProject | undefined> {
    const [project] = await db.select().from(publishingProjects)
      .where(eq(publishingProjects.id, id));
    return project;
  }

  async updatePublishingProject(id: number, updates: Partial<PublishingProject>): Promise<PublishingProject | undefined> {
    const [project] = await db.update(publishingProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(publishingProjects.id, id))
      .returning();
    return project;
  }

  async deletePublishingProject(id: number): Promise<boolean> {
    await db.delete(publishingProjects).where(eq(publishingProjects.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
