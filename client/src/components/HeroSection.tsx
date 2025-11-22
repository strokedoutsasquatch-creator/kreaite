import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/nick_kremers_hero_portrait.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="mb-6 bg-background/20 backdrop-blur border-white/20 text-white"
            data-testid="badge-hero-stat"
          >
            50,000+ Survivors • 6 Years Proven • 90% Function Restored
          </Badge>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight uppercase tracking-tight"
            data-testid="text-hero-title"
          >
            IF THE SASQUATCH CAN DO IT,
            <span className="block text-primary">SO CAN YOU!</span>
          </h1>

          <p
            className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed font-medium"
            data-testid="text-hero-subtitle"
          >
            0% to 90% Recovery - Proven Methods from Someone Who Actually Lived It
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="text-lg font-bold"
              data-testid="button-access-guides"
              onClick={() => console.log("Access Recovery Guides clicked")}
            >
              Access Recovery Guides
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg font-bold bg-background/20 backdrop-blur border-white/30 text-white hover:bg-background/30"
              data-testid="button-watch-story"
              onClick={() => console.log("Watch Nick's Story clicked")}
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Nick&apos;s Story
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl">
            <div data-testid="stat-recovery">
              <div className="text-5xl font-extrabold text-primary">90%</div>
              <div className="text-sm font-medium text-white/80 uppercase tracking-wide mt-1">
                Recovery Achieved
              </div>
            </div>
            <div data-testid="stat-years">
              <div className="text-5xl font-extrabold text-accent">6</div>
              <div className="text-sm font-medium text-white/80 uppercase tracking-wide mt-1">
                Years Tested
              </div>
            </div>
            <div data-testid="stat-survivors">
              <div className="text-5xl font-extrabold text-secondary">50K+</div>
              <div className="text-sm font-medium text-white/80 uppercase tracking-wide mt-1">
                Survivors Helped
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
