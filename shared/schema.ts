import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, serial, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  status: text("status").notNull().default("pending"), // pending, processing, completed
  stripePayoutId: text("stripe_payout_id"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
