import { Sparkles } from "lucide-react";

export default function RecoveryByDesign() {
  return (
    <section className="bg-card border-y border-border py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="absolute -left-2 top-0 w-1 h-full bg-primary" />
          <div className="absolute -right-2 top-0 w-2 h-2 bg-primary" />
          <div className="absolute -right-2 bottom-0 w-2 h-2 bg-primary" />
          <div className="absolute -left-2 bottom-0 w-2 h-2 bg-primary" />
          
          <div className="pl-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground uppercase tracking-wide">
                RECOVERY BY DESIGN, NOT BY CHANCE
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              This isn't therapy. It's a system. A blueprint manual for rebuilding everything from the ground up—movement, mindset, momentum. Built by a survivor who refused to settle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
