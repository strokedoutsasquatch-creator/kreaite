import { useState } from "react";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Book, Music, Video, GraduationCap, Image, Film, Mic2, Headphones, 
  Disc3, GitBranch, DollarSign, TrendingUp, Play, Clock, Zap, Star,
  ArrowRight, Sparkles, Wand2, Layers, FileAudio, Settings,
  ChevronRight, Plus, BarChart3, Wallet, Users
} from "lucide-react";

interface StudioCard {
  id: string;
  name: string;
  description: string;
  icon: any;
  route: string;
  color: string;
  features: string[];
  isPremium?: boolean;
}

const studios: StudioCard[] = [
  {
    id: "book",
    name: "Book Studio",
    description: "AI-powered ghostwriting with Gemini",
    icon: Book,
    route: "/book-studio",
    color: "from-orange-500 to-amber-600",
    features: ["Manuscript Editor", "AI Ghostwriter", "Cover Generator", "Lulu Publishing"]
  },
  {
    id: "music",
    name: "Music Studio",
    description: "Full DAW with 8-genre Lyria generation",
    icon: Music,
    route: "/music-studio",
    color: "from-purple-500 to-pink-600",
    features: ["8-Band EQ", "Compressor", "Lyria AI", "Voice Cloning"]
  },
  {
    id: "video",
    name: "Video Studio",
    description: "Timeline editor with Veo generation",
    icon: Video,
    route: "/video-studio",
    color: "from-blue-500 to-cyan-600",
    features: ["Timeline Editor", "AI Storyboards", "Effects", "Export 4K"]
  },
  {
    id: "movie",
    name: "Movie Studio",
    description: "Full AI film production pipeline",
    icon: Film,
    route: "/movie-studio",
    color: "from-red-500 to-rose-600",
    features: ["Script Generator", "Multi-Voice Dialogue", "Storyboards", "Scene Assembly"],
    isPremium: true
  },
  {
    id: "course",
    name: "Course Studio",
    description: "Build courses with Google Classroom sync",
    icon: GraduationCap,
    route: "/course-studio",
    color: "from-green-500 to-emerald-600",
    features: ["Module Builder", "Quiz Generator", "Classroom Sync", "Certificate Design"]
  },
  {
    id: "image",
    name: "Image Studio",
    description: "AI image generation with style presets",
    icon: Image,
    route: "/image-studio",
    color: "from-indigo-500 to-violet-600",
    features: ["Grok Imagine", "Style Presets", "Batch Generation", "Consistency Tools"]
  }
];

const ultraPremiumTools = [
  {
    id: "podcast-studio",
    name: "Podcast Studio",
    description: "Record, edit, and publish professional podcasts",
    icon: Mic2,
    route: "/podcast-studio",
    color: "from-amber-500 to-orange-600"
  },
  {
    id: "avatar-studio",
    name: "AI Avatar Studio",
    description: "Create talking head videos with D-ID",
    icon: Users,
    route: "/avatar-studio",
    color: "from-purple-500 to-pink-600"
  },
  {
    id: "templates",
    name: "Template Marketplace",
    description: "Buy and sell templates for all studios",
    icon: Layers,
    route: "/templates",
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "voice-library",
    name: "Voice Cloning Library",
    description: "Create and reuse AI voices across all studios",
    icon: Headphones,
    route: "/voice-library",
    color: "from-teal-500 to-cyan-600"
  },
  {
    id: "audiobook-factory",
    name: "Audiobook Factory",
    description: "Book → TTS narration → mastering pipeline",
    icon: FileAudio,
    route: "/audiobook-factory",
    color: "from-indigo-500 to-violet-600"
  },
  {
    id: "dj-studio",
    name: "DJ/Mixing Studio",
    description: "EQ presets, compression, turntable scratching",
    icon: Disc3,
    route: "/dj-studio",
    color: "from-pink-500 to-rose-600"
  },
  {
    id: "workflows",
    name: "Workflow Orchestration",
    description: "Chain studios together for automated pipelines",
    icon: GitBranch,
    route: "/workflows",
    color: "from-slate-500 to-zinc-600"
  }
];

export default function CreatorHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("studios");

  const { data: workflowTemplates } = useQuery({
    queryKey: ["/api/workflows/templates"],
    enabled: !!user
  });

  const { data: voicesData } = useQuery({
    queryKey: ["/api/voices/public"]
  });

  const { data: presetsData } = useQuery({
    queryKey: ["/api/dj/presets/public"]
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Creator Hub</h1>
              <p className="text-zinc-400">Your ultra-premium AI-powered content creation command center</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="studios" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Layers className="w-4 h-4 mr-2" />
              Studios
            </TabsTrigger>
            <TabsTrigger value="ultra-premium" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Zap className="w-4 h-4 mr-2" />
              Ultra-Premium
            </TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <GitBranch className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <DollarSign className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="studios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.map((studio) => (
                <Link key={studio.id} href={studio.route}>
                  <Card 
                    className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all cursor-pointer group overflow-hidden"
                    data-testid={`card-studio-${studio.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${studio.color}`}>
                          <studio.icon className="w-6 h-6 text-white" />
                        </div>
                        {studio.isPremium && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <Star className="w-3 h-3 mr-1" /> Premium
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mt-3 group-hover:text-orange-400 transition-colors">
                        {studio.name}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        {studio.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {studio.features.map((feature) => (
                          <Badge 
                            key={feature} 
                            variant="secondary" 
                            className="bg-zinc-800 text-zinc-300 text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-end mt-4 text-zinc-500 group-hover:text-orange-400 transition-colors">
                        <span className="text-sm mr-1">Open Studio</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ultra-premium" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0">
                <Zap className="w-3 h-3 mr-1" /> Ultra-Premium Features
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ultraPremiumTools.map((tool) => (
                <Link key={tool.id} href={tool.route}>
                  <Card 
                    className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all cursor-pointer group"
                    data-testid={`card-tool-${tool.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl bg-gradient-to-br ${tool.color}`}>
                          <tool.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-orange-400 transition-colors">
                            {tool.name}
                          </CardTitle>
                          <CardDescription className="text-zinc-400">
                            {tool.description}
                          </CardDescription>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800 mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-orange-400" />
                  Voice Cloning Library
                </CardTitle>
                <CardDescription>
                  {voicesData?.voices?.length || 0} cloned voices available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voicesData?.voices?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {voicesData.voices.slice(0, 4).map((voice: any) => (
                      <div key={voice.id} className="p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mic2 className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-medium truncate">{voice.name}</span>
                        </div>
                        <Badge className="mt-2 text-xs" variant="secondary">{voice.voiceType}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Mic2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No voice clones yet</p>
                    <Link href="/voice-library">
                      <Button variant="outline" className="mt-4" data-testid="button-create-voice">
                        <Plus className="w-4 h-4 mr-2" /> Create Your First Voice
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Cross-Studio Workflows</h2>
                <p className="text-zinc-400">Automate content creation across multiple studios</p>
              </div>
              <Link href="/workflows">
                <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-manage-workflows">
                  <Settings className="w-4 h-4 mr-2" /> Manage Workflows
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workflowTemplates?.templates?.map((template: any) => (
                <Card 
                  key={template.type} 
                  className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/30 transition-all"
                  data-testid={`card-workflow-${template.type}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-zinc-400">{template.description}</CardDescription>
                      </div>
                      <Badge className="bg-zinc-800 text-zinc-300">
                        {template.stepCount} steps
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          ~{Math.round(template.estimatedDuration / 60)} min
                        </span>
                        <span className="text-green-400">
                          <DollarSign className="w-4 h-4 inline" />
                          {(template.estimatedCost / 100).toFixed(2)}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-orange-400" data-testid={`button-start-${template.type}`}>
                        Start <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Earnings</CardTitle>
                  <DollarSign className="w-4 h-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">$0.00</div>
                  <p className="text-xs text-zinc-500 mt-1">85% creator share</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Pending Payout</CardTitle>
                  <Wallet className="w-4 h-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.00</div>
                  <p className="text-xs text-zinc-500 mt-1">Available to withdraw</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Content Sales</CardTitle>
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-zinc-500 mt-1">Total purchases</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  Revenue Split
                </CardTitle>
                <CardDescription>You keep 85% of all sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400">Creator Share</span>
                      <span className="text-green-400 font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-3 bg-zinc-800" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400">Platform Fee</span>
                      <span className="text-zinc-500 font-medium">15%</span>
                    </div>
                    <Progress value={15} className="h-3 bg-zinc-800" />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
                  <h4 className="font-medium mb-2">Stripe Connect Required</h4>
                  <p className="text-sm text-zinc-400 mb-4">
                    Connect your Stripe account to receive payouts for your content sales.
                  </p>
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-connect-stripe">
                    <Wallet className="w-4 h-4 mr-2" /> Connect Stripe Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
