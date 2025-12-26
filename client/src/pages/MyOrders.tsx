import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Truck,
  Download,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  Printer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BookOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  paid: { label: "Paid", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400", icon: Package },
  printing: { label: "Printing", color: "bg-purple-500/20 text-purple-400", icon: Printer },
  shipped: { label: "Shipped", color: "bg-teal-500/20 text-teal-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400", icon: AlertCircle },
};

function OrderCard({ order }: { order: BookOrder }) {
  const config = statusConfig[order.status] || statusConfig.pending;
  const Icon = config.icon;
  const date = new Date(order.createdAt).toLocaleDateString();
  
  return (
    <Link href={`/marketplace/order/${order.id}`}>
      <Card className="bg-gray-950 border-gray-800 hover-elevate cursor-pointer" data-testid={`card-order-${order.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color.split(' ')[0]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-white" data-testid={`text-order-number-${order.id}`}>
                  {order.orderNumber}
                </p>
                <p className="text-sm text-gray-400">{date}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className={`${config.color}`}>{config.label}</Badge>
              <span className="font-semibold text-white">
                ${(order.total / 100).toFixed(2)}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MyOrders() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: orders, isLoading } = useQuery<BookOrder[]>({
    queryKey: ["/api/marketplace/my-orders"],
    enabled: !authLoading && !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <CreatorHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <CreatorHeader />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gray-950 border-gray-800">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Sign in Required</h2>
              <p className="text-gray-400 mb-4">Please sign in to view your orders.</p>
              <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <CreatorHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-serif font-bold text-white" data-testid="text-page-title">
              My Orders
            </h1>
            <Button className="bg-orange-500 hover:bg-orange-600" asChild>
              <Link href="/marketplace/books">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Books
              </Link>
            </Button>
          </div>

          {!orders || orders.length === 0 ? (
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No orders yet</h2>
                <p className="text-gray-400 mb-6">
                  Start exploring our marketplace to find amazing books!
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                  <Link href="/marketplace/books">Browse Books</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
