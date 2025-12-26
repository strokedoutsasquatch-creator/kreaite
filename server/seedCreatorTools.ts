import { db } from "./db";
import { marketplaceCategories, marketplaceProducts } from "../shared/schema";

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
