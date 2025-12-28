import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Badge
          variant="outline"
          className="mb-8 px-4 py-2 border-primary text-primary bg-primary/10 font-semibold tracking-wide uppercase"
          data-testid="badge-hero-tagline"
        >
          THE WORLD'S FIRST RECOVERY OPERATING SYSTEM
        </Badge>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-4 leading-tight tracking-tight"
          data-testid="text-hero-title"
        >
          <span className="block italic">REBUILD YOUR BODY,</span>
          <span className="block italic">BRAIN, AND BELIEF SYSTEM</span>
          <span className="block text-primary italic mt-2">— ONE REP AT A TIME.</span>
        </h1>

        <p
          className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          data-testid="text-hero-subtitle"
        >
          The world's first Recovery OS for Stroke Survivors, Caregivers, and Professionals.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Button
            size="lg"
            className="text-lg font-bold px-8"
            data-testid="button-start-comeback"
            onClick={() => window.location.href = '/api/login'}
          >
            START YOUR COMEBACK
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg font-bold px-8 border-muted-foreground/30 text-foreground hover:bg-white/5"
            data-testid="button-free-assessment"
            onClick={() => console.log("Free Builder Assessment clicked")}
          >
            FREE BUILDER ASSESSMENT
          </Button>
        </div>
      </div>
    </section>
  );
}
