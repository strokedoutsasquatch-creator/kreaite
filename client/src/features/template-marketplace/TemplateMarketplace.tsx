import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layout,
  Search,
  Plus,
  Download,
  Star,
  Eye,
  ShoppingCart,
  Coins,
  BookOpen,
  Music,
  Video,
  GraduationCap,
  Layers,
  Filter,
  Heart,
  Share2,
  User,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useMarketplaceListings, 
  useMyListings,
  useCreateListing,
  useCreateCheckout,
  type MarketplaceListing 
} from "@/lib/hooks/useMarketplace";

interface Template {
  id: string;
  title: string;
  description: string;
  category: "book" | "music" | "video" | "course" | "outline";
  price: number;
  creatorId: string;
  creatorName: string;
  downloads: number;
  rating: number;
  previewImage?: string;
  tags: string[];
  createdAt: string;
}

const categories = [
  { id: "all", label: "All Templates", icon: Layout },
  { id: "book", label: "Book Outlines", icon: BookOpen },
  { id: "music", label: "Music Templates", icon: Music },
  { id: "video", label: "Video Templates", icon: Video },
  { id: "course", label: "Course Structures", icon: GraduationCap },
  { id: "outline", label: "Doctrine Outlines", icon: Layers },
];

const mockTemplates: Template[] = [
  {
    id: "1",
    title: "Business Book Blueprint",
    description: "Complete 12-chapter business book outline with exercises and case study templates",
    category: "book",
    price: 15,
    creatorId: "creator1",
    creatorName: "Business Pro",
    downloads: 234,
    rating: 4.8,
    tags: ["business", "non-fiction", "how-to"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Children's Book Story Arc",
    description: "Picture book structure with illustration prompts and page layouts",
    category: "book",
    price: 10,
    creatorId: "creator2",
    creatorName: "Kids Author",
    downloads: 567,
    rating: 4.9,
    tags: ["children", "picture book", "illustrations"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Online Course Framework",
    description: "8-module course structure with quizzes, assignments, and certificate templates",
    category: "course",
    price: 25,
    creatorId: "creator3",
    creatorName: "Course Master",
    downloads: 189,
    rating: 4.7,
    tags: ["course", "education", "certification"],
    createdAt: new Date().toISOString(),
  },
];

export function TemplateMarketplace() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: listingsData, isLoading } = useMarketplaceListings({
    contentType: selectedCategory !== "all" ? selectedCategory : undefined,
    search: searchQuery || undefined,
  });

  const { data: myListings, isLoading: myListingsLoading } = useMyListings();
  const createListing = useCreateListing();
  const createCheckout = useCreateCheckout();

  const listings = listingsData?.listings || [];

  const purchaseListing = async (listing: MarketplaceListing) => {
    try {
      const result = await createCheckout.mutateAsync({ listingId: listing.id });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast({
        title: "Checkout failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || Layout;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" data-testid="template-marketplace">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">Template Gallery</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">Curated Templates from Fellow Creators</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 bg-black/50">
          <TabsTrigger value="browse" data-testid="tab-browse">
            <Search className="w-4 h-4 mr-2" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="my-templates" data-testid="tab-my-templates">
            <Download className="w-4 h-4 mr-2" />
            My Templates
          </TabsTrigger>
          <TabsTrigger value="sell" data-testid="tab-sell">
            <Plus className="w-4 h-4 mr-2" />
            Sell Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/50 border-orange-500/30"
                data-testid="input-search-templates"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-black/50 border-orange-500/30" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((listing: MarketplaceListing) => {
                const CategoryIcon = getCategoryIcon(listing.genre);
                return (
                  <Card
                    key={listing.id}
                    className="bg-zinc-950 border border-zinc-800/50 shadow-xl overflow-hidden hover:border-orange-500/50 transition-colors"
                    data-testid={`listing-card-${listing.id}`}
                  >
                    {listing.coverImageUrl ? (
                      <img src={listing.coverImageUrl} alt={listing.title} className="h-32 w-full object-cover" />
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
                        <CategoryIcon className="w-12 h-12 text-orange-500/50" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-[10px]">
                          {listing.genre}
                        </Badge>
                        {listing.averageRating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs">{listing.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1">{listing.title}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{listing.description}</p>
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {listing.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} className="text-[9px] bg-zinc-800 text-zinc-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-orange-500">
                            ${(listing.totalRevenue / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-zinc-500 ml-2">
                            <Download className="w-3 h-3 inline mr-1" />
                            {listing.totalSales}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => purchaseListing(listing)}
                          disabled={createCheckout.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                          data-testid={`button-buy-${listing.id}`}
                        >
                          {createCheckout.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Buy
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && listings.length === 0 && (
            <div className="text-center py-12">
              <Layout className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No templates found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-templates" className="space-y-4">
          <Card className="bg-black border-orange-500/20">
            <CardContent className="p-8 text-center">
              <Download className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No purchased templates yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Templates you purchase will appear here
              </p>
              <Button
                onClick={() => setActiveTab("browse")}
                className="mt-4 bg-orange-500 hover:bg-orange-600"
                data-testid="button-browse-templates"
              >
                Browse Templates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4 text-orange-500" />
                Create New Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Template Title</label>
                <Input
                  placeholder="e.g., Professional Memoir Outline"
                  className="bg-black/50 border-orange-500/30"
                  data-testid="input-template-title"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <Textarea
                  placeholder="Describe what's included in your template..."
                  className="min-h-[100px] bg-black/50 border-orange-500/30"
                  data-testid="textarea-template-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <Select>
                    <SelectTrigger className="bg-black/50 border-orange-500/30" data-testid="select-template-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Price ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="bg-black/50 border-orange-500/30"
                    data-testid="input-template-price"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
                <Input
                  placeholder="e.g., business, non-fiction, how-to"
                  className="bg-black/50 border-orange-500/30"
                  data-testid="input-template-tags"
                />
              </div>
              <div className="bg-orange-500/5 rounded p-3 border border-orange-500/20">
                <p className="text-xs text-gray-400">
                  <strong className="text-orange-500">85% revenue share</strong> - You keep 85% of every sale.
                  Templates are reviewed before publishing.
                </p>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600" data-testid="button-submit-template">
                <Plus className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
