import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  PenSquare, 
  Heart, 
  MessageCircle, 
  Eye,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import type { BlogPost } from "@shared/schema";

function StoryCard({ post }: { post: BlogPost }) {
  const formattedDate = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Draft';

  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`story-card-${post.id}`}>
      {post.heroImageUrl && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={post.heroImageUrl} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {post.tags?.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {post.isFeatured && (
            <Badge className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        <Link href={`/stories/${post.slug}`}>
          <CardTitle className="hover:text-primary transition-colors cursor-pointer line-clamp-2">
            {post.title}
          </CardTitle>
        </Link>
        <CardDescription className="line-clamp-3">
          {post.excerpt || post.content.substring(0, 150) + '...'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{post.readingTime} min read</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
      </CardFooter>
    </Card>
  );
}

function StoryCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-video rounded-t-lg" />
      <CardHeader>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardFooter>
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}

export default function Stories() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog']
  });

  const { data: featuredPosts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/featured']
  });

  const filteredPosts = posts?.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-primary text-primary" data-testid="badge-stories">
              <BookOpen className="w-3 h-3 mr-1" />
              Recovery Stories
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="heading-main">
              Stories of <span className="text-primary">Triumph</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Real stories from real survivors. Every journey is unique, every victory matters.
              Share your story and inspire others on their path to recovery.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {user && (
                <Link href="/stories/new">
                  <Button size="lg" data-testid="button-write-story">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Share Your Story
                  </Button>
                </Link>
              )}
              {user && (
                <Link href="/stories/my">
                  <Button variant="outline" size="lg" data-testid="button-my-stories">
                    My Stories
                  </Button>
                </Link>
              )}
            </div>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-stories"
              />
            </div>
          </div>
        </div>
      </section>

      {featuredPosts && featuredPosts.length > 0 && (
        <section className="py-12 px-4 bg-card/50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold" data-testid="heading-featured">Featured Stories</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8" data-testid="heading-all-stories">
            All Recovery Stories
          </h2>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <StoryCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Stories Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share your recovery journey with the community.
                </p>
                {user && (
                  <Link href="/stories/new">
                    <Button data-testid="button-first-story">
                      <PenSquare className="mr-2 h-4 w-4" />
                      Write the First Story
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4" data-testid="heading-cta">
            Your Story Could Inspire <span className="text-primary">Thousands</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Every recovery journey has the power to inspire others. Share your wins, 
            your struggles, and your breakthroughs with a community that understands.
          </p>
          {user ? (
            <Link href="/stories/new">
              <Button size="lg" data-testid="button-share-story-cta">
                Share Your Story
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/api/login">
              <Button size="lg" data-testid="button-login-to-share">
                Sign In to Share Your Story
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}