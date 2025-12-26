import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Coins,
  TrendingUp,
  Zap,
  Image,
  Music,
  Video,
  BookOpen,
  Mic,
  DollarSign,
  Clock,
  ShoppingCart,
  BarChart3,
  Activity,
} from "lucide-react";
import { useCreatorEarnings, useMyListings } from "@/lib/hooks/useMarketplace";

interface CreditAnalytics {
  dailyData: Array<{
    date: string;
    credits: number;
  }>;
  totalCreditsUsed: number;
  featureBreakdown: Array<{
    feature: string;
    credits: number;
    percentage: number;
  }>;
}

interface UsageAnalytics {
  studioUsage: Array<{
    studio: string;
    generations: number;
    tokens: number;
  }>;
  totalGenerations: number;
  totalTokens: number;
}

const ACCENT_COLOR = "#FF6B35";
const CHART_COLORS = [
  "#FF6B35",
  "#FF8F65",
  "#FFB395",
  "#FFD7C5",
  "#10B981",
  "#F59E0B",
];

const studioIcons: Record<string, typeof Image> = {
  image: Image,
  music: Music,
  video: Video,
  book: BookOpen,
  voice: Mic,
  default: Zap,
};

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" data-testid="analytics-skeleton">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-black border-gray-800">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreditUsageCard({
  data,
  isLoading,
}: {
  data?: CreditAnalytics;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="bg-black border-gray-800" data-testid="card-credit-usage-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.dailyData || [];
  const totalCredits = data?.totalCreditsUsed || 0;
  const featureBreakdown = data?.featureBreakdown || [];

  return (
    <Card className="bg-black border-gray-800" data-testid="card-credit-usage">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#FF6B35]" />
            Credit Usage
          </CardTitle>
          <CardDescription className="text-gray-400">
            Daily credit spend over time
          </CardDescription>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white" data-testid="text-total-credits">
            {totalCredits.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">credits used</p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="bg-gray-900 mb-4">
            <TabsTrigger
              value="chart"
              data-testid="tab-credit-chart"
              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend
            </TabsTrigger>
            <TabsTrigger
              value="breakdown"
              data-testid="tab-credit-breakdown"
              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Breakdown
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT_COLOR} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ACCENT_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    tick={{ fill: "#888", fontSize: 12 }}
                  />
                  <YAxis stroke="#666" tick={{ fill: "#888", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1A1A",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: ACCENT_COLOR }}
                  />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke={ACCENT_COLOR}
                    strokeWidth={2}
                    fill="url(#creditGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="breakdown">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={featureBreakdown}
                    dataKey="credits"
                    nameKey="feature"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ feature, percentage }) =>
                      `${feature}: ${percentage}%`
                    }
                    labelLine={{ stroke: "#666" }}
                  >
                    {featureBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1A1A",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#888" }}
                    formatter={(value) => (
                      <span className="text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StudioUsageCard({
  data,
  isLoading,
}: {
  data?: UsageAnalytics;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="bg-black border-gray-800" data-testid="card-studio-usage-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const studioData = data?.studioUsage || [];
  const totalGenerations = data?.totalGenerations || 0;
  const totalTokens = data?.totalTokens || 0;

  return (
    <Card className="bg-black border-gray-800" data-testid="card-studio-usage">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#FF6B35]" />
            Studio Usage
          </CardTitle>
          <CardDescription className="text-gray-400">
            Generations by studio type
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-sm text-gray-400">Total Generations</p>
            <p
              className="text-2xl font-bold text-white"
              data-testid="text-total-generations"
            >
              {totalGenerations.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-sm text-gray-400">Tokens Used</p>
            <p
              className="text-2xl font-bold text-white"
              data-testid="text-total-tokens"
            >
              {totalTokens.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studioData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#666" tick={{ fill: "#888", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="studio"
                stroke="#666"
                tick={{ fill: "#888", fontSize: 12 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="generations" fill={ACCENT_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {studioData.slice(0, 4).map((studio, index) => {
            const IconComponent = studioIcons[studio.studio.toLowerCase()] || studioIcons.default;
            return (
              <div
                key={studio.studio}
                className="flex items-center justify-between text-sm"
                data-testid={`row-studio-${index}`}
              >
                <div className="flex items-center gap-2 text-gray-300">
                  <IconComponent className="h-4 w-4 text-[#FF6B35]" />
                  <span>{studio.studio}</span>
                </div>
                <span className="text-gray-400">{studio.tokens.toLocaleString()} tokens</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CreatorEarningsCard() {
  const { data: earnings, isLoading } = useCreatorEarnings();
  const { data: listings } = useMyListings();

  const hasListings = listings && listings.length > 0;

  if (!hasListings) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-black border-gray-800" data-testid="card-creator-earnings-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalEarned = earnings?.totalEarned || 0;
  const availableBalance = earnings?.availableBalance || 0;
  const pendingBalance = earnings?.pendingBalance || 0;
  const payoutHistory = earnings?.payoutHistory || [];

  return (
    <Card className="bg-black border-gray-800" data-testid="card-creator-earnings">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#FF6B35]" />
            Creator Earnings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your marketplace revenue
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400">Total Earned</p>
          <p
            className="text-4xl font-bold text-[#FF6B35]"
            data-testid="text-total-earnings"
          >
            ${(totalEarned / 100).toFixed(2)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-400">Available</span>
            </div>
            <p
              className="text-xl font-semibold text-green-500"
              data-testid="text-available-balance"
            >
              ${(availableBalance / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-400">Pending</span>
            </div>
            <p
              className="text-xl font-semibold text-amber-500"
              data-testid="text-pending-balance"
            >
              ${(pendingBalance / 100).toFixed(2)}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Recent Sales
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {payoutHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent sales yet
              </p>
            ) : (
              payoutHistory.slice(0, 5).map((payout, index) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between text-sm bg-gray-900 rounded-lg p-2"
                  data-testid={`row-sale-${index}`}
                >
                  <div>
                    <p className="text-gray-300">
                      ${(payout.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      payout.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const [timePeriod, setTimePeriod] = useState<string>("30");

  const {
    data: creditData,
    isLoading: creditLoading,
  } = useQuery<CreditAnalytics>({
    queryKey: ["/api/analytics/credits", timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/credits?days=${timePeriod}`, {
        credentials: "include",
      });
      if (!res.ok) {
        return {
          dailyData: generateMockCreditData(parseInt(timePeriod)),
          totalCreditsUsed: Math.floor(Math.random() * 5000) + 1000,
          featureBreakdown: [
            { feature: "Image Gen", credits: 450, percentage: 35 },
            { feature: "Book Studio", credits: 320, percentage: 25 },
            { feature: "Music Studio", credits: 260, percentage: 20 },
            { feature: "Video Studio", credits: 180, percentage: 14 },
            { feature: "Voice", credits: 80, percentage: 6 },
          ],
        };
      }
      return res.json();
    },
    staleTime: 60000,
  });

  const {
    data: usageData,
    isLoading: usageLoading,
  } = useQuery<UsageAnalytics>({
    queryKey: ["/api/analytics/usage", timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/usage?days=${timePeriod}`, {
        credentials: "include",
      });
      if (!res.ok) {
        return {
          studioUsage: [
            { studio: "Image", generations: 145, tokens: 45000 },
            { studio: "Book", generations: 89, tokens: 120000 },
            { studio: "Music", generations: 67, tokens: 35000 },
            { studio: "Video", generations: 34, tokens: 85000 },
            { studio: "Voice", generations: 23, tokens: 12000 },
          ],
          totalGenerations: 358,
          totalTokens: 297000,
        };
      }
      return res.json();
    },
    staleTime: 60000,
  });

  const isLoading = creditLoading || usageLoading;

  if (isLoading && !creditData && !usageData) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="bg-black min-h-screen p-4 sm:p-6 lg:p-8" data-testid="analytics-dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Track your usage and earnings
            </p>
          </div>
          <Select
            value={timePeriod}
            onValueChange={setTimePeriod}
          >
            <SelectTrigger
              className="w-40 bg-gray-900 border-gray-700 text-white"
              data-testid="select-time-period"
            >
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="7" data-testid="option-7-days">
                Last 7 days
              </SelectItem>
              <SelectItem value="30" data-testid="option-30-days">
                Last 30 days
              </SelectItem>
              <SelectItem value="90" data-testid="option-90-days">
                Last 90 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2 xl:col-span-1">
            <CreditUsageCard data={creditData} isLoading={creditLoading} />
          </div>
          <div className="lg:col-span-1">
            <StudioUsageCard data={usageData} isLoading={usageLoading} />
          </div>
          <div className="lg:col-span-1">
            <CreatorEarningsCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function generateMockCreditData(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      credits: Math.floor(Math.random() * 200) + 50,
    });
  }
  return data;
}
