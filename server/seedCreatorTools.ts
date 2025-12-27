import { db } from "./db";
import { marketplaceCategories, marketplaceProducts, workflowCategories } from "../shared/schema";

export async function seedCreatorToolCategories() {
  try {
    const existingCategories = await db.select().from(marketplaceCategories);
    
    if (existingCategories.length > 0) {
      console.log("Creator tool categories already exist, skipping seed");
      return;
    }

    console.log("Seeding creator tool categories...");

    const categories = [
      {
        name: "Writing Tools",
        slug: "writing-tools",
        description: "Essential tools for authors and content writers",
        icon: "book-open",
        order: 1,
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Audio Production",
        slug: "audio-production",
        description: "Professional gear for music producers and podcasters",
        icon: "music",
        order: 2,
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Video Equipment",
        slug: "video-equipment",
        description: "Cameras, lighting, and gear for video creators",
        icon: "video",
        order: 3,
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Teaching & Courses",
        slug: "teaching-courses",
        description: "Tools for online educators and course creators",
        icon: "graduation-cap",
        order: 4,
        isFeatured: false,
        isActive: true,
      },
      {
        name: "Design & Art",
        slug: "design-art",
        description: "Tools for graphic designers and digital artists",
        icon: "palette",
        order: 5,
        isFeatured: false,
        isActive: true,
      },
      {
        name: "Home Studio Setup",
        slug: "home-studio",
        description: "Furniture and accessories for your creative workspace",
        icon: "home",
        order: 6,
        isFeatured: false,
        isActive: true,
      },
    ];

    for (const category of categories) {
      await db.insert(marketplaceCategories).values(category);
    }

    console.log("Successfully seeded", categories.length, "creator tool categories");
  } catch (error) {
    console.error("Error seeding creator tool categories:", error);
  }
}

export async function seedWorkflowCategories() {
  try {
    const existingCategories = await db.select().from(workflowCategories);
    
    if (existingCategories.length > 0) {
      console.log("Workflow categories already exist, skipping seed");
      return;
    }

    console.log("Seeding workflow categories...");

    const categories = [
      {
        name: "Book Writing",
        slug: "book-writing",
        description: "Automation workflows for authors and book creation",
        icon: "book-open",
        color: "#FF6B35",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "Music Production",
        slug: "music-production",
        description: "Workflows for music creation, mixing, and mastering",
        icon: "music",
        color: "#8B5CF6",
        displayOrder: 2,
        isActive: true,
      },
      {
        name: "Video Creation",
        slug: "video-creation",
        description: "Video editing, generation, and post-production workflows",
        icon: "video",
        color: "#EF4444",
        displayOrder: 3,
        isActive: true,
      },
      {
        name: "Course Building",
        slug: "course-building",
        description: "Workflows for creating online courses and educational content",
        icon: "graduation-cap",
        color: "#10B981",
        displayOrder: 4,
        isActive: true,
      },
      {
        name: "Image & Design",
        slug: "image-design",
        description: "Image generation, editing, and graphic design workflows",
        icon: "palette",
        color: "#F59E0B",
        displayOrder: 5,
        isActive: true,
      },
      {
        name: "Content Research",
        slug: "content-research",
        description: "Research, SEO, and content strategy workflows",
        icon: "search",
        color: "#3B82F6",
        displayOrder: 6,
        isActive: true,
      },
      {
        name: "Cross-Studio",
        slug: "cross-studio",
        description: "Multi-studio workflows that combine different content types",
        icon: "layers",
        color: "#EC4899",
        displayOrder: 7,
        isActive: true,
      },
      {
        name: "Publishing",
        slug: "publishing",
        description: "Workflows for publishing and distributing content",
        icon: "upload",
        color: "#6366F1",
        displayOrder: 8,
        isActive: true,
      },
    ];

    for (const category of categories) {
      await db.insert(workflowCategories).values(category);
    }

    console.log("Successfully seeded", categories.length, "workflow categories");
  } catch (error) {
    console.error("Error seeding workflow categories:", error);
  }
}
