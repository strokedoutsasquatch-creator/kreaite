import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MessageSquare, Users, Pin, Lock, Heart, MessageCircle, Plus, ChevronRight, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CreatorHeader from "@/components/CreatorHeader";
import RecoveryHeader from "@/components/RecoveryHeader";
import { usePlatform } from "@/lib/hooks/usePlatform";
import type { ForumCategory, ForumThread, User } from "@shared/schema";

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) return then.toLocaleDateString();
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "Just now";
}

interface CategoryWithStats extends ForumCategory {
  threadCount?: number;
  postCount?: number;
}

export default function Community() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const platform = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newThreadCategoryId, setNewThreadCategoryId] = useState<string>("");
  
  const isRecovery = platform === "recovery";
  const pageTitle = isRecovery ? "Recovery Community" : "Creator Community";
  const pageSubtitle = isRecovery 
    ? "Connect with fellow stroke survivors, share your journey, and support each other"
    : "Connect with fellow creators, share your work, and grow together";

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
  });

  const { data: categories, isLoading: loadingCategories } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  const { data: stats } = useQuery<{ categoryId: number; threadCount: number; postCount: number }[]>({
    queryKey: ["/api/forum/stats"],
  });

  const { data: threads, isLoading: loadingThreads } = useQuery<ForumThread[]>({
    queryKey: ["/api/forum/threads", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/forum/threads?categoryId=${selectedCategory}&limit=20`
        : "/api/forum/threads?limit=20";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch threads");
      return res.json();
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { categoryId: number; title: string; content: string }) => {
      return apiRequest("POST", "/api/forum/threads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/stats"] });
      setIsNewThreadOpen(false);
      setNewThreadTitle("");
      setNewThreadContent("");
      setNewThreadCategoryId("");
      toast({
        title: "Thread created!",
        description: "Your discussion thread has been posted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateThread = () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !newThreadCategoryId) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    createThreadMutation.mutate({
      categoryId: parseInt(newThreadCategoryId),
      title: newThreadTitle,
      content: newThreadContent,
    });
  };

  const categoriesWithStats: CategoryWithStats[] = (categories || []).map((cat) => {
    const stat = stats?.find((s) => s.categoryId === cat.id);
    return {
      ...cat,
      threadCount: stat?.threadCount || 0,
      postCount: stat?.postCount || 0,
    };
  });

  const getCategoryIcon = (icon: string | null) => {
    switch (icon) {
      case "heart":
        return <Heart className="h-5 w-5" />;
      case "users":
        return <Users className="h-5 w-5" />;
      case "message":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isRecovery ? <RecoveryHeader /> : <CreatorHeader />}
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground mt-1">
              {pageSubtitle}
            </p>
          </div>
          
          {user && (
            <Dialog open={isNewThreadOpen} onOpenChange={setIsNewThreadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-new-thread">
                  <Plus className="h-4 w-4" />
                  Start Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Start a New Discussion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newThreadCategoryId}
                      onValueChange={setNewThreadCategoryId}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      placeholder="What would you like to discuss?"
                      data-testid="input-thread-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Your Message</Label>
                    <Textarea
                      id="content"
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      placeholder="Share your thoughts, questions, or experiences..."
                      className="min-h-[150px]"
                      data-testid="input-thread-content"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" data-testid="button-cancel-thread">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleCreateThread}
                    disabled={createThreadMutation.isPending}
                    data-testid="button-submit-thread"
                  >
                    {createThreadMutation.isPending ? "Posting..." : "Post Discussion"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                <Button
                  variant={selectedCategory === null ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-all-categories"
                >
                  <MessageSquare className="h-4 w-4" />
                  All Discussions
                </Button>
                
                {loadingCategories ? (
                  <div className="space-y-2 px-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  categoriesWithStats.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => setSelectedCategory(category.id)}
                      data-testid={`button-category-${category.id}`}
                    >
                      {getCategoryIcon(category.icon)}
                      <span className="flex-1 text-left truncate">{category.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {category.threadCount}
                      </Badge>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>

            {!user && (
              <Card className="mt-4 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Join the Community</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to start discussions, reply to threads, and connect with other survivors.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => setLocation("/api/login")}
                    data-testid="button-login-prompt"
                  >
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>

          <div className="lg:col-span-3 space-y-4">
            {loadingThreads ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : threads && threads.length > 0 ? (
              threads.map((thread) => {
                const category = categories?.find((c) => c.id === thread.categoryId);
                return (
                  <Card 
                    key={thread.id} 
                    className="hover-elevate cursor-pointer transition-colors"
                    onClick={() => setLocation(`/community/thread/${thread.id}`)}
                    data-testid={`card-thread-${thread.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {thread.isPinned && (
                              <Badge variant="secondary" className="gap-1">
                                <Pin className="h-3 w-3" />
                                Pinned
                              </Badge>
                            )}
                            {thread.isLocked && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Locked
                              </Badge>
                            )}
                            {category && (
                              <Badge variant="outline">{category.name}</Badge>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {thread.title}
                          </h3>
                          
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {thread.replyCount} replies
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {thread.viewCount} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatRelativeTime(thread.lastActivityAt)}
                            </span>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCategory 
                      ? "Be the first to start a discussion in this category!"
                      : "Be the first to start a discussion in our community!"}
                  </p>
                  {user && (
                    <Button onClick={() => setIsNewThreadOpen(true)} data-testid="button-start-first-thread">
                      Start a Discussion
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
