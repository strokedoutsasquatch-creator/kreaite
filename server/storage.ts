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
  type UserSettings, type InsertUserSettings,
  type TherapistProfile, type InsertTherapistProfile,
  type PatientAssignment, type InsertPatientAssignment,
  type TherapySession, type InsertTherapySession,
  type ExercisePrescription, type InsertExercisePrescription,
  type ActivityPost, type InsertActivityPost,
  type ActivityMedia, type InsertActivityMedia,
  type ActivityReaction, type InsertActivityReaction,
  type ActivityComment, type InsertActivityComment,
  type TherapeuticExercise, type InsertTherapeuticExercise,
  type ExerciseSession, type InsertExerciseSession,
  type ExerciseScore,
  type SpeechExercise, type InsertSpeechExercise,
  type CognitiveExercise, type InsertCognitiveExercise,
  type WearableConnection, type InsertWearableConnection,
  type WearableMetric, type InsertWearableMetric,
  type Conversation, type InsertConversation,
  type ConversationParticipant,
  type DirectMessage, type InsertDirectMessage,
  type ForumPostMedia, type InsertForumPostMedia,
  type VideoSession, type InsertVideoSession,
  type VideoSessionParticipant,
  type SeoPage, type InsertSeoPage,
  type BlogPost, type InsertBlogPost,
  type BlogPostReaction, type InsertBlogPostReaction,
  type BlogPostComment, type InsertBlogPostComment,
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
  recoveryReminders, reminderLogs,
  standGoals, standLogs,
  hydrationGoals, hydrationLogs,
  exerciseGoals, exerciseLogs,
  userSettings,
  therapistProfiles, patientAssignments, therapySessions, exercisePrescriptions,
  activityPosts, activityMedia, activityReactions, activityComments,
  therapeuticExercises, exerciseSessions, exerciseScores,
  speechExercises, cognitiveExercises,
  wearableConnections, wearableMetrics,
  conversations, conversationParticipants, directMessages,
  forumPostMedia, videoSessions, videoSessionParticipants, seoPages,
  blogPosts, blogPostReactions, blogPostComments,
  type AccountabilityPod, type InsertAccountabilityPod,
  type PodMember, type InsertPodMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, ilike, or, gte, lt } from "drizzle-orm";

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
  
  // Reminders & Wellness
  getUserReminders(userId: string): Promise<any[]>;
  createReminder(reminder: any): Promise<any>;
  updateReminder(id: number, updates: any): Promise<any>;
  deleteReminder(id: number): Promise<boolean>;
  logReminderAction(log: any): Promise<any>;
  
  // Stand Goals
  getUserStandGoal(userId: string): Promise<any | undefined>;
  createOrUpdateStandGoal(userId: string, goal: any): Promise<any>;
  logStand(userId: string, duration?: number): Promise<any>;
  getTodayStandCount(userId: string): Promise<number>;
  
  // Hydration Goals
  getUserHydrationGoal(userId: string): Promise<any | undefined>;
  createOrUpdateHydrationGoal(userId: string, goal: any): Promise<any>;
  logHydration(userId: string, amount: number): Promise<any>;
  getTodayHydration(userId: string): Promise<number>;
  
  // Exercise Goals
  getUserExerciseGoal(userId: string): Promise<any | undefined>;
  createOrUpdateExerciseGoal(userId: string, goal: any): Promise<any>;
  logExercise(userId: string, type: string, duration: number, intensity?: string): Promise<any>;
  getTodayExercise(userId: string): Promise<number>;
  
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  updateUsername(userId: string, username: string): Promise<UserSettings | undefined>;
  isUsernameAvailable(username: string): Promise<boolean>;
  
  // Activity Wall
  getActivityPosts(options?: { limit?: number; offset?: number; visibility?: string; podId?: number; authorId?: string }): Promise<ActivityPost[]>;
  getActivityPost(id: number): Promise<ActivityPost | undefined>;
  createActivityPost(post: InsertActivityPost): Promise<ActivityPost>;
  updateActivityPost(id: number, updates: Partial<InsertActivityPost>): Promise<ActivityPost | undefined>;
  deleteActivityPost(id: number): Promise<boolean>;
  addActivityMedia(media: InsertActivityMedia): Promise<ActivityMedia>;
  getActivityMedia(postId: number): Promise<ActivityMedia[]>;
  toggleActivityReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }>;
  getActivityReactions(postId: number): Promise<{ reactionType: string; count: number }[]>;
  getActivityComments(postId: number): Promise<ActivityComment[]>;
  createActivityComment(comment: InsertActivityComment): Promise<ActivityComment>;
  deleteActivityComment(id: number): Promise<boolean>;
  
  // Therapist System
  getTherapistProfile(userId: string): Promise<TherapistProfile | undefined>;
  createTherapistProfile(profile: InsertTherapistProfile): Promise<TherapistProfile>;
  updateTherapistProfile(userId: string, updates: Partial<InsertTherapistProfile>): Promise<TherapistProfile | undefined>;
  getVerifiedTherapists(filters?: { specialization?: string; acceptingPatients?: boolean }): Promise<TherapistProfile[]>;
  getPatientAssignments(therapistId: string): Promise<PatientAssignment[]>;
  getTherapistForPatient(patientId: string): Promise<PatientAssignment | undefined>;
  createPatientAssignment(assignment: InsertPatientAssignment): Promise<PatientAssignment>;
  updatePatientAssignment(id: number, updates: Partial<InsertPatientAssignment>): Promise<PatientAssignment | undefined>;
  getTherapySessions(assignmentId?: number, userId?: string): Promise<TherapySession[]>;
  createTherapySession(session: InsertTherapySession): Promise<TherapySession>;
  updateTherapySession(id: number, updates: Partial<TherapySession>): Promise<TherapySession | undefined>;
  getExercisePrescriptions(patientId: string): Promise<ExercisePrescription[]>;
  createExercisePrescription(prescription: InsertExercisePrescription): Promise<ExercisePrescription>;
  
  // Therapeutic Exercises
  getTherapeuticExercises(filters?: { category?: string; difficulty?: string }): Promise<TherapeuticExercise[]>;
  getTherapeuticExercise(id: number): Promise<TherapeuticExercise | undefined>;
  getTherapeuticExerciseBySlug(slug: string): Promise<TherapeuticExercise | undefined>;
  createTherapeuticExercise(exercise: InsertTherapeuticExercise): Promise<TherapeuticExercise>;
  recordExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession>;
  getExerciseSessions(userId: string, exerciseId?: number): Promise<ExerciseSession[]>;
  getUserExerciseScores(userId: string): Promise<ExerciseScore[]>;
  updateExerciseScore(userId: string, exerciseId: number, score: number, accuracy: number, time: number): Promise<ExerciseScore>;
  getSpeechExercises(category?: string): Promise<SpeechExercise[]>;
  getCognitiveExercises(category?: string): Promise<CognitiveExercise[]>;
  
  // Direct Messaging
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation, participantIds: string[]): Promise<Conversation>;
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<DirectMessage[]>;
  sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  
  // Video Sessions
  getVideoSessions(userId: string, status?: string): Promise<VideoSession[]>;
  getVideoSession(id: number): Promise<VideoSession | undefined>;
  createVideoSession(session: InsertVideoSession): Promise<VideoSession>;
  updateVideoSession(id: number, updates: Partial<VideoSession>): Promise<VideoSession | undefined>;
  
  // Forum Media
  addForumPostMedia(media: InsertForumPostMedia): Promise<ForumPostMedia>;
  getForumPostMedia(postId: number): Promise<ForumPostMedia[]>;
  
  // SEO
  getSeoPage(slug: string): Promise<SeoPage | undefined>;
  getAllSeoPages(): Promise<SeoPage[]>;
  createOrUpdateSeoPage(page: InsertSeoPage & { slug: string }): Promise<SeoPage>;
  
  // Extended Vitals
  getVitals(userId: string): Promise<any[]>;
  createVital(vital: any): Promise<any>;
  
  // Extended Wearables
  getWearableConnections(userId: string): Promise<WearableConnection[]>;
  createWearableConnection(connection: any): Promise<WearableConnection>;
  deleteWearableConnection(id: number): Promise<boolean>;
  syncWearableData(connectionId: number): Promise<void>;
  getWearableMetrics(userId: string): Promise<WearableMetric[]>;
  getWearableTodayStats(userId: string): Promise<any>;
  
  // Social Network
  getFollowers(userId: string): Promise<any[]>;
  getFollowing(userId: string): Promise<any[]>;
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  
  // Extended Messages
  getMessages(conversationId: number): Promise<DirectMessage[]>;
  createMessage(message: any): Promise<DirectMessage>;
  
  // Extended Video
  joinVideoSession(sessionId: number, userId: string): Promise<void>;
  endVideoSession(sessionId: number): Promise<void>;
  
  // Therapist Marketplace
  getTherapistStorefronts(): Promise<any[]>;
  getTherapistProducts(therapistId: string): Promise<any[]>;
  createTherapistProduct(product: any): Promise<any>;
  getTherapistEarnings(therapistId: string): Promise<any>;
  purchaseTherapistProduct(userId: string, productId: number): Promise<string>;
  
  // Admin Recovery Plans
  getRecoveryPlans(): Promise<any[]>;
  createRecoveryPlan(plan: any): Promise<any>;
  deleteRecoveryPlan(id: number): Promise<boolean>;
  assignRecoveryPlan(planId: number, userIds: string[]): Promise<void>;
  
  // Blogging Suite
  getBlogPosts(filters?: { authorId?: string; status?: string; featured?: boolean }): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  publishBlogPost(id: number): Promise<BlogPost | undefined>;
  getUserBlogPosts(userId: string): Promise<BlogPost[]>;
  toggleBlogReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }>;
  getBlogComments(postId: number): Promise<BlogPostComment[]>;
  createBlogComment(comment: InsertBlogPostComment): Promise<BlogPostComment>;
  deleteBlogComment(id: number): Promise<boolean>;
  incrementBlogViews(id: number): Promise<void>;
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

  // Reminders
  async getUserReminders(userId: string): Promise<any[]> {
    return db.select().from(recoveryReminders).where(eq(recoveryReminders.userId, userId)).orderBy(recoveryReminders.time);
  }

  async createReminder(reminder: any): Promise<any> {
    const [result] = await db.insert(recoveryReminders).values(reminder).returning();
    return result;
  }

  async updateReminder(id: number, updates: any): Promise<any> {
    const [result] = await db.update(recoveryReminders).set(updates).where(eq(recoveryReminders.id, id)).returning();
    return result;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db.delete(recoveryReminders).where(eq(recoveryReminders.id, id));
    return !!result;
  }

  async logReminderAction(log: any): Promise<any> {
    const [result] = await db.insert(reminderLogs).values(log).returning();
    return result;
  }

  // Stand Goals
  async getUserStandGoal(userId: string): Promise<any | undefined> {
    const [goal] = await db.select().from(standGoals).where(eq(standGoals.userId, userId));
    return goal;
  }

  async createOrUpdateStandGoal(userId: string, goal: any): Promise<any> {
    const existing = await this.getUserStandGoal(userId);
    if (existing) {
      const [result] = await db.update(standGoals).set(goal).where(eq(standGoals.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(standGoals).values({ ...goal, userId }).returning();
    return result;
  }

  async logStand(userId: string, duration?: number): Promise<any> {
    const [result] = await db.insert(standLogs).values({ userId, duration }).returning();
    return result;
  }

  async getTodayStandCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await db.select({ count: sql<number>`count(*)` }).from(standLogs).where(and(eq(standLogs.userId, userId), gte(standLogs.standAt, today), lt(standLogs.standAt, tomorrow)));
    return result[0]?.count || 0;
  }

  // Hydration Goals
  async getUserHydrationGoal(userId: string): Promise<any | undefined> {
    const [goal] = await db.select().from(hydrationGoals).where(eq(hydrationGoals.userId, userId));
    return goal;
  }

  async createOrUpdateHydrationGoal(userId: string, goal: any): Promise<any> {
    const existing = await this.getUserHydrationGoal(userId);
    if (existing) {
      const [result] = await db.update(hydrationGoals).set(goal).where(eq(hydrationGoals.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(hydrationGoals).values({ ...goal, userId }).returning();
    return result;
  }

  async logHydration(userId: string, amount: number): Promise<any> {
    const [result] = await db.insert(hydrationLogs).values({ userId, amount }).returning();
    return result;
  }

  async getTodayHydration(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await db.select({ total: sql<number>`sum(amount)` }).from(hydrationLogs).where(and(eq(hydrationLogs.userId, userId), gte(hydrationLogs.loggedAt, today), lt(hydrationLogs.loggedAt, tomorrow)));
    return result[0]?.total || 0;
  }

  // Exercise Goals
  async getUserExerciseGoal(userId: string): Promise<any | undefined> {
    const [goal] = await db.select().from(exerciseGoals).where(eq(exerciseGoals.userId, userId));
    return goal;
  }

  async createOrUpdateExerciseGoal(userId: string, goal: any): Promise<any> {
    const existing = await this.getUserExerciseGoal(userId);
    if (existing) {
      const [result] = await db.update(exerciseGoals).set(goal).where(eq(exerciseGoals.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(exerciseGoals).values({ ...goal, userId }).returning();
    return result;
  }

  async logExercise(userId: string, type: string, duration: number, intensity?: string): Promise<any> {
    const [result] = await db.insert(exerciseLogs).values({ userId, type, duration, intensity }).returning();
    return result;
  }

  async getTodayExercise(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await db.select({ total: sql<number>`sum(duration)` }).from(exerciseLogs).where(and(eq(exerciseLogs.userId, userId), gte(exerciseLogs.loggedAt, today), lt(exerciseLogs.loggedAt, tomorrow)));
    return result[0]?.total || 0;
  }

  // ============================================================================
  // USER SETTINGS
  // ============================================================================

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createOrUpdateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [result] = await db.update(userSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return result;
    }
    const [result] = await db.insert(userSettings)
      .values({ ...settings, userId })
      .returning();
    return result;
  }

  async updateUsername(userId: string, username: string): Promise<UserSettings | undefined> {
    const [result] = await db.update(userSettings)
      .set({ username, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return result;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const [existing] = await db.select().from(userSettings).where(eq(userSettings.username, username));
    return !existing;
  }

  // ============================================================================
  // ACTIVITY WALL
  // ============================================================================

  async getActivityPosts(options: { limit?: number; offset?: number; visibility?: string; podId?: number; authorId?: string } = {}): Promise<ActivityPost[]> {
    const { limit = 20, offset = 0, visibility, podId, authorId } = options;
    let query = db.select().from(activityPosts);
    
    const conditions = [];
    if (visibility) conditions.push(eq(activityPosts.visibility, visibility));
    if (podId) conditions.push(eq(activityPosts.podId, podId));
    if (authorId) conditions.push(eq(activityPosts.authorId, authorId));
    
    if (conditions.length > 0) {
      return db.select().from(activityPosts)
        .where(and(...conditions))
        .orderBy(desc(activityPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return db.select().from(activityPosts)
      .orderBy(desc(activityPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getActivityPost(id: number): Promise<ActivityPost | undefined> {
    const [post] = await db.select().from(activityPosts).where(eq(activityPosts.id, id));
    return post;
  }

  async createActivityPost(post: InsertActivityPost): Promise<ActivityPost> {
    const [result] = await db.insert(activityPosts).values(post).returning();
    return result;
  }

  async updateActivityPost(id: number, updates: Partial<InsertActivityPost>): Promise<ActivityPost | undefined> {
    const [result] = await db.update(activityPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activityPosts.id, id))
      .returning();
    return result;
  }

  async deleteActivityPost(id: number): Promise<boolean> {
    await db.delete(activityPosts).where(eq(activityPosts.id, id));
    return true;
  }

  async addActivityMedia(media: InsertActivityMedia): Promise<ActivityMedia> {
    const [result] = await db.insert(activityMedia).values(media).returning();
    return result;
  }

  async getActivityMedia(postId: number): Promise<ActivityMedia[]> {
    return db.select().from(activityMedia)
      .where(eq(activityMedia.postId, postId))
      .orderBy(activityMedia.order);
  }

  async toggleActivityReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }> {
    const [existing] = await db.select().from(activityReactions)
      .where(and(eq(activityReactions.postId, postId), eq(activityReactions.userId, userId)));
    
    if (existing) {
      if (existing.reactionType === reactionType) {
        await db.delete(activityReactions)
          .where(and(eq(activityReactions.postId, postId), eq(activityReactions.userId, userId)));
        await db.update(activityPosts)
          .set({ likeCount: sql`${activityPosts.likeCount} - 1` })
          .where(eq(activityPosts.id, postId));
        return { added: false };
      } else {
        await db.update(activityReactions)
          .set({ reactionType })
          .where(and(eq(activityReactions.postId, postId), eq(activityReactions.userId, userId)));
        return { added: true };
      }
    }
    
    await db.insert(activityReactions).values({ postId, userId, reactionType });
    await db.update(activityPosts)
      .set({ likeCount: sql`${activityPosts.likeCount} + 1` })
      .where(eq(activityPosts.id, postId));
    return { added: true };
  }

  async getActivityReactions(postId: number): Promise<{ reactionType: string; count: number }[]> {
    const result = await db
      .select({ reactionType: activityReactions.reactionType, count: sql<number>`count(*)` })
      .from(activityReactions)
      .where(eq(activityReactions.postId, postId))
      .groupBy(activityReactions.reactionType);
    return result;
  }

  async getActivityComments(postId: number): Promise<ActivityComment[]> {
    return db.select().from(activityComments)
      .where(eq(activityComments.postId, postId))
      .orderBy(activityComments.createdAt);
  }

  async createActivityComment(comment: InsertActivityComment): Promise<ActivityComment> {
    const [result] = await db.insert(activityComments).values(comment).returning();
    await db.update(activityPosts)
      .set({ commentCount: sql`${activityPosts.commentCount} + 1` })
      .where(eq(activityPosts.id, comment.postId));
    return result;
  }

  async deleteActivityComment(id: number): Promise<boolean> {
    const [comment] = await db.select().from(activityComments).where(eq(activityComments.id, id));
    if (comment) {
      await db.delete(activityComments).where(eq(activityComments.id, id));
      await db.update(activityPosts)
        .set({ commentCount: sql`${activityPosts.commentCount} - 1` })
        .where(eq(activityPosts.id, comment.postId));
    }
    return true;
  }

  // ============================================================================
  // THERAPIST SYSTEM
  // ============================================================================

  async getTherapistProfile(userId: string): Promise<TherapistProfile | undefined> {
    const [profile] = await db.select().from(therapistProfiles).where(eq(therapistProfiles.userId, userId));
    return profile;
  }

  async createTherapistProfile(profile: InsertTherapistProfile): Promise<TherapistProfile> {
    const [result] = await db.insert(therapistProfiles).values(profile).returning();
    return result;
  }

  async updateTherapistProfile(userId: string, updates: Partial<InsertTherapistProfile>): Promise<TherapistProfile | undefined> {
    const [result] = await db.update(therapistProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(therapistProfiles.userId, userId))
      .returning();
    return result;
  }

  async getVerifiedTherapists(filters: { specialization?: string; acceptingPatients?: boolean } = {}): Promise<TherapistProfile[]> {
    const conditions = [eq(therapistProfiles.isVerified, true)];
    if (filters.acceptingPatients !== undefined) {
      conditions.push(eq(therapistProfiles.acceptingPatients, filters.acceptingPatients));
    }
    return db.select().from(therapistProfiles).where(and(...conditions));
  }

  async getPatientAssignments(therapistId: string): Promise<PatientAssignment[]> {
    return db.select().from(patientAssignments)
      .where(eq(patientAssignments.therapistId, therapistId))
      .orderBy(desc(patientAssignments.createdAt));
  }

  async getTherapistForPatient(patientId: string): Promise<PatientAssignment | undefined> {
    const [assignment] = await db.select().from(patientAssignments)
      .where(and(eq(patientAssignments.patientId, patientId), eq(patientAssignments.status, "active")));
    return assignment;
  }

  async createPatientAssignment(assignment: InsertPatientAssignment): Promise<PatientAssignment> {
    const [result] = await db.insert(patientAssignments).values(assignment).returning();
    return result;
  }

  async updatePatientAssignment(id: number, updates: Partial<InsertPatientAssignment>): Promise<PatientAssignment | undefined> {
    const [result] = await db.update(patientAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patientAssignments.id, id))
      .returning();
    return result;
  }

  async getTherapySessions(assignmentId?: number, userId?: string): Promise<TherapySession[]> {
    if (assignmentId) {
      return db.select().from(therapySessions)
        .where(eq(therapySessions.assignmentId, assignmentId))
        .orderBy(desc(therapySessions.scheduledAt));
    }
    if (userId) {
      return db.select().from(therapySessions)
        .where(or(eq(therapySessions.therapistId, userId), eq(therapySessions.patientId, userId)))
        .orderBy(desc(therapySessions.scheduledAt));
    }
    return [];
  }

  async createTherapySession(session: InsertTherapySession): Promise<TherapySession> {
    const [result] = await db.insert(therapySessions).values(session).returning();
    return result;
  }

  async updateTherapySession(id: number, updates: Partial<TherapySession>): Promise<TherapySession | undefined> {
    const [result] = await db.update(therapySessions)
      .set(updates)
      .where(eq(therapySessions.id, id))
      .returning();
    return result;
  }

  async getExercisePrescriptions(patientId: string): Promise<ExercisePrescription[]> {
    return db.select().from(exercisePrescriptions)
      .where(and(eq(exercisePrescriptions.patientId, patientId), eq(exercisePrescriptions.isActive, true)))
      .orderBy(exercisePrescriptions.createdAt);
  }

  async createExercisePrescription(prescription: InsertExercisePrescription): Promise<ExercisePrescription> {
    const [result] = await db.insert(exercisePrescriptions).values(prescription).returning();
    return result;
  }

  // ============================================================================
  // THERAPEUTIC EXERCISES
  // ============================================================================

  async getTherapeuticExercises(filters: { category?: string; difficulty?: string } = {}): Promise<TherapeuticExercise[]> {
    const conditions = [eq(therapeuticExercises.isActive, true)];
    if (filters.category) conditions.push(eq(therapeuticExercises.category, filters.category));
    if (filters.difficulty) conditions.push(eq(therapeuticExercises.difficulty, filters.difficulty));
    return db.select().from(therapeuticExercises).where(and(...conditions));
  }

  async getTherapeuticExercise(id: number): Promise<TherapeuticExercise | undefined> {
    const [exercise] = await db.select().from(therapeuticExercises).where(eq(therapeuticExercises.id, id));
    return exercise;
  }

  async getTherapeuticExerciseBySlug(slug: string): Promise<TherapeuticExercise | undefined> {
    const [exercise] = await db.select().from(therapeuticExercises).where(eq(therapeuticExercises.slug, slug));
    return exercise;
  }

  async createTherapeuticExercise(exercise: InsertTherapeuticExercise): Promise<TherapeuticExercise> {
    const [result] = await db.insert(therapeuticExercises).values(exercise).returning();
    return result;
  }

  async recordExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession> {
    const [result] = await db.insert(exerciseSessions).values(session).returning();
    return result;
  }

  async getExerciseSessions(userId: string, exerciseId?: number): Promise<ExerciseSession[]> {
    const conditions = [eq(exerciseSessions.userId, userId)];
    if (exerciseId) conditions.push(eq(exerciseSessions.exerciseId, exerciseId));
    return db.select().from(exerciseSessions)
      .where(and(...conditions))
      .orderBy(desc(exerciseSessions.startedAt))
      .limit(50);
  }

  async getUserExerciseScores(userId: string): Promise<ExerciseScore[]> {
    return db.select().from(exerciseScores).where(eq(exerciseScores.userId, userId));
  }

  async updateExerciseScore(userId: string, exerciseId: number, score: number, accuracy: number, time: number): Promise<ExerciseScore> {
    const [existing] = await db.select().from(exerciseScores)
      .where(and(eq(exerciseScores.userId, userId), eq(exerciseScores.exerciseId, exerciseId)));
    
    if (existing) {
      const newHighScore = Math.max(existing.highScore, score);
      const newTotalSessions = existing.totalSessions + 1;
      const newTotalTime = existing.totalTime + time;
      const newAvgScore = Math.round((existing.averageScore * existing.totalSessions + score) / newTotalSessions);
      const newAvgAccuracy = Math.round((existing.averageAccuracy * existing.totalSessions + accuracy) / newTotalSessions);
      
      const [result] = await db.update(exerciseScores)
        .set({
          highScore: newHighScore,
          totalSessions: newTotalSessions,
          totalTime: newTotalTime,
          averageScore: newAvgScore,
          averageAccuracy: newAvgAccuracy,
          lastPlayedAt: new Date(),
          streak: existing.streak + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(exerciseScores.userId, userId), eq(exerciseScores.exerciseId, exerciseId)))
        .returning();
      return result;
    }
    
    const [result] = await db.insert(exerciseScores).values({
      userId,
      exerciseId,
      highScore: score,
      totalSessions: 1,
      totalTime: time,
      averageScore: score,
      averageAccuracy: accuracy,
      lastPlayedAt: new Date(),
      streak: 1,
    }).returning();
    return result;
  }

  async getSpeechExercises(category?: string): Promise<SpeechExercise[]> {
    if (category) {
      return db.select().from(speechExercises)
        .where(and(eq(speechExercises.category, category), eq(speechExercises.isActive, true)))
        .orderBy(speechExercises.order);
    }
    return db.select().from(speechExercises)
      .where(eq(speechExercises.isActive, true))
      .orderBy(speechExercises.order);
  }

  async getCognitiveExercises(category?: string): Promise<CognitiveExercise[]> {
    if (category) {
      return db.select().from(cognitiveExercises)
        .where(and(eq(cognitiveExercises.category, category), eq(cognitiveExercises.isActive, true)));
    }
    return db.select().from(cognitiveExercises).where(eq(cognitiveExercises.isActive, true));
  }

  // ============================================================================
  // DIRECT MESSAGING
  // ============================================================================

  async getConversations(userId: string): Promise<Conversation[]> {
    const participations = await db.select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));
    
    if (participations.length === 0) return [];
    
    const conversationIds = participations.map(p => p.conversationId);
    return db.select().from(conversations)
      .where(sql`${conversations.id} IN (${sql.join(conversationIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation, participantIds: string[]): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    for (const participantId of participantIds) {
      await db.insert(conversationParticipants).values({ conversationId: result.id, userId: participantId });
    }
    return result;
  }

  async getConversationMessages(conversationId: number, limit = 50, offset = 0): Promise<DirectMessage[]> {
    return db.select().from(directMessages)
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(desc(directMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage> {
    const [result] = await db.insert(directMessages).values(message).returning();
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    return result;
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    await db.update(directMessages)
      .set({ isRead: true })
      .where(and(
        eq(directMessages.conversationId, conversationId),
        sql`${directMessages.senderId} != ${userId}`
      ));
    await db.update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));
  }

  // ============================================================================
  // VIDEO SESSIONS
  // ============================================================================

  async getVideoSessions(userId: string, status?: string): Promise<VideoSession[]> {
    const participations = await db.select({ sessionId: videoSessionParticipants.sessionId })
      .from(videoSessionParticipants)
      .where(eq(videoSessionParticipants.userId, userId));
    
    if (participations.length === 0) return [];
    
    const sessionIds = participations.map(p => p.sessionId);
    const conditions = [sql`${videoSessions.id} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`];
    if (status) conditions.push(eq(videoSessions.status, status));
    
    return db.select().from(videoSessions)
      .where(and(...conditions))
      .orderBy(desc(videoSessions.scheduledAt));
  }

  async getVideoSession(id: number): Promise<VideoSession | undefined> {
    const [session] = await db.select().from(videoSessions).where(eq(videoSessions.id, id));
    return session;
  }

  async createVideoSession(session: InsertVideoSession): Promise<VideoSession> {
    const [result] = await db.insert(videoSessions).values(session).returning();
    await db.insert(videoSessionParticipants).values({
      sessionId: result.id,
      userId: session.hostId,
      role: "host",
    });
    return result;
  }

  async updateVideoSession(id: number, updates: Partial<VideoSession>): Promise<VideoSession | undefined> {
    const [result] = await db.update(videoSessions)
      .set(updates)
      .where(eq(videoSessions.id, id))
      .returning();
    return result;
  }

  // ============================================================================
  // FORUM MEDIA
  // ============================================================================

  async addForumPostMedia(media: InsertForumPostMedia): Promise<ForumPostMedia> {
    const [result] = await db.insert(forumPostMedia).values(media).returning();
    return result;
  }

  async getForumPostMedia(postId: number): Promise<ForumPostMedia[]> {
    return db.select().from(forumPostMedia)
      .where(eq(forumPostMedia.postId, postId))
      .orderBy(forumPostMedia.order);
  }

  // ============================================================================
  // SEO
  // ============================================================================

  async getSeoPage(slug: string): Promise<SeoPage | undefined> {
    const [page] = await db.select().from(seoPages).where(eq(seoPages.slug, slug));
    return page;
  }

  async getAllSeoPages(): Promise<SeoPage[]> {
    return db.select().from(seoPages).orderBy(desc(seoPages.priority));
  }

  async createOrUpdateSeoPage(page: InsertSeoPage & { slug: string }): Promise<SeoPage> {
    const existing = await this.getSeoPage(page.slug);
    if (existing) {
      const [result] = await db.update(seoPages)
        .set({ ...page, lastModified: new Date() })
        .where(eq(seoPages.slug, page.slug))
        .returning();
      return result;
    }
    const [result] = await db.insert(seoPages).values(page).returning();
    return result;
  }

  // ============================================================================
  // EXTENDED VITALS
  // ============================================================================

  async getVitals(userId: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 7);
    
    const hydrationData = await db.select().from(hydrationLogs)
      .where(and(eq(hydrationLogs.userId, userId), gte(hydrationLogs.loggedAt, yesterday)))
      .orderBy(desc(hydrationLogs.loggedAt));
    
    const exerciseData = await db.select().from(exerciseLogs)
      .where(and(eq(exerciseLogs.userId, userId), gte(exerciseLogs.loggedAt, yesterday)))
      .orderBy(desc(exerciseLogs.loggedAt));
    
    return [
      ...hydrationData.map(h => ({ vitalType: 'hydration', ...h })),
      ...exerciseData.map(e => ({ vitalType: 'exercise', ...e })),
    ];
  }

  async createVital(vital: any): Promise<any> {
    const { userId, type, ...data } = vital;
    if (type === 'hydration') {
      return this.logHydration(userId, data.amount);
    } else if (type === 'exercise') {
      return this.logExercise(userId, data.exerciseType, data.duration, data.intensity);
    } else if (type === 'stand') {
      return this.logStand(userId, data.duration);
    }
    return vital;
  }

  // ============================================================================
  // EXTENDED WEARABLES
  // ============================================================================

  async getWearableConnections(userId: string): Promise<WearableConnection[]> {
    return db.select().from(wearableConnections)
      .where(eq(wearableConnections.userId, userId))
      .orderBy(desc(wearableConnections.createdAt));
  }

  async createWearableConnection(connection: any): Promise<WearableConnection> {
    const [result] = await db.insert(wearableConnections).values(connection).returning();
    return result;
  }

  async deleteWearableConnection(id: number): Promise<boolean> {
    await db.delete(wearableConnections).where(eq(wearableConnections.id, id));
    return true;
  }

  async syncWearableData(connectionId: number): Promise<void> {
    await db.update(wearableConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(wearableConnections.id, connectionId));
  }

  async getWearableMetrics(userId: string): Promise<WearableMetric[]> {
    return db.select().from(wearableMetrics)
      .where(eq(wearableMetrics.userId, userId))
      .orderBy(desc(wearableMetrics.recordedAt))
      .limit(100);
  }

  async getWearableTodayStats(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const metrics = await db.select().from(wearableMetrics)
      .where(and(
        eq(wearableMetrics.userId, userId),
        gte(wearableMetrics.recordedAt, today)
      ));
    
    return {
      steps: metrics.filter(m => m.metricType === 'steps').reduce((sum, m) => sum + Number(m.value), 0),
      heartRate: metrics.find(m => m.metricType === 'heart_rate')?.value || 0,
      calories: metrics.filter(m => m.metricType === 'calories').reduce((sum, m) => sum + Number(m.value), 0),
      activeMinutes: metrics.filter(m => m.metricType === 'active_minutes').reduce((sum, m) => sum + Number(m.value), 0),
    };
  }

  // ============================================================================
  // SOCIAL NETWORK
  // ============================================================================

  async getFollowers(userId: string): Promise<any[]> {
    return [];
  }

  async getFollowing(userId: string): Promise<any[]> {
    return [];
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    return db.select().from(users)
      .where(or(
        ilike(users.email, `%${query}%`),
        ilike(users.firstName, `%${query}%`),
        ilike(users.lastName, `%${query}%`)
      ))
      .limit(20);
  }

  // ============================================================================
  // EXTENDED MESSAGES
  // ============================================================================

  async getMessages(conversationId: number): Promise<DirectMessage[]> {
    return this.getConversationMessages(conversationId);
  }

  async createMessage(message: any): Promise<DirectMessage> {
    return this.sendDirectMessage(message);
  }

  // ============================================================================
  // EXTENDED VIDEO
  // ============================================================================

  async joinVideoSession(sessionId: number, userId: string): Promise<void> {
    await db.insert(videoSessionParticipants).values({
      sessionId,
      userId,
      role: 'participant',
    }).onConflictDoNothing();
    
    await db.update(videoSessions)
      .set({ status: 'active', startedAt: new Date() })
      .where(eq(videoSessions.id, sessionId));
  }

  async endVideoSession(sessionId: number): Promise<void> {
    await db.update(videoSessions)
      .set({ status: 'completed', endedAt: new Date() })
      .where(eq(videoSessions.id, sessionId));
  }

  // ============================================================================
  // THERAPIST MARKETPLACE
  // ============================================================================

  async getTherapistStorefronts(): Promise<any[]> {
    const therapists = await db.select().from(therapistProfiles)
      .where(eq(therapistProfiles.isVerified, true));
    return therapists.map(t => ({
      ...t,
      productCount: 0,
      rating: 4.8,
    }));
  }

  async getTherapistProducts(therapistId: string): Promise<any[]> {
    return db.select().from(marketplaceProducts)
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async createTherapistProduct(product: any): Promise<any> {
    const [result] = await db.insert(marketplaceProducts).values({
      categoryId: product.categoryId || 1,
      title: product.title,
      description: product.description,
      amazonUrl: product.amazonUrl || '#',
      priceDisplay: product.price,
      isFeatured: false,
      isActive: true,
    }).returning();
    return result;
  }

  async getTherapistEarnings(therapistId: string): Promise<any> {
    return {
      totalEarnings: 0,
      pendingPayout: 0,
      platformFee: 15,
      salesCount: 0,
      recentSales: [],
    };
  }

  async purchaseTherapistProduct(userId: string, productId: number): Promise<string> {
    return `/checkout?product=${productId}`;
  }

  // ============================================================================
  // ADMIN RECOVERY PLANS
  // ============================================================================

  async getRecoveryPlans(): Promise<any[]> {
    return db.select().from(recoveryPrograms).orderBy(desc(recoveryPrograms.createdAt));
  }

  async createRecoveryPlan(plan: any): Promise<any> {
    const [result] = await db.insert(recoveryPrograms).values({
      name: plan.name,
      slug: plan.name.toLowerCase().replace(/\s+/g, '-'),
      description: plan.description,
      tier: plan.tier || 'explorer',
      difficulty: plan.difficulty || 'beginner',
      estimatedWeeks: plan.duration || 12,
      isActive: true,
    }).returning();
    return result;
  }

  async deleteRecoveryPlan(id: number): Promise<boolean> {
    await db.delete(recoveryPrograms).where(eq(recoveryPrograms.id, id));
    return true;
  }

  async assignRecoveryPlan(planId: number, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await db.insert(userEnrollments).values({
        userId,
        programId: planId,
        status: 'active',
      }).onConflictDoNothing();
    }
  }

  // ============================================================================
  // BLOGGING SUITE
  // ============================================================================

  async getBlogPosts(filters?: { authorId?: string; status?: string; featured?: boolean }): Promise<BlogPost[]> {
    let query = db.select().from(blogPosts);
    
    if (filters?.authorId) {
      query = query.where(eq(blogPosts.authorId, filters.authorId)) as any;
    }
    if (filters?.status) {
      query = query.where(eq(blogPosts.status, filters.status)) as any;
    }
    if (filters?.featured) {
      query = query.where(eq(blogPosts.isFeatured, true)) as any;
    }
    
    return query.orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const wordCount = post.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    const [result] = await db.insert(blogPosts).values({
      ...post,
      slug,
      readingTime,
    }).returning();
    return result;
  }

  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    if (updates.content) {
      const wordCount = updates.content.split(/\s+/).length;
      updateData.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    
    const [result] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return result;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return true;
  }

  async publishBlogPost(id: number): Promise<BlogPost | undefined> {
    const [result] = await db.update(blogPosts)
      .set({ 
        status: 'published', 
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return result;
  }

  async getUserBlogPosts(userId: string): Promise<BlogPost[]> {
    return db.select().from(blogPosts)
      .where(eq(blogPosts.authorId, userId))
      .orderBy(desc(blogPosts.createdAt));
  }

  async toggleBlogReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }> {
    const [existing] = await db.select().from(blogPostReactions)
      .where(and(
        eq(blogPostReactions.postId, postId),
        eq(blogPostReactions.userId, userId)
      ));
    
    if (existing) {
      await db.delete(blogPostReactions).where(eq(blogPostReactions.id, existing.id));
      await db.update(blogPosts)
        .set({ likeCount: sql`${blogPosts.likeCount} - 1` })
        .where(eq(blogPosts.id, postId));
      return { added: false };
    } else {
      await db.insert(blogPostReactions).values({ postId, userId, reactionType });
      await db.update(blogPosts)
        .set({ likeCount: sql`${blogPosts.likeCount} + 1` })
        .where(eq(blogPosts.id, postId));
      return { added: true };
    }
  }

  async getBlogComments(postId: number): Promise<BlogPostComment[]> {
    return db.select().from(blogPostComments)
      .where(eq(blogPostComments.postId, postId))
      .orderBy(desc(blogPostComments.createdAt));
  }

  async createBlogComment(comment: InsertBlogPostComment): Promise<BlogPostComment> {
    const [result] = await db.insert(blogPostComments).values(comment).returning();
    await db.update(blogPosts)
      .set({ commentCount: sql`${blogPosts.commentCount} + 1` })
      .where(eq(blogPosts.id, comment.postId));
    return result;
  }

  async deleteBlogComment(id: number): Promise<boolean> {
    const [comment] = await db.select().from(blogPostComments).where(eq(blogPostComments.id, id));
    if (comment) {
      await db.delete(blogPostComments).where(eq(blogPostComments.id, id));
      await db.update(blogPosts)
        .set({ commentCount: sql`${blogPosts.commentCount} - 1` })
        .where(eq(blogPosts.id, comment.postId));
    }
    return true;
  }

  async incrementBlogViews(id: number): Promise<void> {
    await db.update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, id));
  }
}

export const storage = new DatabaseStorage();
