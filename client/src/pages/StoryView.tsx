import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock,
  Eye,
  BookOpen,
  Send,
  Loader2
} from "lucide-react";
import { SiFacebook, SiLinkedin } from "react-icons/si";
import { SiX } from "react-icons/si";
import type { BlogPost, BlogPostComment, User } from "@shared/schema";

export default function StoryView() {
  const { user } = useAuth();
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  const { data: post, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog', params.slug]
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<BlogPostComment[]>({
    queryKey: ['/api/blog', post?.id, 'comments'],
    enabled: !!post?.id
  });

  const { data: author } = useQuery<User>({
    queryKey: ['/api/users', post?.authorId],
    enabled: !!post?.authorId
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/blog/${post?.id}/react`, { reactionType: 'like' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog', params.slug] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/blog/${post?.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog', post?.id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog', params.slug] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted."
      });
    }
  });

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || "Recovery Story");
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (postLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="aspect-video rounded-lg mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-16 max-w-md">
          <CardContent>
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">Story Not Found</h3>
            <p className="text-muted-foreground mb-6">
              This story may have been removed or doesn't exist.
            </p>
            <Link href="/stories">
              <Button data-testid="button-back-to-stories">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Stories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Draft';

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/stories">
          <Button variant="ghost" className="mb-8" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stories
          </Button>
        </Link>

        <article>
          <header className="mb-8">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-title">
              {post.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={author?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {author?.firstName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">
                    {author?.firstName} {author?.lastName}
                  </div>
                  <div className="text-sm">{formattedDate}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readingTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.viewCount} views
                </span>
              </div>
            </div>
          </header>

          {post.heroImageUrl && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img 
                src={post.heroImageUrl} 
                alt={post.title}
                className="w-full h-full object-cover"
                data-testid="img-hero"
              />
            </div>
          )}

          <div 
            className="prose prose-invert max-w-none mb-8"
            data-testid="story-content"
          >
            {post.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index} className="mb-4 leading-relaxed">{paragraph}</p>
            ))}
          </div>

          <Separator className="my-8" />

          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant={likeMutation.isPending ? "default" : "outline"}
                onClick={() => user && likeMutation.mutate()}
                disabled={!user || likeMutation.isPending}
                data-testid="button-like"
              >
                <Heart className={`mr-2 h-4 w-4 ${likeMutation.isPending ? 'animate-pulse' : ''}`} />
                {post.likeCount} {post.likeCount === 1 ? 'Like' : 'Likes'}
              </Button>
              <Button variant="outline" disabled data-testid="button-comments-count">
                <MessageCircle className="mr-2 h-4 w-4" />
                {post.commentCount} Comments
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Share:</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleShare('facebook')}
                data-testid="button-share-facebook"
              >
                <SiFacebook className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleShare('twitter')}
                data-testid="button-share-twitter"
              >
                <SiX className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleShare('linkedin')}
                data-testid="button-share-linkedin"
              >
                <SiLinkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          <section>
            <h2 className="text-xl font-bold mb-6" data-testid="heading-comments">
              Comments ({post.commentCount})
            </h2>

            {user ? (
              <Card className="mb-6">
                <CardContent className="pt-4">
                  <Textarea
                    placeholder="Share your thoughts or words of encouragement..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    data-testid="input-comment"
                  />
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => newComment.trim() && commentMutation.mutate(newComment)}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      data-testid="button-submit-comment"
                    >
                      {commentMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Sign in to leave a comment and join the conversation.
                  </p>
                  <Link href="/api/login">
                    <Button data-testid="button-login-to-comment">Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {commentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Community Member</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-2 text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <CardContent>
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}