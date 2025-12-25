import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  ExternalLink, 
  Star, 
  Heart,
  BookOpen,
  Music,
  Video,
  Film,
  GraduationCap,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Clock,
  Eye,
  Crown,
  Sparkles,
  Headphones,
  Palette,
  ListMusic,
  Loader2,
  DollarSign,
  Radio,
  TrendingUp,
  Zap,
} from "lucide-react";

interface CreatorContent {
  id: string;
  title: string;
  creator: string;
  creatorAvatar?: string;
  type: "music" | "video" | "movie" | "course" | "book" | "image";
  coverArt?: string;
  price: number;
  streamCount?: number;
  duration?: string;
  genre?: string;
  rating?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  description?: string;
  releaseDate?: string;
  amazonUrl?: string;
}

interface MarketplaceBook {
  id: number;
  title: string;
  authorName: string;
  price: string;
  genre?: string;
  rating?: string;
  amazonUrl?: string;
  coverImageUrl?: string;
  description?: string;
  isFeatured?: boolean;
}

interface MarketplaceProduct {
  id: number;
  title: string;
  description?: string;
  price: string;
  imageUrl?: string;
  amazonUrl?: string;
  isFeatured?: boolean;
}

interface StripeProduct {
  product_id: string;
  product_name: string;
  product_description?: string;
  unit_amount?: number;
  currency?: string;
  price_id?: string;
}

function MusicPlayer({ track, onClose }: { track: CreatorContent | null; onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-orange-500/30 p-4 z-50 backdrop-blur-lg">
      <div className="container mx-auto flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{track.title}</p>
            <p className="text-sm text-muted-foreground truncate">{track.creator}</p>
          </div>
          <Button size="icon" variant="ghost" className="shrink-0" data-testid="button-favorite-track">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" data-testid="button-shuffle">
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-prev">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              className="rounded-full bg-orange-500"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-next">
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-repeat">
              <Repeat className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-muted-foreground w-10 text-right">1:23</span>
            <Slider 
              value={[progress]} 
              max={100} 
              step={1}
              onValueChange={(v) => setProgress(v[0])}
              className="flex-1"
              data-testid="slider-progress"
            />
            <span className="text-xs text-muted-foreground w-10">{track.duration}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)} data-testid="button-mute-toggle">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider 
            value={[isMuted ? 0 : volume]} 
            max={100} 
            step={1}
            onValueChange={(v) => { setVolume(v[0]); setIsMuted(false); }}
            className="w-24"
            data-testid="slider-volume"
          />
          <Button size="icon" variant="ghost" data-testid="button-queue">
            <ListMusic className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContentCard({ content, onPlay }: { content: CreatorContent; onPlay: (content: CreatorContent) => void }) {
  const getIcon = () => {
    switch (content.type) {
      case "music": return <Music className="w-6 h-6" />;
      case "video": return <Video className="w-6 h-6" />;
      case "movie": return <Film className="w-6 h-6" />;
      case "course": return <GraduationCap className="w-6 h-6" />;
      case "book": return <BookOpen className="w-6 h-6" />;
      case "image": return <Palette className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const getGradient = () => {
    switch (content.type) {
      case "music": return "from-orange-500 to-pink-500";
      case "video": return "from-blue-500 to-purple-500";
      case "movie": return "from-red-500 to-orange-500";
      case "course": return "from-green-500 to-teal-500";
      case "book": return "from-purple-500 to-indigo-500";
      case "image": return "from-yellow-500 to-orange-500";
      default: return "from-orange-500 to-purple-500";
    }
  };

  return (
    <Card className="group hover-elevate overflow-hidden" data-testid={`card-content-${content.id}`}>
      <div className={`relative aspect-square bg-gradient-to-br ${getGradient()} flex items-center justify-center`}>
        <div className="text-white opacity-50">
          {getIcon()}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button 
            size="lg"
            className="rounded-full bg-orange-500 shadow-xl"
            onClick={() => onPlay(content)}
            data-testid={`button-play-${content.id}`}
          >
            <Play className="w-6 h-6 ml-1" />
          </Button>
        </div>
        {content.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-orange-500">
            <Crown className="w-3 h-3 mr-1" /> Featured
          </Badge>
        )}
        {content.isNew && (
          <Badge className="absolute top-2 right-2 bg-green-500">New</Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1" data-testid={`text-title-${content.id}`}>{content.title}</h3>
        <p className="text-sm text-muted-foreground">{content.creator}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {content.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {content.duration}
            </span>
          )}
          {content.streamCount && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {(content.streamCount / 1000).toFixed(0)}K
            </span>
          )}
          {content.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {content.rating}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="font-bold text-orange-500" data-testid={`text-price-${content.id}`}>
          {content.price === 0 ? "FREE" : `$${content.price.toFixed(2)}`}
        </span>
        <div className="flex gap-2">
          {(content.type === "music" || content.type === "video") && (
            <Button size="sm" variant="outline" onClick={() => onPlay(content)} data-testid={`button-stream-${content.id}`}>
              <Headphones className="w-4 h-4 mr-1" /> Stream
            </Button>
          )}
          <Button size="sm" data-testid={`button-buy-${content.id}`}>
            {content.price === 0 ? "Get Free" : "Buy"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function FeaturedCarousel({ items, onPlay }: { items: CreatorContent[]; onPlay: (content: CreatorContent) => void }) {
  const featured = items.filter(i => i.isFeatured);
  
  if (featured.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Crown className="w-6 h-6 text-orange-500" /> Featured Creators
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.slice(0, 3).map(item => (
          <Card key={item.id} className="overflow-hidden group cursor-pointer hover-elevate" onClick={() => onPlay(item)}>
            <div className={`relative h-48 bg-gradient-to-br from-orange-500 via-purple-500 to-pink-500 flex items-center justify-center`}>
              <div className="text-white">
                <Music className="w-16 h-16 opacity-30" />
              </div>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="lg" className="rounded-full bg-orange-500" data-testid={`button-featured-play-${item.id}`}>
                  <Play className="w-8 h-8 ml-1" />
                </Button>
              </div>
              <Badge className="absolute top-4 left-4 bg-black/50 backdrop-blur">
                <Crown className="w-3 h-3 mr-1" /> Featured
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground">{item.creator}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {(item.streamCount! / 1000).toFixed(0)}K streams
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {item.rating}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreatorStats() {
  return (
    <Card className="mb-8 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-pink-500/10 border-orange-500/20">
      <CardContent className="py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-orange-500">15K+</div>
            <div className="text-sm text-muted-foreground">Creators</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-500">250K+</div>
            <div className="text-sm text-muted-foreground">Content Items</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-500">$2.5M+</div>
            <div className="text-sm text-muted-foreground">Creator Earnings</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-500">85%</div>
            <div className="text-sm text-muted-foreground">To Creators</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BecomeCreatorCTA() {
  return (
    <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-black/20" />
      <CardContent className="py-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Become a KreAIte Creator</h2>
          <p className="text-lg opacity-90 mb-6">
            You don't need Silicon Valley to become a star. Create music, videos, courses, and books with AI - 
            then sell or stream them to the world. Keep 85% of every sale.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-orange-500 hover:bg-white/90" data-testid="button-start-creating">
              <Sparkles className="w-5 h-5 mr-2" /> Start Creating
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState("books");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState<CreatorContent | null>(null);

  const { data: booksData, isLoading: booksLoading } = useQuery<MarketplaceBook[]>({
    queryKey: ['/api/marketplace/books'],
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<MarketplaceProduct[]>({
    queryKey: ['/api/marketplace/products'],
  });

  const { data: stripeProducts, isLoading: stripeLoading } = useQuery<StripeProduct[]>({
    queryKey: ['/api/stripe/products'],
  });

  const handlePlay = (content: CreatorContent) => {
    if (content.type === "music") {
      setCurrentTrack(content);
    }
  };

  const transformBooksToContent = (books: MarketplaceBook[]): CreatorContent[] => {
    return books.map(book => ({
      id: `book-${book.id}`,
      title: book.title,
      creator: book.authorName,
      type: "book" as const,
      price: parseFloat(book.price) || 0,
      genre: book.genre,
      rating: book.rating ? parseFloat(book.rating) : undefined,
      description: book.description,
      isFeatured: book.isFeatured,
      amazonUrl: book.amazonUrl,
      coverArt: book.coverImageUrl,
    }));
  };

  const transformProductsToContent = (products: MarketplaceProduct[]): CreatorContent[] => {
    return products.map(product => ({
      id: `product-${product.id}`,
      title: product.title,
      creator: "KreAIte Store",
      type: "course" as const,
      price: parseFloat(product.price) || 0,
      description: product.description,
      isFeatured: product.isFeatured,
      amazonUrl: product.amazonUrl,
      coverArt: product.imageUrl,
    }));
  };

  const transformStripeToContent = (products: StripeProduct[]): CreatorContent[] => {
    return products.map(product => ({
      id: product.product_id,
      title: product.product_name,
      creator: "KreAIte",
      type: "course" as const,
      price: product.unit_amount ? product.unit_amount / 100 : 0,
      description: product.product_description,
      isFeatured: true,
    }));
  };

  const getContentForTab = (): CreatorContent[] => {
    switch (activeTab) {
      case "books":
        return booksData ? transformBooksToContent(booksData) : [];
      case "courses":
        if (stripeProducts) return transformStripeToContent(stripeProducts);
        if (productsData) return transformProductsToContent(productsData);
        return [];
      default:
        return [];
    }
  };

  const isLoading = booksLoading || productsLoading || stripeLoading;

  const filteredContent = getContentForTab().filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-background ${currentTrack ? 'pb-24' : ''}`}>
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                KreAIte Marketplace
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover music, videos, courses, and books from creators around the world. 
              Stream, buy, and support independent creators.
            </p>
          </div>

          <CreatorStats />

          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search music, videos, courses, books..."
              className="pl-12 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-marketplace"
            />
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto gap-1">
            <TabsTrigger value="music" className="gap-2" data-testid="tab-music">
              <Music className="w-4 h-4" /> Music
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2" data-testid="tab-videos">
              <Video className="w-4 h-4" /> Videos
            </TabsTrigger>
            <TabsTrigger value="movies" className="gap-2" data-testid="tab-movies">
              <Film className="w-4 h-4" /> Movies
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2" data-testid="tab-courses">
              <GraduationCap className="w-4 h-4" /> Courses
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-2" data-testid="tab-books">
              <BookOpen className="w-4 h-4" /> Books
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="mt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Music className="w-6 h-6 text-orange-500" /> Music
            </h2>
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Music streaming coming soon!</p>
              <p className="text-sm">Create your own music in the Music Studio.</p>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-500" /> Videos
            </h2>
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Video content coming soon!</p>
              <p className="text-sm">Create videos in the Video Studio.</p>
            </div>
          </TabsContent>

          <TabsContent value="movies" className="mt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Film className="w-6 h-6 text-red-500" /> Movies
            </h2>
            <div className="text-center py-12 text-muted-foreground">
              <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Feature films coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-green-500" /> Courses & Products
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map(content => (
                  <ContentCard key={content.id} content={content} onPlay={handlePlay} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No courses available yet.</p>
                <p className="text-sm">Create your own course in the Course Studio.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="books" className="mt-8">
            {booksData && booksData.length > 0 && (
              <FeaturedCarousel items={transformBooksToContent(booksData.filter(b => b.isFeatured))} onPlay={handlePlay} />
            )}
            
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-500" /> Published Books
            </h2>
            {booksLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredContent.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredContent.map(content => (
                  <ContentCard key={content.id} content={content} onPlay={handlePlay} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No books published yet.</p>
                <p className="text-sm">Be the first to publish! Start in the Book Studio.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <section className="mt-12">
          <BecomeCreatorCTA />
        </section>

        <section className="mt-12 py-8 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">AI-Powered Creation</h3>
              <p className="text-sm text-muted-foreground">Create with cutting-edge AI tools</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">85% Creator Earnings</h3>
              <p className="text-sm text-muted-foreground">Industry-leading revenue share</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Radio className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Global Distribution</h3>
              <p className="text-sm text-muted-foreground">Reach audiences worldwide</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Instant Publishing</h3>
              <p className="text-sm text-muted-foreground">Go live in minutes</p>
            </div>
          </div>
        </section>
      </main>

      <MusicPlayer track={currentTrack} onClose={() => setCurrentTrack(null)} />
    </div>
  );
}
