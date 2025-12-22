import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link } from "wouter";
import {
  Check,
  X,
  Zap,
  Shield,
  Crown,
  Sparkles,
  Brain,
  Users,
  BookOpen,
  MessageCircle,
  Video,
  Activity,
  Trophy,
  Clock,
  Dumbbell,
  Heart,
  Star,
} from "lucide-react";

const tiers = [
  {
    name: "explorer",
    displayName: "Explorer",
    description: "Start your recovery journey",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    popular: false,
    features: [
      { name: "Recovery University (3 modules)", included: true },
      { name: "AI Sasquatch Coach (5 msgs/day)", included: true },
      { name: "66-Day Habit Tracker", included: true },
      { name: "Community Forum Access", included: true },
      { name: "Recovery Dashboard", included: true },
      { name: "Write Recovery Stories", included: false },
      { name: "Accountability Pods", included: false },
      { name: "Survival Grid (16 protocols)", included: false },
      { name: "Direct Messaging", included: false },
      { name: "Wearable Integration", included: false },
      { name: "Video Telemedicine", included: false },
      { name: "Therapeutic Games", included: false },
      { name: "Stroke Lyfe Publishing", included: false },
    ],
    cta: "Start Free",
    ctaVariant: "outline" as const,
  },
  {
    name: "warrior",
    displayName: "Warrior",
    description: "For active self-recoverers",
    monthlyPrice: 1900,
    annualPrice: 14900,
    icon: Shield,
    popular: false,
    features: [
      { name: "Recovery University (All 18 modules)", included: true },
      { name: "AI Sasquatch Coach (Unlimited)", included: true },
      { name: "66-Day Habit Tracker", included: true },
      { name: "Community Forum Access", included: true },
      { name: "Recovery Dashboard", included: true },
      { name: "Write Recovery Stories", included: true },
      { name: "Accountability Pods", included: true },
      { name: "Survival Grid (16 protocols)", included: true },
      { name: "Direct Messaging", included: false },
      { name: "Wearable Integration", included: false },
      { name: "Video Telemedicine", included: false },
      { name: "Therapeutic Games", included: false },
      { name: "Stroke Lyfe Publishing", included: false },
    ],
    cta: "Get Warrior",
    ctaVariant: "default" as const,
  },
  {
    name: "champion",
    displayName: "Champion",
    description: "Full access for serious recovery",
    monthlyPrice: 4900,
    annualPrice: 39900,
    icon: Crown,
    popular: true,
    features: [
      { name: "Recovery University (All 18 modules)", included: true },
      { name: "AI Sasquatch Coach (Unlimited)", included: true },
      { name: "66-Day Habit Tracker", included: true },
      { name: "Community Forum Access", included: true },
      { name: "Recovery Dashboard", included: true },
      { name: "Write Recovery Stories", included: true },
      { name: "Accountability Pods", included: true },
      { name: "Survival Grid (16 protocols)", included: true },
      { name: "Direct Messaging", included: true },
      { name: "Wearable Integration", included: true },
      { name: "Video Telemedicine", included: true },
      { name: "Therapeutic Games", included: true },
      { name: "Stroke Lyfe Publishing", included: false },
    ],
    cta: "Get Champion",
    ctaVariant: "default" as const,
  },
  {
    name: "platinum",
    displayName: "Platinum",
    description: "Premium with coaching & publishing",
    monthlyPrice: 9900,
    annualPrice: 79900,
    icon: Sparkles,
    popular: false,
    features: [
      { name: "Recovery University (All 18 modules)", included: true },
      { name: "AI Sasquatch Coach (Unlimited)", included: true },
      { name: "66-Day Habit Tracker", included: true },
      { name: "Community Forum Access", included: true },
      { name: "Recovery Dashboard", included: true },
      { name: "Write Recovery Stories", included: true },
      { name: "Accountability Pods", included: true },
      { name: "Survival Grid (16 protocols)", included: true },
      { name: "Direct Messaging", included: true },
      { name: "Wearable Integration", included: true },
      { name: "Video Telemedicine", included: true },
      { name: "Therapeutic Games", included: true },
      { name: "Stroke Lyfe Publishing", included: true },
      { name: "1-on-1 Monthly Coaching Call", included: true },
      { name: "Priority Support", included: true },
    ],
    cta: "Get Platinum",
    ctaVariant: "default" as const,
  },
];

const highlights = [
  {
    icon: Brain,
    title: "AI-Powered Coaching",
    description: "24/7 access to the Sasquatch Coach powered by advanced AI",
  },
  {
    icon: BookOpen,
    title: "33 Chapter Curriculum",
    description: "Based on The Ultimate Stroke Recovery Bible",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Connect with thousands of fellow stroke survivors",
  },
  {
    icon: Activity,
    title: "Track Progress",
    description: "66-day habit tracker and comprehensive dashboards",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getAnnualSavings = (monthly: number, annual: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    const savings = ((monthlyTotal - annual) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4" data-testid="badge-recovery-university">
            <Trophy className="w-3 h-3 mr-1" />
            Recovery University
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6" data-testid="heading-pricing">
            Your <span className="text-primary">Ph.D.</span> in Proving the Impossible Possible
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-pricing-subtitle">
            Choose your path to extraordinary recovery. From free explorer access to premium platinum coaching.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <Label htmlFor="billing-toggle" className={!isAnnual ? "text-foreground" : "text-muted-foreground"}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              data-testid="switch-billing-toggle"
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? "text-foreground" : "text-muted-foreground"}>
              Annual
            </Label>
            {isAnnual && (
              <Badge variant="outline" className="text-primary border-primary" data-testid="badge-save-annual">
                Save up to 35%
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => {
              const TierIcon = tier.icon;
              const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
              const savings = getAnnualSavings(tier.monthlyPrice, tier.annualPrice);
              
              return (
                <Card 
                  key={tier.name} 
                  className={`relative flex flex-col ${tier.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
                  data-testid={`card-tier-${tier.name}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-4" data-testid="badge-most-popular">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <TierIcon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl" data-testid={`text-tier-name-${tier.name}`}>
                      {tier.displayName}
                    </CardTitle>
                    <CardDescription data-testid={`text-tier-description-${tier.name}`}>
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black" data-testid={`text-tier-price-${tier.name}`}>
                          {formatPrice(price)}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground">
                            /{isAnnual ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      {isAnnual && savings > 0 && (
                        <p className="text-sm text-primary mt-1" data-testid={`text-tier-savings-${tier.name}`}>
                          Save {savings}% vs monthly
                        </p>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <ul className="space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li 
                          key={featureIndex} 
                          className="flex items-start gap-2 text-sm"
                          data-testid={`feature-${tier.name}-${featureIndex}`}
                        >
                          {feature.included ? (
                            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                          )}
                          <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={tier.ctaVariant}
                      size="lg"
                      data-testid={`button-select-${tier.name}`}
                    >
                      {tier.cta}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="heading-why-choose">
            Why Choose <span className="text-primary">Stroke Recovery Academy</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => {
              const HighlightIcon = highlight.icon;
              return (
                <div 
                  key={index} 
                  className="text-center"
                  data-testid={`highlight-${index}`}
                >
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <HighlightIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{highlight.title}</h3>
                  <p className="text-sm text-muted-foreground">{highlight.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4" data-testid="heading-guarantee">
                90% Recovery Guarantee
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto" data-testid="text-guarantee">
                Nick went from 0% to 90% function. While everyone's journey is unique, 
                we're so confident in our system that we offer a 30-day money-back guarantee. 
                If you don't see improvement, we'll refund your subscription - no questions asked.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/about-us">
                  <Button variant="outline" size="lg" data-testid="button-read-story">
                    Read Nick's Story
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" data-testid="button-start-recovery">
                    Start Your Recovery
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6" data-testid="heading-questions">
            Questions? We're Here to Help
          </h2>
          <p className="text-muted-foreground mb-4">
            Contact us at{' '}
            <a 
              href="mailto:info@strokerecoveryacademy.com" 
              className="text-primary hover:underline"
              data-testid="link-email"
            >
              info@strokerecoveryacademy.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by KremersX
          </p>
        </div>
      </section>
    </div>
  );
}
