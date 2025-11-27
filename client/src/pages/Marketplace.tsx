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
  BookOpen,
  ImageOff
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
  const [imageError, setImageError] = useState(false);
  
  const handleBuyClick = () => {
    window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
  };

  const getProxiedImageUrl = (url: string) => {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <article 
      className="flex flex-col h-full" 
      data-testid={`card-product-${product.id}`}
      aria-label={`Stroke recovery product: ${product.title}`}
    >
      <Card className="flex flex-col h-full hover-elevate">
        <CardHeader className="pb-2">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-3">
            {product.imageUrl && !imageError ? (
              <img 
                src={getProxiedImageUrl(product.imageUrl)} 
                alt={`${product.title} - Stroke recovery ${product.brand ? `by ${product.brand}` : 'equipment'}`}
                className="w-full h-full object-contain p-4"
                data-testid={`img-product-${product.id}`}
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                role="img"
                aria-label={`Placeholder for ${product.title}`}
              >
                {imageError ? (
                  <ImageOff className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                )}
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
              <div className="flex items-center gap-1" aria-label={`Rating: ${product.rating} out of 5 stars`}>
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                <span className="text-sm font-medium">{product.rating}</span>
                {product.reviewCount && (
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {product.features && product.features.length > 0 && (
            <ul className="mt-3 space-y-1" aria-label="Product features">
              {product.features.slice(0, 2).map((feature, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary mt-0.5" aria-hidden="true">•</span>
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
            aria-label={`View ${product.title} on Amazon`}
          >
            View on Amazon
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <Card className="flex flex-col h-full" aria-hidden="true">
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

function SEOHead({ products }: { products?: MarketplaceProduct[] }) {
  useEffect(() => {
    document.title = "Stroke Recovery Products & Equipment | StrokeRecoveryAcademy.com";
    
    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateOrCreateLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    updateOrCreateMeta('description', 'Shop essential stroke recovery products, mobility aids, therapy equipment, and daily living tools. Curated by a stroke survivor who achieved 90% recovery. Find the best rehabilitation equipment to support your stroke recovery journey.');
    
    updateOrCreateLink('canonical', 'https://strokerecoveryacademy.com/marketplace');

    updateOrCreateMeta('og:title', 'Stroke Recovery Products & Equipment | StrokeRecoveryAcademy.com', true);
    updateOrCreateMeta('og:description', 'Shop curated stroke recovery products including mobility aids, therapy equipment, and rehabilitation tools. Recommended by a survivor who achieved 90% recovery.', true);
    updateOrCreateMeta('og:type', 'website', true);
    updateOrCreateMeta('og:url', 'https://strokerecoveryacademy.com/marketplace', true);
    updateOrCreateMeta('og:site_name', 'StrokeRecoveryAcademy.com', true);

    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', 'Stroke Recovery Products & Equipment | StrokeRecoveryAcademy.com');
    updateOrCreateMeta('twitter:description', 'Shop curated stroke recovery products including mobility aids, therapy equipment, and rehabilitation tools.');

    updateOrCreateMeta('keywords', 'stroke recovery products, stroke rehabilitation equipment, mobility aids, therapy equipment, stroke survivor, recovery tools, physical therapy, occupational therapy, stroke recovery marketplace');

    return () => {
    };
  }, []);

  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="marketplace"]');
    if (existingScript) {
      existingScript.remove();
    }

    const jsonLdData: any = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://strokerecoveryacademy.com/#organization",
          "name": "StrokeRecoveryAcademy",
          "url": "https://strokerecoveryacademy.com",
          "description": "Comprehensive stroke recovery platform founded by Nick 'The Stroked Out Sasquatch' Kremers, providing proven recovery methods, products, and community support.",
          "sameAs": []
        },
        {
          "@type": "WebPage",
          "@id": "https://strokerecoveryacademy.com/marketplace",
          "url": "https://strokerecoveryacademy.com/marketplace",
          "name": "Stroke Recovery Products & Equipment | StrokeRecoveryAcademy.com",
          "description": "Shop essential stroke recovery products, mobility aids, therapy equipment, and daily living tools curated by a stroke survivor.",
          "isPartOf": {
            "@id": "https://strokerecoveryacademy.com/#website"
          }
        }
      ]
    };

    if (products && products.length > 0) {
      const itemList = {
        "@type": "ItemList",
        "name": "Stroke Recovery Products",
        "description": "Curated stroke recovery products and equipment",
        "numberOfItems": products.length,
        "itemListElement": products.slice(0, 20).map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.title,
            "description": product.description || `Stroke recovery product: ${product.title}`,
            "image": product.imageUrl || undefined,
            "brand": product.brand ? {
              "@type": "Brand",
              "name": product.brand
            } : undefined,
            "url": product.amazonUrl,
            ...(product.priceDisplay && {
              "offers": {
                "@type": "Offer",
                "price": product.priceDisplay.replace(/[^0-9.]/g, ''),
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": product.amazonUrl
              }
            }),
            ...(product.rating && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "bestRating": 5,
                "reviewCount": product.reviewCount || 1
              }
            })
          }
        }))
      };
      jsonLdData["@graph"].push(itemList);
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'marketplace');
    script.textContent = JSON.stringify(jsonLdData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="marketplace"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [products]);

  return null;
}

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
      <SEOHead products={filteredProducts} />
      <Header />
      
      <main className="container mx-auto px-4 py-8" role="main">
        <section className="mb-8" aria-labelledby="marketplace-heading">
          <header className="mb-8">
            <h1 
              id="marketplace-heading"
              className="text-3xl md:text-4xl font-bold text-foreground mb-4" 
              data-testid="text-marketplace-title"
            >
              Stroke Recovery Products & Equipment
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Discover essential stroke recovery products curated by survivors who understand your journey. 
              From mobility aids and therapy equipment to daily living tools, find the rehabilitation 
              products that can support your path to recovery. Every item is personally vetted based on 
              real recovery experience.
            </p>
          </header>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Recovery Marketplace
              </h2>
              <p className="text-muted-foreground mt-1">
                Curated products to support your stroke recovery journey
              </p>
            </div>
            
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Search stroke recovery products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-products"
                aria-label="Search stroke recovery products"
              />
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 mb-6" aria-label="Product categories">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-category-all"
              aria-pressed={selectedCategory === null}
            >
              All Products
            </Button>
            {categoriesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" aria-hidden="true" />
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
                  aria-pressed={selectedCategory === category.id}
                >
                  {categoryIcons[category.slug] || categoryIcons[category.icon || ""] || <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
                  {category.name}
                </Button>
              ))
            )}
          </nav>
        </section>

        <section aria-label="Product listings">
          {productsLoading ? (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              aria-busy="true"
              aria-label="Loading products"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              role="list"
              aria-label={`${filteredProducts.length} stroke recovery products`}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch 
                  ? `No stroke recovery products match "${debouncedSearch}"` 
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

        <section className="mt-12 py-8 border-t border-border" aria-label="Affiliate disclosure">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              As an Amazon Associate, we earn from qualifying purchases. 
              All stroke recovery products are personally vetted and recommended based on real recovery experience.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
