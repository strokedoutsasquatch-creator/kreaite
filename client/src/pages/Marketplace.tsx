import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ExternalLink, 
  Star, 
  ShoppingCart,
  Accessibility,
  Heart,
  Brain,
  Dumbbell,
  Utensils,
  Hand,
  Footprints,
  Activity,
  Pill,
  Armchair,
  BookOpen
} from "lucide-react";
import type { MarketplaceCategory, MarketplaceProduct } from "@shared/schema";

const categoryIcons: Record<string, React.ReactNode> = {
  mobility: <Footprints className="h-5 w-5" />,
  therapy: <Hand className="h-5 w-5" />,
  exercise: <Dumbbell className="h-5 w-5" />,
  daily: <Utensils className="h-5 w-5" />,
  cognitive: <Brain className="h-5 w-5" />,
  comfort: <Armchair className="h-5 w-5" />,
  health: <Heart className="h-5 w-5" />,
  medical: <Pill className="h-5 w-5" />,
  accessibility: <Accessibility className="h-5 w-5" />,
  monitoring: <Activity className="h-5 w-5" />,
  books: <BookOpen className="h-5 w-5" />,
};

function ProductCard({ product }: { product: MarketplaceProduct }) {
  const handleBuyClick = () => {
    window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="flex flex-col h-full hover-elevate" data-testid={`card-product-${product.id}`}>
      <CardHeader className="pb-2">
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-3">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.title}
              className="w-full h-full object-contain p-4"
              data-testid={`img-product-${product.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {product.isFeatured && (
            <Badge className="absolute top-2 left-2 bg-primary">Featured</Badge>
          )}
        </div>
        {product.brand && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.brand}</p>
        )}
        <CardTitle className="text-base line-clamp-2" data-testid={`text-product-title-${product.id}`}>
          {product.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 pb-2">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 flex-wrap">
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">{product.rating}</span>
              {product.reviewCount && (
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        {product.features && product.features.length > 0 && (
          <ul className="mt-3 space-y-1">
            {product.features.slice(0, 2).map((feature, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-primary mt-0.5">•</span>
                <span className="line-clamp-1">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        {product.priceDisplay ? (
          <span className="text-lg font-bold text-foreground" data-testid={`text-price-${product.id}`}>
            {product.priceDisplay}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">See price on Amazon</span>
        )}
        <Button 
          size="sm" 
          className="gap-1"
          onClick={handleBuyClick}
          data-testid={`button-buy-${product.id}`}
        >
          View on Amazon
          <ExternalLink className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProductSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <Skeleton className="aspect-square rounded-lg mb-3" />
        <Skeleton className="h-3 w-20 mb-2" />
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

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    document.title = "Stroke Recovery Marketplace | Stroke Recovery OS";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Shop essential stroke recovery products including mobility aids, therapy equipment, and daily living tools. Curated recommendations from a stroke survivor who achieved 90% recovery.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categories, isLoading: categoriesLoading } = useQuery<MarketplaceCategory[]>({
    queryKey: ["/api/marketplace/categories"],
  });

  const buildProductsUrl = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoryId', selectedCategory.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    const queryString = params.toString();
    return queryString ? `/api/marketplace/products?${queryString}` : '/api/marketplace/products';
  };

  const { data: products, isLoading: productsLoading } = useQuery<MarketplaceProduct[]>({
    queryKey: ["/api/marketplace/products", selectedCategory, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(buildProductsUrl(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const filteredProducts = products?.filter(product => {
    if (selectedCategory && product.categoryId !== selectedCategory) return false;
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        product.title.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-marketplace-title">
                Recovery Marketplace
              </h1>
              <p className="text-muted-foreground mt-1">
                Curated products to support your stroke recovery journey
              </p>
            </div>
            
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-products"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-category-all"
            >
              All Products
            </Button>
            {categoriesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))
            ) : (
              categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-1"
                  data-testid={`button-category-${category.slug}`}
                >
                  {categoryIcons[category.slug] || categoryIcons[category.icon || ""] || <ShoppingCart className="h-4 w-4" />}
                  {category.name}
                </Button>
              ))
            )}
          </div>
        </section>

        <section>
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch 
                  ? `No products match "${debouncedSearch}"` 
                  : "No products in this category yet"}
              </p>
              {(selectedCategory || debouncedSearch) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          )}
        </section>

        <section className="mt-12 py-8 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              As an Amazon Associate, we earn from qualifying purchases. 
              All products are personally vetted and recommended based on real recovery experience.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
