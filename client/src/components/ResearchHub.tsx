import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Loader2,
  ExternalLink,
  BookOpen,
  Music,
  GraduationCap,
  Film,
  History,
  Sparkles,
  Save,
  RefreshCw,
  TrendingUp,
  Coins,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  position?: number;
}

interface TrendingTopic {
  id: number;
  title: string;
  description: string;
  category: string;
  popularity?: number;
}

interface ResearchQuery {
  id: number;
  query: string;
  resultsCount: number;
  createdAt: string;
}

interface AIInsight {
  id: number;
  title: string;
  content: string;
  queryId: number;
  createdAt: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
}

const CREDIT_COST = 1;

export function ResearchHub() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("books");
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [currentInsights, setCurrentInsights] = useState<AIInsight | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    { id: "books", label: "Books", icon: BookOpen },
    { id: "music", label: "Music", icon: Music },
    { id: "courses", label: "Courses", icon: GraduationCap },
    { id: "movies", label: "Movies", icon: Film },
  ];

  const { data: trendingTopics = [], isLoading: trendingLoading } = useQuery<TrendingTopic[]>({
    queryKey: ['/api/research/trending', activeCategory],
    enabled: !!activeCategory,
  });

  const { data: researchHistory = [], isLoading: historyLoading } = useQuery<ResearchQuery[]>({
    queryKey: ['/api/research/history'],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string): Promise<SearchResponse> => {
      const res = await fetch(`/api/research/query?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentResults(data.results || []);
      queryClient.invalidateQueries({ queryKey: ['/api/research/history'] });
      toast({ title: "Search completed", description: `Found ${data.results?.length || 0} results` });
    },
    onError: () => {
      toast({ title: "Search failed", variant: "destructive" });
    },
  });

  const insightsMutation = useMutation({
    mutationFn: async (data: { query: string; results: SearchResult[] }): Promise<AIInsight> => {
      const res = await apiRequest('POST', '/api/research/insights', data);
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentInsights(data);
      toast({ title: "AI insights generated" });
    },
    onError: () => {
      toast({ title: "Failed to generate insights", variant: "destructive" });
    },
  });

  const saveToVaultMutation = useMutation({
    mutationFn: async (insight: AIInsight) => {
      return apiRequest('POST', '/api/vault/items', {
        type: 'research_insight',
        title: insight.title,
        content: insight.content,
      });
    },
    onSuccess: () => {
      toast({ title: "Saved to Vault" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({ title: "Enter a search query", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setCurrentInsights(null);
    searchMutation.mutate(searchQuery, {
      onSettled: () => setIsSearching(false),
    });
  };

  const handleReplayQuery = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setCurrentInsights(null);
    searchMutation.mutate(query, {
      onSettled: () => setIsSearching(false),
    });
  };

  const handleGenerateInsights = () => {
    if (currentResults.length === 0) {
      toast({ title: "No results to analyze", variant: "destructive" });
      return;
    }
    insightsMutation.mutate({ query: searchQuery, results: currentResults });
  };

  const handleTrendingClick = (topic: TrendingTopic) => {
    setSearchQuery(topic.title);
    handleReplayQuery(topic.title);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" data-testid="research-hub">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">Research Hub</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">Discover insights with AI-powered research</p>
      </div>

      <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="border-orange-500/50 text-orange-400">
              <Coins className="w-3 h-3 mr-1" />
              {CREDIT_COST} credit per query
            </Badge>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                placeholder="Search anything... books, music, courses, movies, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-11 h-12 text-lg bg-black/50 border-zinc-700"
                data-testid="input-research-query"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="h-12 px-6 bg-orange-500 hover:bg-orange-600"
              data-testid="button-search"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-3" data-testid="text-credit-cost">
            Fresh queries cost {CREDIT_COST} credit. Cached results are free.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {currentResults.length > 0 && (
            <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Search Results
                </CardTitle>
                <Button
                  onClick={handleGenerateInsights}
                  disabled={insightsMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  data-testid="button-generate-insights"
                >
                  {insightsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analyze with AI
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {currentResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-zinc-800 hover:border-orange-500/50 transition-colors"
                        data-testid={`result-card-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-white font-medium line-clamp-2" data-testid={`result-title-${index}`}>
                            {result.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            #{result.position || index + 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-3 mb-3" data-testid={`result-snippet-${index}`}>
                          {result.snippet}
                        </p>
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-orange-400 hover:text-orange-300"
                          data-testid={`result-link-${index}`}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Visit Source
                        </a>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {currentInsights && (
            <Card className="bg-zinc-950 border border-orange-500/30 shadow-xl" data-testid="insights-panel">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-500" />
                  AI Insights
                </CardTitle>
                <Button
                  onClick={() => saveToVaultMutation.mutate(currentInsights)}
                  disabled={saveToVaultMutation.isPending}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-save-to-vault"
                >
                  {saveToVaultMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save to Vault
                </Button>
              </CardHeader>
              <CardContent>
                <h4 className="text-lg font-medium text-white mb-3" data-testid="insights-title">
                  {currentInsights.title}
                </h4>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap" data-testid="insights-content">
                  {currentInsights.content}
                </p>
              </CardContent>
            </Card>
          )}

          {!currentResults.length && !isSearching && (
            <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                <h3 className="text-xl font-medium text-white mb-2">Start Your Research</h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Enter a search query above to discover content across the web. Our AI will analyze results and provide actionable insights.
                </p>
              </CardContent>
            </Card>
          )}

          {isSearching && (
            <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-zinc-800">
                      <Skeleton className="h-5 w-3/4 mb-2 bg-zinc-800" />
                      <Skeleton className="h-4 w-full mb-1 bg-zinc-800" />
                      <Skeleton className="h-4 w-2/3 bg-zinc-800" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid grid-cols-4 bg-zinc-900/50 border border-zinc-800/50 mb-4">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="text-xs"
                      data-testid={`tab-trending-${cat.id}`}
                    >
                      <cat.icon className="w-3 h-3" />
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id}>
                    {trendingLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                        ))}
                      </div>
                    ) : trendingTopics.length > 0 ? (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {trendingTopics.map((topic) => (
                            <div
                              key={topic.id}
                              onClick={() => handleTrendingClick(topic)}
                              className="p-3 rounded-lg border border-zinc-800 hover:border-orange-500/50 cursor-pointer transition-colors"
                              data-testid={`trending-topic-${topic.id}`}
                            >
                              <h5 className="text-sm font-medium text-white truncate" data-testid={`trending-title-${topic.id}`}>
                                {topic.title}
                              </h5>
                              <p className="text-xs text-zinc-500 line-clamp-1">
                                {topic.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8">
                        <cat.icon className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                        <p className="text-xs text-zinc-500">No trending topics</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                Research History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : researchHistory.length > 0 ? (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {researchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-zinc-800 hover:border-orange-500/50 transition-colors"
                        data-testid={`history-item-${item.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate" data-testid={`history-query-${item.id}`}>
                              {item.query}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {item.resultsCount} results
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReplayQuery(item.query)}
                            className="flex-shrink-0"
                            data-testid={`button-replay-${item.id}`}
                          >
                            <RotateCcw className="w-4 h-4 text-orange-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <History className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-xs text-zinc-500">No research history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResearchHub;
