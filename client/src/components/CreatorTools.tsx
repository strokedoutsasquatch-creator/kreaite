import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Package, Sparkles } from "lucide-react";

interface Product {
  id: number;
  title: string;
  brand?: string;
  description?: string;
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
}

interface CreatorToolsProps {
  studioType?: "book" | "music" | "video" | "course" | "image" | "doctrine";
  variant?: "sidebar" | "inline" | "full";
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const studioTagMap: Record<string, string[]> = {
  book: ["writing", "author", "publishing", "books", "editing"],
  music: ["audio", "music", "production", "recording", "studio"],
  video: ["video", "camera", "lighting", "production", "filming"],
  course: ["teaching", "education", "presentation", "recording"],
  image: ["design", "graphics", "art", "illustration", "photo"],
  doctrine: ["research", "organization", "knowledge", "reference"],
};

export default function CreatorTools({
  studioType,
  variant = "sidebar",
  limit = 4,
  showHeader = true,
  className = "",
}: CreatorToolsProps) {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/marketplace/products", { featured: true, limit }],
  });

  const relevantProducts = products?.filter((product) => {
    if (!studioType) return true;
    const tags = studioTagMap[studioType] || [];
    const productTags = product.tags?.map((t) => t.toLowerCase()) || [];
    const titleLower = product.title.toLowerCase();
    const descLower = product.description?.toLowerCase() || "";
    return tags.some(
      (tag) =>
        productTags.includes(tag) ||
        titleLower.includes(tag) ||
        descLower.includes(tag)
    );
  });

  const displayProducts = (relevantProducts?.length ? relevantProducts : products)?.slice(0, limit);

  if (variant === "sidebar") {
    return (
      <Card className={`bg-zinc-900/50 border-zinc-800 ${className}`}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FF6B35]" />
              Creator Tools
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Recommended tools to enhance your work
            </p>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : displayProducts?.length ? (
            displayProducts.map((product) => (
              <ProductCardCompact key={product.id} product={product} />
            ))
          ) : (
            <p className="text-xs text-zinc-500 text-center py-4">
              No tools available yet
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="font-semibold text-foreground">Tools for Your Success</h3>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : (
            displayProducts?.map((product) => (
              <ProductCardFull key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={`${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8)
            .fill(0)
            .map((_, i) => <ProductSkeleton key={i} />)
        ) : (
          displayProducts?.map((product) => (
            <ProductCardFull key={product.id} product={product} />
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function ProductCardCompact({ product }: { product: Product }) {
  return (
    <a
      href={product.amazonUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
      data-testid={`product-card-${product.id}`}
    >
      <div className="w-12 h-12 rounded bg-zinc-700 flex-shrink-0 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-zinc-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate group-hover:text-[#FF6B35] transition-colors">
          {product.title}
        </p>
        {product.priceDisplay && (
          <p className="text-xs text-[#FF6B35] font-semibold">
            {product.priceDisplay}
          </p>
        )}
        {product.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="text-[10px] text-zinc-400">{product.rating}</span>
          </div>
        )}
      </div>
      <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-[#FF6B35] flex-shrink-0 mt-1" />
    </a>
  );
}

function ProductCardFull({ product }: { product: Product }) {
  return (
    <Card
      className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-[#FF6B35]/30 transition-colors"
      data-testid={`product-card-full-${product.id}`}
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
          <Badge className="absolute top-2 left-2 bg-[#FF6B35] text-foreground text-[10px]">
            Creator's Choice
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        {product.brand && (
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {product.brand}
          </p>
        )}
        <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-[#FF6B35] transition-colors">
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
          className="w-full mt-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-foreground"
        >
          <a
            href={product.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
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
    <div className="flex gap-3 p-2">
      <Skeleton className="w-12 h-12 rounded bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-full bg-zinc-800" />
        <Skeleton className="h-3 w-1/2 bg-zinc-800" />
      </div>
    </div>
  );
}
