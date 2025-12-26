import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, TrendingUp, Calendar, MessageCircle, BookOpen, Music, Film, Mic, Users, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import academyLogo from "@assets/academy_logo.png";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={academyLogo}
                alt="Stroke Recovery Academy"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                data-testid="img-dashboard-logo"
              />
              <div>
                <div className="text-sm sm:text-lg font-black tracking-tight">STROKE RECOVERY ACADEMY</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-sm font-medium" data-testid="text-user-greeting">
                Welcome, {user?.firstName || user?.email || 'Warrior'}!
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
                className="gap-1 sm:gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2" data-testid="text-dashboard-title">
            Your Recovery Dashboard
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground" data-testid="text-dashboard-subtitle">
            Track your progress, access coaching, and connect with the community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Link href="/music-studio">
            <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-music-studio">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg">Music Studio</div>
                  <div className="text-sm text-muted-foreground">Create AI music & voice</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">Lyria AI</Badge>
                <Badge variant="secondary" className="text-xs">Voice Clone</Badge>
                <Badge variant="secondary" className="text-xs">Movie Studio</Badge>
              </div>
            </Card>
          </Link>

          <Link href="/recovery-dashboard">
            <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-progress">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg">Recovery Dashboard</div>
                  <div className="text-sm text-muted-foreground">Track your progress</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">66-Day Tracker</Badge>
                <Badge variant="secondary" className="text-xs">Milestones</Badge>
              </div>
            </Card>
          </Link>

          <Link href="/publishing">
            <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-publishing">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg">Stroke Lyfe Publishing</div>
                  <div className="text-sm text-muted-foreground">Write your story</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">AI Ghostwriter</Badge>
                <Badge variant="secondary" className="text-xs">Course Builder</Badge>
              </div>
            </Card>
          </Link>

          <Link href="/community">
            <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-community">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg">Community</div>
                  <div className="text-sm text-muted-foreground">Connect with warriors</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">Forum</Badge>
                <Badge variant="secondary" className="text-xs">Pods</Badge>
              </div>
            </Card>
          </Link>

          <Link href="/marketplace">
            <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-marketplace">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg">Marketplace</div>
                  <div className="text-sm text-muted-foreground">Books, courses & gear</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">Recovery Guides</Badge>
                <Badge variant="secondary" className="text-xs">Coaching</Badge>
              </div>
            </Card>
          </Link>

          <Link href="/university">
            <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-university">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg">Recovery University</div>
                  <div className="text-sm text-muted-foreground">Structured curriculum</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">18 Modules</Badge>
                <Badge variant="secondary" className="text-xs">15+ Lessons</Badge>
              </div>
            </Card>
          </Link>
        </div>

        <Card className="p-4 sm:p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center">
            <Badge className="mb-3 sm:mb-4">AI CREATIVE STUDIO</Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Create Music, Clone Voices, Make Movies
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto">
              The most advanced AI creative suite for stroke recovery. Generate beats in any genre, 
              clone your voice, write songs, and create AI movies where you play hero and villain.
            </p>
            <Link href="/music-studio">
              <Button size="default" className="sm:h-11 sm:px-8" data-testid="button-go-to-studio">
                <Music className="h-5 w-5 mr-2" />
                Open Creative Studio
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
