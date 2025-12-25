import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  BarChart3,
  Loader2,
  RefreshCw,
  BookOpen,
  Music,
  Film,
  GraduationCap
} from "lucide-react";

interface Earning {
  id: number;
  productType: string;
  productId: number;
  productTitle: string;
  saleAmount: number;
  platformFee: number;
  creatorShare: number;
  status: string;
  customerEmail?: string;
  createdAt: string;
  paidAt?: string;
}

interface Payout {
  id: number;
  amount: number;
  currency: string;
  status: string;
  stripePayoutId?: string;
  stripeTransferId?: string;
  createdAt: string;
  processedAt?: string;
  paidAt?: string;
}

interface EarningsSummary {
  totalSales: number;
  totalCreatorShare: number;
  totalPlatformFee: number;
  pendingBalance: number;
  availableBalance: number;
  paidOut: number;
  salesCount: number;
}

interface ConnectStatus {
  connected: boolean;
  onboarded: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export default function CreatorEarnings() {
  const { toast } = useToast();
  const [selectedEarnings, setSelectedEarnings] = useState<number[]>([]);

  const { data: connectStatus, isLoading: loadingConnect, refetch: refetchConnect } = useQuery<ConnectStatus>({
    queryKey: ["/api/stripe/connect/status"],
  });

  const { data: earningsData, isLoading: loadingEarnings } = useQuery<{ earnings: Earning[]; summary: EarningsSummary }>({
    queryKey: ["/api/creator/earnings"],
  });

  const { data: payouts, isLoading: loadingPayouts } = useQuery<Payout[]>({
    queryKey: ["/api/creator/payouts"],
  });

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/connect/onboard");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start onboarding", variant: "destructive" });
    }
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/stripe/connect/login");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open dashboard", variant: "destructive" });
    }
  });

  const transferMutation = useMutation({
    mutationFn: async (earningIds: number[]) => {
      const res = await apiRequest("POST", "/api/creator/payouts/transfer", { earningIds });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transfer initiated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/payouts"] });
      setSelectedEarnings([]);
    },
    onError: (error: any) => {
      toast({ title: "Transfer Failed", description: error.message || "Could not process transfer", variant: "destructive" });
    }
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'video': return <Film className="w-4 h-4" />;
      case 'course': return <GraduationCap className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'available':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case 'paid':
        return <Badge className="bg-primary/20 text-primary"><DollarSign className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const summary = earningsData?.summary || {
    totalSales: 0, totalCreatorShare: 0, totalPlatformFee: 0,
    pendingBalance: 0, availableBalance: 0, paidOut: 0, salesCount: 0
  };

  const availableEarnings = earningsData?.earnings?.filter(e => e.status === 'available') || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Creator Earnings</h1>
            <p className="text-muted-foreground mt-1">Track your sales and manage payouts</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetchConnect()}
              data-testid="button-refresh-status"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {!connectStatus?.onboarded && (
          <Card className="mb-8 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Set Up Payouts
              </CardTitle>
              <CardDescription>
                Connect your bank account to receive payouts. You earn 85% of every sale!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">85%</Badge>
                    <span className="text-sm text-muted-foreground">Creator Share</span>
                    <Badge variant="outline" className="text-lg px-3 py-1 ml-4">15%</Badge>
                    <span className="text-sm text-muted-foreground">Platform Fee</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We use Stripe for secure, instant payments to over 135 countries.
                  </p>
                </div>
                <Button 
                  onClick={() => onboardMutation.mutate()} 
                  disabled={onboardMutation.isPending || loadingConnect}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-connect-stripe"
                >
                  {onboardMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
                  )}
                  {connectStatus?.connected ? 'Complete Setup' : 'Connect Bank Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="text-total-earnings">
                {formatCurrency(summary.totalCreatorShare)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.salesCount} sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="text-available-balance">
                {formatCurrency(summary.availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Ready for payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-pending-balance">
                {formatCurrency(summary.pendingBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Clearing period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
              <CheckCircle className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-paid-out">
                {formatCurrency(summary.paidOut)}
              </div>
              <p className="text-xs text-muted-foreground">Total withdrawn</p>
            </CardContent>
          </Card>
        </div>

        {connectStatus?.onboarded && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" /> Payouts Enabled
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => loginMutation.mutate()} data-testid="button-stripe-dashboard">
                <ExternalLink className="w-4 h-4 mr-1" /> Stripe Dashboard
              </Button>
            </div>
            {availableEarnings.length > 0 && (
              <Button 
                onClick={() => transferMutation.mutate(availableEarnings.map(e => e.id))}
                disabled={transferMutation.isPending}
                data-testid="button-request-payout"
              >
                {transferMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                )}
                Request Payout ({formatCurrency(summary.availableBalance)})
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="earnings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="earnings" data-testid="tab-earnings">
              <BarChart3 className="w-4 h-4 mr-2" /> Sales History
            </TabsTrigger>
            <TabsTrigger value="payouts" data-testid="tab-payouts">
              <CreditCard className="w-4 h-4 mr-2" /> Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            {loadingEarnings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : earningsData?.earnings?.length ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {earningsData.earnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getProductIcon(earning.productType)}
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-product-title-${earning.id}`}>
                              {earning.productTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(earning.createdAt).toLocaleDateString()}
                              {earning.customerEmail && ` • ${earning.customerEmail}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-primary" data-testid={`text-earning-amount-${earning.id}`}>
                              {formatCurrency(earning.creatorShare)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sale: {formatCurrency(earning.saleAmount)}
                            </p>
                          </div>
                          {getStatusBadge(earning.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Sales Yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    When customers purchase your content, you'll see your earnings here.
                    Start creating and publishing to begin earning!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {loadingPayouts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : payouts?.length ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">Payout #{payout.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg" data-testid={`text-payout-amount-${payout.id}`}>
                            {formatCurrency(payout.amount)}
                          </p>
                          {getStatusBadge(payout.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Payouts Yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Once you have available earnings and request a payout, your payout history will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Split Breakdown</CardTitle>
            <CardDescription>How your earnings are calculated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Creator Share (85%)</span>
                <span className="font-bold text-primary">{formatCurrency(summary.totalCreatorShare)}</span>
              </div>
              <Progress value={85} className="h-2" />
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Platform Fee (15%)</span>
                <span className="font-medium">{formatCurrency(summary.totalPlatformFee)}</span>
              </div>
              <Progress value={15} className="h-2 opacity-50" />
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Sales</span>
                <span className="font-bold">{formatCurrency(summary.totalSales)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
