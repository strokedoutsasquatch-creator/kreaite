import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Heart, MessageCircle, Edit2, Trash2, Pin, Lock, MoreVertical, Send, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CreatorHeader from "@/components/CreatorHeader";
import type { ForumThread, ForumPost, ForumCategory, User } from "@shared/schema";

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

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
  });

  const { data: thread, isLoading: loadingThread } = useQuery<ForumThread>({
    queryKey: ["/api/forum/threads", id],
  });

  const { data: posts, isLoading: loadingPosts } = useQuery<ForumPost[]>({
    queryKey: ["/api/forum/threads", id, "posts"],
    queryFn: async () => {
      const res = await fetch(`/api/forum/threads/${id}/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: categories } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/forum/posts", { threadId: parseInt(id!), content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      setReplyContent("");
      toast({ title: "Reply posted!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    },
  });

  const editPostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      return apiRequest("PATCH", `/api/forum/posts/${postId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id, "posts"] });
      setEditingPostId(null);
      setEditContent("");
      toast({ title: "Post updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update post.", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/forum/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      toast({ title: "Post deleted!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("POST", `/api/forum/posts/${postId}/react`, { reactionType: "like" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id, "posts"] });
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async (updates: { isPinned?: boolean; isLocked?: boolean }) => {
      return apiRequest("PATCH", `/api/forum/threads/${id}/moderate`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      toast({ title: "Thread updated!" });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/forum/threads/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Thread deleted!" });
      setLocation("/community");
    },
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  const handleEditPost = (postId: number) => {
    if (!editContent.trim()) return;
    editPostMutation.mutate({ postId, content: editContent });
  };

  const startEditing = (post: ForumPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const canModerate = user?.role === "moderator" || user?.role === "admin";
  const category = categories?.find((c) => c.id === thread?.categoryId);

  if (loadingThread) {
    return (
      <div className="min-h-screen bg-background">
        <CreatorHeader />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background">
        <CreatorHeader />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Thread not found</h1>
          <Button onClick={() => setLocation("/community")}>
            Back to Community
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="gap-2 mb-4"
          onClick={() => setLocation("/community")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Button>

        <Card className="mb-6">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
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
            
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-thread-title">
                {thread.title}
              </h1>
              
              {canModerate && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-moderate">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => moderateMutation.mutate({ isPinned: !thread.isPinned })}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {thread.isPinned ? "Unpin" : "Pin"} Thread
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => moderateMutation.mutate({ isLocked: !thread.isLocked })}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {thread.isLocked ? "Unlock" : "Lock"} Thread
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Thread
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. All posts in this thread will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteThreadMutation.mutate()}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {thread.replyCount} replies
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Started {formatRelativeTime(thread.createdAt)}
              </span>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post, index) => (
              <Card key={post.id} data-testid={`card-post-${post.id}`}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {post.authorId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">Member</span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">Author</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                        {post.isEdited && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      
                      {editingPostId === post.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px]"
                            data-testid={`input-edit-post-${post.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditPost(post.id)}
                              disabled={editPostMutation.isPending}
                              data-testid={`button-save-edit-${post.id}`}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPostId(null);
                                setEditContent("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap">{post.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-3 px-6 pb-3">
                  <div className="flex items-center gap-4">
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => likeMutation.mutate(post.id)}
                        data-testid={`button-like-${post.id}`}
                      >
                        <Heart className="h-4 w-4" />
                        {post.likeCount > 0 && post.likeCount}
                      </Button>
                    )}
                    
                    {user && (post.authorId === user.id || canModerate) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => startEditing(post)}
                          data-testid={`button-edit-${post.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              data-testid={`button-delete-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePostMutation.mutate(post.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-muted-foreground">No posts yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {user && !thread.isLocked && (
          <Card className="mt-6">
            <CardHeader>
              <h3 className="font-semibold">Reply to this discussion</h3>
            </CardHeader>
            <CardContent>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-[120px] mb-4"
                data-testid="input-reply"
              />
              <Button
                onClick={handleReply}
                disabled={replyMutation.isPending || !replyContent.trim()}
                className="gap-2"
                data-testid="button-submit-reply"
              >
                <Send className="h-4 w-4" />
                {replyMutation.isPending ? "Posting..." : "Post Reply"}
              </Button>
            </CardContent>
          </Card>
        )}

        {thread.isLocked && (
          <Card className="mt-6 border-muted">
            <CardContent className="pt-6 text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                This thread is locked. No new replies can be posted.
              </p>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to join the discussion and share your recovery journey.
              </p>
              <Button onClick={() => setLocation("/api/login")} data-testid="button-login-reply">
                Sign In to Reply
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
