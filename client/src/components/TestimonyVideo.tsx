import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import { useState } from "react";
import testimonyVideo from "@assets/Nick Testimony_1763787525256.mp4";
import videoPoster from "@assets/Nick king_1763787525256.png";

export default function TestimonyVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-testimony-category">
            NICK'S STORY
          </Badge>
          <h2 className="text-4xl font-bold mb-4" data-testid="text-testimony-title">
            From Paralyzed to Powerful
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-testimony-subtitle">
            Watch Nick's raw, unfiltered testimony of survival, struggle, and ultimate triumph
            over a massive hemorrhagic stroke.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              {!isPlaying && (
                <button 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors group w-full"
                  onClick={() => setIsPlaying(true)}
                  data-testid="button-play-video"
                  aria-label="Play testimony video"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-primary-foreground ml-1" />
                    </div>
                    <div className="text-white text-lg font-semibold">
                      Watch Nick's Testimony
                    </div>
                  </div>
                </button>
              )}
              <video
                controls
                className="w-full h-full object-contain"
                src={testimonyVideo}
                poster={videoPoster}
                data-testid="testimony-video"
                onPlay={() => setIsPlaying(true)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </Card>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center" data-testid="stat-card-staples">
              <div className="text-4xl font-black text-primary mb-2" data-testid="stat-value-staples">50</div>
              <div className="text-sm font-medium text-muted-foreground" data-testid="stat-label-staples">
                STAPLES IN SKULL
              </div>
            </Card>
            <Card className="p-6 text-center" data-testid="stat-card-recovery">
              <div className="text-4xl font-black text-primary mb-2" data-testid="stat-value-recovery">0%</div>
              <div className="text-sm font-medium text-muted-foreground" data-testid="stat-label-recovery">
                TO 90% RECOVERY
              </div>
            </Card>
            <Card className="p-6 text-center" data-testid="stat-card-years">
              <div className="text-4xl font-black text-primary mb-2" data-testid="stat-value-years">7+</div>
              <div className="text-sm font-medium text-muted-foreground" data-testid="stat-label-years">
                YEARS CONQUERING
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
