import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Star, 
  ShoppingCart,
  BookOpen,
  FileText,
  Printer,
  Download,
  Truck,
  Globe,
  User,
  Loader2,
  X,
  Plus,
  Minus,
  ChevronRight,
  Filter,
  SortAsc,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MarketplaceListing, BookEdition, BookReview } from "@shared/schema";

interface BookListingWithDetails extends MarketplaceListing {
  editions?: BookEdition[];
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
  };
  authorName?: string;
}

const categories = [
  { value: "all", label: "All Books" },
  { value: "memoir", label: "Memoirs" },
  { value: "self-help", label: "Self-Help" },
  { value: "recovery", label: "Recovery Guides" },
  { value: "medical", label: "Medical Reference" },
  { value: "children", label: "Children's Books" },
  { value: "caregiver", label: "Caregiver Resources" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

function BookCard({ 
  book, 
  onViewDetails 
}: { 
  book: BookListingWithDetails; 
  onViewDetails: (book: BookListingWithDetails) => void;
}) {
  const lowestPriceCents = book.editions?.reduce((min, ed) => 
    ed.price < min ? ed.price : min, book.editions[0]?.price || 999
  ) || 999;
  const lowestPrice = lowestPriceCents / 100;

  const hasEbook = book.editions?.some(ed => ed.editionType.includes('digital'));
  const hasPrint = book.editions?.some(ed => ed.editionType.includes('print'));

  return (
    <article 
      className="flex flex-col h-full" 
      data-testid={`card-book-${book.id}`}
    >
      <Card className="flex flex-col h-full hover-elevate cursor-pointer transition-all" onClick={() => onViewDetails(book)}>
        <CardHeader className="pb-2">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
            {book.coverImageUrl ? (
              <img 
                src={book.coverImageUrl} 
                alt={book.title}
                className="w-full h-full object-cover"
                data-testid={`img-book-cover-${book.id}`}
              />
            ) : (
              <BookOpen className="h-16 w-16 text-primary/50" />
            )}
            {book.isFeatured && (
              <Badge className="absolute top-2 left-2 bg-orange-500">
                <Sparkles className="w-3 h-3 mr-1" /> Featured
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <User className="w-3 h-3" />
            <span>{book.authorName || "Anonymous Author"}</span>
          </div>
          
          <CardTitle className="text-base line-clamp-2" data-testid={`text-book-title-${book.id}`}>
            {book.title}
          </CardTitle>
          
          {book.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">{book.subtitle}</p>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 pb-2">
          {book.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {book.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 flex-wrap">
            {book.reviewStats && book.reviewStats.totalReviews > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium">{book.reviewStats.averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({book.reviewStats.totalReviews})
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {hasEbook && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <FileText className="w-2.5 h-2.5 mr-0.5" /> eBook
                </Badge>
              )}
              {hasPrint && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Printer className="w-2.5 h-2.5 mr-0.5" /> Print
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <div>
            <span className="text-sm text-muted-foreground">From </span>
            <span className="text-lg font-bold text-primary" data-testid={`text-price-${book.id}`}>
              ${lowestPrice.toFixed(2)}
            </span>
          </div>
          <Button 
            size="sm" 
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(book);
            }}
            data-testid={`button-view-${book.id}`}
          >
            View Details
            <ChevronRight className="h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}

function BookSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <Skeleton className="aspect-[3/4] rounded-lg mb-3" />
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-5 w-full" />
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-28" />
      </CardFooter>
    </Card>
  );
}

function BookDetailsDialog({ 
  book, 
  isOpen, 
  onClose 
}: { 
  book: BookListingWithDetails | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedEdition, setSelectedEdition] = useState<BookEdition | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (book?.editions && book.editions.length > 0) {
      setSelectedEdition(book.editions[0]);
    }
  }, [book]);

  const checkoutMutation = useMutation({
    mutationFn: async (data: { editionId: number; quantity: number }) => {
      const response = await apiRequest('POST', '/api/marketplace/checkout', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase books.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEdition) {
      toast({
        title: "Select Format",
        description: "Please select a book format.",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({
      editionId: selectedEdition.id,
      quantity,
    });
  };

  if (!book) return null;

  const formatLabels: Record<string, string> = {
    digital_ebook: 'eBook (ePub)',
    digital_pdf: 'PDF Download',
    print_paperback: 'Paperback',
    print_hardcover: 'Hardcover',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{book.title}</DialogTitle>
          {book.subtitle && (
            <DialogDescription>{book.subtitle}</DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg overflow-hidden flex items-center justify-center">
              {book.coverImageUrl ? (
                <img 
                  src={book.coverImageUrl} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="h-24 w-24 text-primary/50" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">By {book.authorName || "Anonymous Author"}</span>
            </div>

            {book.reviewStats && book.reviewStats.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(book.reviewStats!.averageRating) 
                          ? 'fill-yellow-500 text-yellow-500' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{book.reviewStats.averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({book.reviewStats.totalReviews} reviews)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{book.description}</p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Select Format</h4>
              <div className="space-y-2">
                {book.editions?.map((edition) => (
                  <button
                    key={edition.id}
                    onClick={() => setSelectedEdition(edition)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedEdition?.id === edition.id
                        ? 'border-orange-500 bg-primary/10'
                        : 'border-border hover:border-orange-500/50'
                    }`}
                    data-testid={`button-edition-${edition.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {edition.editionType.includes('digital') ? (
                          <FileText className="w-4 h-4 text-primary" />
                        ) : (
                          <Printer className="w-4 h-4 text-primary" />
                        )}
                        <span className="font-medium">{formatLabels[edition.editionType] || edition.editionType}</span>
                      </div>
                      <span className="font-bold text-primary">${(Number(edition.price) / 100).toFixed(2)}</span>
                    </div>
                    {edition.editionType.includes('print') && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Ships in 3-5 days
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Worldwide
                        </span>
                      </div>
                    )}
                    {edition.editionType.includes('digital') && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Download className="w-3 h-3" /> Instant download
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedEdition && selectedEdition.editionType.includes('print') && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedEdition && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-xl font-bold">
                    ${((Number(selectedEdition.price) / 100) * quantity).toFixed(2)}
                  </span>
                </div>
                {selectedEdition.editionType.includes('print') && (
                  <p className="text-xs text-muted-foreground">
                    Shipping calculated at checkout
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Continue Browsing
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!selectedEdition || checkoutMutation.isPending}
            className="gap-2"
            data-testid="button-checkout"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {selectedEdition?.editionType.includes('digital') ? 'Buy Now' : 'Proceed to Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBook, setSelectedBook] = useState<BookListingWithDetails | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: books, isLoading } = useQuery<BookListingWithDetails[]>({
    queryKey: ['/api/marketplace/listings', { category: selectedCategory, sort: sortBy }],
  });

  const filteredBooks = books?.filter(book => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.subtitle?.toLowerCase().includes(query) ||
      book.description?.toLowerCase().includes(query) ||
      book.authorName?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    document.title = "Book Marketplace | Stroke Recovery Academy";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Discover books written by stroke survivors and recovery experts. Find memoirs, self-help guides, and resources to support your stroke recovery journey.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CreatorHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border">
              <BookOpen className="w-3 h-3 mr-1" /> Book Marketplace
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-page-title">
              Books by Stroke Recovery Experts
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover inspiring memoirs, practical guides, and expert resources written by 
              survivors who understand your journey. Every purchase supports authors in the 
              stroke recovery community.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search books, authors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-books"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <div className={`flex-1 flex items-center gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]" data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]" data-testid="select-sort">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <BookSkeleton key={i} />
              ))}
            </div>
          ) : filteredBooks && filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onViewDetails={setSelectedBook}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No books match "${searchQuery}"` 
                  : "No books in this category yet. Check back soon!"}
              </p>
              {(selectedCategory !== 'all' || searchQuery) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          )}
        </section>

        <section className="mt-16 py-12 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Support Survivors</h3>
              <p className="text-sm text-muted-foreground">
                Every purchase directly supports stroke survivors and recovery experts sharing their knowledge.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Worldwide Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Print books shipped globally. eBooks available for instant download anywhere.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                Professional print-on-demand ensures every book is printed fresh with the highest quality.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      <BookDetailsDialog
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
