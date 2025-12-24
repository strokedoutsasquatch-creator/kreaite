import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Star,
  Eye,
  BarChart3,
  Download,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Wallet,
  Printer,
  Truck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { MarketplaceListing, BookOrder, AuthorEarnings, BookReview } from "@shared/schema";

interface AuthorStats {
  totalBooks: number;
  totalSales: number;
  totalRevenue: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
  totalReviews: number;
}

interface BookWithStats extends MarketplaceListing {
  salesCount: number;
  revenueTotal: number;
  earningsTotal: number;
}

interface OrderWithDetails extends BookOrder {
  bookTitle: string;
  editionType: string;
  itemCount: number;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendUp = true 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
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

function BookPerformanceCard({ book }: { book: BookWithStats }) {
  const rating = book.averageRating ? (book.averageRating / 10).toFixed(1) : null;
  
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-16 h-24 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded flex items-center justify-center flex-shrink-0">
            {book.coverImageUrl ? (
              <img 
                src={book.coverImageUrl} 
                alt={book.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <BookOpen className="w-8 h-8 text-orange-500/50" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{book.title}</h3>
                <Badge 
                  variant="outline" 
                  className={`mt-1 ${
                    book.status === 'published' ? 'text-green-500 border-green-500/30' :
                    book.status === 'pending_review' ? 'text-yellow-500 border-yellow-500/30' :
                    'text-muted-foreground'
                  }`}
                >
                  {book.status === 'published' ? 'Live' : 
                   book.status === 'pending_review' ? 'Pending Review' : 
                   book.status}
                </Badge>
              </div>
              <Link href={`/books/${book.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-muted-foreground">Sales</p>
                <p className="font-medium">{book.salesCount || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-medium">${((book.revenueTotal || 0) / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rating</p>
                <p className="font-medium flex items-center gap-1">
                  {rating ? (
                    <>
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {rating}
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
    pending: { color: 'text-yellow-500 border-yellow-500/30', icon: Clock },
    processing: { color: 'text-blue-500 border-blue-500/30', icon: Package },
    printing: { color: 'text-purple-500 border-purple-500/30', icon: Printer },
    shipped: { color: 'text-cyan-500 border-cyan-500/30', icon: Truck },
    delivered: { color: 'text-green-500 border-green-500/30', icon: CheckCircle },
    completed: { color: 'text-green-500 border-green-500/30', icon: CheckCircle },
    cancelled: { color: 'text-red-500 border-red-500/30', icon: AlertCircle },
    refunded: { color: 'text-red-500 border-red-500/30', icon: AlertCircle },
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function AuthorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<AuthorStats>({
    queryKey: ['/api/marketplace/author/stats'],
  });

  const { data: books, isLoading: booksLoading } = useQuery<BookWithStats[]>({
    queryKey: ['/api/marketplace/author/books'],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/marketplace/author/orders'],
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery<AuthorEarnings[]>({
    queryKey: ['/api/marketplace/author/earnings'],
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<BookReview[]>({
    queryKey: ['/api/marketplace/author/reviews'],
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CreatorHeader />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-orange-500/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to access your author dashboard.
              </p>
              <Link href="/api/login">
                <Button>Sign In</Button>
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
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Author Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your book sales, earnings, and reader engagement
            </p>
          </div>
          <Link href="/book-studio">
            <Button className="gap-2" data-testid="button-create-book">
              <Plus className="w-4 h-4" />
              Create New Book
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Total Revenue"
                value={`$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`}
                subtitle="Lifetime earnings"
                icon={DollarSign}
              />
              <StatCard
                title="Total Sales"
                value={String(stats?.totalSales || 0)}
                subtitle="Books sold"
                icon={ShoppingCart}
              />
              <StatCard
                title="Available Earnings"
                value={`$${((stats?.totalEarnings || 0) / 100).toFixed(2)}`}
                subtitle={`$${((stats?.pendingEarnings || 0) / 100).toFixed(2)} pending`}
                icon={Wallet}
              />
              <StatCard
                title="Average Rating"
                value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                subtitle={`${stats?.totalReviews || 0} reviews`}
                icon={Star}
              />
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">My Books</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Top Performing Books
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {booksLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                      ))
                    ) : books && books.length > 0 ? (
                      books.slice(0, 5).map((book) => (
                        <BookPerformanceCard key={book.id} book={book} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No books published yet</p>
                        <Link href="/book-studio">
                          <Button variant="outline">Create Your First Book</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-orange-500" />
                      Earnings Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="font-medium text-green-500">
                          ${((stats?.totalEarnings || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="font-medium text-yellow-500">
                          ${((stats?.pendingEarnings || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Lifetime</span>
                        <span className="font-bold">
                          ${((stats?.totalRevenue || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" disabled>
                      Request Payout
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Minimum $50 for payout requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-orange-500" />
                      Recent Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <Skeleton className="h-24 w-full" />
                    ) : reviews && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-muted-foreground line-clamp-2">{review.content}</p>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab('reviews')}>
                          View All Reviews
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No reviews yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="books" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Published Books</CardTitle>
                <CardDescription>Manage your book listings and track performance</CardDescription>
              </CardHeader>
              <CardContent>
                {booksLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full" />
                    ))}
                  </div>
                ) : books && books.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {books.map((book) => (
                      <BookPerformanceCard key={book.id} book={book} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Books Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start creating your first book and share your recovery journey.
                    </p>
                    <Link href="/book-studio">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Book
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track orders of your books</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : orders && orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            #{order.id.toString().padStart(6, '0')}
                          </TableCell>
                          <TableCell className="font-medium">{order.bookTitle}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {order.editionType.includes('digital') ? (
                                <FileText className="w-3 h-3 mr-1" />
                              ) : (
                                <Printer className="w-3 h-3 mr-1" />
                              )}
                              {order.editionType.includes('print_paperback') ? 'Paperback' :
                               order.editionType.includes('print_hardcover') ? 'Hardcover' :
                               order.editionType.includes('digital') ? 'Digital' : order.editionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(order.total / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground">
                      Orders for your books will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reader Reviews</CardTitle>
                <CardDescription>See what readers are saying about your books</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              {review.title && (
                                <h4 className="font-medium mb-1">{review.title}</h4>
                              )}
                              <p className="text-sm text-muted-foreground">{review.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                    <p className="text-muted-foreground">
                      Reader reviews will appear here once customers start leaving feedback.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
