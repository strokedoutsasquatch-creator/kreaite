import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import CreatorVault from "@/components/CreatorVault";
import ResearchHub from "@/components/ResearchHub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coins, 
  Zap, 
  FlaskConical, 
  Vault, 
  Layers, 
  Grid3X3,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  BookOpen,
  Music,
  Video,
  Image,
  FileText,
  RefreshCw,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";

interface CreditBalance {
  balance: number;
  bonusCredits: number;
  total: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

interface BatchJob {
  id: string;
  name: string;
  type: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  itemsCompleted: number;
  totalItems: number;
  createdAt: string;
}

interface VaultEntry {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  thumbnail?: string;
}

function CreditWidget() {
  const { data: credits, isLoading, error } = useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
  });

  if (isLoading) {
    return (
      <Card className="bg-zinc-950 border-zinc-800" data-testid="card-credits-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (error || !credits) {
    return (
      <Card className="bg-zinc-950 border-zinc-800" data-testid="card-credits-error">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Coins className="h-4 w-4 text-orange-500" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">--</div>
          <p className="text-xs text-zinc-500">Unable to load balance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800" data-testid="card-credits">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Coins className="h-4 w-4 text-orange-500" />
          Credit Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl sm:text-4xl font-bold text-white" data-testid="text-credit-balance">
          {credits.total.toLocaleString()}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-500">{credits.balance.toLocaleString()} base</span>
          {credits.bonusCredits > 0 && (
            <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-500">
              +{credits.bonusCredits.toLocaleString()} bonus
            </Badge>
          )}
        </div>
        <Link href="/pricing">
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
            data-testid="button-buy-credits"
          >
            <Plus className="h-4 w-4 mr-1" />
            Buy Credits
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface BatchesResponse {
  batches: BatchJob[];
  count: number;
}

function ActiveJobsWidget() {
  const { data, isLoading, error } = useQuery<BatchesResponse>({
    queryKey: ['/api/production/batches'],
    refetchInterval: 5000,
  });
  
  const batches = data?.batches || [];

  const getStatusIcon = (status: BatchJob["status"]) => {
    switch (status) {
      case "processing":
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: BatchJob["status"]) => {
    const variants: Record<string, string> = {
      processing: "border-orange-500/50 text-orange-500 bg-orange-500/10",
      completed: "border-green-500/50 text-green-500 bg-green-500/10",
      failed: "border-red-500/50 text-red-500 bg-red-500/10",
      pending: "border-zinc-500/50 text-zinc-400 bg-zinc-500/10",
    };
    return variants[status] || variants.pending;
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-950 border-zinc-800" data-testid="card-jobs-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeJobs = batches.filter(b => b.status === "processing" || b.status === "pending");

  return (
    <Card className="bg-zinc-950 border-zinc-800" data-testid="card-active-jobs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" />
            Active Batch Jobs
          </CardTitle>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {activeJobs.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activeJobs.length === 0 ? (
          <div className="text-center py-6">
            <Layers className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No active batch jobs</p>
            <Link href="/batch-studio">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                data-testid="button-start-batch"
              >
                Start Batch Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.slice(0, 3).map((job) => (
              <div 
                key={job.id} 
                className="p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                data-testid={`job-item-${job.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="text-sm font-medium text-white truncate max-w-[150px]">
                      {job.name}
                    </span>
                  </div>
                  <Badge variant="outline" className={getStatusBadge(job.status)}>
                    {job.status}
                  </Badge>
                </div>
                <Progress value={job.progress} className="h-1.5 bg-zinc-800" />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-zinc-500">{job.type}</span>
                  <span className="text-xs text-zinc-500">
                    {job.itemsCompleted}/{job.totalItems} items
                  </span>
                </div>
              </div>
            ))}
            {activeJobs.length > 3 && (
              <Link href="/workflows">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-zinc-400 hover:text-white"
                  data-testid="button-view-all-jobs"
                >
                  View all {activeJobs.length} jobs
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentVaultWidget() {
  const { data: entries, isLoading } = useQuery<VaultEntry[]>({
    queryKey: ['/api/vault/entries', 5],
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "book":
        return <BookOpen className="h-4 w-4 text-orange-500" />;
      case "music":
        return <Music className="h-4 w-4 text-orange-500" />;
      case "video":
        return <Video className="h-4 w-4 text-orange-500" />;
      case "image":
        return <Image className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-orange-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-950 border-zinc-800" data-testid="card-vault-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800" data-testid="card-recent-vault">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Vault className="h-4 w-4 text-orange-500" />
          Recent Vault Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!entries || entries.length === 0 ? (
          <div className="text-center py-6">
            <Vault className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No vault entries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry) => (
              <div 
                key={entry.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                data-testid={`vault-entry-${entry.id}`}
              >
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                  {getTypeIcon(entry.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.title}</p>
                  <p className="text-xs text-zinc-500">{entry.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsWidget() {
  const quickActions = [
    { href: "/book-studio", label: "Write Book", icon: BookOpen, color: "text-orange-500" },
    { href: "/music-studio", label: "Create Music", icon: Music, color: "text-orange-500" },
    { href: "/video-studio", label: "Edit Video", icon: Video, color: "text-orange-500" },
    { href: "/image-studio", label: "Generate Image", icon: Image, color: "text-orange-500" },
  ];

  return (
    <Card className="bg-zinc-950 border-zinc-800" data-testid="card-quick-actions">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button 
                variant="outline" 
                className="w-full h-auto py-3 flex-col gap-1 border-zinc-800 hover:border-orange-500/50 hover:bg-orange-500/5"
                data-testid={`button-quick-${action.label.toLowerCase().replace(" ", "-")}`}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs text-zinc-300">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <CreditWidget />
        <QuickActionsWidget />
        <RecentVaultWidget />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ActiveJobsWidget />
        <Card className="bg-zinc-950 border-zinc-800" data-testid="card-stats">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Production Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-2xl font-bold text-white" data-testid="text-projects-count">0</p>
                <p className="text-xs text-zinc-500">Total Projects</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-2xl font-bold text-white" data-testid="text-published-count">0</p>
                <p className="text-xs text-zinc-500">Published</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-2xl font-bold text-white" data-testid="text-this-week">0</p>
                <p className="text-xs text-zinc-500">This Week</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-2xl font-bold text-white" data-testid="text-earnings">$0</p>
                <p className="text-xs text-zinc-500">Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResearchLabTab() {
  return <ResearchHub />;
}

function CreatorVaultTab() {
  return <CreatorVault />;
}

function BatchStudioTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
        <Layers className="h-8 w-8 text-orange-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-batch-title">
        Batch Studio
      </h3>
      <p className="text-zinc-400 text-center max-w-md mb-6" data-testid="text-batch-description">
        Process multiple content pieces at once. Batch generate images, convert formats, 
        and automate repetitive creative tasks.
      </p>
      <Badge variant="outline" className="border-orange-500/50 text-orange-500">
        Coming Soon
      </Badge>
    </div>
  );
}

function CrossFormatTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
        <Grid3X3 className="h-8 w-8 text-orange-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-crossformat-title">
        Cross-Format Canvas
      </h3>
      <p className="text-zinc-400 text-center max-w-md mb-6" data-testid="text-crossformat-description">
        Transform your content across formats. Turn books into courses, podcasts into blogs, 
        and videos into social posts with AI assistance.
      </p>
      <Badge variant="outline" className="border-orange-500/50 text-orange-500">
        Coming Soon
      </Badge>
    </div>
  );
}

export default function ProductionDashboard() {
  return (
    <div className="min-h-screen bg-black">
      <CreatorHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-page-title">
                Production Dashboard
              </h1>
              <p className="text-sm text-zinc-400" data-testid="text-page-subtitle">
                Manage your creative production workflow
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-zinc-950 border border-zinc-800 p-1 mb-6 overflow-x-auto flex-wrap sm:flex-nowrap h-auto gap-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
              data-testid="tab-overview"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="research" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
              data-testid="tab-research"
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Research Lab</span>
            </TabsTrigger>
            <TabsTrigger 
              value="vault" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
              data-testid="tab-vault"
            >
              <Vault className="h-4 w-4" />
              <span className="hidden sm:inline">Creator Vault</span>
            </TabsTrigger>
            <TabsTrigger 
              value="batch" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
              data-testid="tab-batch"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Batch Studio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="crossformat" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
              data-testid="tab-crossformat"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Cross-Format</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" data-testid="content-overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="research" data-testid="content-research">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-0">
                <ResearchLabTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vault" data-testid="content-vault">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-0">
                <CreatorVaultTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" data-testid="content-batch">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-0">
                <BatchStudioTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crossformat" data-testid="content-crossformat">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-0">
                <CrossFormatTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
