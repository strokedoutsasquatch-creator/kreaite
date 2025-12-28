import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Plus,
  Infinity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Crown,
  DollarSign,
  BarChart3,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UserWithCredits {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  subscriptionStatus: string | null;
  createdAt: string;
  credits: {
    balance: number;
    bonusCredits: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
}

interface AdminStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    recentSignups: number;
  };
  credits: {
    totalBalance: number;
    totalBonusCredits: number;
    totalEarned: number;
    totalSpent: number;
  };
  usage: {
    last24Hours: {
      events: number;
      creditsUsed: number;
    };
  };
}

interface RevenueData {
  metrics: {
    totalRevenue: number;
    mrr: number;
    subscriptionRevenue: number;
    creditPurchases: number;
    marketplaceSales: number;
    creatorPayouts: number;
    platformFees: number;
    transactionCount: number;
  };
  recentEvents: Array<{
    id: number;
    eventType: string;
    amount: number;
    productType: string | null;
    tierName: string | null;
    status: string;
    createdAt: string;
  }>;
}

interface SubscriptionData {
  activeSubscriptions: number;
  newThisMonth: number;
  churned: number;
  churnRate: string;
  byTier: Record<string, number>;
}

interface CreditAnalytics {
  totalCreditsUsed: number;
  totalCreditsGranted: number;
  netCreditFlow: number;
  byFeature: Record<string, number>;
  byStudio: Record<string, number>;
  topFeatures: Array<{ feature: string; credits: number }>;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function AddCreditsDialog({ user, onSuccess }: { user: UserWithCredits; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/credits`, {
        amount: parseInt(amount),
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Credits added successfully" });
      setOpen(false);
      setAmount("");
      setReason("");
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to add credits", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-add-credits-${user.id}`}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Credits to {user.firstName || user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter credit amount"
              data-testid="input-credit-amount"
            />
          </div>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for adding credits"
              data-testid="input-credit-reason"
            />
          </div>
          <Button 
            onClick={() => addCreditsMutation.mutate()} 
            disabled={!amount || parseInt(amount) <= 0 || addCreditsMutation.isPending}
            className="w-full"
            data-testid="button-confirm-add-credits"
          >
            {addCreditsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add {amount || 0} Credits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ user, onUpdate }: { user: UserWithCredits; onUpdate: () => void }) {
  const { toast } = useToast();

  const setUnlimitedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/unlimited`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Unlimited credits granted" });
      onUpdate();
    },
    onError: () => {
      toast({ title: "Failed to set unlimited credits", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/role`, { role: newRole });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      onUpdate();
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const isUnlimited = user.credits.balance >= 999999999;
  const totalCredits = user.credits.balance + user.credits.bonusCredits;

  return (
    <div 
      className="flex flex-wrap items-center gap-4 p-4 border-b last:border-b-0 hover-elevate"
      data-testid={`row-user-${user.id}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.profileImageUrl || undefined} />
        <AvatarFallback>
          {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-[200px]">
        <div className="font-medium text-sm">
          {user.firstName} {user.lastName}
          {user.role === 'admin' && <Crown className="h-3 w-3 inline ml-1 text-primary" />}
        </div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isUnlimited ? "default" : "secondary"} className="font-mono">
          {isUnlimited ? (
            <>
              <Infinity className="h-3 w-3 mr-1" /> Unlimited
            </>
          ) : (
            `${totalCredits.toLocaleString()} credits`
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={user.role}
          onValueChange={(value) => updateRoleMutation.mutate(value)}
          disabled={updateRoleMutation.isPending}
        >
          <SelectTrigger className="w-28" data-testid={`select-role-${user.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <AddCreditsDialog user={user} onSuccess={onUpdate} />

        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setUnlimitedMutation.mutate()}
          disabled={isUnlimited || setUnlimitedMutation.isPending}
          data-testid={`button-unlimited-${user.id}`}
        >
          {setUnlimitedMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Infinity className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const limit = 20;

  const statsQuery = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const revenueQuery = useQuery<RevenueData>({
    queryKey: ["/api/admin/revenue"],
  });

  const subscriptionQuery = useQuery<SubscriptionData>({
    queryKey: ["/api/admin/subscriptions"],
  });

  const creditAnalyticsQuery = useQuery<CreditAnalytics>({
    queryKey: ["/api/admin/credits-analytics"],
  });

  const usersQuery = useQuery<{ users: UserWithCredits[]; total: number }>({
    queryKey: ["/api/admin/users", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (search) params.set("search", search);
      const response = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/credits-analytics"] });
  };

  const totalPages = usersQuery.data ? Math.ceil(usersQuery.data.total / limit) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="credits" data-testid="tab-credits">Credits</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-24" />
                  </Card>
                ))}
              </div>
            ) : statsQuery.data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Users"
                  value={statsQuery.data.users.total}
                  icon={Users}
                  subtitle={`${statsQuery.data.users.recentSignups} in last 30 days`}
                />
                <StatCard
                  title="Admin Users"
                  value={statsQuery.data.users.byRole.admin || 0}
                  icon={Shield}
                />
                <StatCard
                  title="Credits in Circulation"
                  value={statsQuery.data.credits.totalBalance + statsQuery.data.credits.totalBonusCredits}
                  icon={CreditCard}
                />
                <StatCard
                  title="Usage (24h)"
                  value={statsQuery.data.usage.last24Hours.events}
                  icon={TrendingUp}
                  subtitle={`${statsQuery.data.usage.last24Hours.creditsUsed.toLocaleString()} credits used`}
                />
              </div>
            ) : null}

            {revenueQuery.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(revenueQuery.data.metrics.totalRevenue)}
                  icon={DollarSign}
                  subtitle="This period"
                />
                <StatCard
                  title="MRR"
                  value={formatCurrency(revenueQuery.data.metrics.mrr)}
                  icon={Repeat}
                  subtitle="Monthly recurring"
                />
                <StatCard
                  title="Active Subscriptions"
                  value={subscriptionQuery.data?.activeSubscriptions || 0}
                  icon={Users}
                  subtitle={`${subscriptionQuery.data?.newThisMonth || 0} new this month`}
                />
                <StatCard
                  title="Transactions"
                  value={revenueQuery.data.metrics.transactionCount}
                  icon={BarChart3}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {revenueQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : revenueQuery.data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(revenueQuery.data.metrics.totalRevenue)}
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Subscription Revenue"
                    value={formatCurrency(revenueQuery.data.metrics.subscriptionRevenue)}
                    icon={Repeat}
                  />
                  <StatCard
                    title="Marketplace Sales"
                    value={formatCurrency(revenueQuery.data.metrics.marketplaceSales)}
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Platform Fees (15%)"
                    value={formatCurrency(revenueQuery.data.metrics.platformFees)}
                    icon={ArrowUpRight}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {revenueQuery.data.recentEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No transactions yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {revenueQuery.data.recentEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4">
                            <div>
                              <div className="font-medium text-sm">
                                {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {event.tierName || event.productType || 'N/A'} - {new Date(event.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={event.status === 'succeeded' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                              <span className="font-mono font-medium">
                                {formatCurrency(event.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {subscriptionQuery.data && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{subscriptionQuery.data.activeSubscriptions}</div>
                          <div className="text-sm text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-500">{subscriptionQuery.data.newThisMonth}</div>
                          <div className="text-sm text-muted-foreground">New This Month</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-red-500">{subscriptionQuery.data.churned}</div>
                          <div className="text-sm text-muted-foreground">Churned</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{subscriptionQuery.data.churnRate}%</div>
                          <div className="text-sm text-muted-foreground">Churn Rate</div>
                        </div>
                      </div>
                      {Object.keys(subscriptionQuery.data.byTier).length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-3">By Tier</h4>
                          <div className="space-y-2">
                            {Object.entries(subscriptionQuery.data.byTier).map(([tier, count]) => (
                              <div key={tier} className="flex items-center justify-between">
                                <span className="text-sm">{tier}</span>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            {creditAnalyticsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : creditAnalyticsQuery.data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Credits Granted"
                    value={creditAnalyticsQuery.data.totalCreditsGranted.toLocaleString()}
                    icon={ArrowUpRight}
                    subtitle="This period"
                  />
                  <StatCard
                    title="Credits Used"
                    value={creditAnalyticsQuery.data.totalCreditsUsed.toLocaleString()}
                    icon={ArrowDownRight}
                    subtitle="This period"
                  />
                  <StatCard
                    title="Net Flow"
                    value={creditAnalyticsQuery.data.netCreditFlow.toLocaleString()}
                    icon={BarChart3}
                    subtitle={creditAnalyticsQuery.data.netCreditFlow >= 0 ? 'Positive' : 'Negative'}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Features by Credit Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creditAnalyticsQuery.data.topFeatures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No usage data yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {creditAnalyticsQuery.data.topFeatures.map((item, idx) => {
                          const maxCredits = creditAnalyticsQuery.data!.topFeatures[0]?.credits || 1;
                          const percentage = (item.credits / maxCredits) * 100;
                          return (
                            <div key={item.feature} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item.feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                <span className="font-mono">{item.credits.toLocaleString()}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {Object.keys(creditAnalyticsQuery.data.byStudio).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage by Studio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Object.entries(creditAnalyticsQuery.data.byStudio).map(([studio, credits]) => (
                          <div key={studio} className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-lg font-bold">{credits.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{studio}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or name..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                      className="pl-10"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {usersQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : usersQuery.data?.users.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  <div>
                    {usersQuery.data?.users.map((user) => (
                      <UserRow key={user.id} user={user} onUpdate={handleRefresh} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
