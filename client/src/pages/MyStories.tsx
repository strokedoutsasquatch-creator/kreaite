import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  PenSquare, 
  Edit2, 
  Trash2, 
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Send,
  FileText,
  Plus,
  ArrowLeft
} from "lucide-react";
import type { BlogPost } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function StoryRow({ post }: { post: BlogPost }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const formattedDate = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : new Date(post.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/blog/${post.id}/publish`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Published!",
        description: "Your story is now live."
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/blog/${post.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Deleted",
        description: "Your story has been deleted."
      });
    }
  });

  return (
    <Card data-testid={`my-story-card-${post.id}`}>
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                {post.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
              {post.isFeatured && (
                <Badge variant="outline">Featured</Badge>
              )}
            </div>
            <h3 className="font-bold text-lg mb-1">
              {post.title || "Untitled Story"}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.excerpt || post.content.substring(0, 100) + '...'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {post.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.commentCount}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {post.status === 'draft' && (
              <Button 
                size="sm" 
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                data-testid={`button-publish-${post.id}`}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation(`/stories/edit/${post.id}`)}
              data-testid={`button-edit-${post.id}`}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {post.status === 'published' && (
              <Link href={`/stories/${post.slug}`}>
                <Button variant="outline" size="sm" data-testid={`button-view-${post.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </Link>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-delete-${post.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this story?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your story will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyStories() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/me'],
    enabled: !!user
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    setLocation('/api/login');
    return null;
  }

  const drafts = posts?.filter(p => p.status === 'draft') || [];
  const published = posts?.filter(p => p.status === 'published') || [];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/stories">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Stories
              </Button>
            </Link>
          </div>
          <Link href="/stories/new">
            <Button data-testid="button-new-story">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" data-testid="heading-main">
            <PenSquare className="inline-block mr-3 h-8 w-8 text-primary" />
            My Stories
          </h1>
          <p className="text-muted-foreground">
            Manage your recovery stories. Write, edit, and share with the community.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <Skeleton className="h-6 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-8">
            {drafts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" data-testid="heading-drafts">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Drafts ({drafts.length})
                </h2>
                <div className="space-y-4">
                  {drafts.map(post => (
                    <StoryRow key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {published.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" data-testid="heading-published">
                  <Send className="h-5 w-5 text-primary" />
                  Published ({published.length})
                </h2>
                <div className="space-y-4">
                  {published.map(post => (
                    <StoryRow key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <PenSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Stories Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start sharing your recovery journey with the community.
              </p>
              <Link href="/stories/new">
                <Button data-testid="button-write-first">
                  <Plus className="mr-2 h-4 w-4" />
                  Write Your First Story
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}