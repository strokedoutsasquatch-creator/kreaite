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
  recoveryPrograms, programModules, programLessons,
  userEnrollments, dailyCheckins, userStreaks,
  userHabits, habitLogs, recoveryHabits,
  recoveryMilestones, userMilestoneLogs,
  userProfiles,
  accountabilityPods, podMembers,
  type AccountabilityPod, type InsertAccountabilityPod,
  type PodMember, type InsertPodMember,
} from "@shared/schema";
import { gte } from "drizzle-orm";
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
  
  // Recovery Dashboard
  getRecoveryPrograms(): Promise<any[]>;
  getRecoveryProgramBySlug(slug: string): Promise<any | undefined>;
  getUserEnrollment(userId: string): Promise<any | undefined>;
  createUserEnrollment(enrollment: any): Promise<any>;
  updateUserEnrollment(id: number, updates: any): Promise<any | undefined>;
  getDailyCheckin(userId: string, date: Date): Promise<any | undefined>;
  createDailyCheckin(checkin: any): Promise<any>;
  getRecentCheckins(userId: string, days: number): Promise<any[]>;
  getUserStreak(userId: string): Promise<any | undefined>;
  createOrUpdateUserStreak(userId: string, data: any): Promise<any>;
  getUserHabits(userId: string): Promise<any[]>;
  createUserHabit(habit: any): Promise<any>;
  logHabitCompletion(userHabitId: number, date: Date, notes?: string): Promise<any>;
  getRecoveryMilestones(): Promise<any[]>;
  getUserMilestones(userId: string): Promise<any[]>;
  awardMilestone(userId: string, milestoneId: number, notes?: string): Promise<any>;
  getDefaultHabits(): Promise<any[]>;
  
  // User Profile
  getUserProfile(userId: string): Promise<any | undefined>;
  createUserProfile(profile: any): Promise<any>;
  updateUserProfile(userId: string, updates: any): Promise<any | undefined>;
  
  // Achievements
  getUserAchievements(userId: string): Promise<any[]>;
  getAvailableMilestones(): Promise<any[]>;
  checkAndAwardStreakMilestones(userId: string, currentStreak: number): Promise<any[]>;
  
  // Accountability Pods
  getAccountabilityPod(podId: number): Promise<AccountabilityPod | null>;
  getUserPod(userId: string): Promise<AccountabilityPod | null>;
  getPodMembers(podId: number): Promise<any[]>;
  createPod(pod: InsertAccountabilityPod): Promise<AccountabilityPod>;
  joinPod(userId: string, podId: number): Promise<PodMember>;
  leavePod(userId: string, podId: number): Promise<void>;
  getOpenPods(): Promise<AccountabilityPod[]>;
  getRecentPodActivity(podId: number, limit?: number): Promise<any[]>;
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
      threadCount: sql<number>`COALESCE((SELECT COUNT(*) FROM forum_threads ft WHERE ft.category_id = forum_categories.id), 0)::int`,
      postCount: sql<number>`COALESCE((SELECT COUNT(*) FROM forum_posts fp JOIN forum_threads ft ON fp.thread_id = ft.id WHERE ft.category_id = forum_categories.id), 0)::int`
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

  // Recovery Dashboard Methods
  async getRecoveryPrograms(): Promise<any[]> {
    return db.select().from(recoveryPrograms)
      .where(eq(recoveryPrograms.isActive, true))
      .orderBy(recoveryPrograms.id);
  }

  async getRecoveryProgramBySlug(slug: string): Promise<any | undefined> {
    const [program] = await db.select().from(recoveryPrograms)
      .where(eq(recoveryPrograms.slug, slug));
    return program;
  }

  async getUserEnrollment(userId: string): Promise<any | undefined> {
    const [enrollment] = await db.select().from(userEnrollments)
      .where(eq(userEnrollments.userId, userId));
    if (enrollment) {
      const [program] = await db.select().from(recoveryPrograms)
        .where(eq(recoveryPrograms.id, enrollment.programId));
      const modules = await db.select().from(programModules)
        .where(eq(programModules.programId, enrollment.programId))
        .orderBy(programModules.order);
      let currentModule = null;
      let currentLesson = null;
      if (enrollment.currentModuleId) {
        [currentModule] = await db.select().from(programModules)
          .where(eq(programModules.id, enrollment.currentModuleId));
      }
      if (enrollment.currentLessonId) {
        [currentLesson] = await db.select().from(programLessons)
          .where(eq(programLessons.id, enrollment.currentLessonId));
      }
      return { ...enrollment, program, modules, currentModule, currentLesson };
    }
    return undefined;
  }

  async createUserEnrollment(enrollment: any): Promise<any> {
    const [newEnrollment] = await db.insert(userEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateUserEnrollment(id: number, updates: any): Promise<any | undefined> {
    const [enrollment] = await db.update(userEnrollments)
      .set({ ...updates, lastActivityAt: new Date() })
      .where(eq(userEnrollments.id, id))
      .returning();
    return enrollment;
  }

  async getDailyCheckin(userId: string, date: Date): Promise<any | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [checkin] = await db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.checkinDate, startOfDay),
        sql`${dailyCheckins.checkinDate} <= ${endOfDay}`
      ));
    return checkin;
  }

  async createDailyCheckin(checkin: any): Promise<any> {
    const [newCheckin] = await db.insert(dailyCheckins).values(checkin).returning();
    return newCheckin;
  }

  async getRecentCheckins(userId: string, days: number): Promise<any[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.checkinDate, daysAgo)
      ))
      .orderBy(desc(dailyCheckins.checkinDate));
  }

  async getUserStreak(userId: string): Promise<any | undefined> {
    const [streak] = await db.select().from(userStreaks)
      .where(eq(userStreaks.userId, userId));
    return streak;
  }

  async createOrUpdateUserStreak(userId: string, data: any): Promise<any> {
    const existing = await this.getUserStreak(userId);
    if (existing) {
      const [streak] = await db.update(userStreaks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userStreaks.userId, userId))
        .returning();
      return streak;
    }
    const [streak] = await db.insert(userStreaks)
      .values({ userId, ...data })
      .returning();
    return streak;
  }

  async getUserHabits(userId: string): Promise<any[]> {
    const habits = await db.select({
      userHabit: userHabits,
      habit: recoveryHabits
    })
      .from(userHabits)
      .innerJoin(recoveryHabits, eq(userHabits.habitId, recoveryHabits.id))
      .where(eq(userHabits.userId, userId));
    
    const result = [];
    for (const row of habits) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 66);
      const logs = await db.select().from(habitLogs)
        .where(and(
          eq(habitLogs.userHabitId, row.userHabit.id),
          gte(habitLogs.logDate, daysAgo)
        ))
        .orderBy(desc(habitLogs.logDate));
      result.push({
        ...row.userHabit,
        habitName: row.habit.name,
        habitDescription: row.habit.description,
        habitCategory: row.habit.category,
        logs
      });
    }
    return result;
  }

  async createUserHabit(habit: any): Promise<any> {
    const [newHabit] = await db.insert(userHabits).values(habit).returning();
    return newHabit;
  }

  async logHabitCompletion(userHabitId: number, date: Date, notes?: string): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [existing] = await db.select().from(habitLogs)
      .where(and(
        eq(habitLogs.userHabitId, userHabitId),
        gte(habitLogs.logDate, startOfDay),
        sql`${habitLogs.logDate} <= ${endOfDay}`
      ));
    
    if (existing) {
      const [log] = await db.update(habitLogs)
        .set({ isCompleted: !existing.isCompleted, notes })
        .where(eq(habitLogs.id, existing.id))
        .returning();
      
      await db.update(userHabits)
        .set({ 
          totalCompletions: log.isCompleted 
            ? sql`${userHabits.totalCompletions} + 1`
            : sql`GREATEST(${userHabits.totalCompletions} - 1, 0)`
        })
        .where(eq(userHabits.id, userHabitId));
      
      return log;
    }
    
    const [log] = await db.insert(habitLogs)
      .values({ userHabitId, logDate: date, isCompleted: true, notes })
      .returning();
    
    await db.update(userHabits)
      .set({ totalCompletions: sql`${userHabits.totalCompletions} + 1` })
      .where(eq(userHabits.id, userHabitId));
    
    return log;
  }

  async getRecoveryMilestones(): Promise<any[]> {
    return db.select().from(recoveryMilestones)
      .orderBy(recoveryMilestones.order);
  }

  async getUserMilestones(userId: string): Promise<any[]> {
    const milestones = await db.select({
      log: userMilestoneLogs,
      milestone: recoveryMilestones
    })
      .from(userMilestoneLogs)
      .innerJoin(recoveryMilestones, eq(userMilestoneLogs.milestoneId, recoveryMilestones.id))
      .where(eq(userMilestoneLogs.userId, userId))
      .orderBy(desc(userMilestoneLogs.achievedAt));
    
    return milestones.map(m => ({
      ...m.log,
      name: m.milestone.name,
      description: m.milestone.description,
      category: m.milestone.category,
      iconUrl: m.milestone.iconUrl,
      badgeUrl: m.milestone.badgeUrl,
      pointsAwarded: m.milestone.pointsAwarded
    }));
  }

  async awardMilestone(userId: string, milestoneId: number, notes?: string): Promise<any> {
    const [existing] = await db.select().from(userMilestoneLogs)
      .where(and(
        eq(userMilestoneLogs.userId, userId),
        eq(userMilestoneLogs.milestoneId, milestoneId)
      ));
    
    if (existing) return existing;
    
    const [log] = await db.insert(userMilestoneLogs)
      .values({ userId, milestoneId, celebrationNotes: notes })
      .returning();
    return log;
  }

  async getDefaultHabits(): Promise<any[]> {
    return db.select().from(recoveryHabits)
      .where(eq(recoveryHabits.isDefault, true))
      .orderBy(recoveryHabits.id);
  }

  async getUserProfile(userId: string): Promise<any | undefined> {
    const [profile] = await db.select().from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: any): Promise<any> {
    const [newProfile] = await db.insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, updates: any): Promise<any | undefined> {
    const [profile] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Accountability Pod Methods
  async getAccountabilityPod(podId: number): Promise<AccountabilityPod | null> {
    const [pod] = await db.select().from(accountabilityPods)
      .where(eq(accountabilityPods.id, podId));
    return pod || null;
  }

  async getUserPod(userId: string): Promise<AccountabilityPod | null> {
    const [membership] = await db.select({
      pod: accountabilityPods
    })
      .from(podMembers)
      .innerJoin(accountabilityPods, eq(podMembers.podId, accountabilityPods.id))
      .where(eq(podMembers.userId, userId));
    return membership?.pod || null;
  }

  async getPodMembers(podId: number): Promise<any[]> {
    const members = await db.select({
      member: podMembers,
      user: users
    })
      .from(podMembers)
      .innerJoin(users, eq(podMembers.userId, users.id))
      .where(eq(podMembers.podId, podId))
      .orderBy(podMembers.joinedAt);
    
    return members.map(m => ({
      ...m.member,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      profileImageUrl: m.user.profileImageUrl,
    }));
  }

  async createPod(pod: InsertAccountabilityPod): Promise<AccountabilityPod> {
    const [newPod] = await db.insert(accountabilityPods)
      .values({ ...pod, memberCount: 0 })
      .returning();
    return newPod;
  }

  async joinPod(userId: string, podId: number): Promise<PodMember> {
    const existing = await db.select().from(podMembers)
      .where(and(
        eq(podMembers.userId, userId),
        eq(podMembers.podId, podId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [member] = await db.insert(podMembers)
      .values({ userId, podId, role: 'member' })
      .returning();
    
    await db.update(accountabilityPods)
      .set({ memberCount: sql`${accountabilityPods.memberCount} + 1` })
      .where(eq(accountabilityPods.id, podId));
    
    return member;
  }

  async leavePod(userId: string, podId: number): Promise<void> {
    const result = await db.delete(podMembers)
      .where(and(
        eq(podMembers.userId, userId),
        eq(podMembers.podId, podId)
      ));
    
    await db.update(accountabilityPods)
      .set({ memberCount: sql`GREATEST(${accountabilityPods.memberCount} - 1, 0)` })
      .where(eq(accountabilityPods.id, podId));
  }

  async getOpenPods(): Promise<AccountabilityPod[]> {
    return db.select().from(accountabilityPods)
      .where(and(
        eq(accountabilityPods.isActive, true),
        eq(accountabilityPods.isPrivate, false),
        sql`${accountabilityPods.memberCount} < ${accountabilityPods.maxMembers}`
      ))
      .orderBy(desc(accountabilityPods.createdAt));
  }

  async getRecentPodActivity(podId: number, limit: number = 20): Promise<any[]> {
    const members = await db.select().from(podMembers)
      .where(eq(podMembers.podId, podId));
    
    if (members.length === 0) return [];
    
    const memberIds = members.map(m => m.userId);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const checkins = await db.select({
      checkin: dailyCheckins,
      user: users
    })
      .from(dailyCheckins)
      .innerJoin(users, eq(dailyCheckins.userId, users.id))
      .where(and(
        sql`${dailyCheckins.userId} IN ${memberIds}`,
        gte(dailyCheckins.checkinDate, sevenDaysAgo)
      ))
      .orderBy(desc(dailyCheckins.checkinDate))
      .limit(limit);
    
    return checkins.map(c => ({
      id: c.checkin.id,
      type: 'checkin',
      userId: c.checkin.userId,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
      profileImageUrl: c.user.profileImageUrl,
      moodScore: c.checkin.moodScore,
      energyScore: c.checkin.energyScore,
      winsToday: c.checkin.winsToday,
      createdAt: c.checkin.checkinDate,
    }));
  }

  // Achievements Methods
  async getUserAchievements(userId: string): Promise<any[]> {
    const milestones = await db.select({
      log: userMilestoneLogs,
      milestone: recoveryMilestones
    })
      .from(userMilestoneLogs)
      .innerJoin(recoveryMilestones, eq(userMilestoneLogs.milestoneId, recoveryMilestones.id))
      .where(eq(userMilestoneLogs.userId, userId))
      .orderBy(desc(userMilestoneLogs.achievedAt));
    
    return milestones.map(m => ({
      id: m.log.id,
      milestoneId: m.milestone.id,
      userId: m.log.userId,
      name: m.milestone.name,
      description: m.milestone.description,
      category: m.milestone.category,
      iconUrl: m.milestone.iconUrl,
      badgeUrl: m.milestone.badgeUrl,
      pointsAwarded: m.milestone.pointsAwarded,
      celebrationNotes: m.log.celebrationNotes,
      achievedAt: m.log.achievedAt,
    }));
  }

  async getAvailableMilestones(): Promise<any[]> {
    return db.select().from(recoveryMilestones)
      .orderBy(recoveryMilestones.category, recoveryMilestones.order);
  }

  async checkAndAwardStreakMilestones(userId: string, currentStreak: number): Promise<any[]> {
    const streakMilestones = [
      { streak: 3, name: "3 Day Warrior" },
      { streak: 7, name: "Week Warrior" },
      { streak: 14, name: "Two Week Champion" },
      { streak: 21, name: "21 Day Habit Builder" },
      { streak: 30, name: "30 Day Veteran" },
      { streak: 66, name: "66 Day Master" },
      { streak: 100, name: "Century Champion" },
    ];
    
    const awardedMilestones: any[] = [];
    const allMilestones = await this.getAvailableMilestones();
    const userMilestones = await this.getUserMilestones(userId);
    const userMilestoneIds = new Set(userMilestones.map(m => m.milestoneId));
    
    for (const streakMilestone of streakMilestones) {
      if (currentStreak >= streakMilestone.streak) {
        const milestone = allMilestones.find(m => 
          m.name.toLowerCase().includes(streakMilestone.name.toLowerCase()) ||
          (m.category === 'streak' && m.name.includes(String(streakMilestone.streak)))
        );
        
        if (milestone && !userMilestoneIds.has(milestone.id)) {
          const awarded = await this.awardMilestone(userId, milestone.id, `Achieved ${streakMilestone.streak} day streak!`);
          awardedMilestones.push({
            ...awarded,
            name: milestone.name,
            description: milestone.description,
            category: milestone.category,
            pointsAwarded: milestone.pointsAwarded,
          });
        }
      }
    }
    
    return awardedMilestones;
  }
}

export const storage = new DatabaseStorage();
