import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Music, Film, Image, GraduationCap, Brain, 
  CreditCard, DollarSign, TrendingUp, BarChart3, 
  ShoppingBag, Users, Settings, Shield, Sparkles,
  FileText, Mic, Palette, Clock, ArrowRight, Plus,
  Loader2, Calendar, Zap, Target, Award, FolderOpen,
  Copy, Share2, Gift, UserPlus
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import CreatorHeader from "@/components/CreatorHeader";

interface CreditBalance {
  balance: number;
  bonusCredits: number;
  total: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

interface UserStats {
  projects: number;
  earnings: number;
  sales: number;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  trend,
  testId
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  testId?: string;
}) {
  const id = testId || `stat-${title.toLowerCase().replace(/\s/g, '-')}`;
  return (
    <Card data-testid={id}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" data-testid={`${id}-value`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudioCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  tags,
  color = "primary"
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  href: string;
  tags: string[];
  color?: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-base">{title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  testId
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  testId?: string;
}) {
  const id = testId || `action-${title.toLowerCase().replace(/\s/g, '-')}`;
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid={id}>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground truncate">{description}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const creditsQuery = useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
  });

  const subscriptionQuery = useQuery<{ tier: string; status: string; creditsRemaining: number }>({
    queryKey: ['/api/user/subscription'],
    enabled: !!user,
  });

  const usageQuery = useQuery<{ recent: Array<{ feature: string; credits: number; createdAt: string }> }>({
    queryKey: ['/api/credits/usage'],
    enabled: !!user,
  });

  const revenueQuery = useQuery<{ metrics: any; recentEvents: any[] }>({
    queryKey: ['/api/admin/revenue'],
    enabled: isAdmin,
  });

  const subscriptionMetricsQuery = useQuery<{ 
    activeSubscriptions: number; 
    newThisMonth: number; 
    churned: number; 
    byTier: Record<string, number>;
  }>({
    queryKey: ['/api/admin/subscriptions'],
    enabled: isAdmin,
  });

  const projectsQuery = useQuery<any[]>({
    queryKey: ['/api/book-projects'],
    enabled: !!user,
  });

  const earningsQuery = useQuery<{ 
    summary: { 
      totalSales: number; 
      totalCreatorShare: number; 
      totalPlatformFee: number;
      pendingBalance: number; 
      availableBalance: number;
      paidOut: number; 
      salesCount: number 
    } 
  }>({
    queryKey: ['/api/creator/earnings'],
    enabled: !!user,
  });

  const affiliateCodeQuery = useQuery<{ code: string; usageCount: number; totalEarnings: number }>({
    queryKey: ['/api/affiliate/code'],
    enabled: !!user,
  });

  const affiliateStatsQuery = useQuery<{
    totalReferrals: number;
    successfulConversions: number;
    pendingConversions: number;
    totalEarnings: number;
    recentReferrals: Array<{ createdAt: string; commission: number; status: string }>;
  }>({
    queryKey: ['/api/affiliate/stats'],
    enabled: !!user,
  });

  const { toast } = useToast();

  const copyReferralLink = () => {
    const code = affiliateCodeQuery.data?.code;
    if (code) {
      const link = `${window.location.origin}?ref=${code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copied!",
        description: "Share it to earn free credits when others sign up.",
      });
    }
  };

  const formatCurrency = (amount: number, fromCents = false) => {
    const dollars = fromCents ? amount / 100 : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars);
  };

  const totalCredits = (creditsQuery.data?.balance || 0) + (creditsQuery.data?.bonusCredits || 0);

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dashboard-title">
            Welcome back, {user?.firstName || 'Creator'}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-dashboard-subtitle">
            Your creative command center for everything on KreAIte
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList data-testid="dashboard-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="studios" data-testid="tab-studios">Studios</TabsTrigger>
            <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings</TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" data-testid="tab-admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Credit Balance"
                value={creditsQuery.isLoading ? '...' : totalCredits.toLocaleString()}
                icon={CreditCard}
                subtitle={creditsQuery.data?.bonusCredits ? `+${creditsQuery.data.bonusCredits} bonus` : undefined}
                testId="stat-credit-balance"
              />
              <StatCard
                title="Projects"
                value={projectsQuery.isLoading ? '...' : (projectsQuery.data?.length ?? 0).toString()}
                icon={FolderOpen}
                subtitle="Book projects"
                testId="stat-projects-count"
              />
              <StatCard
                title="Credits Used"
                value={creditsQuery.isLoading ? '...' : (creditsQuery.data?.lifetimeSpent || 0).toLocaleString()}
                icon={Target}
                subtitle="All time"
                testId="stat-credits-used"
              />
              <StatCard
                title="Total Earnings"
                value={earningsQuery.isLoading ? '...' : formatCurrency(earningsQuery.data?.summary?.totalCreatorShare ?? 0, true)}
                icon={DollarSign}
                subtitle={earningsQuery.data?.summary?.salesCount ? `${earningsQuery.data.summary.salesCount} sales` : 'Start selling to earn'}
                testId="stat-total-earnings"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Quick Create
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <QuickActionCard
                      title="New Book Project"
                      description="Start writing with AI assistance"
                      icon={BookOpen}
                      href="/book-studio-v2"
                    />
                    <QuickActionCard
                      title="Generate Music"
                      description="Create beats and melodies"
                      icon={Music}
                      href="/music-studio"
                    />
                    <QuickActionCard
                      title="Create Images"
                      description="AI-powered image generation"
                      icon={Image}
                      href="/image-studio"
                    />
                    <QuickActionCard
                      title="Build Course"
                      description="Turn content into courses"
                      icon={GraduationCap}
                      href="/course-studio"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">The 6 Studios</CardTitle>
                      <Link href="/creator-hub">
                        <Button variant="ghost" size="sm">
                          View All <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Link href="/book-studio-v2">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid="link-book-studio">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Book Studio</span>
                      </div>
                    </Link>
                    <Link href="/video-studio">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid="link-video-studio">
                        <Film className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Video Studio</span>
                      </div>
                    </Link>
                    <Link href="/music-studio">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid="link-music-studio">
                        <Music className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Music Studio</span>
                      </div>
                    </Link>
                    <Link href="/course-studio">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid="link-course-studio">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Course Builder</span>
                      </div>
                    </Link>
                    <Link href="/image-studio">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid="link-image-studio">
                        <Image className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Image Studio</span>
                      </div>
                    </Link>
                    <Link href="/doctrine-engine">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border" data-testid="link-doctrine-engine">
                        <Brain className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Doctrine Engine</span>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageQuery.isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : usageQuery.data?.recent?.length ? (
                      <div className="space-y-3">
                        {usageQuery.data.recent.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground truncate flex-1">
                              {item.feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {item.credits} cr
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No recent activity
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/marketplace">
                      <div className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer" data-testid="link-marketplace">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Marketplace</span>
                      </div>
                    </Link>
                    <Link href="/quick-create">
                      <div className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer" data-testid="link-magic-tools">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Magic Tools</span>
                      </div>
                    </Link>
                    <Link href="/production-dashboard">
                      <div className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer" data-testid="link-production-hub">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Production Hub</span>
                      </div>
                    </Link>
                    <Link href="/settings">
                      <div className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer" data-testid="link-settings">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Settings</span>
                      </div>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin">
                        <div className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer" data-testid="link-admin-panel">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Admin Panel</span>
                        </div>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="studios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StudioCard
                title="Book Studio"
                description="Professional TipTap editor with AI ghostwriting, KDP publishing"
                icon={BookOpen}
                href="/book-studio-v2"
                tags={['AI Writing', 'KDP/Lulu', 'EPUB']}
              />
              <StudioCard
                title="Video Studio"
                description="Professional timeline editor with AI video generation"
                icon={Film}
                href="/video-studio"
                tags={['AI Video', 'Multi-track', 'Effects']}
              />
              <StudioCard
                title="Music Studio"
                description="AI music composition with Tone.js and loop libraries"
                icon={Music}
                href="/music-studio"
                tags={['Lyria AI', 'Mixing', 'Voice Clone']}
              />
              <StudioCard
                title="Course Builder"
                description="Create courses from books with video lessons and quizzes"
                icon={GraduationCap}
                href="/course-studio"
                tags={['Certificates', 'Quizzes', 'Video']}
              />
              <StudioCard
                title="Image Studio"
                description="Photoshop-like editor with layers, filters, AI generation"
                icon={Image}
                href="/image-studio"
                tags={['AI Gen', 'Remove.bg', 'Layers']}
              />
              <StudioCard
                title="Doctrine Engine"
                description="Knowledge base builder for structured content systems"
                icon={Brain}
                href="/doctrine-engine"
                tags={['Knowledge', 'Systems', 'Export']}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>More Tools</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <Link href="/media-studio">
                  <div className="text-center p-4 rounded-lg hover-elevate cursor-pointer border" data-testid="link-media-studio">
                    <Palette className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Media Studio</div>
                  </div>
                </Link>
                <Link href="/podcast-studio">
                  <div className="text-center p-4 rounded-lg hover-elevate cursor-pointer border" data-testid="link-podcast-studio">
                    <Mic className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Podcast Studio</div>
                  </div>
                </Link>
                <Link href="/script-studio">
                  <div className="text-center p-4 rounded-lg hover-elevate cursor-pointer border" data-testid="link-script-studio">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Script Studio</div>
                  </div>
                </Link>
                <Link href="/doc-hub">
                  <div className="text-center p-4 rounded-lg hover-elevate cursor-pointer border" data-testid="link-doc-hub">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Doc Hub</div>
                  </div>
                </Link>
                <Link href="/life-story">
                  <div className="text-center p-4 rounded-lg hover-elevate cursor-pointer border" data-testid="link-life-story">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Life Story</div>
                  </div>
                </Link>
                <Link href="/ai-consultant">
                  <div className="text-center p-4 rounded-lg hover-elevate cursor-pointer border" data-testid="link-ai-consultant">
                    <Brain className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">AI Consultant</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            {earningsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {!earningsQuery.data?.summary?.salesCount && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">Start Earning on KreAIte</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sell books, courses, and music on the marketplace. You keep 85% of every sale.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Earnings"
                    value={formatCurrency(earningsQuery.data?.summary?.totalCreatorShare ?? 0, true)}
                    icon={DollarSign}
                    subtitle="All time"
                    testId="stat-earnings-total"
                  />
                  <StatCard
                    title="Pending Payout"
                    value={formatCurrency(earningsQuery.data?.summary?.pendingBalance ?? 0, true)}
                    icon={Clock}
                    subtitle="Ready to withdraw"
                    testId="stat-pending-payout"
                  />
                  <StatCard
                    title="Paid Out"
                    value={formatCurrency(earningsQuery.data?.summary?.paidOut ?? 0, true)}
                    icon={CreditCard}
                    subtitle="Total withdrawn"
                    testId="stat-paid-out"
                  />
                  <StatCard
                    title="Total Sales"
                    value={(earningsQuery.data?.summary?.salesCount ?? 0).toString()}
                    icon={ShoppingBag}
                    subtitle="Products sold"
                    testId="stat-sales-count"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card data-testid="card-revenue-split">
                    <CardHeader>
                      <CardTitle>Revenue Split</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Your Share (85%)</span>
                            <span className="font-medium" data-testid="text-creator-share">
                              {formatCurrency(earningsQuery.data?.summary?.totalCreatorShare ?? 0, true)}
                            </span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Platform Fee (15%)</span>
                            <span className="text-muted-foreground" data-testid="text-platform-fee">
                              {formatCurrency(earningsQuery.data?.summary?.totalPlatformFee ?? 0, true)}
                            </span>
                          </div>
                          <Progress value={15} className="h-2" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        You keep 85% of every sale. Start selling in the marketplace to earn.
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-earnings-transactions">
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No transactions yet</p>
                        <Link href="/marketplace">
                          <Button variant="outline" size="sm" className="mt-4" data-testid="button-visit-marketplace">
                            Visit Marketplace
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Start Earning</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg" data-testid="card-sell-books">
                      <BookOpen className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">Sell Books</h3>
                      <p className="text-sm text-muted-foreground mb-3">Publish and sell your books on the marketplace</p>
                      <Link href="/book-studio-v2">
                        <Button variant="outline" size="sm" data-testid="button-create-book">Create Book</Button>
                      </Link>
                    </div>
                    <div className="p-4 border rounded-lg" data-testid="card-sell-courses">
                      <GraduationCap className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">Sell Courses</h3>
                      <p className="text-sm text-muted-foreground mb-3">Turn your knowledge into paid courses</p>
                      <Link href="/course-studio">
                        <Button variant="outline" size="sm" data-testid="button-build-course">Build Course</Button>
                      </Link>
                    </div>
                    <div className="p-4 border rounded-lg" data-testid="card-sell-music">
                      <Music className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">Sell Music</h3>
                      <p className="text-sm text-muted-foreground mb-3">License your beats and compositions</p>
                      <Link href="/music-studio">
                        <Button variant="outline" size="sm" data-testid="button-create-music">Create Music</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Referrals"
                value={affiliateStatsQuery.isLoading ? '...' : (affiliateStatsQuery.data?.totalReferrals ?? 0).toString()}
                icon={UserPlus}
                testId="stat-total-referrals"
              />
              <StatCard
                title="Successful Signups"
                value={affiliateStatsQuery.isLoading ? '...' : (affiliateStatsQuery.data?.successfulConversions ?? 0).toString()}
                icon={Users}
                testId="stat-successful-signups"
              />
              <StatCard
                title="Pending"
                value={affiliateStatsQuery.isLoading ? '...' : (affiliateStatsQuery.data?.pendingConversions ?? 0).toString()}
                icon={Clock}
                testId="stat-pending-referrals"
              />
              <StatCard
                title="Credits Earned"
                value={affiliateStatsQuery.isLoading ? '...' : (affiliateStatsQuery.data?.totalEarnings ?? 0).toLocaleString()}
                icon={Gift}
                subtitle="From referrals"
                testId="stat-referral-credits"
              />
            </div>

            <Card data-testid="card-referral-link">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share your unique link and earn 500 credits for every new user who signs up. 
                  They get 250 bonus credits too!
                </p>
                {affiliateCodeQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : affiliateCodeQuery.data?.code ? (
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}?ref=${affiliateCodeQuery.data.code}`}
                      className="font-mono text-sm"
                      data-testid="input-referral-link"
                    />
                    <Button onClick={copyReferralLink} data-testid="button-copy-referral">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Unable to load referral code
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="text-referrer-reward">500</div>
                    <div className="text-xs text-muted-foreground">Credits for You</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="text-referee-reward">250</div>
                    <div className="text-xs text-muted-foreground">Credits for Friend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="text-commission-rate">10%</div>
                    <div className="text-xs text-muted-foreground">Purchase Commission</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-how-it-works">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">1. Share Your Link</h3>
                    <p className="text-sm text-muted-foreground">
                      Copy your unique referral link and share it with friends, on social media, or in your content
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">2. Friend Signs Up</h3>
                    <p className="text-sm text-muted-foreground">
                      When someone clicks your link and creates an account, they become your referral
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">3. Both Get Rewarded</h3>
                    <p className="text-sm text-muted-foreground">
                      You get 500 credits instantly, plus 10% commission on their first purchase. They get 250 bonus credits!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(affiliateStatsQuery.data?.recentReferrals?.length ?? 0) > 0 && (
              <Card data-testid="card-recent-referrals">
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {affiliateStatsQuery.data?.recentReferrals?.slice(0, 5).map((ref, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4" data-testid={`row-referral-${idx}`}>
                        <div>
                          <div className="font-medium text-sm">New Signup</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ref.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={ref.status === 'pending' ? 'secondary' : 'default'}>
                            {ref.status}
                          </Badge>
                          {ref.commission > 0 && (
                            <span className="font-mono text-sm text-green-600" data-testid={`text-referral-commission-${idx}`}>
                              +{ref.commission} credits
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {revenueQuery.isLoading ? (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="h-24" />
                      </Card>
                    ))}
                  </>
                ) : revenueQuery.data?.metrics ? (
                  <>
                    <StatCard
                      title="Total Revenue"
                      value={formatCurrency(revenueQuery.data.metrics.totalRevenue ?? 0)}
                      icon={DollarSign}
                      testId="stat-admin-total-revenue"
                    />
                    <StatCard
                      title="MRR"
                      value={formatCurrency(revenueQuery.data.metrics.mrr ?? 0)}
                      icon={TrendingUp}
                      testId="stat-admin-mrr"
                    />
                    <StatCard
                      title="Platform Fees"
                      value={formatCurrency(revenueQuery.data.metrics.platformFees ?? 0)}
                      icon={BarChart3}
                      testId="stat-admin-platform-fees"
                    />
                    <StatCard
                      title="Transactions"
                      value={revenueQuery.data.metrics.transactionCount ?? 0}
                      icon={ShoppingBag}
                      testId="stat-admin-transactions"
                    />
                  </>
                ) : (
                  <div className="col-span-4 text-center py-8 text-muted-foreground">
                    Unable to load admin metrics
                  </div>
                )}
              </div>

              <Card data-testid="card-subscription-metrics">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Subscription Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionMetricsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : subscriptionMetricsQuery.data ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold" data-testid="text-active-subs">
                            {subscriptionMetricsQuery.data.activeSubscriptions}
                          </div>
                          <div className="text-xs text-muted-foreground">Active Subscribers</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600" data-testid="text-new-subs">
                            +{subscriptionMetricsQuery.data.newThisMonth}
                          </div>
                          <div className="text-xs text-muted-foreground">New This Month</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600" data-testid="text-churned-subs">
                            -{subscriptionMetricsQuery.data.churned}
                          </div>
                          <div className="text-xs text-muted-foreground">Churned</div>
                        </div>
                      </div>
                      {Object.keys(subscriptionMetricsQuery.data.byTier || {}).length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">By Tier</div>
                          <div className="space-y-2">
                            {Object.entries(subscriptionMetricsQuery.data.byTier).map(([tier, count]) => (
                              <div key={tier} className="flex items-center justify-between text-sm">
                                <span>{tier || 'Unknown'}</span>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No subscription data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Link href="/admin">
                  <Button data-testid="button-admin-panel">
                    <Shield className="h-4 w-4 mr-2" />
                    Full Admin Panel
                  </Button>
                </Link>
                <Link href="/moderation">
                  <Button variant="outline" data-testid="button-moderation">
                    <Users className="h-4 w-4 mr-2" />
                    Moderation
                  </Button>
                </Link>
              </div>

              {(revenueQuery.data?.recentEvents?.length ?? 0) > 0 && (
                <Card data-testid="card-admin-transactions">
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {revenueQuery.data?.recentEvents?.slice(0, 5).map((event: any, idx: number) => (
                        <div key={event.id} className="flex items-center justify-between p-4" data-testid={`row-transaction-${idx}`}>
                          <div>
                            <div className="font-medium text-sm">
                              {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="font-mono font-medium" data-testid={`text-transaction-amount-${idx}`}>
                            {formatCurrency(event.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
