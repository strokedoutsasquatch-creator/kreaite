import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Star,
  Package,
  Search,
  Sparkles,
  BookOpen,
  Music,
  Video,
  GraduationCap,
  Palette,
  Library,
} from "lucide-react";

interface Product {
  id: number;
  categoryId: number;
  title: string;
  brand?: string;
  description?: string;
  features?: string[];
  imageUrl?: string;
  amazonUrl: string;
  priceDisplay?: string;
  rating?: string;
  reviewCount?: number;
  isFeatured: boolean;
  tags?: string[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isFeatured: boolean;
}

const studioIcons: Record<string, typeof BookOpen> = {
  writing: BookOpen,
  audio: Music,
  video: Video,
  teaching: GraduationCap,
  design: Palette,
  research: Library,
};

export default function CreatorStore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/marketplace/categories"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/marketplace/products"],
  });

  const { data: featuredProducts } = useQuery<Product[]>({
    queryKey: ["/api/marketplace/products", { featured: true }],
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      product.categoryId === parseInt(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <CreatorHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-[#FF6B35]" />
              <h1 className="text-4xl font-bold font-serif">Creator Tools</h1>
            </div>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Hand-picked tools and resources to help you create your best work.
              Every recommendation is chosen to help creators succeed.
            </p>
          </div>

          {featuredProducts && featuredProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#FF6B35] text-white">Featured</Badge>
                <h2 className="text-xl font-semibold">Creator's Choice</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 4).map((product) => (
                  <FeaturedProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                data-testid="input-search-products"
              />
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
            <TabsList className="bg-zinc-900 border-zinc-800 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
                data-testid="tab-category-all"
              >
                All Tools
              </TabsTrigger>
              {categoriesLoading ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                categories?.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id.toString()}
                    className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
                    data-testid={`tab-category-${category.slug}`}
                  >
                    {category.name}
                  </TabsTrigger>
                ))
              )}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              {productsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array(8)
                    .fill(0)
                    .map((_, i) => (
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
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No products found
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Products coming soon to this category"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-8 text-center space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Why These Tools?
              </h3>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Every product in the Creator Tools store is hand-selected to help you
                create better content. We focus on quality, value, and tools that
                successful creators actually use. When you purchase through our links,
                you support KreAIte at no extra cost to you.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeaturedProductCard({ product }: { product: Product }) {
  return (
    <Card
      className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-[#FF6B35]/30 overflow-hidden group hover:border-[#FF6B35]/50 transition-all"
      data-testid={`featured-product-${product.id}`}
    >
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[10px]">
          Creator's Choice
        </Badge>
      </div>
      <CardContent className="p-4 space-y-2">
        <h4 className="text-sm font-medium text-white line-clamp-2">
          {product.title}
        </h4>
        <div className="flex items-center justify-between">
          {product.priceDisplay && (
            <p className="text-lg font-bold text-[#FF6B35]">
              {product.priceDisplay}
            </p>
          )}
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-xs text-zinc-400">{product.rating}</span>
            </div>
          )}
        </div>
        <Button
          asChild
          size="sm"
          className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
        >
          <a href={product.amazonUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" />
            Shop Now
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card
      className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors"
      data-testid={`product-${product.id}`}
    >
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        {product.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[10px]">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        {product.brand && (
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {product.brand}
          </p>
        )}
        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#FF6B35] transition-colors">
          {product.title}
        </h4>
        <div className="flex items-center justify-between">
          {product.priceDisplay && (
            <p className="text-lg font-bold text-[#FF6B35]">
              {product.priceDisplay}
            </p>
          )}
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-xs text-zinc-400">{product.rating}</span>
              {product.reviewCount && (
                <span className="text-xs text-zinc-500">
                  ({product.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          asChild
          className="w-full mt-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
        >
          <a href={product.amazonUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Amazon
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <Skeleton className="aspect-square bg-zinc-800" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/3 bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-2/3 bg-zinc-800" />
        <Skeleton className="h-8 w-1/2 bg-zinc-800" />
        <Skeleton className="h-9 w-full bg-zinc-800" />
      </CardContent>
    </Card>
  );
}
