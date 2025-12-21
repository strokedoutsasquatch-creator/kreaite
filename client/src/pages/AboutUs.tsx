import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Heart, 
  Target, 
  Users, 
  Zap, 
  Award, 
  BookOpen, 
  Brain, 
  Sparkles,
  Mail,
  ArrowRight,
  CheckCircle2,
  Star,
  Trophy
} from "lucide-react";

export default function AboutUs() {
  const values = [
    {
      icon: Heart,
      title: "Compassion First",
      description: "Every feature is built with empathy, understanding the daily challenges of stroke recovery."
    },
    {
      icon: Target,
      title: "Evidence-Based",
      description: "Our protocols combine personal recovery experience with modern neuroscience research."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "We believe in the power of shared experiences and mutual support among survivors."
    },
    {
      icon: Zap,
      title: "Relentless Progress",
      description: "Small wins compound. We celebrate every step forward on your recovery journey."
    }
  ];

  const timeline = [
    {
      year: "2019",
      title: "The Stroke",
      description: "Nick suffered a massive stroke that doctors said would leave him permanently disabled. Against all odds, he refused to accept that fate."
    },
    {
      year: "2020",
      title: "The Fight Begins",
      description: "Beginning with 0% mobility, Nick developed unconventional recovery protocols that defied medical expectations."
    },
    {
      year: "2022",
      title: "90% Recovery",
      description: "Through relentless dedication, Nick achieved 90% recovery - proving that the impossible is possible."
    },
    {
      year: "2024",
      title: "Stroke Recovery Academy",
      description: "Nick founded Stroke Recovery Academy to share his battle-tested methods with survivors worldwide."
    },
    {
      year: "2025",
      title: "KremersX Launch",
      description: "The full Recovery Operating System launches under parent company KremersX, reaching 50,000+ warriors."
    }
  ];

  const stats = [
    { value: "90%", label: "Nick's Recovery Rate" },
    { value: "50K+", label: "Community Members" },
    { value: "18", label: "Recovery Modules" },
    { value: "66", label: "Day Habit System" }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-primary text-primary" data-testid="badge-founder">
                <Star className="w-3 h-3 mr-1" />
                Founder's Story
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black mb-6" data-testid="heading-main">
                Meet Nick <span className="text-primary">"The Stroked Out Sasquatch"</span> Kremers
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed" data-testid="text-intro">
                When doctors said I'd never walk again, I didn't just prove them wrong - 
                I created a system to help thousands of stroke survivors reclaim their lives.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                From 0% to 90% recovery. From wheelchair to warrior. Now I'm sharing every 
                protocol, every exercise, every mindset shift that made my "impossible" recovery possible.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <Button size="lg" data-testid="button-start-journey">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/stories">
                  <Button variant="outline" size="lg" data-testid="button-read-stories">
                    Read Recovery Stories
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <Card className="overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <img 
                    src="/attached_assets/ss logo 2_1763787525258.png"
                    alt="The Stroked Out Sasquatch"
                    className="w-64 h-64 object-contain"
                    data-testid="img-nick-avatar"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold">Nick Kremers</h3>
                  <p className="text-muted-foreground">Stroke Survivor & Recovery Coach</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge>Stroke Survivor</Badge>
                    <Badge>Author</Badge>
                    <Badge>Coach</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-4xl md:text-5xl font-black text-primary mb-2" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground" data-testid={`stat-label-${index}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Trophy className="w-3 h-3 mr-1" />
              The Journey
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-timeline">
              From <span className="text-primary">0% to 90%</span> Recovery
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A timeline of defying the impossible and building something that changes lives.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div 
                  key={index} 
                  className={`relative flex flex-col md:flex-row gap-8 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                  data-testid={`timeline-item-${index}`}
                >
                  <div className="flex-1 md:text-right">
                    {index % 2 === 0 && (
                      <Card className="inline-block text-left">
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit mb-2">{item.year}</Badge>
                          <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  
                  <div className="flex-1 pl-12 md:pl-0">
                    {index % 2 !== 0 && (
                      <Card className="inline-block">
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit mb-2">{item.year}</Badge>
                          <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Our Mission
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-mission">
              REBUILD. REWIRE. <span className="text-primary">RISE.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stroke Recovery Academy exists for one purpose: to prove that your stroke is not your ending - 
              it's your beginning. We combine cutting-edge neuroscience with battle-tested recovery protocols 
              to help survivors exceed every limitation placed upon them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center" data-testid={`value-card-${index}`}>
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              The Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-platform">
              Your Complete <span className="text-primary">Recovery Operating System</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Recovery University", desc: "18 modules of battle-tested recovery protocols across three tiers." },
              { icon: Target, title: "66-Day Habit Tracker", desc: "Build lasting recovery habits with visual progress tracking." },
              { icon: Users, title: "Accountability Pods", desc: "Small group support with fellow warriors on the same journey." },
              { icon: Award, title: "Achievement System", desc: "Celebrate milestones with badges and shareable recovery cards." },
              { icon: Sparkles, title: "AI Sasquatch Coach", desc: "24/7 motivation and guidance from your AI recovery partner." },
              { icon: BookOpen, title: "Stroke Lyfe Publishing", desc: "Write and publish your own recovery story with AI assistance." }
            ].map((feature, index) => (
              <Card key={index} data-testid={`feature-card-${index}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Powered By</Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-kremersx">
              About <span className="text-primary">KremersX</span>
            </h2>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardContent className="py-8 text-center">
              <img 
                src="/attached_assets/Kremersx_1766356681995.png"
                alt="KremersX"
                className="h-32 mx-auto mb-6 object-contain rounded-lg"
                data-testid="img-kremersx-logo"
              />
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                KremersX is the parent company behind Stroke Recovery Academy, dedicated to 
                building transformative health and wellness platforms. Founded by Nick Kremers, 
                our mission is to leverage technology and lived experience to help people 
                overcome life's greatest challenges.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Stroke Recovery Academy
                </Badge>
                <Badge variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Stroke Lyfe Publishing
                </Badge>
                <Badge variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Recovery University
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6" data-testid="heading-cta">
            Ready to Start <span className="text-primary">Your Recovery?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join 50,000+ stroke warriors who are proving the impossible every single day.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button size="lg" data-testid="button-join-now">
                Join The Academy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" data-testid="button-contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            Questions? Email us at{" "}
            <a 
              href="mailto:info@strokerecoveryacademy.com" 
              className="text-primary hover:underline"
              data-testid="link-email"
            >
              info@strokerecoveryacademy.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}