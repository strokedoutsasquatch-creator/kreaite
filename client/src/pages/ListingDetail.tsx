import { useState } from "react";
import { useRoute, Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  BookOpen,
  Music,
  Video,
  GraduationCap,
  Image as ImageIcon,
  FileText,
  Clock,
  Eye,
  Download,
  Play,
  ArrowLeft,
  ThumbsUp,
  CheckCircle,
  Globe,
} from "lucide-react";
import { useMarketplaceListing, useListingReviews, useCreateCheckout, type MarketplaceReview } from "@/lib/hooks/useMarketplace";
import { useLocaleContext } from "@/lib/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const contentTypeIcons: Record<string, typeof BookOpen> = {
  book: BookOpen,
  music: Music,
  video: Video,
  course: GraduationCap,
  image: ImageIcon,
  doctrine: FileText,
};

const contentTypeLabels: Record<string, string> = {
  book: "Book",
  music: "Music",
  video: "Video",
  course: "Course",
  image: "Image Pack",
  doctrine: "Knowledge Base",
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const stars = [];
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`${sizeClass} ${i <= Math.round(rating) ? "fill-orange-500 text-primary" : "text-zinc-600"}`}
      />
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

function ReviewCard({ review }: { review: MarketplaceReview }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border">
              <AvatarImage src={review.user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {review.user?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground">
                {review.user?.firstName || "Anonymous"} {review.user?.lastName?.[0] || ""}
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                {review.isVerifiedPurchase && (
                  <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
        {review.title && (
          <h4 className="font-semibold text-foreground">{review.title}</h4>
        )}
        {review.content && (
          <p className="text-sm text-muted-foreground">{review.content}</p>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <ThumbsUp className="w-3 h-3" />
            Helpful ({review.helpfulCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const listingId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useLocaleContext();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { data: listing, isLoading: listingLoading } = useMarketplaceListing(listingId);
  const { data: reviews, isLoading: reviewsLoading } = useListingReviews(listingId ? parseInt(listingId) : undefined);
  const purchaseMutation = useCreateCheckout();

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    if (!listing) return;

    try {
      const result = await purchaseMutation.mutateAsync({
        listingId: listing.id,
        quantity: 1,
      });
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast({
          title: "Purchase Initiated",
          description: "Redirecting to checkout...",
        });
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Unable to initiate checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Listing URL copied to clipboard",
    });
  };

  const ContentIcon = listing?.genre ? contentTypeIcons[listing.genre] || BookOpen : BookOpen;

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CreatorHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <CreatorHeader />
        <main className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Listing Not Found</h1>
          <p className="text-muted-foreground mb-8">This content may have been removed or is unavailable.</p>
          <Link href="/marketplace">
            <Button className="bg-orange-500 hover:bg-orange-600 text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const ratingDistribution = [
    { stars: 5, percent: 65 },
    { stars: 4, percent: 20 },
    { stars: 3, percent: 10 },
    { stars: 2, percent: 3 },
    { stars: 1, percent: 2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/marketplace">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2" data-testid="link-back-marketplace">
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Button>
        </Link>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          <div className="space-y-8">
            <div className="relative aspect-[3/4] md:aspect-[4/3] rounded-lg overflow-hidden bg-zinc-900">
              {listing.coverImageUrl ? (
                <img
                  src={listing.coverImageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  data-testid="img-listing-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ContentIcon className="w-24 h-24 text-zinc-700" />
                </div>
              )}
              {listing.previewUrl && (
                <Button
                  size="lg"
                  className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-black gap-2"
                  data-testid="button-preview"
                >
                  <Play className="w-5 h-5" />
                  Preview
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">About This {contentTypeLabels[listing.genre] || "Content"}</h2>
              <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {listing.pageCount && (
                  <div className="text-center p-4 bg-zinc-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{listing.pageCount}</div>
                    <div className="text-xs text-muted-foreground">Pages</div>
                  </div>
                )}
                {listing.wordCount && (
                  <div className="text-center p-4 bg-zinc-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{(listing.wordCount / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                )}
                <div className="text-center p-4 bg-zinc-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{listing.totalSales}</div>
                  <div className="text-xs text-muted-foreground">Sales</div>
                </div>
                <div className="text-center p-4 bg-zinc-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{listing.reviewCount}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Customer Reviews</h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={listing.averageRating || 0} size="lg" />
                  <span className="text-lg font-bold text-foreground">{(listing.averageRating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({listing.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="grid md:grid-cols-[200px,1fr] gap-6">
                <div className="space-y-2">
                  {ratingDistribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-6">{item.stars}</span>
                      <Star className="w-4 h-4 fill-orange-500 text-primary" />
                      <Progress value={item.percent} className="h-2 flex-1" />
                      <span className="text-sm text-muted-foreground w-10">{item.percent}%</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {reviewsLoading ? (
                    <>
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </>
                  ) : reviews && reviews.length > 0 ? (
                    reviews.slice(0, 5).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-8 text-center">
                        <Star className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 space-y-6 h-fit">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border">
                    <ContentIcon className="w-3 h-3 mr-1" />
                    {contentTypeLabels[listing.genre] || listing.genre}
                  </Badge>
                  {listing.isFeatured && (
                    <Badge variant="outline" className="border-orange-500/50 text-primary">
                      Featured
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-foreground" data-testid="text-listing-title">{listing.title}</h1>
                {listing.subtitle && (
                  <p className="text-muted-foreground">{listing.subtitle}</p>
                )}

                <div className="flex items-center gap-2">
                  <StarRating rating={listing.averageRating || 0} />
                  <span className="text-sm text-muted-foreground">
                    {(listing.averageRating || 0).toFixed(1)} ({listing.reviewCount} reviews)
                  </span>
                </div>

                <Separator className="bg-zinc-800" />

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground" data-testid="text-listing-price">
                    {formatCurrency(listing.totalRevenue > 0 ? listing.totalRevenue / listing.totalSales : 9.99)}
                  </span>
                  {listing.isDigitalOnly && (
                    <Badge variant="outline" className="text-xs border-zinc-700">
                      <Download className="w-3 h-3 mr-1" />
                      Digital
                    </Badge>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold gap-2"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchaseMutation.isPending}
                    data-testid="button-buy-now"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {purchaseMutation.isPending ? "Processing..." : "Buy Now"}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-zinc-700 gap-2"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      data-testid="button-wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                      {isWishlisted ? "Saved" : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-zinc-700 gap-2"
                      onClick={handleShare}
                      data-testid="button-share"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>Available worldwide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    <span>Instant digital delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Secure checkout via Stripe</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-2">Creator Earnings</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Progress value={85} className="h-2" />
                  </div>
                  <span className="text-sm font-medium text-primary">85%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Creators keep 85% of every sale. You support independent creators directly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
