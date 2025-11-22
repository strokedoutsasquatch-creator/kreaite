import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function ProgressTimeline() {
  const milestones = [
    {
      year: "Day 1",
      title: "December 3, 2018",
      description: "Massive hemorrhagic stroke. 50 staples. 0% left side function. Hoyer lift dependency.",
      percentage: 0,
    },
    {
      year: "Year 1",
      title: "The Foundation",
      description: "Learned basic transfers. Started mirror therapy. Discovered baseball bat method. Built mental resilience.",
      percentage: 15,
    },
    {
      year: "Year 2",
      title: "Breaking Through",
      description: "First independent steps. Hand opening protocols. Plateau-busting environmental variation techniques.",
      percentage: 35,
    },
    {
      year: "Year 3",
      title: "Accelerating",
      description: "Walking without AFO. Typing with both hands. Baseball bat mastery. Business launch preparation.",
      percentage: 55,
    },
    {
      year: "Year 4-6",
      title: "The Revolution",
      description: "Memory processing doubled. Advanced protocols refined. 50,000+ survivors helped. Business thriving.",
      percentage: 90,
    },
  ];

  return (
    <section className="py-20" id="journey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-timeline-category">
            THE IMPOSSIBLE JOURNEY
          </Badge>
          <h2 className="text-4xl font-bold mb-4" data-testid="text-timeline-title">
            From 0% to 90% Recovery
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-timeline-subtitle">
            Every breakthrough moment documented. Proof that recovery never stops with the right approach.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
                data-testid={`milestone-${index}`}
              >
                <div className="flex-1 hidden md:block" />
                
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary border-4 border-background flex items-center justify-center z-10">
                  <span className="text-lg font-black text-primary-foreground">
                    {milestone.percentage}%
                  </span>
                </div>

                <Card className="flex-1 p-6 ml-20 md:ml-0">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {milestone.year}
                      </Badge>
                      <h3 className="text-2xl font-bold mb-2">{milestone.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
