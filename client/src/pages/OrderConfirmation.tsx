import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Package,
  Truck,
  Download,
  Clock,
  MapPin,
  ExternalLink,
  ShoppingBag,
  Printer,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  id: number;
  listingId: number;
  editionId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  downloadUrl?: string;
  downloadExpiresAt?: string;
  editionType?: string;
  listingTitle?: string;
  coverImage?: string;
  isDigital?: boolean;
  canDownload?: boolean;
  printJobs?: PrintJob[];
}

interface PrintJob {
  id: number;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedShipDate?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingStreet1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostcode?: string;
  shippingCountry?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: OrderItem[];
  printJobs?: PrintJob[];
  hasDigitalItems?: boolean;
  hasPrintItems?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending Payment", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  paid: { label: "Payment Received", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400", icon: Package },
  printing: { label: "Printing", color: "bg-purple-500/20 text-purple-400", icon: Printer },
  shipped: { label: "Shipped", color: "bg-teal-500/20 text-teal-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400", icon: AlertCircle },
};

function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.color} gap-1`} data-testid={`badge-status-${status}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { key: "paid", label: "Payment", date: order.paidAt },
    { key: "processing", label: "Processing", date: order.status === "processing" ? new Date().toISOString() : null },
    { key: "shipped", label: "Shipped", date: order.shippedAt },
    { key: "delivered", label: "Delivered", date: order.deliveredAt },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status) !== -1 
    ? steps.findIndex(s => s.key === order.status) 
    : (order.status === "printing" ? 1 : 0);

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto" data-testid="order-timeline">
      {steps.map((step, index) => {
        const isComplete = index < currentStepIndex || (index === currentStepIndex && step.date);
        const isCurrent = index === currentStepIndex;
        
        return (
          <div key={step.key} className="flex flex-col items-center relative flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                isComplete ? "bg-green-500 text-white" : 
                isCurrent ? "bg-orange-500 text-white" : 
                "bg-gray-700 text-gray-400"
              }`}
            >
              {isComplete ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-xs mt-2 ${isComplete || isCurrent ? "text-white" : "text-gray-500"}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div 
                className={`absolute top-4 left-1/2 w-full h-0.5 ${
                  index < currentStepIndex ? "bg-green-500" : "bg-gray-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderItemCard({ item }: { item: OrderItem }) {
  const price = item.unitPrice / 100;
  
  return (
    <div className="flex gap-4 p-4 bg-gray-900/50 rounded-lg" data-testid={`order-item-${item.id}`}>
      <div className="w-16 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded overflow-hidden flex-shrink-0">
        {item.coverImage ? (
          <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-orange-500/50" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{item.listingTitle || "Book"}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {item.isDigital ? (
              <><Download className="w-3 h-3 mr-1" /> Digital</>
            ) : (
              <><Printer className="w-3 h-3 mr-1" /> Print</>
            )}
          </Badge>
          <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
        </div>
        
        {item.canDownload && item.downloadUrl && (
          <Button
            size="sm"
            className="mt-2 bg-orange-500 hover:bg-orange-600"
            asChild
            data-testid={`button-download-${item.id}`}
          >
            <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-3 h-3 mr-1" />
              Download
            </a>
          </Button>
        )}
        
        {item.printJobs && item.printJobs.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.printJobs.map(pj => (
              <div key={pj.id} className="flex items-center gap-2 text-sm">
                <OrderStatusBadge status={pj.status} />
                {pj.trackingNumber && (
                  <a 
                    href={pj.trackingUrl || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:underline flex items-center gap-1"
                    data-testid={`link-tracking-${pj.id}`}
                  >
                    {pj.carrier}: {pj.trackingNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-white">${price.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function OrderConfirmation() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  const orderId = params.id;
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const sessionId = searchParams.get("session_id");
  const isSuccess = searchParams.get("success") === "true";

  const { data: order, isLoading, error, refetch } = useQuery<Order>({
    queryKey: sessionId 
      ? ["/api/marketplace/orders/session", sessionId]
      : ["/api/marketplace/orders", orderId],
    enabled: !authLoading && !!user && (!!orderId || !!sessionId),
  });

  useEffect(() => {
    if (order && isSuccess) {
      const timer = setInterval(() => {
        refetch();
      }, 30000);
      
      return () => clearInterval(timer);
    }
  }, [order, isSuccess, refetch]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <CreatorHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
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
              <p className="text-gray-400 mb-4">Please sign in to view your order details.</p>
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <CreatorHeader />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gray-950 border-gray-800">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Order Not Found</h2>
              <p className="text-gray-400 mb-4">We couldn't find this order. It may still be processing.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => refetch()}>
                  <Loader2 className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                  <Link href="/marketplace/my-orders">View All Orders</Link>
                </Button>
              </div>
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
        <div className="max-w-3xl mx-auto">
          {isSuccess && (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white mb-2" data-testid="text-success-title">
                Thank You for Your Order!
              </h1>
              <p className="text-gray-400">
                Your order has been confirmed and is being processed.
              </p>
            </div>
          )}

          <Card className="bg-gray-950 border-gray-800 mb-6">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-gray-400">Order Number</p>
                <CardTitle className="text-xl text-white" data-testid="text-order-number">
                  {order.orderNumber}
                </CardTitle>
              </div>
              <OrderStatusBadge status={order.status} />
            </CardHeader>
            
            <CardContent className="space-y-6">
              {order.hasPrintItems && (
                <div className="py-4">
                  <OrderTimeline order={order} />
                </div>
              )}

              <Separator className="bg-gray-800" />

              <div className="space-y-3">
                <h3 className="font-medium text-white">Order Items</h3>
                {order.items.map(item => (
                  <OrderItemCard key={item.id} item={item} />
                ))}
              </div>

              <Separator className="bg-gray-800" />

              <div className="grid md:grid-cols-2 gap-6">
                {order.shippingStreet1 && (
                  <div>
                    <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      Shipping Address
                    </h3>
                    <div className="text-gray-400 text-sm">
                      <p>{order.customerName}</p>
                      <p>{order.shippingStreet1}</p>
                      <p>
                        {order.shippingCity}, {order.shippingState} {order.shippingPostcode}
                      </p>
                      <p>{order.shippingCountry}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-white mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>${(order.subtotal / 100).toFixed(2)}</span>
                    </div>
                    {order.shippingCost > 0 && (
                      <div className="flex justify-between text-gray-400">
                        <span>Shipping</span>
                        <span>${(order.shippingCost / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {order.tax > 0 && (
                      <div className="flex justify-between text-gray-400">
                        <span>Tax</span>
                        <span>${(order.tax / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="bg-gray-800 my-2" />
                    <div className="flex justify-between text-white font-semibold">
                      <span>Total</span>
                      <span data-testid="text-order-total">${(order.total / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.trackingNumber && (
                <>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between p-4 bg-teal-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-teal-400" />
                      <div>
                        <p className="font-medium text-white">Tracking Information</p>
                        <p className="text-sm text-gray-400">Your order is on its way!</p>
                      </div>
                    </div>
                    {order.trackingUrl ? (
                      <Button variant="outline" size="sm" asChild data-testid="button-track-package">
                        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                          Track Package
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-white font-mono">{order.trackingNumber}</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild data-testid="button-view-orders">
              <Link href="/marketplace/my-orders">
                <ShoppingBag className="w-4 h-4 mr-2" />
                View All Orders
              </Link>
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" asChild data-testid="button-continue-shopping">
              <Link href="/marketplace/books">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
