import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Music,
  Film,
  GraduationCap,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Eye,
  BarChart3,
  Trash2,
  EyeOff,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Filter,
  Calendar,
  Percent,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  type: "book" | "course" | "music" | "video";
  title: string;
  description: string;
  coverImageUrl: string | null;
  price: number;
  status: "active" | "draft" | "sold" | "inactive";
  salesCount: number;
  revenue: number;
  views: number;
  discount?: number;
  scheduledReleaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

const mockProducts: Product[] = [
  {
    id: 1,
    type: "book",
    title: "The Ultimate Stroke Recovery Bible",
    description: "A comprehensive guide to stroke recovery with actionable exercises and real stories.",
    coverImageUrl: null,
    price: 2999,
    status: "active",
    salesCount: 127,
    revenue: 380373,
    views: 2450,
    createdAt: "2024-11-15T10:00:00Z",
    updatedAt: "2024-12-20T14:30:00Z",
  },
  {
    id: 2,
    type: "course",
    title: "30-Day Recovery Bootcamp",
    description: "Intensive recovery program with daily exercises and coaching.",
    coverImageUrl: null,
    price: 4999,
    status: "active",
    salesCount: 89,
    revenue: 444911,
    views: 1820,
    discount: 20,
    createdAt: "2024-10-01T08:00:00Z",
    updatedAt: "2024-12-18T11:15:00Z",
  },
  {
    id: 3,
    type: "music",
    title: "Meditation Sounds for Recovery",
    description: "Calming audio tracks designed for relaxation during recovery.",
    coverImageUrl: null,
    price: 999,
    status: "draft",
    salesCount: 0,
    revenue: 0,
    views: 45,
    scheduledReleaseDate: "2025-01-15T00:00:00Z",
    createdAt: "2024-12-01T09:00:00Z",
    updatedAt: "2024-12-22T16:45:00Z",
  },
  {
    id: 4,
    type: "video",
    title: "Physical Therapy Exercise Series",
    description: "Video tutorials for home physical therapy exercises.",
    coverImageUrl: null,
    price: 1999,
    status: "active",
    salesCount: 56,
    revenue: 111944,
    views: 890,
    createdAt: "2024-09-20T12:00:00Z",
    updatedAt: "2024-12-15T10:00:00Z",
  },
  {
    id: 5,
    type: "book",
    title: "Caregiver's Companion Guide",
    description: "Essential guide for caregivers supporting stroke survivors.",
    coverImageUrl: null,
    price: 1999,
    status: "inactive",
    salesCount: 34,
    revenue: 67966,
    views: 520,
    createdAt: "2024-08-10T14:00:00Z",
    updatedAt: "2024-11-30T09:00:00Z",
  },
];

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs text-green-500">
                <TrendingUp className="w-3 h-3" />
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-orange-500/10">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductTypeIcon({ type }: { type: Product["type"] }) {
  switch (type) {
    case "book":
      return <BookOpen className="w-4 h-4" />;
    case "course":
      return <GraduationCap className="w-4 h-4" />;
    case "music":
      return <Music className="w-4 h-4" />;
    case "video":
      return <Film className="w-4 h-4" />;
  }
}

function ProductTypeBadge({ type }: { type: Product["type"] }) {
  const colors = {
    book: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    course: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    music: "bg-green-500/10 text-green-400 border-green-500/30",
    video: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <Badge variant="outline" className={colors[type]}>
      <ProductTypeIcon type={type} />
      <span className="ml-1 capitalize">{type}</span>
    </Badge>
  );
}

function StatusBadge({ status }: { status: Product["status"] }) {
  const colors = {
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    sold: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    inactive: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  return (
    <Badge variant="outline" className={colors[status]}>
      <span className="capitalize">{status}</span>
    </Badge>
  );
}

function ProductManagementDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product ? (product.price / 100).toString() : "");
  const [isActive, setIsActive] = useState(product?.status === "active");
  const [discount, setDiscount] = useState(product?.discount?.toString() || "");
  const [releaseDate, setReleaseDate] = useState(
    product?.scheduledReleaseDate ? new Date(product.scheduledReleaseDate).toISOString().split("T")[0] : ""
  );

  const handleSave = () => {
    toast({
      title: "Changes Saved",
      description: "Your product has been updated successfully.",
    });
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update your product details and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-edit-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-edit-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                data-testid="input-edit-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discount">Discount (%)</Label>
              <Input
                id="edit-discount"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                data-testid="input-edit-discount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-release-date">Scheduled Release Date</Label>
            <Input
              id="edit-release-date"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              data-testid="input-edit-release-date"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-active">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Make this product visible in the marketplace
              </p>
            </div>
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-edit-active"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-28 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <Button variant="outline" data-testid="button-upload-cover">
                <ImageIcon className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-product">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductAnalyticsDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Product Analytics</DialogTitle>
          <DialogDescription>{product.title}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{product.views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingCart className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{product.salesCount}</p>
              <p className="text-xs text-muted-foreground">Sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">${(product.revenue / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conversion Rate</span>
            <span className="font-medium">
              {product.views > 0 ? ((product.salesCount / product.views) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Average Order Value</span>
            <span className="font-medium">
              ${product.salesCount > 0 ? (product.revenue / product.salesCount / 100).toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-analytics">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CreatorProductDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

  const { data: earningsData } = useQuery<{ summary: { totalSales: number; totalCreatorShare: number } }>({
    queryKey: ["/api/creator/earnings"],
  });

  const products = mockProducts;
  const isLoading = false;

  const filteredProducts = products.filter((product) => {
    const matchesTab = activeTab === "all" || product.type === activeTab;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesTab && matchesStatus;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleViewAnalytics = (product: Product) => {
    setSelectedProduct(product);
    setAnalyticsDialogOpen(true);
  };

  const handleUnpublish = (product: Product) => {
    toast({
      title: "Product Unpublished",
      description: `"${product.title}" has been removed from the marketplace.`,
    });
  };

  const handleDelete = (product: Product) => {
    toast({
      title: "Product Deleted",
      description: `"${product.title}" has been permanently deleted.`,
      variant: "destructive",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your sales data is being prepared for download.",
    });
  };

  const getStudioLink = (type: Product["type"]) => {
    switch (type) {
      case "book":
        return "/book-studio";
      case "course":
        return "/course-studio";
      case "music":
        return "/music-studio";
      case "video":
        return "/video-studio";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CreatorHeader />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto text-orange-500/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to access your product dashboard.
              </p>
              <Link href="/api/login">
                <Button data-testid="button-sign-in">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CreatorHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Product Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all your marketplace products in one place
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="button-add-product">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/book-studio" data-testid="link-add-book">
                    <BookOpen className="w-4 h-4 mr-2" />
                    New Book
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/course-studio" data-testid="link-add-course">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    New Course
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/music-studio" data-testid="link-add-music">
                    <Music className="w-4 h-4 mr-2" />
                    New Music
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/video-studio" data-testid="link-add-video">
                    <Film className="w-4 h-4 mr-2" />
                    New Video
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Products"
            value={totalProducts.toString()}
            icon={Package}
          />
          <StatCard
            title="Active Products"
            value={activeProducts.toString()}
            icon={Eye}
          />
          <StatCard
            title="Total Sales"
            value={totalSales.toString()}
            icon={ShoppingCart}
            trend="+12% this month"
          />
          <StatCard
            title="Total Revenue"
            value={`$${(totalRevenue / 100).toLocaleString()}`}
            icon={DollarSign}
            trend="+8% this month"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-5">
              <TabsTrigger value="all" data-testid="tab-all-products">
                All
              </TabsTrigger>
              <TabsTrigger value="book" data-testid="tab-books">
                <BookOpen className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Books</span>
              </TabsTrigger>
              <TabsTrigger value="course" data-testid="tab-courses">
                <GraduationCap className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="music" data-testid="tab-music">
                <Music className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Music</span>
              </TabsTrigger>
              <TabsTrigger value="video" data-testid="tab-videos">
                <Film className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "all" ? "All Products" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
                </CardTitle>
                <CardDescription>
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Product</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Sales</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-16 rounded bg-gradient-to-br from-orange-500/10 to-orange-600/5 flex items-center justify-center flex-shrink-0">
                                  {product.coverImageUrl ? (
                                    <img
                                      src={product.coverImageUrl}
                                      alt={product.title}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  ) : (
                                    <ProductTypeIcon type={product.type} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate" data-testid={`text-product-title-${product.id}`}>
                                    {product.title}
                                  </p>
                                  {product.discount && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      <Percent className="w-3 h-3 mr-1" />
                                      {product.discount}% off
                                    </Badge>
                                  )}
                                  {product.scheduledReleaseDate && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Scheduled
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ProductTypeBadge type={product.type} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={product.status} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${(product.price / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.salesCount}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-500">
                              ${(product.revenue / 100).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-actions-${product.id}`}>
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(product)} data-testid={`action-edit-${product.id}`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewAnalytics(product)} data-testid={`action-analytics-${product.id}`}>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    View Analytics
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {product.status === "active" ? (
                                    <DropdownMenuItem onClick={() => handleUnpublish(product)} data-testid={`action-unpublish-${product.id}`}>
                                      <EyeOff className="w-4 h-4 mr-2" />
                                      Unpublish
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem asChild>
                                      <Link href={getStudioLink(product.type)} data-testid={`action-publish-${product.id}`}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Publish
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(product)}
                                    className="text-destructive"
                                    data-testid={`action-delete-${product.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {statusFilter !== "all"
                        ? `No ${statusFilter} products in this category.`
                        : "Start creating products to see them here."}
                    </p>
                    <Link href={activeTab === "all" ? "/book-studio" : getStudioLink(activeTab as Product["type"])}>
                      <Button data-testid="button-create-first-product">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Product
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <ProductManagementDialog
        product={selectedProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <ProductAnalyticsDialog
        product={selectedProduct}
        open={analyticsDialogOpen}
        onOpenChange={setAnalyticsDialogOpen}
      />
    </div>
  );
}
