import { db } from "./db";
import { 
  recoveryPrograms, 
  programModules, 
  programLessons,
  recoveryHabits,
  recoveryMilestones 
} from "@shared/schema";
import { eq } from "drizzle-orm";

const programs = [
  {
    name: "Recovery University - Explorer",
    slug: "recovery-university-explorer",
    description: "For survivors just beginning their recovery journey. Focus on foundational movements, mindset, and building consistency.",
    tier: "explorer",
    difficulty: "beginner",
    estimatedWeeks: 12,
    moduleCount: 6,
    isActive: true,
  },
  {
    name: "Recovery University - Warrior",
    slug: "recovery-university-warrior",
    description: "For survivors ready to push boundaries. Advanced techniques, plateaus breakers, and intensive protocols.",
    tier: "warrior",
    difficulty: "intermediate",
    estimatedWeeks: 16,
    moduleCount: 6,
    isActive: true,
  },
  {
    name: "Recovery University - Champion",
    slug: "recovery-university-champion",
    description: "The ultimate recovery curriculum. Master-level techniques, leadership training, and helping others.",
    tier: "champion",
    difficulty: "advanced",
    estimatedWeeks: 24,
    moduleCount: 6,
    isActive: true,
  }
];

const explorerModules = [
  { title: "Enrollment Day", description: "Understanding your journey and building the foundation of hope", order: 1 },
  { title: "Brain Science Basics", description: "Your brain's incredible healing power and neuroplasticity", order: 2 },
  { title: "First Steps", description: "Small victories build big comebacks - foundational movements", order: 3 },
  { title: "Think-Twitch-Move", description: "The core progression from thought to movement", order: 4 },
  { title: "Mental Mastery", description: "Building unbreakable mental strength", order: 5 },
  { title: "Building Community", description: "Your support network and accountability", order: 6 },
];

const warriorModules = [
  { title: "The Plateau Wars", description: "When progress stops - breakthrough strategies", order: 1 },
  { title: "Drop Foot Mastery", description: "Conquering drop foot and reclaiming your stride", order: 2 },
  { title: "Arm & Hand Recovery", description: "The long road back - intensive protocols", order: 3 },
  { title: "Mirror Therapy Advanced", description: "Thinking movement into existence", order: 4 },
  { title: "Baseball Bat Method", description: "Nick's revolutionary training technique", order: 5 },
  { title: "66-Day Transformation", description: "Building lasting habits that stick", order: 6 },
];

const championModules = [
  { title: "Advanced Techniques", description: "Bioness, robotics, and cutting-edge recovery", order: 1 },
  { title: "Nutrition & Sleep", description: "Fueling brain recovery for maximum results", order: 2 },
  { title: "From Student to Teacher", description: "Teaching others and leaving your legacy", order: 3 },
  { title: "Creating Content", description: "Sharing your story to help others", order: 4 },
  { title: "Building StrokeLyfe", description: "Creating your empire of hope", order: 5 },
  { title: "Your Impossible Life", description: "Living proof that anything is possible", order: 6 },
];

const explorerLessons = [
  { title: "Welcome to Recovery University", lessonType: "video", estimatedMinutes: 15, content: "An introduction to your recovery journey with Nick. Learn what makes this program different and how to get the most out of your time here.", order: 1 },
  { title: "Your Recovery Roadmap", lessonType: "reading", estimatedMinutes: 10, content: "Understanding the phases of stroke recovery and setting realistic expectations for your journey ahead.", order: 2 },
  { title: "Setting Your First Goals", lessonType: "exercise", estimatedMinutes: 20, content: "A guided exercise to identify your top 3 recovery priorities and create actionable first steps.", order: 3 },
  { title: "The Survivor's Mindset", lessonType: "reflection", estimatedMinutes: 15, content: "Journaling prompts to explore your current mindset and begin shifting from victim to survivor to thriver.", order: 4 },
  { title: "Module 1 Assessment", lessonType: "quiz", estimatedMinutes: 10, content: "Test your understanding of the enrollment materials and your readiness to begin.", order: 5 },
];

const warriorLessons = [
  { title: "Understanding Plateaus", lessonType: "video", estimatedMinutes: 20, content: "Nick explains why plateaus happen and the science behind breakthrough moments in recovery.", order: 1 },
  { title: "The Plateau Busting Protocol", lessonType: "reading", estimatedMinutes: 15, content: "Learn the exact strategies Nick used to break through his own recovery plateaus.", order: 2 },
  { title: "Intensity Training Basics", lessonType: "exercise", estimatedMinutes: 25, content: "A guided workout designed to push past comfort zones safely and effectively.", order: 3 },
  { title: "Tracking Your Breakthroughs", lessonType: "reflection", estimatedMinutes: 10, content: "Document your plateau experiences and identify patterns that will help you push through.", order: 4 },
];

const championLessons = [
  { title: "The Future of Recovery", lessonType: "video", estimatedMinutes: 25, content: "Explore cutting-edge technologies and therapies that are revolutionizing stroke recovery.", order: 1 },
  { title: "Understanding Bioness & FES", lessonType: "reading", estimatedMinutes: 20, content: "A deep dive into functional electrical stimulation and how it can accelerate your recovery.", order: 2 },
  { title: "Robotics-Assisted Therapy", lessonType: "reading", estimatedMinutes: 15, content: "Learn about robotic therapy options and how to access them in your area.", order: 3 },
  { title: "Creating Your Advanced Protocol", lessonType: "exercise", estimatedMinutes: 30, content: "Design a personalized advanced recovery protocol incorporating multiple modalities.", order: 4 },
  { title: "Technology Assessment", lessonType: "quiz", estimatedMinutes: 15, content: "Test your understanding of advanced recovery technologies and their applications.", order: 5 },
];

const defaultHabits = [
  { name: "Morning Movement", description: "10+ minutes of any movement to start your day", category: "exercise", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Mirror Therapy Session", description: "15 minutes of mirror therapy for affected limbs", category: "therapy", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Mindful Breathing", description: "5 minutes of deep breathing and mental visualization", category: "mindfulness", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Gratitude Journal", description: "Write 3 things you're grateful for", category: "mindfulness", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Hand Exercises", description: "Open/close hand exercises to prevent contractures", category: "exercise", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Walking Practice", description: "Dedicated walking practice with proper form", category: "exercise", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Brain Training", description: "Cognitive exercises or puzzles", category: "therapy", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Hydration Check", description: "Drink 8+ glasses of water", category: "nutrition", frequency: "daily", targetDays: 66, isDefault: true },
];

const milestones = [
  { name: "First Twitch", description: "First voluntary muscle movement in affected limb", category: "physical", pointsAwarded: 100, order: 1 },
  { name: "Sitting Balance", description: "Able to sit unsupported for 30 seconds", category: "physical", pointsAwarded: 150, order: 2 },
  { name: "Standing Moment", description: "First time standing with assistance", category: "physical", pointsAwarded: 200, order: 3 },
  { name: "First Steps", description: "First unassisted steps", category: "physical", pointsAwarded: 500, order: 4 },
  { name: "Walking 100 Feet", description: "Walk 100 feet independently", category: "physical", pointsAwarded: 750, order: 5 },
  { name: "Grip Regained", description: "Able to grip and hold objects", category: "physical", pointsAwarded: 400, order: 6 },
  { name: "Drop Foot Conquered", description: "Walking without AFO brace", category: "physical", pointsAwarded: 1000, order: 7 },
  { name: "Hope Rekindled", description: "First moment of genuine hope for recovery", category: "emotional", pointsAwarded: 100, order: 1 },
  { name: "Plateau Breaker", description: "Pushed through a recovery plateau", category: "emotional", pointsAwarded: 300, order: 2 },
  { name: "Inspiration Shared", description: "Helped another survivor with advice or encouragement", category: "emotional", pointsAwarded: 250, order: 3 },
  { name: "7-Day Streak", description: "7 consecutive days of activity", category: "social", pointsAwarded: 100, order: 1 },
  { name: "30-Day Streak", description: "30 consecutive days of activity", category: "social", pointsAwarded: 500, order: 2 },
  { name: "66-Day Master", description: "Completed the 66-day habit challenge", category: "social", pointsAwarded: 1000, order: 3 },
  { name: "Words Returned", description: "Speaking full sentences clearly", category: "cognitive", pointsAwarded: 400, order: 1 },
  { name: "Memory Milestone", description: "Significant improvement in memory function", category: "cognitive", pointsAwarded: 300, order: 2 },
];

export interface SeedResult {
  programsCreated: number;
  modulesCreated: number;
  lessonsCreated: number;
  habitsCreated: number;
  milestonesCreated: number;
  skipped: string[];
}

export async function seedRecoveryData(): Promise<SeedResult> {
  const result: SeedResult = {
    programsCreated: 0,
    modulesCreated: 0,
    lessonsCreated: 0,
    habitsCreated: 0,
    milestonesCreated: 0,
    skipped: [],
  };

  const existingPrograms = await db.select().from(recoveryPrograms);
  if (existingPrograms.length > 0) {
    result.skipped.push("programs (already exist)");
  } else {
    for (const program of programs) {
      const [createdProgram] = await db.insert(recoveryPrograms).values(program).returning();
      result.programsCreated++;

      let modules: typeof explorerModules;
      let lessons: typeof explorerLessons;

      if (program.tier === "explorer") {
        modules = explorerModules;
        lessons = explorerLessons;
      } else if (program.tier === "warrior") {
        modules = warriorModules;
        lessons = warriorLessons;
      } else {
        modules = championModules;
        lessons = championLessons;
      }

      for (const module of modules) {
        const [createdModule] = await db.insert(programModules).values({
          programId: createdProgram.id,
          title: module.title,
          description: module.description,
          order: module.order,
          lessonCount: module.order === 1 ? lessons.length : 0,
          estimatedMinutes: module.order === 1 ? lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 0), 0) : 45,
        }).returning();
        result.modulesCreated++;

        if (module.order === 1) {
          for (const lesson of lessons) {
            await db.insert(programLessons).values({
              moduleId: createdModule.id,
              title: lesson.title,
              content: lesson.content,
              order: lesson.order,
              lessonType: lesson.lessonType,
              estimatedMinutes: lesson.estimatedMinutes,
            });
            result.lessonsCreated++;
          }
        }
      }
    }
  }

  const existingHabits = await db.select().from(recoveryHabits).where(eq(recoveryHabits.isDefault, true));
  if (existingHabits.length > 0) {
    result.skipped.push("habits (already exist)");
  } else {
    for (const habit of defaultHabits) {
      await db.insert(recoveryHabits).values(habit);
      result.habitsCreated++;
    }
  }

  const existingMilestones = await db.select().from(recoveryMilestones);
  if (existingMilestones.length > 0) {
    result.skipped.push("milestones (already exist)");
  } else {
    for (const milestone of milestones) {
      await db.insert(recoveryMilestones).values(milestone);
      result.milestonesCreated++;
    }
  }

  return result;
}
