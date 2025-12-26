import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
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
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Eye,
  Package,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const ACCENT_COLOR = "#FF6B35";
const CHART_COLORS = [
  "#FF6B35",
  "#FF8F65",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

const generateRevenueData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.floor(Math.random() * 500) + 100,
      sales: Math.floor(Math.random() * 20) + 5,
    });
  }
  return data;
};

const mockSalesBreakdown = [
  { name: "E-Books", value: 4500, count: 45 },
  { name: "Music Tracks", value: 3200, count: 32 },
  { name: "Video Courses", value: 2800, count: 14 },
  { name: "Images", value: 1800, count: 180 },
  { name: "Templates", value: 1200, count: 24 },
];

const mockTopProducts = [
  { id: 1, name: "Complete Guitar Mastery Course", type: "Course", sales: 156, revenue: 4680, trend: 12 },
  { id: 2, name: "Ambient Music Pack Vol. 1", type: "Music", sales: 89, revenue: 1335, trend: 8 },
  { id: 3, name: "Stroke Recovery Bible", type: "E-Book", sales: 76, revenue: 1140, trend: 25 },
  { id: 4, name: "Professional Photo Presets", type: "Images", sales: 234, revenue: 936, trend: -5 },
  { id: 5, name: "Meditation Audio Collection", type: "Music", sales: 45, revenue: 675, trend: 3 },
];

const mockTransactions = [
  { id: 1, product: "Complete Guitar Mastery Course", buyer: "john_doe", amount: 29.99, date: "2025-12-26T10:30:00", status: "completed" },
  { id: 2, product: "Ambient Music Pack Vol. 1", buyer: "music_lover_22", amount: 14.99, date: "2025-12-26T09:15:00", status: "completed" },
  { id: 3, product: "Stroke Recovery Bible", buyer: "recovery_warrior", amount: 14.99, date: "2025-12-25T22:45:00", status: "completed" },
  { id: 4, product: "Professional Photo Presets", buyer: "photo_pro", amount: 3.99, date: "2025-12-25T18:20:00", status: "pending" },
  { id: 5, product: "Meditation Audio Collection", buyer: "zen_master", amount: 14.99, date: "2025-12-25T14:10:00", status: "completed" },
];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" data-testid="analytics-loading">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-gray-800">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="bg-card border-gray-800">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  change: number;
  icon: typeof DollarSign;
  testId: string;
}

function SummaryCard({ title, value, change, icon: Icon, testId }: SummaryCardProps) {
  const isPositive = change >= 0;
  return (
    <Card className="bg-card border-gray-800" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <div className="h-8 w-8 rounded bg-[#FF6B35]/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#FF6B35]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white" data-testid={`${testId}-value`}>{value}</div>
        <p className={`text-xs flex items-center gap-1 ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(change)}% from last period
        </p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const [timePeriod, setTimePeriod] = useState<string>("30");
  const [isLoading, setIsLoading] = useState(false);

  const revenueData = generateRevenueData(parseInt(timePeriod));
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalSales = revenueData.reduce((sum, d) => sum + d.sales, 0);

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <AnalyticsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-4 sm:p-6 lg:p-8" data-testid="analytics-dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Creator Analytics</h1>
            <p className="text-gray-400 mt-1">Track your performance and earnings</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white" data-testid="select-time-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="7" data-testid="option-7-days">Last 7 days</SelectItem>
                <SelectItem value="30" data-testid="option-30-days">Last 30 days</SelectItem>
                <SelectItem value="90" data-testid="option-90-days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/creator-hub">
              <Button variant="outline" size="default" data-testid="button-back">
                Back to Hub
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Earnings"
            value={`$${totalRevenue.toLocaleString()}`}
            change={12.5}
            icon={DollarSign}
            testId="card-total-earnings"
          />
          <SummaryCard
            title="Total Sales"
            value={totalSales.toLocaleString()}
            change={8.2}
            icon={ShoppingCart}
            testId="card-total-sales"
          />
          <SummaryCard
            title="Active Listings"
            value="24"
            change={4}
            icon={Package}
            testId="card-active-listings"
          />
          <SummaryCard
            title="Total Views"
            value="12.4K"
            change={-2.1}
            icon={Eye}
            testId="card-total-views"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 bg-card border-gray-800" data-testid="card-revenue-chart">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#FF6B35]" />
                  Revenue Trends
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Daily earnings over the selected period
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
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
                    <YAxis
                      stroke="#666"
                      tick={{ fill: "#888", fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1A1A",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: number) => [`$${value}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={ACCENT_COLOR}
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-800" data-testid="card-sales-breakdown">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#FF6B35]" />
                Sales by Product Type
              </CardTitle>
              <CardDescription className="text-gray-400">
                Revenue distribution by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockSalesBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {mockSalesBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1A1A",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value}`, "Revenue"]}
                    />
                    <Legend
                      wrapperStyle={{ color: "#888" }}
                      formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-gray-800" data-testid="card-top-products">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#FF6B35]" />
                Top Performing Products
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your best sellers by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 text-gray-400 font-medium">Product</th>
                      <th className="text-left py-3 text-gray-400 font-medium">Type</th>
                      <th className="text-right py-3 text-gray-400 font-medium">Sales</th>
                      <th className="text-right py-3 text-gray-400 font-medium">Revenue</th>
                      <th className="text-right py-3 text-gray-400 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTopProducts.map((product, index) => (
                      <tr key={product.id} className="border-b border-gray-800/50" data-testid={`row-product-${index}`}>
                        <td className="py-3 text-white font-medium truncate max-w-[200px]">{product.name}</td>
                        <td className="py-3 text-gray-400">{product.type}</td>
                        <td className="py-3 text-right text-gray-300">{product.sales}</td>
                        <td className="py-3 text-right text-white font-medium">${product.revenue}</td>
                        <td className="py-3 text-right">
                          <span className={`flex items-center justify-end gap-1 ${product.trend >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {product.trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {Math.abs(product.trend)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-800" data-testid="card-recent-transactions">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#FF6B35]" />
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your latest sales activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {mockTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                    data-testid={`row-transaction-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{transaction.product}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>@{transaction.buyer}</span>
                        <span>•</span>
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-white font-semibold">${transaction.amount}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          transaction.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
