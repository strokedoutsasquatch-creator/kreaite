import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, serial, index, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AFFILIATE/REFERRAL SYSTEM
// ============================================================================

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  usageCount: integer("usage_count").notNull().default(0),
  totalEarnings: integer("total_earnings").notNull().default(0), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralConversions = pgTable("referral_conversions", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purchaseId: integer("purchase_id"),
  commission: integer("commission").notNull().default(0), // in cents (10% of first purchase)
  status: text("status").notNull().default("pending"), // pending, paid
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({ id: true, createdAt: true, usageCount: true, totalEarnings: true });
export const insertReferralConversionSchema = createInsertSchema(referralConversions).omit({ id: true, createdAt: true });

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralConversion = typeof referralConversions.$inferSelect;
export type InsertReferralConversion = z.infer<typeof insertReferralConversionSchema>;

// ============================================================================
// SESSION STORAGE (Required for Replit Auth)
// ============================================================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("member"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false),
  creatorPayoutEnabled: boolean("creator_payout_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  strokeDate: timestamp("stroke_date"),
  strokeType: text("stroke_type"),
  affectedSide: text("affected_side"),
  recoveryGoals: text("recovery_goals").array(),
  currentChallenges: text("current_challenges").array(),
  bio: text("bio"),
  location: text("location"),
  timeZone: text("time_zone"),
  notificationPreferences: jsonb("notification_preferences"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// FORUM SYSTEM
// ============================================================================

export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumThreads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => forumCategories.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => forumThreads.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumReactions = pgTable("forum_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// LEARNING PLATFORM - COURSES
// ============================================================================

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  difficulty: text("difficulty").notNull(),
  estimatedHours: integer("estimated_hours"),
  category: text("category").notNull(),
  instructorId: varchar("instructor_id").references(() => users.id),
  isPublished: boolean("is_published").notNull().default(false),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => courseModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  duration: integer("duration"),
  order: integer("order").notNull(),
  lessonType: text("lesson_type").notNull(),
  resources: jsonb("resources"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// LEARNING PLATFORM - BOOKS
// ============================================================================

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  author: text("author").notNull().default("Nick Kremers"),
  coverImageUrl: text("cover_image_url"),
  stripePriceId: text("stripe_price_id"),
  stripeProductId: text("stripe_product_id"),
  category: text("category").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  isFree: boolean("is_free").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookChapters = pgTable("book_chapters", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  estimatedReadTime: integer("estimated_read_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookPages = pgTable("book_pages", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => bookChapters.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  content: text("content").notNull(),
  interactiveElements: jsonb("interactive_elements"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// LEARNING PACKAGES (Book + Course Combinations)
// ============================================================================

export const learningPackages = pgTable("learning_packages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  bookChapterIds: integer("book_chapter_ids").array(),
  courseIds: integer("course_ids").array(),
  difficulty: text("difficulty").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export const userCourseProgress = pgTable("user_course_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  completedLessonIds: integer("completed_lesson_ids").array(),
  currentLessonId: integer("current_lesson_id"),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const userBookProgress = pgTable("user_book_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentChapterId: integer("current_chapter_id").references(() => bookChapters.id),
  currentPageNumber: integer("current_page_number").notNull().default(1),
  completedChapterIds: integer("completed_chapter_ids").array(),
  totalReadTime: integer("total_read_time").notNull().default(0),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
});

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  note: text("note").notNull(),
  position: jsonb("position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userBookmarks = pgTable("user_bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// AI COACHING SYSTEM
// ============================================================================

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(),
  title: text("title"),
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachingInsights = pgTable("coaching_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightType: text("insight_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// ACHIEVEMENTS & MILESTONES
// ============================================================================

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  category: text("category").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  criteria: jsonb("criteria").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: timestamp("log_date").notNull(),
  mood: text("mood"),
  energyLevel: integer("energy_level"),
  painLevel: integer("pain_level"),
  exercisesCompleted: text("exercises_completed").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// MARKETPLACE (Amazon Affiliate Products)
// ============================================================================

export const marketplaceCategories = pgTable("marketplace_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketplaceProducts = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => marketplaceCategories.id, { onDelete: "cascade" }),
  asin: text("asin"),
  title: text("title").notNull(),
  brand: text("brand"),
  description: text("description"),
  features: text("features").array(),
  imageUrl: text("image_url"),
  amazonUrl: text("amazon_url").notNull(),
  priceDisplay: text("price_display"),
  rating: text("rating"),
  reviewCount: integer("review_count"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// STROKE LYFE PUBLISHING - Book Writing Studio
// ============================================================================

export const publishingProjects = pgTable("publishing_projects", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  genre: text("genre"),
  targetAudience: text("target_audience"),
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("draft"), // draft, writing, editing, review, published
  wordCount: integer("word_count").notNull().default(0),
  chapterCount: integer("chapter_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  price: integer("price"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const manuscriptChapters = pgTable("manuscript_chapters", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  content: text("content"), // Rich text content
  aiDraft: text("ai_draft"), // AI-generated draft
  notes: text("notes"), // Author notes
  wordCount: integer("word_count").notNull().default(0),
  status: text("status").notNull().default("outline"), // outline, drafting, ai_review, editing, complete
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const manuscriptAssets = pgTable("manuscript_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  assetType: text("asset_type").notNull(), // image, document, audio
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiWritingJobs = pgTable("ai_writing_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "cascade" }),
  jobType: text("job_type").notNull(), // outline, draft, rewrite, edit, expand, summarize
  prompt: text("prompt").notNull(),
  result: text("result"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ============================================================================
// STROKE LYFE PUBLISHING - Course Builder
// ============================================================================

export const creatorCourses = pgTable("creator_courses", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceProjectId: integer("source_project_id").references(() => publishingProjects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  difficulty: text("difficulty").notNull().default("beginner"),
  estimatedHours: integer("estimated_hours"),
  price: integer("price"), // in cents
  status: text("status").notNull().default("draft"), // draft, review, published
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creatorCourseModules = pgTable("creator_course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => creatorCourses.id, { onDelete: "cascade" }),
  sourceChapterId: integer("source_chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creatorCourseLessons = pgTable("creator_course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => creatorCourseModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  videoUrl: text("video_url"),
  duration: integer("duration"), // in minutes
  order: integer("order").notNull().default(0),
  isFree: boolean("is_free").notNull().default(false), // Preview lesson
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coursePurchases = pgTable("course_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => creatorCourses.id, { onDelete: "cascade" }),
  stripePaymentId: text("stripe_payment_id"),
  amount: integer("amount").notNull(), // in cents
  status: text("status").notNull().default("pending"), // pending, completed, refunded
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
});

export const creatorPayouts = pgTable("creator_payouts", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  stripePayoutId: text("stripe_payout_id"),
  stripeTransferId: text("stripe_transfer_id"),
  failureReason: text("failure_reason"),
  earningsIncluded: integer("earnings_included").array(), // array of earning IDs
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
});

// ============================================================================
// RECOVERY UNIVERSITY - Learning Programs
// ============================================================================

export const recoveryPrograms = pgTable("recovery_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  tier: text("tier").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedWeeks: integer("estimated_weeks"),
  moduleCount: integer("module_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programModules = pgTable("program_modules", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => recoveryPrograms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  lessonCount: integer("lesson_count").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programLessons = pgTable("program_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => programModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  videoUrl: text("video_url"),
  order: integer("order").notNull(),
  lessonType: text("lesson_type").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  resources: jsonb("resources"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userEnrollments = pgTable("user_enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programId: integer("program_id").notNull().references(() => recoveryPrograms.id),
  currentModuleId: integer("current_module_id").references(() => programModules.id),
  currentLessonId: integer("current_lesson_id").references(() => programLessons.id),
  completedModuleIds: integer("completed_module_ids").array(),
  completedLessonIds: integer("completed_lesson_ids").array(),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  recoveryScore: integer("recovery_score").notNull().default(0),
  status: text("status").notNull().default("active"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  graduatedAt: timestamp("graduated_at"),
});

// ============================================================================
// RECOVERY UNIVERSITY - Milestones & Achievements
// ============================================================================

export const recoveryMilestones = pgTable("recovery_milestones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  iconUrl: text("icon_url"),
  badgeUrl: text("badge_url"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userMilestoneLogs = pgTable("user_milestone_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneId: integer("milestone_id").notNull().references(() => recoveryMilestones.id),
  celebrationNotes: text("celebration_notes"),
  achievedAt: timestamp("achieved_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY UNIVERSITY - Habits & Streaks
// ============================================================================

export const recoveryHabits = pgTable("recovery_habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  frequency: text("frequency").notNull().default("daily"),
  targetDays: integer("target_days").notNull().default(66),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userHabits = pgTable("user_habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  habitId: integer("habit_id").notNull().references(() => recoveryHabits.id),
  customName: text("custom_name"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  targetDays: integer("target_days").notNull().default(66),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalCompletions: integer("total_completions").notNull().default(0),
  status: text("status").notNull().default("active"),
  completedAt: timestamp("completed_at"),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  userHabitId: integer("user_habit_id").notNull().references(() => userHabits.id, { onDelete: "cascade" }),
  logDate: timestamp("log_date").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checkinDate: timestamp("checkin_date").notNull(),
  moodScore: integer("mood_score"),
  energyScore: integer("energy_score"),
  painScore: integer("pain_score"),
  effortScore: integer("effort_score"),
  sleepHours: integer("sleep_hours"),
  exerciseMinutes: integer("exercise_minutes"),
  winsToday: text("wins_today"),
  challengesToday: text("challenges_today"),
  gratitude: text("gratitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  totalActiveDays: integer("total_active_days").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY UNIVERSITY - Accountability & Community
// ============================================================================

export const accountabilityPods = pgTable("accountability_pods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: varchar("leader_id").references(() => users.id),
  maxMembers: integer("max_members").notNull().default(6),
  memberCount: integer("member_count").notNull().default(0),
  focusArea: text("focus_area"),
  meetingSchedule: text("meeting_schedule"),
  isPrivate: boolean("is_private").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const podMembers = pgTable("pod_members", {
  id: serial("id").primaryKey(),
  podId: integer("pod_id").notNull().references(() => accountabilityPods.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const recoveryExperiments = pgTable("recovery_experiments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  outcome: text("outcome"),
  notes: text("notes"),
  rating: integer("rating"),
  wouldRecommend: boolean("would_recommend"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY UNIVERSITY - Reminders & Wellness
// ============================================================================

export const recoveryReminders = pgTable("recovery_reminders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // medication, appointment, hydration, exercise, stand
  title: text("title").notNull(),
  description: text("description"),
  time: text("time").notNull(), // HH:MM format
  days: text("days").array().notNull(), // ["monday", "tuesday", etc.] or ["daily"]
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reminderLogs = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  reminderId: integer("reminder_id").notNull().references(() => recoveryReminders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // completed, dismissed, snoozed, missed
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const standGoals = pgTable("stand_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hourlyGoal: integer("hourly_goal").notNull().default(1), // stand up every X hours
  dailyStandTarget: integer("daily_stand_target").notNull().default(12), // total stands per day
  startHour: integer("start_hour").notNull().default(8), // 8 AM
  endHour: integer("end_hour").notNull().default(20), // 8 PM
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const standLogs = pgTable("stand_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  standAt: timestamp("stand_at").notNull().defaultNow(),
  duration: integer("duration"), // seconds standing
  notes: text("notes"),
});

export const hydrationGoals = pgTable("hydration_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dailyTarget: integer("daily_target").notNull().default(8), // glasses per day
  glassSize: integer("glass_size").notNull().default(8), // oz per glass
  reminderInterval: integer("reminder_interval").notNull().default(60), // minutes
  startHour: integer("start_hour").notNull().default(7),
  endHour: integer("end_hour").notNull().default(21),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const hydrationLogs = pgTable("hydration_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // oz
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const exerciseGoals = pgTable("exercise_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dailyMinutes: integer("daily_minutes").notNull().default(30),
  weeklyDays: integer("weekly_days").notNull().default(5),
  preferredTime: text("preferred_time"), // morning, afternoon, evening
  exerciseTypes: text("exercise_types").array(), // walking, stretching, therapy, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // walking, stretching, therapy, etc.
  duration: integer("duration").notNull(), // minutes
  intensity: text("intensity"), // light, moderate, intense
  notes: text("notes"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
});

// ============================================================================
// ENHANCED USER MANAGEMENT
// ============================================================================

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  // Profile Settings
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  // Privacy Settings
  profileVisibility: text("profile_visibility").notNull().default("public"), // public, members, private
  showRecoveryProgress: boolean("show_recovery_progress").notNull().default(true),
  showActivityFeed: boolean("show_activity_feed").notNull().default(true),
  allowDirectMessages: boolean("allow_direct_messages").notNull().default(true),
  // Notification Settings
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  reminderNotifications: boolean("reminder_notifications").notNull().default(true),
  communityNotifications: boolean("community_notifications").notNull().default(true),
  achievementNotifications: boolean("achievement_notifications").notNull().default(true),
  // Accessibility Settings
  fontSize: text("font_size").notNull().default("medium"), // small, medium, large, xlarge
  highContrast: boolean("high_contrast").notNull().default(false),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  screenReader: boolean("screen_reader").notNull().default(false),
  // Theme Settings
  theme: text("theme").notNull().default("dark"), // dark, light, system
  accentColor: text("accent_color").notNull().default("#FF6B35"),
  // Recovery Preferences
  preferredExerciseTime: text("preferred_exercise_time"), // morning, afternoon, evening
  recoveryFocus: text("recovery_focus").array(), // upper_extremity, speech, cognitive, etc.
  difficultyLevel: text("difficulty_level").notNull().default("adaptive"), // easy, moderate, challenging, adaptive
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// THERAPIST SYSTEM
// ============================================================================

export const therapistProfiles = pgTable("therapist_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  licenseNumber: text("license_number"),
  licenseState: text("license_state"),
  licenseType: text("license_type"), // PT, OT, SLP, etc.
  specializations: text("specializations").array(),
  yearsExperience: integer("years_experience"),
  bio: text("bio"),
  education: text("education"),
  certifications: text("certifications").array(),
  acceptingPatients: boolean("accepting_patients").notNull().default(true),
  hourlyRate: integer("hourly_rate"), // in cents
  availableHours: jsonb("available_hours"), // { monday: ["9:00-12:00", "14:00-17:00"], ... }
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  rating: integer("rating"), // 1-5 scale, stored as 10-50 for precision
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const patientAssignments = pgTable("patient_assignments", {
  id: serial("id").primaryKey(),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // pending, active, paused, completed, terminated
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  goals: text("goals").array(),
  notes: text("notes"),
  sessionFrequency: text("session_frequency"), // weekly, biweekly, monthly
  nextSessionDate: timestamp("next_session_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const therapySessions = pgTable("therapy_sessions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => patientAssignments.id, { onDelete: "cascade" }),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // video, in_person, phone, async_review
  scheduledAt: timestamp("scheduled_at").notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, no_show
  meetingUrl: text("meeting_url"),
  recordingUrl: text("recording_url"),
  notes: text("notes"),
  patientNotes: text("patient_notes"),
  exercisesPrescribed: jsonb("exercises_prescribed"),
  progressAssessment: jsonb("progress_assessment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exercisePrescriptions = pgTable("exercise_prescriptions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => patientAssignments.id, { onDelete: "cascade" }),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id"), // links to therapeutic exercises
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  sets: integer("sets"),
  reps: integer("reps"),
  duration: integer("duration"), // seconds
  frequency: text("frequency").notNull(), // daily, twice_daily, weekly, etc.
  daysPerWeek: integer("days_per_week"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// ACTIVITY WALL (Social Feed)
// ============================================================================

export const activityPosts = pgTable("activity_posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("update"), // update, milestone, question, tip, celebration, pod_activity
  visibility: text("visibility").notNull().default("public"), // public, members, pod, private
  podId: integer("pod_id").references(() => accountabilityPods.id, { onDelete: "set null" }),
  isPinned: boolean("is_pinned").notNull().default(false),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const activityMedia = pgTable("activity_media", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => activityPosts.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(), // image, video, gif, sticker
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  tenorId: text("tenor_id"), // for GIFs from Tenor API
  altText: text("alt_text"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // for videos, in seconds
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityReactions = pgTable("activity_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => activityPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(), // like, love, celebrate, support, insightful
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityComments = pgTable("activity_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => activityPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // for nested replies
  content: text("content").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// THERAPEUTIC EXERCISE GAMES
// ============================================================================

export const therapeuticExercises = pgTable("therapeutic_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // upper_extremity, lower_extremity, cognitive, speech, balance, daily_living
  subcategory: text("subcategory"), // grip_strength, shoulder_rom, finger_dexterity, memory, attention, etc.
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  targetArea: text("target_area").array(), // shoulder, elbow, wrist, fingers, etc.
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  gameType: text("game_type"), // tap_sequence, target_hit, word_match, memory_cards, reaction_time, etc.
  gameConfig: jsonb("game_config"), // { duration: 60, targets: 10, speed: "medium", etc. }
  benefits: text("benefits").array(),
  contraindications: text("contraindications").array(),
  estimatedMinutes: integer("estimated_minutes"),
  caloriesBurned: integer("calories_burned"),
  equipmentNeeded: text("equipment_needed").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exerciseSessions = pgTable("exercise_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => therapeuticExercises.id, { onDelete: "cascade" }),
  prescriptionId: integer("prescription_id").references(() => exercisePrescriptions.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // seconds
  score: integer("score"),
  maxScore: integer("max_score"),
  accuracy: integer("accuracy"), // percentage 0-100
  speed: integer("speed"), // average response time in ms
  reps: integer("reps"),
  sets: integer("sets"),
  difficulty: text("difficulty"),
  gameData: jsonb("game_data"), // detailed performance metrics
  notes: text("notes"),
  painLevel: integer("pain_level"), // 0-10 scale
  effortLevel: integer("effort_level"), // 0-10 scale
});

export const exerciseScores = pgTable("exercise_scores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => therapeuticExercises.id, { onDelete: "cascade" }),
  highScore: integer("high_score").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalTime: integer("total_time").notNull().default(0), // seconds
  averageScore: integer("average_score").notNull().default(0),
  averageAccuracy: integer("average_accuracy").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at"),
  streak: integer("streak").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SPEECH & COGNITIVE THERAPY
// ============================================================================

export const speechExercises = pgTable("speech_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // apraxia, aphasia, articulation, fluency, voice
  difficulty: text("difficulty").notNull(),
  promptType: text("prompt_type").notNull(), // word, phrase, sentence, reading, naming, repetition
  promptContent: text("prompt_content").notNull(),
  audioUrl: text("audio_url"), // model pronunciation
  imageUrl: text("image_url"), // visual prompt
  expectedResponse: text("expected_response"),
  phonemes: text("phonemes").array(), // target sounds
  hints: text("hints").array(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cognitiveExercises = pgTable("cognitive_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // memory, attention, problem_solving, processing_speed, language
  subcategory: text("subcategory"), // working_memory, visual_memory, sustained_attention, etc.
  difficulty: text("difficulty").notNull(),
  gameType: text("game_type").notNull(), // matching, sequence, sorting, word_finding, math, etc.
  instructions: text("instructions"),
  gameConfig: jsonb("game_config"), // { grid_size: 4, time_limit: 60, categories: ["animals"], etc. }
  estimatedMinutes: integer("estimated_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// WEARABLE INTEGRATION
// ============================================================================

export const wearableConnections = pgTable("wearable_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // fitbit, apple_health, google_fit, garmin, oura
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  deviceId: text("device_id"),
  deviceName: text("device_name"),
  lastSyncAt: timestamp("last_sync_at"),
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  metricsEnabled: jsonb("metrics_enabled"), // { steps: true, heart_rate: true, sleep: true, etc. }
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wearableMetrics = pgTable("wearable_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: integer("connection_id").notNull().references(() => wearableConnections.id, { onDelete: "cascade" }),
  metricType: text("metric_type").notNull(), // steps, heart_rate, sleep, calories, active_minutes, etc.
  value: integer("value").notNull(),
  unit: text("unit").notNull(), // count, bpm, hours, kcal, etc.
  recordedAt: timestamp("recorded_at").notNull(),
  metadata: jsonb("metadata"), // additional data like heart_rate_zones, sleep_stages, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// DIRECT MESSAGING
// ============================================================================

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("direct"), // direct, group
  name: text("name"), // for group chats
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  isMuted: boolean("is_muted").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // image, video, gif, file
  tenorId: text("tenor_id"),
  isRead: boolean("is_read").notNull().default(false),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// ENHANCED FORUM (Media Support)
// ============================================================================

export const forumPostMedia = pgTable("forum_post_media", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(), // image, video, gif, file
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  tenorId: text("tenor_id"),
  altText: text("alt_text"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// VIDEO SESSIONS (Telemedicine)
// ============================================================================

export const videoSessions = pgTable("video_sessions", {
  id: serial("id").primaryKey(),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // therapy, pod_meeting, coaching, group_class
  title: text("title"),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // minutes
  maxParticipants: integer("max_participants").notNull().default(2),
  meetingUrl: text("meeting_url"),
  roomId: text("room_id"),
  recordingUrl: text("recording_url"),
  status: text("status").notNull().default("scheduled"), // scheduled, live, ended, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videoSessionParticipants = pgTable("video_session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => videoSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("participant"), // host, co_host, participant
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  status: text("status").notNull().default("invited"), // invited, joined, left
});

// ============================================================================
// SEO & CONTENT PAGES
// ============================================================================

export const seoPages = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords").array(),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  canonicalUrl: text("canonical_url"),
  structuredData: jsonb("structured_data"), // JSON-LD schema.org data
  robots: text("robots").notNull().default("index, follow"),
  priority: integer("priority").notNull().default(5), // 1-10 for sitemap
  changeFrequency: text("change_frequency").notNull().default("weekly"),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// BLOGGING SUITE - USER STORIES
// ============================================================================

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  heroImageUrl: text("hero_image_url"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  visibility: text("visibility").notNull().default("public"), // public, private, followers
  tags: text("tags").array(),
  readingTime: integer("reading_time").default(5),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogPostReactions = pgTable("blog_post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull().default("like"), // like, love, inspire, support
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blogPostComments = pgTable("blog_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// INSERT SCHEMAS & TYPES
// ============================================================================

// Recovery University Insert Schemas
export const insertRecoveryProgramSchema = createInsertSchema(recoveryPrograms).omit({ id: true, createdAt: true });
export const insertUserEnrollmentSchema = createInsertSchema(userEnrollments).omit({ id: true, enrolledAt: true, lastActivityAt: true });
export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins).omit({ id: true, createdAt: true });
export const insertUserHabitSchema = createInsertSchema(userHabits).omit({ id: true, currentStreak: true, longestStreak: true, totalCompletions: true });
export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true, createdAt: true });
export const insertRecoveryExperimentSchema = createInsertSchema(recoveryExperiments).omit({ id: true, createdAt: true });
export const insertAccountabilityPodSchema = createInsertSchema(accountabilityPods).omit({ id: true, createdAt: true, memberCount: true });
export const insertPodMemberSchema = createInsertSchema(podMembers).omit({ id: true, joinedAt: true });

// Reminders & Wellness Insert Schemas
export const insertRecoveryReminderSchema = createInsertSchema(recoveryReminders).omit({ id: true, createdAt: true, lastTriggered: true });
export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({ id: true, createdAt: true });
export const insertStandGoalSchema = createInsertSchema(standGoals).omit({ id: true, createdAt: true });
export const insertStandLogSchema = createInsertSchema(standLogs).omit({ id: true });
export const insertHydrationGoalSchema = createInsertSchema(hydrationGoals).omit({ id: true, createdAt: true });
export const insertHydrationLogSchema = createInsertSchema(hydrationLogs).omit({ id: true });
export const insertExerciseGoalSchema = createInsertSchema(exerciseGoals).omit({ id: true, createdAt: true });
export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({ id: true });

export const insertPublishingProjectSchema = createInsertSchema(publishingProjects).omit({ id: true, createdAt: true, updatedAt: true, wordCount: true, chapterCount: true });
export const insertManuscriptChapterSchema = createInsertSchema(manuscriptChapters).omit({ id: true, createdAt: true, updatedAt: true, wordCount: true });
export const insertManuscriptAssetSchema = createInsertSchema(manuscriptAssets).omit({ id: true, createdAt: true });
export const insertAiWritingJobSchema = createInsertSchema(aiWritingJobs).omit({ id: true, createdAt: true, completedAt: true });
export const insertCreatorCourseSchema = createInsertSchema(creatorCourses).omit({ id: true, createdAt: true, updatedAt: true, enrollmentCount: true, revenue: true });
export const insertCreatorCourseModuleSchema = createInsertSchema(creatorCourseModules).omit({ id: true, createdAt: true });
export const insertCreatorCourseLessonSchema = createInsertSchema(creatorCourseLessons).omit({ id: true, createdAt: true });
export const insertCoursePurchaseSchema = createInsertSchema(coursePurchases).omit({ id: true, purchasedAt: true });
export const insertCreatorPayoutSchema = createInsertSchema(creatorPayouts).omit({ id: true, createdAt: true, paidAt: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, role: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, updatedAt: true });
export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({ id: true, createdAt: true });
export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({ id: true, createdAt: true, lastActivityAt: true, viewCount: true, replyCount: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, likeCount: true, isEdited: true, editedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true, enrollmentCount: true });
export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true });
export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true });
export const insertBookSchema = createInsertSchema(books).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookChapterSchema = createInsertSchema(bookChapters).omit({ id: true, createdAt: true });
export const insertBookPageSchema = createInsertSchema(bookPages).omit({ id: true, createdAt: true });
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({ id: true, createdAt: true, messageCount: true, lastMessageAt: true });
export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({ id: true, createdAt: true });
export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true });
export const insertMarketplaceCategorySchema = createInsertSchema(marketplaceCategories).omit({ id: true, createdAt: true });
export const insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({ id: true, createdAt: true, updatedAt: true });

// Enhanced User Management Insert Schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, updatedAt: true });

// Therapist System Insert Schemas
export const insertTherapistProfileSchema = createInsertSchema(therapistProfiles).omit({ id: true, createdAt: true, updatedAt: true, isVerified: true, verifiedAt: true, rating: true, reviewCount: true });
export const insertPatientAssignmentSchema = createInsertSchema(patientAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTherapySessionSchema = createInsertSchema(therapySessions).omit({ id: true, createdAt: true });
export const insertExercisePrescriptionSchema = createInsertSchema(exercisePrescriptions).omit({ id: true, createdAt: true });

// Activity Wall Insert Schemas
export const insertActivityPostSchema = createInsertSchema(activityPosts).omit({ id: true, createdAt: true, updatedAt: true, likeCount: true, commentCount: true, shareCount: true });
export const insertActivityMediaSchema = createInsertSchema(activityMedia).omit({ id: true, createdAt: true });
export const insertActivityReactionSchema = createInsertSchema(activityReactions).omit({ id: true, createdAt: true });
export const insertActivityCommentSchema = createInsertSchema(activityComments).omit({ id: true, createdAt: true, updatedAt: true, likeCount: true });

// Therapeutic Exercises Insert Schemas
export const insertTherapeuticExerciseSchema = createInsertSchema(therapeuticExercises).omit({ id: true, createdAt: true });
export const insertExerciseSessionSchema = createInsertSchema(exerciseSessions).omit({ id: true, startedAt: true });
export const insertExerciseScoreSchema = createInsertSchema(exerciseScores).omit({ id: true, updatedAt: true });
export const insertSpeechExerciseSchema = createInsertSchema(speechExercises).omit({ id: true, createdAt: true });
export const insertCognitiveExerciseSchema = createInsertSchema(cognitiveExercises).omit({ id: true, createdAt: true });

// Wearable Integration Insert Schemas
export const insertWearableConnectionSchema = createInsertSchema(wearableConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWearableMetricSchema = createInsertSchema(wearableMetrics).omit({ id: true, createdAt: true });

// Direct Messaging Insert Schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({ id: true, joinedAt: true });
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, createdAt: true, updatedAt: true, isRead: true, isEdited: true });

// Enhanced Forum Insert Schemas
export const insertForumPostMediaSchema = createInsertSchema(forumPostMedia).omit({ id: true, createdAt: true });

// Video Sessions Insert Schemas
export const insertVideoSessionSchema = createInsertSchema(videoSessions).omit({ id: true, createdAt: true });
export const insertVideoSessionParticipantSchema = createInsertSchema(videoSessionParticipants).omit({ id: true });

// SEO Insert Schemas
export const insertSeoPageSchema = createInsertSchema(seoPages).omit({ id: true, createdAt: true, lastModified: true });

// Blogging Suite Insert Schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, likeCount: true, commentCount: true });
export const insertBlogPostReactionSchema = createInsertSchema(blogPostReactions).omit({ id: true, createdAt: true });
export const insertBlogPostCommentSchema = createInsertSchema(blogPostComments).omit({ id: true, createdAt: true, updatedAt: true, isEdited: true });

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type BookChapter = typeof bookChapters.$inferSelect;
export type InsertBookChapter = z.infer<typeof insertBookChapterSchema>;
export type BookPage = typeof bookPages.$inferSelect;
export type InsertBookPage = z.infer<typeof insertBookPageSchema>;
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type UserCourseProgress = typeof userCourseProgress.$inferSelect;
export type UserBookProgress = typeof userBookProgress.$inferSelect;
export type UserNote = typeof userNotes.$inferSelect;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type CoachingInsight = typeof coachingInsights.$inferSelect;
export type LearningPackage = typeof learningPackages.$inferSelect;
export type MarketplaceCategory = typeof marketplaceCategories.$inferSelect;
export type InsertMarketplaceCategory = z.infer<typeof insertMarketplaceCategorySchema>;
export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type InsertMarketplaceProduct = z.infer<typeof insertMarketplaceProductSchema>;

// Stroke Lyfe Publishing Types
export type PublishingProject = typeof publishingProjects.$inferSelect;
export type InsertPublishingProject = z.infer<typeof insertPublishingProjectSchema>;
export type ManuscriptChapter = typeof manuscriptChapters.$inferSelect;
export type InsertManuscriptChapter = z.infer<typeof insertManuscriptChapterSchema>;
export type ManuscriptAsset = typeof manuscriptAssets.$inferSelect;
export type InsertManuscriptAsset = z.infer<typeof insertManuscriptAssetSchema>;
export type AiWritingJob = typeof aiWritingJobs.$inferSelect;
export type InsertAiWritingJob = z.infer<typeof insertAiWritingJobSchema>;
export type CreatorCourse = typeof creatorCourses.$inferSelect;
export type InsertCreatorCourse = z.infer<typeof insertCreatorCourseSchema>;
export type CreatorCourseModule = typeof creatorCourseModules.$inferSelect;
export type InsertCreatorCourseModule = z.infer<typeof insertCreatorCourseModuleSchema>;
export type CreatorCourseLesson = typeof creatorCourseLessons.$inferSelect;
export type InsertCreatorCourseLesson = z.infer<typeof insertCreatorCourseLessonSchema>;
export type CoursePurchase = typeof coursePurchases.$inferSelect;
export type InsertCoursePurchase = z.infer<typeof insertCoursePurchaseSchema>;
export type CreatorPayout = typeof creatorPayouts.$inferSelect;
export type InsertCreatorPayout = z.infer<typeof insertCreatorPayoutSchema>;

// Recovery University Types
export type RecoveryProgram = typeof recoveryPrograms.$inferSelect;
export type InsertRecoveryProgram = z.infer<typeof insertRecoveryProgramSchema>;
export type UserEnrollment = typeof userEnrollments.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;
export type UserHabit = typeof userHabits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type RecoveryExperiment = typeof recoveryExperiments.$inferSelect;
export type AccountabilityPod = typeof accountabilityPods.$inferSelect;
export type InsertAccountabilityPod = z.infer<typeof insertAccountabilityPodSchema>;
export type PodMember = typeof podMembers.$inferSelect;
export type InsertPodMember = z.infer<typeof insertPodMemberSchema>;
export type RecoveryMilestone = typeof recoveryMilestones.$inferSelect;
export type UserStreak = typeof userStreaks.$inferSelect;

// Enhanced User Management Types
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Therapist System Types
export type TherapistProfile = typeof therapistProfiles.$inferSelect;
export type InsertTherapistProfile = z.infer<typeof insertTherapistProfileSchema>;
export type PatientAssignment = typeof patientAssignments.$inferSelect;
export type InsertPatientAssignment = z.infer<typeof insertPatientAssignmentSchema>;
export type TherapySession = typeof therapySessions.$inferSelect;
export type InsertTherapySession = z.infer<typeof insertTherapySessionSchema>;
export type ExercisePrescription = typeof exercisePrescriptions.$inferSelect;
export type InsertExercisePrescription = z.infer<typeof insertExercisePrescriptionSchema>;

// Activity Wall Types
export type ActivityPost = typeof activityPosts.$inferSelect;
export type InsertActivityPost = z.infer<typeof insertActivityPostSchema>;
export type ActivityMedia = typeof activityMedia.$inferSelect;
export type InsertActivityMedia = z.infer<typeof insertActivityMediaSchema>;
export type ActivityReaction = typeof activityReactions.$inferSelect;
export type InsertActivityReaction = z.infer<typeof insertActivityReactionSchema>;
export type ActivityComment = typeof activityComments.$inferSelect;
export type InsertActivityComment = z.infer<typeof insertActivityCommentSchema>;

// Therapeutic Exercises Types
export type TherapeuticExercise = typeof therapeuticExercises.$inferSelect;
export type InsertTherapeuticExercise = z.infer<typeof insertTherapeuticExerciseSchema>;
export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type InsertExerciseSession = z.infer<typeof insertExerciseSessionSchema>;
export type ExerciseScore = typeof exerciseScores.$inferSelect;
export type InsertExerciseScore = z.infer<typeof insertExerciseScoreSchema>;
export type SpeechExercise = typeof speechExercises.$inferSelect;
export type InsertSpeechExercise = z.infer<typeof insertSpeechExerciseSchema>;
export type CognitiveExercise = typeof cognitiveExercises.$inferSelect;
export type InsertCognitiveExercise = z.infer<typeof insertCognitiveExerciseSchema>;

// Wearable Integration Types
export type WearableConnection = typeof wearableConnections.$inferSelect;
export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;
export type WearableMetric = typeof wearableMetrics.$inferSelect;
export type InsertWearableMetric = z.infer<typeof insertWearableMetricSchema>;

// Direct Messaging Types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

// Enhanced Forum Types
export type ForumPostMedia = typeof forumPostMedia.$inferSelect;
export type InsertForumPostMedia = z.infer<typeof insertForumPostMediaSchema>;

// Video Sessions Types
export type VideoSession = typeof videoSessions.$inferSelect;
export type InsertVideoSession = z.infer<typeof insertVideoSessionSchema>;
export type VideoSessionParticipant = typeof videoSessionParticipants.$inferSelect;
export type InsertVideoSessionParticipant = z.infer<typeof insertVideoSessionParticipantSchema>;

// SEO Types
export type SeoPage = typeof seoPages.$inferSelect;
export type InsertSeoPage = z.infer<typeof insertSeoPageSchema>;

// Blogging Suite Types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPostReaction = typeof blogPostReactions.$inferSelect;
export type InsertBlogPostReaction = z.infer<typeof insertBlogPostReactionSchema>;
export type BlogPostComment = typeof blogPostComments.$inferSelect;
export type InsertBlogPostComment = z.infer<typeof insertBlogPostCommentSchema>;

// Recovery University Curriculum (from The Ultimate Stroke Recovery Bible)
export const curriculumParts = pgTable("curriculum_parts", {
  id: serial("id").primaryKey(),
  partNumber: integer("part_number").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  iconName: text("icon_name"),
  order: integer("order").notNull(),
  requiredTier: text("required_tier").notNull().default("explorer"), // explorer, warrior, champion, platinum
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const curriculumChapters = pgTable("curriculum_chapters", {
  id: serial("id").primaryKey(),
  partId: integer("part_id").notNull().references(() => curriculumParts.id, { onDelete: "cascade" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"), // Full chapter content
  videoUrl: text("video_url"), // AI-generated or uploaded video
  audioUrl: text("audio_url"), // Audio narration
  estimatedMinutes: integer("estimated_minutes"),
  keyTakeaways: text("key_takeaways").array(),
  exercises: jsonb("exercises"), // Interactive exercises
  requiredTier: text("required_tier").notNull().default("warrior"),
  order: integer("order").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userCurriculumProgress = pgTable("user_curriculum_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").notNull().references(() => curriculumChapters.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  progressPercentage: integer("progress_percentage").notNull().default(0),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCurriculumPartSchema = createInsertSchema(curriculumParts).omit({
  id: true,
  createdAt: true,
});

export const insertCurriculumChapterSchema = createInsertSchema(curriculumChapters).omit({
  id: true,
  createdAt: true,
});

export const insertUserCurriculumProgressSchema = createInsertSchema(userCurriculumProgress).omit({
  id: true,
  createdAt: true,
});

// AI Video Content
export const aiGeneratedVideos = pgTable("ai_generated_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  contentType: text("content_type").notNull(), // chapter_intro, exercise_demo, motivation, celebration
  contentId: integer("content_id"), // Reference to chapter or exercise
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  cost: integer("cost"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAiGeneratedVideoSchema = createInsertSchema(aiGeneratedVideos).omit({
  id: true,
  createdAt: true,
});

// Curriculum Types
export type CurriculumPart = typeof curriculumParts.$inferSelect;
export type InsertCurriculumPart = z.infer<typeof insertCurriculumPartSchema>;
export type CurriculumChapter = typeof curriculumChapters.$inferSelect;
export type InsertCurriculumChapter = z.infer<typeof insertCurriculumChapterSchema>;
export type UserCurriculumProgress = typeof userCurriculumProgress.$inferSelect;
export type InsertUserCurriculumProgress = z.infer<typeof insertUserCurriculumProgressSchema>;

// AI Video Types
export type AiGeneratedVideo = typeof aiGeneratedVideos.$inferSelect;
export type InsertAiGeneratedVideo = z.infer<typeof insertAiGeneratedVideoSchema>;

// ============================================================================
// STROKE LYFE MUSIC STUDIO
// ============================================================================

export const musicProjects = pgTable("music_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  genre: text("genre").notNull(), // rap, pop, country, metal, rock, punk, edm, ambient
  subGenre: text("sub_genre"),
  bpm: integer("bpm").notNull().default(120),
  key: text("key").notNull().default("C"),
  scale: text("scale").notNull().default("major"), // major, minor, pentatonic, etc.
  description: text("description"),
  coverArtUrl: text("cover_art_url"),
  status: text("status").notNull().default("draft"), // draft, mixing, mastering, completed
  isPublished: boolean("is_published").notNull().default(false),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const musicStems = pgTable("music_stems", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // drums, bass, guitar, synth, vocals, etc.
  stemType: text("stem_type").notNull(), // instrumental, vocal, ai_generated, sample, recorded
  sourceModel: text("source_model"), // lyria, tonej, user_upload
  audioUrl: text("audio_url"),
  waveformData: jsonb("waveform_data"), // for visualization
  volume: integer("volume").notNull().default(80), // 0-100
  pan: integer("pan").notNull().default(50), // 0-100, 50 = center
  muted: boolean("muted").notNull().default(false),
  solo: boolean("solo").notNull().default(false),
  effects: jsonb("effects"), // reverb, delay, eq settings
  startTime: integer("start_time").notNull().default(0), // ms offset
  duration: integer("duration"), // in ms
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const musicLyrics = pgTable("music_lyrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  content: text("content").notNull(),
  structure: jsonb("structure"), // verse, chorus, bridge markers with timestamps
  aiGenerated: boolean("ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vocalRenders = pgTable("vocal_renders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  lyricsId: integer("lyrics_id").references(() => musicLyrics.id),
  singerProfile: text("singer_profile").notNull(), // voice type/character
  language: text("language").notNull().default("en"),
  audioUrl: text("audio_url"),
  phonemeMap: jsonb("phoneme_map"), // timing data for lip sync
  style: text("style"), // rap, sing, scream, whisper
  pitch: integer("pitch").notNull().default(0), // -12 to +12 semitones
  status: text("status").notNull().default("pending"), // pending, rendering, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mixSessions = pgTable("mix_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  masterVolume: integer("master_volume").notNull().default(80),
  masterEffects: jsonb("master_effects"), // master chain: compressor, limiter, eq
  automationCurves: jsonb("automation_curves"), // volume/pan automation over time
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const musicExports = pgTable("music_exports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  mixSessionId: integer("mix_session_id").references(() => mixSessions.id),
  format: text("format").notNull(), // wav, mp3, flac
  quality: text("quality").notNull(), // 320kbps, lossless, etc.
  audioUrl: text("audio_url"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  fileSize: integer("file_size"), // in bytes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const musicVideos = pgTable("music_videos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  exportId: integer("export_id").references(() => musicExports.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style"), // cinematic, lyric_video, performance, abstract
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  beatMarkers: jsonb("beat_markers"), // sync points for audio-reactive visuals
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const aiMusicJobs = pgTable("ai_music_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => musicProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobType: text("job_type").notNull(), // instrumental, vocal, lyrics, video, mastering
  provider: text("provider").notNull(), // lyria, gemini, veo, openai
  prompt: text("prompt").notNull(),
  parameters: jsonb("parameters"), // genre, bpm, key, etc.
  resultUrl: text("result_url"),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  errorMessage: text("error_message"),
  cost: integer("cost"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertMusicProjectSchema = createInsertSchema(musicProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMusicStemSchema = createInsertSchema(musicStems).omit({
  id: true,
  createdAt: true,
});

export const insertMusicLyricsSchema = createInsertSchema(musicLyrics).omit({
  id: true,
  createdAt: true,
});

export const insertVocalRenderSchema = createInsertSchema(vocalRenders).omit({
  id: true,
  createdAt: true,
});

export const insertMixSessionSchema = createInsertSchema(mixSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMusicExportSchema = createInsertSchema(musicExports).omit({
  id: true,
  createdAt: true,
});

export const insertMusicVideoSchema = createInsertSchema(musicVideos).omit({
  id: true,
  createdAt: true,
});

export const insertAiMusicJobSchema = createInsertSchema(aiMusicJobs).omit({
  id: true,
  createdAt: true,
});

// Music Studio Types
export type MusicProject = typeof musicProjects.$inferSelect;
export type InsertMusicProject = z.infer<typeof insertMusicProjectSchema>;
export type MusicStem = typeof musicStems.$inferSelect;
export type InsertMusicStem = z.infer<typeof insertMusicStemSchema>;
export type MusicLyrics = typeof musicLyrics.$inferSelect;
export type InsertMusicLyrics = z.infer<typeof insertMusicLyricsSchema>;
export type VocalRender = typeof vocalRenders.$inferSelect;
export type InsertVocalRender = z.infer<typeof insertVocalRenderSchema>;
export type MixSession = typeof mixSessions.$inferSelect;
export type InsertMixSession = z.infer<typeof insertMixSessionSchema>;
export type MusicExport = typeof musicExports.$inferSelect;
export type InsertMusicExport = z.infer<typeof insertMusicExportSchema>;
export type MusicVideo = typeof musicVideos.$inferSelect;
export type InsertMusicVideo = z.infer<typeof insertMusicVideoSchema>;
export type AiMusicJob = typeof aiMusicJobs.$inferSelect;
export type InsertAiMusicJob = z.infer<typeof insertAiMusicJobSchema>;

// ============================================================================
// CREATOR EARNINGS & STRIPE CONNECT
// ============================================================================

export const creatorEarnings = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id"),
  productType: text("product_type").notNull(), // book, audiobook, course, music, video
  productId: integer("product_id").notNull(),
  productTitle: text("product_title").notNull(),
  saleAmount: integer("sale_amount").notNull(), // in cents (total sale price)
  platformFee: integer("platform_fee").notNull(), // in cents (15% platform cut)
  creatorShare: integer("creator_share").notNull(), // in cents (85% creator cut)
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, available, paid, failed
  stripeTransferId: text("stripe_transfer_id"),
  payoutId: integer("payout_id"),
  customerEmail: text("customer_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertCreatorEarningSchema = createInsertSchema(creatorEarnings).omit({
  id: true,
  createdAt: true,
});

export type CreatorEarning = typeof creatorEarnings.$inferSelect;
export type InsertCreatorEarning = z.infer<typeof insertCreatorEarningSchema>;

// ============================================================================
// BOOK MARKETPLACE - Lulu Print-on-Demand Integration
// ============================================================================

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  coverImageUrl: text("cover_image_url"),
  previewUrl: text("preview_url"),
  genre: text("genre").notNull(),
  tags: text("tags").array(),
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, published, suspended
  isFeatured: boolean("is_featured").notNull().default(false),
  isDigitalOnly: boolean("is_digital_only").notNull().default(false),
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // in cents
  averageRating: integer("average_rating"), // 1-50 (x10 for precision)
  reviewCount: integer("review_count").notNull().default(0),
  pageCount: integer("page_count"),
  wordCount: integer("word_count"),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  scheduledUnpublishAt: timestamp("scheduled_unpublish_at"),
  publishedAt: timestamp("published_at"),
  moderationStatus: text("moderation_status").notNull().default("pending"), // pending, approved, rejected, flagged
  moderatedAt: timestamp("moderated_at"),
  moderatedBy: integer("moderated_by"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CONTENT MODERATION SYSTEM
// ============================================================================

export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  reporterUserId: varchar("reporter_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), // inappropriate, copyright, spam, other
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
});

export const insertContentReportSchema = createInsertSchema(contentReports).omit({ id: true, createdAt: true, resolvedAt: true, resolvedBy: true });
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;

export const bookEditions = pgTable("book_editions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  editionType: text("edition_type").notNull(), // digital_ebook, digital_pdf, print_paperback, print_hardcover
  isActive: boolean("is_active").notNull().default(true),
  // Pricing
  price: integer("price").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  printCost: integer("print_cost"), // Lulu print cost in cents (null for digital)
  authorRoyalty: integer("author_royalty").notNull(), // author's cut in cents
  // Print specs (for physical books)
  trimSize: text("trim_size"), // 5x8, 5.5x8.5, 6x9, etc.
  paperType: text("paper_type"), // white, cream
  bindingType: text("binding_type"), // paperback, hardcover, case_laminate
  colorInterior: boolean("color_interior").notNull().default(false),
  luluPackageId: text("lulu_package_id"), // Lulu's product spec code
  luluProductId: text("lulu_product_id"), // Lulu's product ID once created
  // Digital files
  interiorPdfUrl: text("interior_pdf_url"),
  coverPdfUrl: text("cover_pdf_url"),
  epubUrl: text("epub_url"),
  // ISBN
  isbn: text("isbn"),
  isbn13: text("isbn13"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookOrders = pgTable("book_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "set null" }),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, processing, shipped, delivered, cancelled, refunded
  // Payment
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  subtotal: integer("subtotal").notNull(), // in cents
  shippingCost: integer("shipping_cost").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  currency: text("currency").notNull().default("USD"),
  // Shipping
  shippingMethod: text("shipping_method"), // ground, expedited, express
  shippingName: text("shipping_name"),
  shippingStreet1: text("shipping_street1"),
  shippingStreet2: text("shipping_street2"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostcode: text("shipping_postcode"),
  shippingCountry: text("shipping_country"),
  shippingPhone: text("shipping_phone"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  // Timestamps
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => bookOrders.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id),
  editionId: integer("edition_id").notNull().references(() => bookEditions.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // in cents
  printCost: integer("print_cost"), // null for digital
  authorRoyalty: integer("author_royalty").notNull(), // author's cut per unit
  subtotal: integer("subtotal").notNull(),
  // Digital delivery
  downloadUrl: text("download_url"),
  downloadExpiresAt: timestamp("download_expires_at"),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const luluPrintJobs = pgTable("lulu_print_jobs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => bookOrders.id, { onDelete: "cascade" }),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  luluOrderId: text("lulu_order_id"), // Lulu's order ID
  luluLineItemId: text("lulu_line_item_id"),
  status: text("status").notNull().default("pending"), // pending, submitted, accepted, in_production, shipped, delivered, cancelled, failed
  // Job details
  productId: text("product_id"),
  quantity: integer("quantity").notNull(),
  interiorSourceUrl: text("interior_source_url"),
  coverSourceUrl: text("cover_source_url"),
  // Shipping
  shippingLevel: text("shipping_level"), // GROUND, EXPEDITED, EXPRESS
  estimatedShipDate: timestamp("estimated_ship_date"),
  actualShipDate: timestamp("actual_ship_date"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  carrier: text("carrier"),
  // Cost
  productionCost: integer("production_cost"), // in cents
  shippingCost: integer("shipping_cost"), // in cents
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  lastWebhookAt: timestamp("last_webhook_at"),
  webhookPayload: jsonb("webhook_payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authorEarnings = pgTable("author_earnings", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => bookOrders.id, { onDelete: "cascade" }),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id),
  // Earnings breakdown
  saleAmount: integer("sale_amount").notNull(), // in cents
  printCost: integer("print_cost").notNull().default(0), // in cents
  platformFee: integer("platform_fee").notNull(), // in cents
  netEarnings: integer("net_earnings").notNull(), // in cents
  // Payout status
  status: text("status").notNull().default("pending"), // pending, available, paid, held
  availableAt: timestamp("available_at"), // when earnings become available (after refund window)
  paidAt: timestamp("paid_at"),
  payoutId: integer("payout_id").references(() => creatorPayouts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookReviews = pgTable("book_reviews", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => bookOrders.id, { onDelete: "set null" }), // verified purchase
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AI Provider Usage Tracking
export const aiProviderUsage = pgTable("ai_provider_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // gemini, openai, anthropic, xai, perplexity
  model: text("model").notNull(),
  operation: text("operation").notNull(), // text_generation, image_generation, music_generation, etc.
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costCents: integer("cost_cents").notNull().default(0), // in cents
  cached: boolean("cached").notNull().default(false),
  requestId: text("request_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas for marketplace
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSales: true,
  totalRevenue: true,
  averageRating: true,
  reviewCount: true,
});

export const insertBookEditionSchema = createInsertSchema(bookEditions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookOrderSchema = createInsertSchema(bookOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
  downloadCount: true,
});

export const insertLuluPrintJobSchema = createInsertSchema(luluPrintJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  retryCount: true,
});

export const insertAuthorEarningsSchema = createInsertSchema(authorEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertBookReviewSchema = createInsertSchema(bookReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
});

export const insertAiProviderUsageSchema = createInsertSchema(aiProviderUsage).omit({
  id: true,
  createdAt: true,
});

// Marketplace Types
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type BookEdition = typeof bookEditions.$inferSelect;
export type InsertBookEdition = z.infer<typeof insertBookEditionSchema>;
export type BookOrder = typeof bookOrders.$inferSelect;
export type InsertBookOrder = z.infer<typeof insertBookOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type LuluPrintJob = typeof luluPrintJobs.$inferSelect;
export type InsertLuluPrintJob = z.infer<typeof insertLuluPrintJobSchema>;
export type AuthorEarnings = typeof authorEarnings.$inferSelect;
export type InsertAuthorEarnings = z.infer<typeof insertAuthorEarningsSchema>;
export type BookReview = typeof bookReviews.$inferSelect;
export type InsertBookReview = z.infer<typeof insertBookReviewSchema>;
export type AiProviderUsage = typeof aiProviderUsage.$inferSelect;
export type InsertAiProviderUsage = z.infer<typeof insertAiProviderUsageSchema>;

// ============================================================================
// CHILDREN'S BOOK CREATION SYSTEM
// ============================================================================

// Age band configuration for children's books
export const ageBandSchema = z.enum([
  "board-book",      // 0-3 years: 50-200 words, simple concepts
  "picture-book",    // 4-8 years: 500-1000 words, illustrated
  "early-reader",    // 5-7 years: 200-1500 words, simple sentences
  "chapter-book",    // 7-10 years: 4000-15000 words
  "middle-grade",    // 8-12 years: 20000-50000 words
]);

export type AgeBand = z.infer<typeof ageBandSchema>;

// Character definition for consistent illustrations
export const childBookCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  visualTraits: z.object({
    species: z.string(), // human, animal, fantasy creature
    age: z.string(),
    height: z.string(),
    bodyType: z.string(),
    skinTone: z.string().optional(),
    hairColor: z.string().optional(),
    hairStyle: z.string().optional(),
    eyeColor: z.string().optional(),
    clothingStyle: z.string(),
    distinctiveFeatures: z.array(z.string()),
  }),
  personalityTraits: z.array(z.string()),
  role: z.enum(["protagonist", "sidekick", "mentor", "antagonist", "supporting"]),
  illustrationPrompt: z.string(), // AI-generated consistent prompt
  colorPalette: z.array(z.string()), // Hex colors for this character
});

export type ChildBookCharacter = z.infer<typeof childBookCharacterSchema>;

// Page spread layout options
export const pageLayoutSchema = z.enum([
  "full-bleed-illustration",     // Full page image
  "illustration-left-text-right", // Split layout
  "illustration-right-text-left", // Split layout
  "text-over-illustration",       // Text overlays image
  "illustration-top-text-bottom", // Vertical split
  "text-top-illustration-bottom", // Vertical split
  "centered-vignette",           // Small centered illustration
  "spread-illustration",         // Illustration spans 2 pages
  "text-only",                   // Text page only
]);

export type PageLayout = z.infer<typeof pageLayoutSchema>;

// Single page spread in children's book
export const childBookSpreadSchema = z.object({
  id: z.string(),
  pageNumber: z.number(),
  layout: pageLayoutSchema,
  text: z.string(),
  readAloudText: z.string().optional(), // With phonetic hints
  syllableCount: z.number().optional(),
  rhymeScheme: z.string().optional(),
  illustrationPrompt: z.string(),
  illustrationUrl: z.string().optional(),
  characterIds: z.array(z.string()), // Characters appearing on this page
  emotionalTone: z.string().optional(), // happy, scary, mysterious, etc.
  actionDescription: z.string().optional(),
});

export type ChildBookSpread = z.infer<typeof childBookSpreadSchema>;

// Moral/theme options for children's books
export const childBookThemeSchema = z.enum([
  "friendship",
  "kindness",
  "courage",
  "honesty",
  "sharing",
  "perseverance",
  "self-confidence",
  "empathy",
  "family-love",
  "accepting-differences",
  "handling-emotions",
  "trying-new-things",
  "problem-solving",
  "environmental-care",
  "gratitude",
  "patience",
  "teamwork",
  "creativity",
  "dealing-with-loss",
  "overcoming-fear",
]);

export type ChildBookTheme = z.infer<typeof childBookThemeSchema>;

// Educational alignment tags
export const educationalTagSchema = z.enum([
  "social-emotional-learning",
  "early-literacy",
  "counting-numbers",
  "colors-shapes",
  "alphabet-phonics",
  "rhyming-patterns",
  "vocabulary-building",
  "science-nature",
  "cultural-awareness",
  "problem-solving-skills",
  "motor-skills",
  "sensory-exploration",
]);

export type EducationalTag = z.infer<typeof educationalTagSchema>;

// Illustration style presets
export const illustrationStyleSchema = z.enum([
  "whimsical-watercolor",
  "bold-cartoon",
  "soft-pastel",
  "digital-modern",
  "classic-storybook",
  "collage-mixed-media",
  "minimalist-nordic",
  "vibrant-tropical",
  "cozy-handdrawn",
  "retro-vintage",
  "anime-influenced",
  "realistic-detailed",
]);

export type IllustrationStyle = z.infer<typeof illustrationStyleSchema>;

// Complete children's book project
export const childBookProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  authorName: z.string(),
  illustratorName: z.string().optional(),
  ageBand: ageBandSchema,
  themes: z.array(childBookThemeSchema),
  educationalTags: z.array(educationalTagSchema),
  illustrationStyle: illustrationStyleSchema,
  storyPremise: z.string(),
  characters: z.array(childBookCharacterSchema),
  spreads: z.array(childBookSpreadSchema),
  rhymingMode: z.boolean(),
  targetWordCount: z.number(),
  trimSize: z.string(),
  colorPalette: z.array(z.string()),
  coverImageUrl: z.string().optional(),
  backCoverImageUrl: z.string().optional(),
  dedication: z.string().optional(),
  aboutAuthorPage: z.string().optional(),
});

export type ChildBookProject = z.infer<typeof childBookProjectSchema>;

// Request schemas for API endpoints
export const generateChildStoryRequestSchema = z.object({
  ageBand: ageBandSchema,
  themes: z.array(childBookThemeSchema),
  educationalTags: z.array(educationalTagSchema).optional(),
  mainCharacter: z.object({
    name: z.string(),
    species: z.string(),
    traits: z.array(z.string()),
  }),
  storyPremise: z.string(),
  rhymingMode: z.boolean().optional(),
  targetPageCount: z.number().optional(),
  illustrationStyle: illustrationStyleSchema.optional(),
});

export type GenerateChildStoryRequest = z.infer<typeof generateChildStoryRequestSchema>;

export const generateCharacterPromptRequestSchema = z.object({
  character: childBookCharacterSchema,
  illustrationStyle: illustrationStyleSchema,
  consistencySeed: z.string().optional(),
});

export type GenerateCharacterPromptRequest = z.infer<typeof generateCharacterPromptRequestSchema>;

export const generatePageIllustrationRequestSchema = z.object({
  spread: childBookSpreadSchema,
  characters: z.array(childBookCharacterSchema),
  illustrationStyle: illustrationStyleSchema,
  projectColorPalette: z.array(z.string()).optional(),
});

export type GeneratePageIllustrationRequest = z.infer<typeof generatePageIllustrationRequestSchema>;

// Rhyme conversion request schema
export const rhymeConvertRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  ageBand: ageBandSchema,
  rhymeScheme: z.enum(["AABB", "ABAB", "ABCB"]).optional().default("AABB"),
});

export type RhymeConvertRequest = z.infer<typeof rhymeConvertRequestSchema>;

// Read-aloud analysis request schema
export const readAloudAnalyzeRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  ageBand: ageBandSchema,
});

export type ReadAloudAnalyzeRequest = z.infer<typeof readAloudAnalyzeRequestSchema>;

// ============================================================================
// ULTRA-PREMIUM CREATOR GRAPH - Cross-Studio Orchestration
// ============================================================================

// Voice Cloning Library - Reusable cloned voices across all projects
export const voiceClones = pgTable("voice_clones", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  voiceType: text("voice_type").notNull(), // custom, celebrity_style, character
  gender: text("gender"), // male, female, neutral
  ageRange: text("age_range"), // child, teen, adult, senior
  accent: text("accent"), // american, british, australian, etc.
  sourceAudioUrl: text("source_audio_url"), // 10+ seconds of source audio
  voiceModelId: text("voice_model_id"), // Google TTS or cloned model ID
  previewAudioUrl: text("preview_audio_url"),
  styleSettings: jsonb("style_settings"), // pitch, rate, emotion presets
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  status: text("status").notNull().default("processing"), // processing, ready, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Movie Production Pipeline
export const movieProjects = pgTable("movie_projects", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  logline: text("logline"), // One-sentence summary
  synopsis: text("synopsis"),
  genre: text("genre").notNull(), // action, comedy, horror, romance, scifi, thriller
  targetDuration: integer("target_duration"), // minutes
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  style: text("style"), // cinematic, anime, realistic, noir, etc.
  coverImageUrl: text("cover_image_url"),
  trailerUrl: text("trailer_url"),
  status: text("status").notNull().default("development"), // development, pre_production, production, post_production, completed
  totalScenes: integer("total_scenes").notNull().default(0),
  completedScenes: integer("completed_scenes").notNull().default(0),
  estimatedCost: integer("estimated_cost"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Movie Characters with voice assignments
export const movieCharacters = pgTable("movie_characters", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movieProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(), // protagonist, antagonist, supporting, extra
  description: text("description"),
  appearance: text("appearance"), // Visual description for AI image generation
  personality: text("personality"),
  voiceCloneId: integer("voice_clone_id").references(() => voiceClones.id, { onDelete: "set null" }),
  voiceStyle: text("voice_style"), // hero, villain, sidekick, etc.
  referenceImageUrl: text("reference_image_url"),
  aiGeneratedImageUrl: text("ai_generated_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Movie Scenes with dialogue
export const movieScenes = pgTable("movie_scenes", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movieProjects.id, { onDelete: "cascade" }),
  sceneNumber: integer("scene_number").notNull(),
  title: text("title").notNull(),
  setting: text("setting").notNull(), // Location description
  timeOfDay: text("time_of_day"), // day, night, dawn, dusk
  mood: text("mood"), // tense, romantic, comedic, scary
  description: text("description"),
  cameraAngles: text("camera_angles").array(),
  duration: integer("duration"), // seconds
  status: text("status").notNull().default("scripted"), // scripted, storyboarded, rendering, completed
  // Generated assets
  storyboardUrls: text("storyboard_urls").array(),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Scene Dialogue with multi-character support
export const sceneDialogue = pgTable("scene_dialogue", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id").notNull().references(() => movieScenes.id, { onDelete: "cascade" }),
  characterId: integer("character_id").notNull().references(() => movieCharacters.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  dialogueText: text("dialogue_text").notNull(),
  emotion: text("emotion"), // angry, sad, happy, sarcastic, etc.
  direction: text("direction"), // Acting/delivery direction
  synthesizedAudioUrl: text("synthesized_audio_url"),
  duration: integer("duration"), // milliseconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audiobook Production System
export const audiobookProjects = pgTable("audiobook_projects", {
  id: serial("id").primaryKey(),
  sourceProjectId: integer("source_project_id").references(() => publishingProjects.id, { onDelete: "set null" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  narratorVoiceId: integer("narrator_voice_id").references(() => voiceClones.id, { onDelete: "set null" }),
  narratorName: text("narrator_name"),
  totalChapters: integer("total_chapters").notNull().default(0),
  completedChapters: integer("completed_chapters").notNull().default(0),
  totalDuration: integer("total_duration"), // seconds
  estimatedCost: integer("estimated_cost"), // in cents
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("setup"), // setup, narrating, mastering, completed
  // Mastering settings
  masteringPreset: text("mastering_preset"), // podcast, audiobook, broadcast
  noiseReduction: boolean("noise_reduction").notNull().default(true),
  loudnessNormalization: boolean("loudness_normalization").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audiobookChapters = pgTable("audiobook_chapters", {
  id: serial("id").primaryKey(),
  audiobookId: integer("audiobook_id").notNull().references(() => audiobookProjects.id, { onDelete: "cascade" }),
  sourceChapterId: integer("source_chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  textContent: text("text_content"),
  wordCount: integer("word_count"),
  estimatedDuration: integer("estimated_duration"), // seconds
  actualDuration: integer("actual_duration"), // seconds
  rawAudioUrl: text("raw_audio_url"),
  masteredAudioUrl: text("mastered_audio_url"),
  status: text("status").notNull().default("pending"), // pending, synthesizing, mastering, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// DJ/Mixing Studio Presets
export const djPresets = pgTable("dj_presets", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(), // eq, compressor, effects, mastering, scratch
  settings: jsonb("settings").notNull(), // Full preset configuration
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cross-Studio Workflow Orchestration
export const creatorWorkflows = pgTable("creator_workflows", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  workflowType: text("workflow_type").notNull(), // book_to_audiobook, book_to_course, movie_production, music_to_video
  status: text("status").notNull().default("active"), // active, paused, completed
  // Source references
  sourceType: text("source_type"), // publishing_project, music_project, movie_project
  sourceId: integer("source_id"),
  // Pipeline configuration
  steps: jsonb("steps").notNull(), // Array of workflow step definitions
  currentStepIndex: integer("current_step_index").notNull().default(0),
  completedSteps: integer("completed_steps").array(),
  // Output references
  outputs: jsonb("outputs"), // Map of output type to IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workflowJobs = pgTable("workflow_jobs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => creatorWorkflows.id, { onDelete: "cascade" }),
  stepIndex: integer("step_index").notNull(),
  jobType: text("job_type").notNull(), // ai_generation, tts_synthesis, video_render, export
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0), // 0-100
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Google Classroom Integration
export const classroomCourses = pgTable("classroom_courses", {
  id: serial("id").primaryKey(),
  creatorCourseId: integer("creator_course_id").notNull().references(() => creatorCourses.id, { onDelete: "cascade" }),
  googleCourseId: text("google_course_id").notNull(),
  googleCourseLink: text("google_course_link"),
  enrollmentCode: text("enrollment_code"),
  syncStatus: text("sync_status").notNull().default("pending"), // pending, synced, error
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const classroomAssignments = pgTable("classroom_assignments", {
  id: serial("id").primaryKey(),
  classroomCourseId: integer("classroom_course_id").notNull().references(() => classroomCourses.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").references(() => creatorCourseLessons.id, { onDelete: "set null" }),
  googleAssignmentId: text("google_assignment_id"),
  googleFormId: text("google_form_id"), // For quizzes
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  maxPoints: integer("max_points"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// MEDIA STUDIO - PROJECTS & ASSETS
// ============================================================================

export const mediaProjects = pgTable("media_projects", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("image"), // 'image' or 'video'
  projectData: jsonb("project_data"), // Full project state (layers, clips, etc.)
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // For video projects, in seconds
  width: integer("width"),
  height: integer("height"),
  status: text("status").notNull().default("draft"), // draft, rendering, completed
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => mediaProjects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'image', 'video', 'audio'
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // For video/audio
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMediaProjectSchema = createInsertSchema(mediaProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMediaProject = z.infer<typeof insertMediaProjectSchema>;
export type MediaProject = typeof mediaProjects.$inferSelect;

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true });
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;

// Insert schemas for ultra-premium features
export const insertVoiceCloneSchema = createInsertSchema(voiceClones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertMovieProjectSchema = createInsertSchema(movieProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalScenes: true,
  completedScenes: true,
});

export const insertMovieCharacterSchema = createInsertSchema(movieCharacters).omit({
  id: true,
  createdAt: true,
});

export const insertMovieSceneSchema = createInsertSchema(movieScenes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSceneDialogueSchema = createInsertSchema(sceneDialogue).omit({
  id: true,
  createdAt: true,
});

export const insertAudiobookProjectSchema = createInsertSchema(audiobookProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalChapters: true,
  completedChapters: true,
});

export const insertAudiobookChapterSchema = createInsertSchema(audiobookChapters).omit({
  id: true,
  createdAt: true,
});

export const insertDjPresetSchema = createInsertSchema(djPresets).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertCreatorWorkflowSchema = createInsertSchema(creatorWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentStepIndex: true,
});

export const insertWorkflowJobSchema = createInsertSchema(workflowJobs).omit({
  id: true,
  createdAt: true,
  progress: true,
});

export const insertClassroomCourseSchema = createInsertSchema(classroomCourses).omit({
  id: true,
  createdAt: true,
});

export const insertClassroomAssignmentSchema = createInsertSchema(classroomAssignments).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// CREDIT & BILLING SYSTEM - Enterprise Monetization
// ============================================================================

// Subscription tiers with feature limits (preserves existing columns + new billing columns)
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull().default(""),
  monthlyPrice: integer("monthly_price").notNull().default(0),
  annualPrice: integer("annual_price").notNull().default(0),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdAnnual: text("stripe_price_id_annual"),
  stripeProductId: text("stripe_product_id"),
  features: jsonb("features").notNull().default({}),
  limits: jsonb("limits").notNull().default({}),
  // New billing columns
  monthlyCredits: integer("monthly_credits").notNull().default(0),
  maxProjects: integer("max_projects"),
  maxStorageGb: integer("max_storage_gb"),
  maxTeamMembers: integer("max_team_members").default(1),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feature gates - defines what each tier can access
export const featureGates = pgTable("feature_gates", {
  id: serial("id").primaryKey(),
  featureKey: text("feature_key").notNull(),
  featureName: text("feature_name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  creditCost: integer("credit_cost").notNull().default(1),
  minTier: text("min_tier").notNull().default("free"),
  limitType: text("limit_type").notNull().default("per_use"),
  dailyLimit: integer("daily_limit"),
  monthlyLimit: integer("monthly_limit"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User credit wallets
export const creditWallets = pgTable("credit_wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  balance: integer("balance").notNull().default(0),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  lastRefillAt: timestamp("last_refill_at"),
  nextRefillAt: timestamp("next_refill_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Credit transactions ledger
export const creditLedger = pgTable("credit_ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionType: text("transaction_type").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  featureKey: text("feature_key"),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_credit_ledger_user").on(table.userId),
  index("idx_credit_ledger_created").on(table.createdAt),
]);

// Usage events for analytics
export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureKey: text("feature_key").notNull(),
  studioType: text("studio_type"),
  creditsCost: integer("credits_cost").notNull().default(0),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  durationMs: integer("duration_ms"),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_usage_events_user").on(table.userId),
  index("idx_usage_events_feature").on(table.featureKey),
  index("idx_usage_events_created").on(table.createdAt),
]);

// Credit packages for purchase
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  priceUsd: integer("price_usd").notNull(),
  stripePriceId: text("stripe_price_id"),
  bonusPercent: integer("bonus_percent").default(0),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// TEMPLATE LIBRARY SYSTEM
// ============================================================================

export const studioTemplates = pgTable("studio_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  studioType: text("studio_type").notNull(),
  category: text("category").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  templateData: jsonb("template_data").notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  isOfficial: boolean("is_official").notNull().default(false),
  creatorId: varchar("creator_id").references(() => users.id),
  usageCount: integer("usage_count").notNull().default(0),
  rating: integer("rating").default(0),
  tags: text("tags").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// VERSION HISTORY SYSTEM
// ============================================================================

export const projectVersions = pgTable("project_versions", {
  id: serial("id").primaryKey(),
  projectType: text("project_type").notNull(),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  snapshotData: jsonb("snapshot_data").notNull(),
  changeDescription: text("change_description"),
  isAutoSave: boolean("is_auto_save").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_project_versions_project").on(table.projectType, table.projectId),
]);

// ============================================================================
// WORKSPACES & COLLABORATION
// ============================================================================

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  description: text("description"),
  settings: jsonb("settings").default({}),
  tierId: integer("tier_id").references(() => subscriptionTiers.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  permissions: jsonb("permissions").default({}),
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const brandKits = pgTable("brand_kits", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  fonts: jsonb("fonts").default({}),
  logos: jsonb("logos").default([]),
  guidelines: text("guidelines"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// MARKETPLACE ENHANCEMENTS
// ============================================================================

export const creatorStorefronts = pgTable("creator_storefronts", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  tagline: text("tagline"),
  bio: text("bio"),
  bannerUrl: text("banner_url"),
  logoUrl: text("logo_url"),
  theme: jsonb("theme").default({}),
  socialLinks: jsonb("social_links").default({}),
  customDomain: text("custom_domain"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productBundles = pgTable("product_bundles", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  productIds: integer("product_ids").array().notNull(),
  originalPrice: integer("original_price").notNull(),
  bundlePrice: integer("bundle_price").notNull(),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").notNull().default(true),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id"),
  code: text("code").notNull().unique(),
  commissionPercent: integer("commission_percent").notNull().default(20),
  clickCount: integer("click_count").notNull().default(0),
  conversionCount: integer("conversion_count").notNull().default(0),
  totalEarnings: integer("total_earnings").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creatorAnalytics = pgTable("creator_analytics", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  views: integer("views").notNull().default(0),
  sales: integer("sales").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  newFollowers: integer("new_followers").notNull().default(0),
  productViews: jsonb("product_views").default({}),
  trafficSources: jsonb("traffic_sources").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_creator_analytics_date").on(table.creatorId, table.date),
]);

// ============================================================================
// CREATOR PROFILES & PUBLISHING PRESETS (Stickiness Features)
// ============================================================================

// Author profiles - reusable across books
export const authorProfiles = pgTable("author_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  penName: text("pen_name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  bio: text("bio"),
  shortBio: text("short_bio"),
  photoUrl: text("photo_url"),
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links").default({}),
  genres: text("genres").array(),
  otherBooks: jsonb("other_books").default([]),
  publisherInfo: jsonb("publisher_info").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Publishing presets - saved formatting settings
export const publishingPresets = pgTable("publishing_presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  presetType: text("preset_type").notNull().default("book"),
  isDefault: boolean("is_default").notNull().default(false),
  trimSize: text("trim_size"),
  paperType: text("paper_type"),
  fontFamily: text("font_family"),
  fontSize: integer("font_size"),
  lineSpacing: real("line_spacing"),
  marginInside: real("margin_inside"),
  marginOutside: real("margin_outside"),
  marginTopBottom: real("margin_top_bottom"),
  hasBleed: boolean("has_bleed").default(false),
  includePageNumbers: boolean("include_page_numbers").default(true),
  includeHeaders: boolean("include_headers").default(true),
  chapterBreakStyle: text("chapter_break_style"),
  frontMatterDefaults: jsonb("front_matter_defaults").default({}),
  backMatterDefaults: jsonb("back_matter_defaults").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Course presets - saved course creation settings
export const coursePresets = pgTable("course_presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  lessonDuration: integer("lesson_duration"),
  quizSettings: jsonb("quiz_settings").default({}),
  certificateTemplate: text("certificate_template"),
  brandingColors: jsonb("branding_colors").default({}),
  introVideoTemplate: text("intro_video_template"),
  outroVideoTemplate: text("outro_video_template"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Saved cover designs - reusable covers and templates
export const savedCoverDesigns = pgTable("saved_cover_designs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  designData: jsonb("design_data").notNull(),
  designType: text("design_type").notNull().default("book_cover"),
  isTemplate: boolean("is_template").notNull().default(false),
  category: text("category"),
  tags: text("tags").array(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inspiration library - uploaded reference images
export const inspirationLibrary = pgTable("inspiration_library", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  title: text("title"),
  notes: text("notes"),
  category: text("category"),
  tags: text("tags").array(),
  colorPalette: jsonb("color_palette").default([]),
  styleAttributes: jsonb("style_attributes").default({}),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROJECT NOTES SYSTEM (Annotations for Book/Course Projects)
// ============================================================================

export const projectNotes = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  noteType: text("note_type").notNull().default("general"), // planning, research, revision, feedback, general
  content: text("content").notNull(),
  status: text("status").notNull().default("open"), // open, resolved, archived
  priority: text("priority").default("normal"), // low, normal, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_notes_project").on(table.projectId),
  index("idx_notes_chapter").on(table.chapterId),
]);

// ============================================================================
// DOCTRINE OUTLINES (Optional Structured Knowledge for Projects)
// ============================================================================

export const doctrineOutlines = pgTable("doctrine_outlines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const doctrineNodes = pgTable("doctrine_nodes", {
  id: serial("id").primaryKey(),
  outlineId: integer("outline_id").notNull().references(() => doctrineOutlines.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // Self-reference for tree structure
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content"),
  nodeType: text("node_type").notNull().default("topic"), // topic, concept, reference, quote, argument
  order: integer("order").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_doctrine_outline").on(table.outlineId),
  index("idx_doctrine_chapter").on(table.chapterId),
]);

// Insert schemas for Notes and Doctrine
export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export const insertDoctrineOutlineSchema = createInsertSchema(doctrineOutlines).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDoctrineNodeSchema = createInsertSchema(doctrineNodes).omit({ id: true, createdAt: true, updatedAt: true });

// Types for Notes and Doctrine
export type ProjectNote = typeof projectNotes.$inferSelect;
export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type DoctrineOutline = typeof doctrineOutlines.$inferSelect;
export type InsertDoctrineOutline = z.infer<typeof insertDoctrineOutlineSchema>;
export type DoctrineNode = typeof doctrineNodes.$inferSelect;
export type InsertDoctrineNode = z.infer<typeof insertDoctrineNodeSchema>;

// ============================================================================
// UNIFIED CONVERSATION SYSTEM (Cross-Studio AI Collaboration)
// ============================================================================

// Conversation sessions - persistent AI chats for all studios
export const conversationSessions = pgTable("conversation_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studio: text("studio").notNull(), // book, music, movie, course, video, doctrine
  title: text("title").notNull(),
  status: text("status").notNull().default("active"), // active, paused, completed, archived
  projectId: integer("project_id"), // Optional link to a project in that studio
  metadata: jsonb("metadata").default({}), // Studio-specific context (genre, style, etc.)
  systemPrompt: text("system_prompt"), // Custom system prompt for this session
  isShared: boolean("is_shared").notNull().default(false),
  sharedWith: text("shared_with").array(), // User IDs who can access
  sharePermission: text("share_permission").default("view"), // view, comment, edit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_conversation_user_studio").on(table.userId, table.studio),
]);

// Conversation messages - individual chat messages
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => conversationSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // text, audio, image, action
  attachments: jsonb("attachments").default([]), // Files, images, audio attached
  actionType: text("action_type"), // generate_song, create_scene, analyze, etc.
  actionPayload: jsonb("action_payload"), // Parameters for the action
  actionResult: jsonb("action_result"), // Result of the action (asset IDs, etc.)
  isStreaming: boolean("is_streaming").notNull().default(false),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_message_session").on(table.sessionId),
]);

// Conversation actions - queued generation jobs from conversations
export const conversationActions = pgTable("conversation_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => conversationSessions.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => conversationMessages.id),
  actionType: text("action_type").notNull(), // generate_song, create_scene, generate_cover, etc.
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  payload: jsonb("payload").notNull(), // Action parameters
  result: jsonb("result"), // Action result (asset IDs, URLs, etc.)
  error: text("error"),
  progress: integer("progress").default(0), // 0-100 progress percentage
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// ASSET REGISTRY (Cross-Studio Asset Sharing)
// ============================================================================

// Unified asset registry - all generated/uploaded assets across studios
export const assetRegistry = pgTable("asset_registry", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceStudio: text("source_studio").notNull(), // book, music, movie, video, image
  assetType: text("asset_type").notNull(), // audio, video, image, document, voice_clone
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"), // Storage URL
  thumbnailUrl: text("thumbnail_url"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  duration: integer("duration"), // For audio/video in seconds
  metadata: jsonb("metadata").default({}), // Type-specific metadata
  tags: text("tags").array(),
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0), // How many times used in projects
  sourceProjectId: integer("source_project_id"), // Original project that created this
  sourceConversationId: integer("source_conversation_id"), // Conversation that generated this
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_asset_user_type").on(table.userId, table.assetType),
  index("idx_asset_studio").on(table.sourceStudio),
]);

// ============================================================================
// STUDIO PIPELINES (Workflow Orchestration)
// ============================================================================

// Studio pipelines - sequences like Book→Course→Consultant
export const studioPipelines = pgTable("studio_pipelines", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pipelineType: text("pipeline_type").notNull(), // book_to_course, music_to_video, doctrine_to_consultant
  status: text("status").notNull().default("active"), // active, paused, completed
  currentStage: text("current_stage").notNull(), // Current stage in the pipeline
  stages: jsonb("stages").notNull(), // Array of stage definitions with status
  sourceAssetId: integer("source_asset_id"), // Original asset that started the pipeline
  outputAssetIds: integer("output_asset_ids").array(), // Assets generated by the pipeline
  metadata: jsonb("metadata").default({}),
  progress: integer("progress").notNull().default(0), // Overall progress 0-100
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AI Quality Tiers - Different quality levels with credit costs
export const aiQualityTiers = pgTable("ai_quality_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Draft, Standard, Premium, Ultra
  description: text("description").notNull(),
  creditCost: integer("credit_cost").notNull(), // 1, 3, 7, 15
  model: text("model").notNull(), // gemini-2.5-flash, gpt-5-mini, etc.
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(4096),
  promptModifiers: text("prompt_modifiers"), // Extra instructions for this tier
  sortOrder: integer("sort_order").notNull().default(0),
});

// AI Voice Presets - Different writing styles/voices
export const aiVoicePresets = pgTable("ai_voice_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Morgan Freeman, Shakespeare, Hemingway, etc.
  description: text("description").notNull(),
  category: text("category").notNull().default("narrative"), // narrative, educational, poetic, conversational
  systemInstructions: text("system_instructions").notNull(), // Detailed prompt for voice style
  exampleOutput: text("example_output"), // Sample of what this voice sounds like
  isBuiltIn: boolean("is_built_in").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  sortOrder: integer("sort_order").notNull().default(0),
});

// User AI Preferences - Saves user's preferred settings
export const userAiPreferences = pgTable("user_ai_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  preferredTierId: integer("preferred_tier_id").references(() => aiQualityTiers.id),
  preferredVoiceId: integer("preferred_voice_id").references(() => aiVoicePresets.id),
  customVoiceProfile: text("custom_voice_profile"), // User's custom voice description
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas for AI Quality System
export const insertAiQualityTierSchema = createInsertSchema(aiQualityTiers).omit({ id: true });
export const insertAiVoicePresetSchema = createInsertSchema(aiVoicePresets).omit({ id: true });
export const insertUserAiPreferencesSchema = createInsertSchema(userAiPreferences).omit({ id: true, updatedAt: true });

// Insert schemas for billing system
export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({ id: true, createdAt: true });
export const insertFeatureGateSchema = createInsertSchema(featureGates).omit({ id: true, createdAt: true });
export const insertCreditWalletSchema = createInsertSchema(creditWallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditLedgerSchema = createInsertSchema(creditLedger).omit({ id: true, createdAt: true });
export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({ id: true, createdAt: true });
export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({ id: true, createdAt: true });
export const insertStudioTemplateSchema = createInsertSchema(studioTemplates).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({ id: true, createdAt: true });
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({ id: true, joinedAt: true });
export const insertBrandKitSchema = createInsertSchema(brandKits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreatorStorefrontSchema = createInsertSchema(creatorStorefronts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export const insertProductBundleSchema = createInsertSchema(productBundles).omit({ id: true, createdAt: true, salesCount: true });
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({ id: true, createdAt: true, clickCount: true, conversionCount: true, totalEarnings: true });
export const insertCreatorAnalyticsSchema = createInsertSchema(creatorAnalytics).omit({ id: true, createdAt: true });
export const insertAuthorProfileSchema = createInsertSchema(authorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPublishingPresetSchema = createInsertSchema(publishingPresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCoursePresetSchema = createInsertSchema(coursePresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSavedCoverDesignSchema = createInsertSchema(savedCoverDesigns).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export const insertInspirationLibrarySchema = createInsertSchema(inspirationLibrary).omit({ id: true, createdAt: true });

// Conversation System Insert Schemas
export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({ id: true, createdAt: true });
export const insertConversationActionSchema = createInsertSchema(conversationActions).omit({ id: true, createdAt: true, startedAt: true, completedAt: true });

// Asset Registry Insert Schema
export const insertAssetRegistrySchema = createInsertSchema(assetRegistry).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });

// Studio Pipeline Insert Schema
export const insertStudioPipelineSchema = createInsertSchema(studioPipelines).omit({ id: true, createdAt: true, updatedAt: true });

// Ultra-Premium Types
export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertVoiceClone = z.infer<typeof insertVoiceCloneSchema>;
export type MovieProject = typeof movieProjects.$inferSelect;
export type InsertMovieProject = z.infer<typeof insertMovieProjectSchema>;
export type MovieCharacter = typeof movieCharacters.$inferSelect;
export type InsertMovieCharacter = z.infer<typeof insertMovieCharacterSchema>;
export type MovieScene = typeof movieScenes.$inferSelect;
export type InsertMovieScene = z.infer<typeof insertMovieSceneSchema>;
export type SceneDialogue = typeof sceneDialogue.$inferSelect;
export type InsertSceneDialogue = z.infer<typeof insertSceneDialogueSchema>;
export type AudiobookProject = typeof audiobookProjects.$inferSelect;
export type InsertAudiobookProject = z.infer<typeof insertAudiobookProjectSchema>;
export type AudiobookChapter = typeof audiobookChapters.$inferSelect;
export type InsertAudiobookChapter = z.infer<typeof insertAudiobookChapterSchema>;
export type DjPreset = typeof djPresets.$inferSelect;
export type InsertDjPreset = z.infer<typeof insertDjPresetSchema>;
export type CreatorWorkflow = typeof creatorWorkflows.$inferSelect;
export type InsertCreatorWorkflow = z.infer<typeof insertCreatorWorkflowSchema>;
export type WorkflowJob = typeof workflowJobs.$inferSelect;
export type InsertWorkflowJob = z.infer<typeof insertWorkflowJobSchema>;
export type ClassroomCourse = typeof classroomCourses.$inferSelect;
export type InsertClassroomCourse = z.infer<typeof insertClassroomCourseSchema>;
export type ClassroomAssignment = typeof classroomAssignments.$inferSelect;
export type InsertClassroomAssignment = z.infer<typeof insertClassroomAssignmentSchema>;

// Billing & Credits Types
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type FeatureGate = typeof featureGates.$inferSelect;
export type InsertFeatureGate = z.infer<typeof insertFeatureGateSchema>;
export type CreditWallet = typeof creditWallets.$inferSelect;
export type InsertCreditWallet = z.infer<typeof insertCreditWalletSchema>;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type InsertCreditLedgerEntry = z.infer<typeof insertCreditLedgerSchema>;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;

// Template Library Types
export type StudioTemplate = typeof studioTemplates.$inferSelect;
export type InsertStudioTemplate = z.infer<typeof insertStudioTemplateSchema>;

// Version History Types
export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;

// Workspace & Collaboration Types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type BrandKit = typeof brandKits.$inferSelect;
export type InsertBrandKit = z.infer<typeof insertBrandKitSchema>;

// Marketplace Types
export type CreatorStorefront = typeof creatorStorefronts.$inferSelect;
export type InsertCreatorStorefront = z.infer<typeof insertCreatorStorefrontSchema>;
export type ProductBundle = typeof productBundles.$inferSelect;
export type InsertProductBundle = z.infer<typeof insertProductBundleSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type CreatorAnalytics = typeof creatorAnalytics.$inferSelect;
export type InsertCreatorAnalytics = z.infer<typeof insertCreatorAnalyticsSchema>;

// Creator Profiles & Presets Types (Stickiness)
export type AuthorProfile = typeof authorProfiles.$inferSelect;
export type InsertAuthorProfile = z.infer<typeof insertAuthorProfileSchema>;
export type PublishingPreset = typeof publishingPresets.$inferSelect;
export type InsertPublishingPreset = z.infer<typeof insertPublishingPresetSchema>;
export type CoursePreset = typeof coursePresets.$inferSelect;
export type InsertCoursePreset = z.infer<typeof insertCoursePresetSchema>;
export type SavedCoverDesign = typeof savedCoverDesigns.$inferSelect;
export type InsertSavedCoverDesign = z.infer<typeof insertSavedCoverDesignSchema>;
export type InspirationItem = typeof inspirationLibrary.$inferSelect;
export type InsertInspirationItem = z.infer<typeof insertInspirationLibrarySchema>;

// Conversation System Types
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type ConversationAction = typeof conversationActions.$inferSelect;
export type InsertConversationAction = z.infer<typeof insertConversationActionSchema>;

// Asset Registry Types
export type Asset = typeof assetRegistry.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetRegistrySchema>;

// Studio Pipeline Types
export type StudioPipeline = typeof studioPipelines.$inferSelect;
export type InsertStudioPipeline = z.infer<typeof insertStudioPipelineSchema>;

// AI Quality System Types
export type AiQualityTier = typeof aiQualityTiers.$inferSelect;
export type InsertAiQualityTier = z.infer<typeof insertAiQualityTierSchema>;
export type AiVoicePreset = typeof aiVoicePresets.$inferSelect;
export type InsertAiVoicePreset = z.infer<typeof insertAiVoicePresetSchema>;
export type UserAiPreferences = typeof userAiPreferences.$inferSelect;
export type InsertUserAiPreferences = z.infer<typeof insertUserAiPreferencesSchema>;
