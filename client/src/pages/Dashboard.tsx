import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, TrendingUp, Calendar, MessageCircle, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/attached_assets/ss logo 2_1763787525258.png"
                alt="Stroked Out Sasquatch"
                className="h-10 w-10 object-contain"
              />
              <div>
                <div className="text-lg font-black tracking-tight">STROKE RECOVERY ACADEMY</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium" data-testid="text-user-greeting">
                Welcome, {user?.firstName || user?.email || 'Warrior'}!
              </div>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-dashboard-title">
            Your Recovery Dashboard
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-dashboard-subtitle">
            Track your progress, access coaching, and connect with the community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 hover-elevate cursor-pointer" data-testid="card-ai-coach">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg">AI Coach</div>
                <div className="text-sm text-muted-foreground">Chat with Sasquatch</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" data-testid="card-courses">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg">Courses</div>
                <div className="text-sm text-muted-foreground">Interactive learning</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" data-testid="card-progress">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg">Progress</div>
                <div className="text-sm text-muted-foreground">Track recovery</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" data-testid="card-daily-log">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg">Daily Log</div>
                <div className="text-sm text-muted-foreground">Record today</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">COMING SOON</Badge>
            <h2 className="text-2xl font-bold mb-4">
              Your Personalized Recovery Journey Awaits
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We're building world-class AI coaching, interactive courses, community forums, 
              and progress tracking tools specifically designed for stroke recovery warriors like you.
            </p>
            <p className="text-sm text-muted-foreground">
              Stay tuned - these features are launching soon!
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
