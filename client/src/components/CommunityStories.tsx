import TestimonialCard from "./TestimonialCard";
import { Badge } from "@/components/ui/badge";

export default function CommunityStories() {
  const testimonials = [
    {
      quote:
        "Nick's baseball bat therapy changed everything for me. When my therapists said I'd never regain arm function, his methods proved them wrong. I'm back to playing guitar after 2 years.",
      name: "Sarah Martinez",
      recovery: "2 Years Post-Stroke • 75% Recovery",
      initials: "SM",
    },
    {
      quote:
        "The mirror therapy protocol is genius. 20 minutes a day for 6 months and I went from no hand movement to typing emails. The medical system gave up on me, but Nick's methods didn't.",
      name: "James Chen",
      recovery: "3 Years Post-Stroke • 65% Recovery",
      initials: "JC",
    },
    {
      quote:
        "I was stuck at 30% recovery for 18 months. Nick's plateau-busting techniques and environmental variation broke through. Now I'm at 80% and still improving. The impossible became inevitable.",
      name: "Maria Rodriguez",
      recovery: "4 Years Post-Stroke • 80% Recovery",
      initials: "MR",
    },
  ];

  return (
    <section className="py-20 bg-card" id="community">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-community-category">
            SUCCESS STORIES
          </Badge>
          <h2 className="text-4xl font-bold mb-4" data-testid="text-community-title">
            The Recovery Revolution
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-community-subtitle">
            50,000+ stroke survivors refusing to accept limitations. Your recovery matters. Your story matters.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
