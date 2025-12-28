import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Watch, Smartphone, Activity, Heart, Footprints, Moon, Flame,
  RefreshCw, Link2, Unlink, CheckCircle2, AlertCircle, TrendingUp,
  Loader2, Settings, Zap
} from "lucide-react";

interface WearableConnection {
  id: number;
  provider: string;
  deviceName: string;
  lastSyncAt: string;
  syncEnabled: boolean;
  metricsEnabled: {
    steps: boolean;
    heart_rate: boolean;
    sleep: boolean;
    calories: boolean;
    active_minutes: boolean;
  };
}

interface WearableMetric {
  id: number;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
}

const PROVIDERS = [
  { id: "google_fit", name: "Google Fit", icon: Activity, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "fitbit", name: "Fitbit", icon: Watch, color: "text-teal-400", bgColor: "bg-teal-500/10" },
  { id: "apple_health", name: "Apple Health", icon: Heart, color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "garmin", name: "Garmin", icon: Watch, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  { id: "oura", name: "Oura Ring", icon: Moon, color: "text-purple-400", bgColor: "bg-purple-500/10" },
];

export default function Wearables() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const { data: connections, isLoading: connectionsLoading } = useQuery<WearableConnection[]>({
    queryKey: ["/api/wearables/connections"],
    queryFn: async () => {
      const res = await fetch("/api/wearables/connections");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<WearableMetric[]>({
    queryKey: ["/api/wearables/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/wearables/metrics");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: todayStats } = useQuery<any>({
    queryKey: ["/api/wearables/today"],
    queryFn: async () => {
      const res = await fetch("/api/wearables/today");
      if (!res.ok) return { steps: 0, heartRate: 0, calories: 0, activeMinutes: 0, sleep: 0 };
      return res.json();
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest("POST", "/api/wearables/connect", { provider });
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/connections"] });
      setConnectingProvider(null);
      toast({ title: "Connected!", description: `${provider} is now connected` });
    },
    onError: () => {
      setConnectingProvider(null);
      toast({ title: "Connection failed", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return apiRequest("DELETE", `/api/wearables/connections/${connectionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/connections"] });
      toast({ title: "Disconnected" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return apiRequest("POST", `/api/wearables/connections/${connectionId}/sync`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/today"] });
      toast({ title: "Synced!", description: "Latest data imported" });
    },
  });

  const isConnected = (providerId: string) => {
    return connections?.some(c => c.provider === providerId);
  };

  const getConnection = (providerId: string) => {
    return connections?.find(c => c.provider === providerId);
  };

  if (connectionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-wearables-title">
              Wearables & Devices
            </h1>
            <p className="text-gray-400 mt-1">
              Connect your fitness trackers and smartwatches
            </p>
          </div>
          <Button
            onClick={() => {
              connections?.forEach(c => syncMutation.mutate(c.id));
            }}
            disabled={!connections?.length || syncMutation.isPending}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-sync-all"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync All
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 mb-6">
            <TabsTrigger value="overview" data-testid="tab-wearables-overview">Overview</TabsTrigger>
            <TabsTrigger value="devices" data-testid="tab-wearables-devices">Devices</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-wearables-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Footprints className="w-8 h-8 text-blue-400" />
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Steps</p>
                  <p className="text-2xl font-bold text-foreground">{todayStats?.steps?.toLocaleString() || 0}</p>
                  <Progress value={(todayStats?.steps || 0) / 100} className="h-1 mt-2" />
                  <p className="text-gray-500 text-xs mt-1">Goal: 10,000</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-8 h-8 text-red-400" />
                    <Badge className="bg-green-500/20 text-green-400 text-xs">Normal</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">Heart Rate</p>
                  <p className="text-2xl font-bold text-foreground">{todayStats?.heartRate || 72} BPM</p>
                  <p className="text-gray-500 text-xs mt-2">Resting average</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="w-8 h-8 text-primary" />
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Calories</p>
                  <p className="text-2xl font-bold text-foreground">{todayStats?.calories?.toLocaleString() || 0}</p>
                  <p className="text-gray-500 text-xs mt-2">Active calories burned</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-8 h-8 text-yellow-400" />
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Active Minutes</p>
                  <p className="text-2xl font-bold text-foreground">{todayStats?.activeMinutes || 0}</p>
                  <Progress value={(todayStats?.activeMinutes || 0) / 0.3} className="h-1 mt-2" />
                  <p className="text-gray-500 text-xs mt-1">Goal: 30 mins</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Moon className="w-8 h-8 text-purple-400" />
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">Good</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">Sleep</p>
                  <p className="text-2xl font-bold text-foreground">{todayStats?.sleep || 7}h</p>
                  <p className="text-gray-500 text-xs mt-2">Last night</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-foreground">Connected Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  {connections && connections.length > 0 ? (
                    <div className="space-y-3">
                      {connections.map((connection) => {
                        const provider = PROVIDERS.find(p => p.id === connection.provider);
                        const Icon = provider?.icon || Watch;
                        return (
                          <div key={connection.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${provider?.bgColor}`}>
                                <Icon className={`w-5 h-5 ${provider?.color}`} />
                              </div>
                              <div>
                                <p className="text-foreground font-medium">{connection.deviceName || provider?.name}</p>
                                <p className="text-gray-400 text-sm">
                                  Last sync: {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Never"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => syncMutation.mutate(connection.id)}
                                disabled={syncMutation.isPending}
                              >
                                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                              </Button>
                              <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Watch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No devices connected</p>
                      <p className="text-gray-500 text-sm">Connect a wearable to start tracking</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-foreground">Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                      <div key={day} className="flex items-center gap-4">
                        <span className="text-gray-400 w-10">{day}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-orange-400 h-full rounded-full"
                            style={{ width: `${Math.random() * 40 + 40}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm w-16 text-right">
                          {Math.floor(Math.random() * 5000 + 5000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROVIDERS.map((provider) => {
                const connected = isConnected(provider.id);
                const connection = getConnection(provider.id);
                const Icon = provider.icon;

                return (
                  <Card key={provider.id} className={`bg-gray-900 border-gray-800 ${connected ? "ring-1 ring-green-500/50" : ""}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${provider.bgColor}`}>
                          <Icon className={`w-8 h-8 ${provider.color}`} />
                        </div>
                        {connected && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{provider.name}</h3>
                      {connected && connection ? (
                        <div className="space-y-4">
                          <p className="text-gray-400 text-sm">
                            Device: {connection.deviceName || "Unknown"}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Steps</span>
                              <Switch checked={connection.metricsEnabled?.steps ?? true} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Heart Rate</span>
                              <Switch checked={connection.metricsEnabled?.heart_rate ?? true} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Sleep</span>
                              <Switch checked={connection.metricsEnabled?.sleep ?? true} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => syncMutation.mutate(connection.id)}
                              className="flex-1"
                              variant="outline"
                              size="sm"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sync
                            </Button>
                            <Button
                              onClick={() => disconnectMutation.mutate(connection.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                            >
                              <Unlink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-400 text-sm mb-4">
                            Connect your {provider.name} to sync health data automatically
                          </p>
                          <Button
                            onClick={() => {
                              setConnectingProvider(provider.id);
                              connectMutation.mutate(provider.id);
                            }}
                            disabled={connectingProvider === provider.id}
                            className="w-full bg-primary hover:bg-primary/90"
                            data-testid={`button-connect-${provider.id}`}
                          >
                            {connectingProvider === provider.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Link2 className="w-4 h-4 mr-2" />
                            )}
                            Connect
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Synced Data</CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : metrics && metrics.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.slice(0, 20).map((metric) => (
                      <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {metric.metricType === "steps" && <Footprints className="w-5 h-5 text-blue-400" />}
                          {metric.metricType === "heart_rate" && <Heart className="w-5 h-5 text-red-400" />}
                          {metric.metricType === "sleep" && <Moon className="w-5 h-5 text-purple-400" />}
                          {metric.metricType === "calories" && <Flame className="w-5 h-5 text-primary" />}
                          {metric.metricType === "active_minutes" && <Zap className="w-5 h-5 text-yellow-400" />}
                          <div>
                            <p className="text-foreground capitalize">{metric.metricType.replace("_", " ")}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(metric.recordedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-foreground font-medium">
                          {metric.value.toLocaleString()} {metric.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No data synced yet</p>
                    <p className="text-gray-500 text-sm">Connect a device and sync to see your data</p>
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
