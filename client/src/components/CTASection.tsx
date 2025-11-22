import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent p-12">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Zap className="h-16 w-16 text-white mx-auto mb-6" />
            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-6 uppercase"
              data-testid="text-cta-title"
            >
              YOUR IMPOSSIBLE STARTS NOW
            </h2>
            <p
              className="text-xl text-white/90 mb-8 leading-relaxed"
              data-testid="text-cta-description"
            >
              Stop accepting limitations. Join 50,000+ survivors proving that extraordinary recovery
              is possible. Access the complete arsenal of breakthrough techniques that took me from
              0% to 90%.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="text-lg font-bold bg-white text-primary hover:bg-white/90 border-white"
                data-testid="button-cta-primary"
                onClick={() => console.log("Join The Revolution clicked")}
              >
                Join The Revolution
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg font-bold bg-transparent border-white text-white hover:bg-white/10"
                data-testid="button-cta-secondary"
                onClick={() => console.log("Access Free Resources clicked")}
              >
                Access Free Resources
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
