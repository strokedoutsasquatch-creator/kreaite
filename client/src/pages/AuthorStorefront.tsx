import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Globe,
  Mail,
  UserPlus,
  ExternalLink,
  Calendar,
  Star,
  ShoppingCart,
  ArrowLeft,
  Play,
  Mic,
} from "lucide-react";
import { SiX, SiInstagram, SiFacebook, SiLinkedin, SiTiktok, SiYoutube, SiAmazon, SiGoodreads } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import type { AuthorProfile as AuthorProfileType } from "@shared/schema";

interface BookProject {
  id: number;
  title: string;
  subtitle?: string;
  coverImageUrl?: string;
  genre?: string;
  status: string;
  createdAt: string;
  price?: number;
}

interface StorefrontData {
  profile: AuthorProfileType;
  books: BookProject[];
}

function StorefrontSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="h-64 bg-gradient-to-r from-orange-500/20 to-orange-600/10" />
      <div className="container mx-auto px-4 -mt-16 max-w-6xl">
        <div className="flex items-end gap-6 mb-8">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="space-y-2 pb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialLink({ 
  href, 
  icon: Icon, 
  label 
}: { 
  href?: string; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
}) {
  if (!href) return null;
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-muted-foreground hover:text-orange-500 transition-colors"
      data-testid={`link-social-${label.toLowerCase()}`}
    >
      <Icon className="w-5 h-5" />
      <span className="sr-only">{label}</span>
    </a>
  );
}

function BookCard({ book }: { book: BookProject }) {
  return (
    <Card className="overflow-hidden hover-elevate group" data-testid={`card-book-${book.id}`}>
      <div className="aspect-[2/3] bg-gradient-to-br from-orange-500/20 to-orange-600/10 relative">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-orange-500/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" data-testid={`button-buy-${book.id}`}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2" data-testid={`text-book-title-${book.id}`}>{book.title}</h3>
        {book.subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">{book.subtitle}</p>
        )}
        <div className="flex items-center justify-between mt-3 gap-2">
          {book.genre && (
            <Badge variant="outline" className="text-xs">
              {book.genre}
            </Badge>
          )}
          {book.price && (
            <span className="font-bold text-orange-500" data-testid={`text-book-price-${book.id}`}>
              ${(book.price / 100).toFixed(2)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuthorStorefront() {
  const params = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  const { data, isLoading, error } = useQuery<StorefrontData>({
    queryKey: ["/api/author", params.slug],
    enabled: !!params.slug,
  });

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following!",
      description: isFollowing 
        ? "You will no longer receive updates from this author"
        : "You'll be notified about new releases",
    });
  };

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    const socialLinks = data?.profile.socialLinks as Record<string, string> || {};
    if (socialLinks.newsletter) {
      window.open(`${socialLinks.newsletter}?email=${encodeURIComponent(email)}`, "_blank");
    } else {
      toast({
        title: "Signed up!",
        description: "You've been added to the newsletter list",
      });
    }
    setEmail("");
  };

  if (isLoading) {
    return <StorefrontSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Author Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The author you're looking for doesn't exist or their storefront is private.
          </p>
          <Button asChild>
            <Link href="/" data-testid="link-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { profile, books } = data;
  const socialLinks = profile.socialLinks as Record<string, string> || {};
  const publisherInfo = profile.publisherInfo as Record<string, unknown> || {};

  return (
    <div className="min-h-screen bg-black">
      <div 
        className="h-64 md:h-80 relative bg-gradient-to-r from-orange-500/20 to-orange-600/10"
        style={socialLinks.bannerUrl ? {
          backgroundImage: `url(${socialLinks.bannerUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <Button variant="ghost" asChild className="text-white/80 hover:text-white" data-testid="link-back">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-black ring-4 ring-orange-500/20">
            <AvatarImage src={profile.photoUrl || undefined} data-testid="img-author-photo" />
            <AvatarFallback className="text-4xl bg-orange-500/20">
              {profile.penName?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pb-2">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-white" data-testid="text-author-name">
              {profile.penName}
            </h1>
            {socialLinks.tagline && (
              <p className="text-lg text-muted-foreground mt-1" data-testid="text-author-tagline">
                {socialLinks.tagline}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.genres?.map((genre) => (
                <Badge 
                  key={genre} 
                  variant="outline" 
                  className="border-orange-500/30 text-orange-400"
                  data-testid={`badge-genre-${genre.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={isFollowing ? "outline" : "default"}
              className={isFollowing ? "" : "bg-orange-500 hover:bg-orange-600"}
              onClick={handleFollow}
              data-testid="button-follow"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio ? (
                  <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-author-bio">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No biography provided yet.</p>
                )}

                {(socialLinks.audioBioUrl || socialLinks.videoBioUrl) && (
                  <div className="flex gap-3 pt-4">
                    {socialLinks.audioBioUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(socialLinks.audioBioUrl, "_blank")}
                        data-testid="button-audio-bio"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Audio Bio
                      </Button>
                    )}
                    {socialLinks.videoBioUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(socialLinks.videoBioUrl, "_blank")}
                        data-testid="button-video-bio"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Video Intro
                      </Button>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex flex-wrap gap-4">
                  <SocialLink href={profile.websiteUrl || undefined} icon={Globe} label="Website" />
                  <SocialLink href={socialLinks.twitter} icon={SiX} label="Twitter" />
                  <SocialLink href={socialLinks.instagram} icon={SiInstagram} label="Instagram" />
                  <SocialLink href={socialLinks.facebook} icon={SiFacebook} label="Facebook" />
                  <SocialLink href={socialLinks.linkedin} icon={SiLinkedin} label="LinkedIn" />
                  <SocialLink href={socialLinks.tiktok} icon={SiTiktok} label="TikTok" />
                  <SocialLink href={socialLinks.youtube} icon={SiYoutube} label="YouTube" />
                  <SocialLink href={socialLinks.amazon} icon={SiAmazon} label="Amazon" />
                  <SocialLink href={socialLinks.goodreads} icon={SiGoodreads} label="Goodreads" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Books by {profile.penName}
                </CardTitle>
                <CardDescription>
                  {books.length} {books.length === 1 ? "book" : "books"} published
                </CardDescription>
              </CardHeader>
              <CardContent>
                {books.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {books.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No books published yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(publisherInfo.achievements as string[])?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-500" />
                    Achievements & Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(publisherInfo.achievements as string[]).map((achievement, index) => (
                      <li 
                        key={index}
                        className="flex items-center gap-3 text-muted-foreground"
                        data-testid={`text-achievement-${index}`}
                      >
                        <Star className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {socialLinks.newsletter && (
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-orange-500" />
                    Newsletter
                  </CardTitle>
                  <CardDescription>
                    Get updates on new releases and exclusive content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNewsletterSignup} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-newsletter-email"
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      data-testid="button-newsletter-subscribe"
                    >
                      Subscribe
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                    data-testid="link-website"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-orange-500" />
                      Official Website
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {socialLinks.amazon && (
                  <a
                    href={socialLinks.amazon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                    data-testid="link-amazon"
                  >
                    <span className="flex items-center gap-2">
                      <SiAmazon className="w-4 h-4 text-orange-500" />
                      Amazon Author Page
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {socialLinks.goodreads && (
                  <a
                    href={socialLinks.goodreads}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                    data-testid="link-goodreads"
                  >
                    <span className="flex items-center gap-2">
                      <SiGoodreads className="w-4 h-4 text-orange-500" />
                      Goodreads Profile
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No announcements yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            Author page for {profile.penName} powered by KreAIte
          </p>
        </div>
      </footer>
    </div>
  );
}
