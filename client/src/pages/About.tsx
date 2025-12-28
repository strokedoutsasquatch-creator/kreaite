import { useEffect } from "react";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Heart, Target, Zap, Users } from "lucide-react";
import { Link } from "wouter";
import nickBeforeImage from "@assets/Nick crooked smile_1764268708613.jpg";
import nickTodayImage from "@assets/Nick_1764268830601.jpg";

export default function About() {
  useEffect(() => {
    document.title = "About Nick Kremers - From 0% to 90% Recovery | Stroke Recovery OS";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Nick Kremers' inspiring stroke recovery journey from 0% function to 90% recovery. Learn how the Stroke Recovery OS was born from his personal experience beating the odds.");
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Nick Kremers - 0% to 90% Stroke Recovery Story");
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", "When doctors said 'never,' Nick said 'watch me.' Discover the incredible journey from wheelchair to walking that inspired the Stroke Recovery OS.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main>
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-primary border-primary">
                The Story Behind the System
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="text-about-title">
                From 0% Function to{" "}
                <span className="text-primary">90% Recovery</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                When doctors said "never," Nick Kremers said "watch me." 
                This is the story of how one man's refusal to accept limitations 
                became a system that's helping stroke survivors everywhere.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="overflow-hidden border-2 border-muted">
                <div className="relative">
                  <img 
                    src={nickBeforeImage} 
                    alt="Nick during early recovery with walker" 
                    className="w-full h-auto object-contain"
                    data-testid="img-nick-before"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <Badge variant="secondary" className="mb-2">2018 - Early Recovery</Badge>
                    <p className="text-foreground text-sm">
                      Massive hemorrhagic stroke. Wheelchair. Walker. 
                      Doctors said I'd never walk again.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border-2 border-primary">
                <div className="relative">
                  <img 
                    src={nickTodayImage} 
                    alt="Nick today - recovered and thriving" 
                    className="w-full h-auto object-contain"
                    data-testid="img-nick-today"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <Badge className="mb-2 bg-primary text-primary-foreground">Today - 90% Recovery</Badge>
                    <p className="text-foreground text-sm">
                      Living proof that your greatest comeback 
                      starts with your greatest setback.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                The Journey
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-destructive">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">The Stroke</h3>
                    <p className="text-muted-foreground">
                      In 2018, a massive hemorrhagic stroke left me with 0% function on my left side. 
                      Doctors gave me the prognosis that included words like "never" and "can't." 
                      I was in a wheelchair, dependent on others for everything.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-yellow-500">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">The Decision</h3>
                    <p className="text-muted-foreground">
                      I decided that "never" was just another word for "I don't know how yet." 
                      I enrolled myself in what I call "Recovery University" - treating my rehabilitation 
                      like a PhD program where I was earning my degree in Proving the Impossible Possible.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">The System</h3>
                    <p className="text-muted-foreground">
                      Through years of therapy, experimentation, and relentless consistency, 
                      I developed the Kremers Recovery Formula: Take what the stroke gives you + 
                      Learn from therapists + Experiment + Apply to your own recovery. 
                      This became the foundation of the Stroke Recovery OS.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-500">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">The Recovery</h3>
                    <p className="text-muted-foreground">
                      Today, I've recovered approximately 90% of my function. I'm living proof 
                      that the brain's neuroplasticity is real, that consistency compounds, 
                      and that small victories build extraordinary comebacks. Now I'm sharing 
                      everything I learned so others can write their own comeback stories.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Core Principles
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <Card className="hover-elevate">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Think-Twitch-Move</h3>
                  <p className="text-sm text-muted-foreground">
                    Recovery starts in the mind. Think it, then twitch it, then move it.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Neuroplasticity</h3>
                  <p className="text-sm text-muted-foreground">
                    Your brain can rewire itself. Consistent practice creates new neural pathways.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Small Victories</h3>
                  <p className="text-sm text-muted-foreground">
                    Celebrate every win. Extraordinary comebacks are built from tiny improvements.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Community</h3>
                  <p className="text-sm text-muted-foreground">
                    You're not alone. Connect with survivors who understand the journey.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Ready to Start Your Comeback?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Your recovery story is waiting to be written. Join thousands of stroke survivors 
                who are proving the impossible possible, one rep at a time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/community">
                  <Button size="lg" className="gap-2" data-testid="button-join-community">
                    Join the Community
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" data-testid="button-explore">
                    Explore the Platform
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground italic mb-6">
                "Your greatest comeback starts with your greatest setback."
              </blockquote>
              <p className="text-primary font-semibold">— Nick Kremers, Founder</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
