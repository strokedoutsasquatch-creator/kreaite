import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { 
  Trophy, Heart, Brain, Users, Award, Share2, ArrowLeft, 
  Flame, Star, TrendingUp, Calendar, CheckCircle2, Lock
} from "lucide-react";
import { format } from "date-fns";

const categoryIcons: Record<string, any> = {
  physical: Trophy,
  emotional: Heart,
  cognitive: Brain,
  social: Users,
  streak: Flame,
};

const categoryColors: Record<string, string> = {
  physical: "text-green-400",
  emotional: "text-pink-400",
  cognitive: "text-blue-400",
  social: "text-purple-400",
  streak: "text-primary",
};

const categoryBgColors: Record<string, string> = {
  physical: "bg-green-500/20 border-green-500/40",
  emotional: "bg-pink-500/20 border-pink-500/40",
  cognitive: "bg-blue-500/20 border-blue-500/40",
  social: "bg-purple-500/20 border-purple-500/40",
  streak: "bg-primary/20 border",
};

const sasquatchQuotes = [
  "You're not just recovering. You're becoming unstoppable.",
  "Every badge earned is a battle won.",
  "Warriors don't quit. They adapt and conquer.",
  "This achievement is proof of your warrior spirit.",
  "The comeback is always stronger than the setback.",
];

export default function Achievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  const { data: achievements, isLoading: achievementsLoading } = useQuery<any[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: availableMilestones, isLoading: milestonesLoading } = useQuery<any[]>({
    queryKey: ["/api/achievements/available"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/achievements/stats"],
  });

  const checkStreaksMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/achievements/check-streaks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check achievements");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/stats"] });
      if (data.awarded && data.awarded.length > 0) {
        toast({ 
          title: "New Achievement Unlocked!", 
          description: `You earned: ${data.awarded.map((a: any) => a.name).join(", ")}` 
        });
      } else {
        toast({ 
          title: "Achievements Checked", 
          description: "No new achievements unlocked yet. Keep going!" 
        });
      }
    },
  });

  const handleShareClick = (achievement: any) => {
    setSelectedAchievement(achievement);
    setShareDialogOpen(true);
  };

  const getRandomQuote = () => sasquatchQuotes[Math.floor(Math.random() * sasquatchQuotes.length)];

  const earnedIds = new Set((achievements || []).map((a: any) => a.milestoneId));
  
  const filteredMilestones = (availableMilestones || []).filter((m: any) => {
    if (selectedCategory && m.category !== selectedCategory) return false;
    return true;
  });

  const upcomingMilestones = filteredMilestones.filter((m: any) => !earnedIds.has(m.id));
  const earnedMilestones = filteredMilestones.filter((m: any) => earnedIds.has(m.id));

  const isLoading = achievementsLoading || milestonesLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl" data-testid="loading-state">
          Loading achievements...
        </div>
      </div>
    );
  }

  const categories = ["physical", "emotional", "cognitive", "social", "streak"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 border-b border-gray-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/recovery">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="w-5 h-5" />
                <span className="font-bold" data-testid="text-current-streak">{stats?.currentStreak || 0} Day Streak</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => checkStreaksMutation.mutate()}
                disabled={checkStreaksMutation.isPending}
                data-testid="button-check-achievements"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Check Achievements
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-foreground mb-2" data-testid="heading-achievements">
            ACHIEVEMENTS & BADGES
          </h1>
          <p className="text-gray-400">Your recovery victories, earned one milestone at a time</p>
        </div>

        <Card className="bg-gray-900/50 border mb-8 p-6" data-testid="card-report">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Recovery Report Card
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-card rounded-lg border border-gray-800">
              <div className="text-3xl font-black text-primary" data-testid="stat-total-points">
                {stats?.totalPoints || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Points</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border border-gray-800">
              <div className="text-3xl font-black text-green-400" data-testid="stat-badges-earned">
                {stats?.badgesEarned || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Badges Earned</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border border-gray-800">
              <div className="text-3xl font-black text-yellow-400" data-testid="stat-current-streak">
                {stats?.currentStreak || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Current Streak</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border border-gray-800">
              <div className="text-3xl font-black text-blue-400" data-testid="stat-active-days">
                {stats?.totalActiveDays || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Days Active</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Category Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.slice(0, 4).map(cat => {
                const Icon = categoryIcons[cat];
                const earned = stats?.categoryStats?.[cat] || 0;
                const total = (availableMilestones || []).filter((m: any) => m.category === cat).length || 1;
                const percentage = Math.round((earned / total) * 100);
                return (
                  <div key={cat} className="p-3 bg-card/80 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${categoryColors[cat]}`} />
                      <span className="text-sm font-medium text-foreground capitalize">{cat}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">{earned}/{total} badges</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6" data-testid="category-filters">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-all"
          >
            All
          </Button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat];
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`filter-${cat}`}
              >
                <Icon className="w-4 h-4 mr-1" />
                <span className="capitalize">{cat}</span>
              </Button>
            );
          })}
        </div>

        {earnedMilestones.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Earned Badges ({earnedMilestones.length})
            </h2>
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              data-testid="grid-earned-achievements"
            >
              {achievements?.filter((a: any) => {
                if (selectedCategory && a.category !== selectedCategory) return false;
                return true;
              }).map((achievement: any) => {
                const Icon = categoryIcons[achievement.category] || Trophy;
                return (
                  <Card 
                    key={achievement.id}
                    className={`relative overflow-hidden bg-gray-900 border-2 ${categoryBgColors[achievement.category]} p-5 hover-elevate transition-all`}
                    data-testid={`card-achievement-${achievement.id}`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${categoryBgColors[achievement.category]}`}>
                        <Icon className={`w-6 h-6 ${categoryColors[achievement.category]}`} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShareClick(achievement)}
                        data-testid={`button-share-${achievement.id}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1">{achievement.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border">
                        +{achievement.pointsAwarded} pts
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(achievement.achievedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gray-400" />
            Upcoming Milestones ({upcomingMilestones.length})
          </h2>
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            data-testid="grid-upcoming-milestones"
          >
            {upcomingMilestones.map((milestone: any) => {
              const Icon = categoryIcons[milestone.category] || Trophy;
              return (
                <Card 
                  key={milestone.id}
                  className="relative overflow-hidden bg-gray-900/50 border border-gray-800 p-5 opacity-70"
                  data-testid={`card-milestone-${milestone.id}`}
                >
                  <div className="absolute top-3 right-3">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  
                  <div className="flex items-start mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-gray-500" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-300 mb-1">{milestone.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{milestone.description}</p>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-gray-500 border-gray-700">
                      +{milestone.pointsAwarded} pts
                    </Badge>
                    <span className="text-xs text-gray-600 capitalize">{milestone.category}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-background border border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Share Achievement</DialogTitle>
          </DialogHeader>
          
          {selectedAchievement && (
            <div 
              className="p-6 bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500/50 rounded-xl"
              data-testid="share-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl" />
              
              <div className="flex items-center justify-center mb-4">
                {(() => {
                  const Icon = categoryIcons[selectedAchievement.category] || Trophy;
                  return (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${categoryBgColors[selectedAchievement.category]} shadow-lg shadow-orange-500/20`}>
                      <Icon className={`w-8 h-8 ${categoryColors[selectedAchievement.category]}`} />
                    </div>
                  );
                })()}
              </div>

              <div className="text-center mb-4">
                <h3 className="text-xl font-black text-foreground mb-1">{selectedAchievement.name}</h3>
                <p className="text-sm text-gray-400">{selectedAchievement.description}</p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge variant="outline" className="text-primary border">
                  +{selectedAchievement.pointsAwarded} points
                </Badge>
                <span className="text-xs text-gray-500">
                  {format(new Date(selectedAchievement.achievedAt), "MMMM d, yyyy")}
                </span>
              </div>

              <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <p className="text-sm text-orange-300 italic">"{getRandomQuote()}"</p>
                <p className="text-xs text-gray-500 mt-1">— Sasquatch</p>
              </div>

              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Flame className="w-4 h-4 text-primary" />
                  <span>Stroke Recovery OS</span>
                </div>
                {user && (
                  <p className="text-xs text-gray-600 mt-1">
                    Earned by {user.firstName || "Warrior"}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShareDialogOpen(false)}
              data-testid="button-close-share"
            >
              Close
            </Button>
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                toast({ title: "Screenshot this card to share!", description: "Use your device's screenshot feature" });
              }}
              data-testid="button-screenshot-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Screenshot to Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
