import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  Heart, Activity, Droplets, Footprints, Moon, Brain, Flame, Target,
  Plus, TrendingUp, Calendar, Clock, CheckCircle2, AlertCircle, Zap,
  Thermometer, Wind, Eye, Pill, Bell, ChevronRight, Loader2
} from "lucide-react";

interface VitalReading {
  id: number;
  type: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  oxygenLevel?: number;
  temperature?: number;
  weight?: number;
  recordedAt: string;
}

interface DailyCheckin {
  id: number;
  moodScore: number;
  energyScore: number;
  painScore: number;
  sleepHours: number;
  exerciseMinutes: number;
  winsToday: string;
  challengesToday: string;
  gratitude: string;
  checkinDate: string;
}

export default function CommandCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [vitalDialogOpen, setVitalDialogOpen] = useState(false);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);

  const [vitalForm, setVitalForm] = useState({
    type: "blood_pressure",
    systolic: 120,
    diastolic: 80,
    heartRate: 72,
    oxygenLevel: 98,
    temperature: 98.6,
    weight: 0,
  });

  const [checkinForm, setCheckinForm] = useState({
    moodScore: 5,
    energyScore: 5,
    painScore: 3,
    sleepHours: 7,
    exerciseMinutes: 0,
    winsToday: "",
    challengesToday: "",
    gratitude: "",
  });

  const { data: dashboard, isLoading } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
  });

  const { data: vitals } = useQuery<VitalReading[]>({
    queryKey: ["/api/vitals"],
    queryFn: async () => {
      const res = await fetch("/api/vitals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: hydrationData } = useQuery<any>({
    queryKey: ["/api/wellness/hydration-goal"],
    queryFn: async () => {
      const res = await fetch("/api/wellness/hydration-goal");
      return res.json();
    },
  });

  const { data: exerciseData } = useQuery<any>({
    queryKey: ["/api/wellness/exercise-goal"],
    queryFn: async () => {
      const res = await fetch("/api/wellness/exercise-goal");
      return res.json();
    },
  });

  const { data: standData } = useQuery<any>({
    queryKey: ["/api/wellness/stand-goal"],
    queryFn: async () => {
      const res = await fetch("/api/wellness/stand-goal");
      return res.json();
    },
  });

  const { data: reminders } = useQuery<any[]>({
    queryKey: ["/api/reminders"],
    queryFn: async () => {
      const res = await fetch("/api/reminders");
      return res.json();
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/checkin", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/dashboard"] });
      setCheckinDialogOpen(false);
      toast({ title: "Check-in complete!", description: "Great job staying consistent!" });
    },
  });

  const logHydrationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/hydration-log", { amount: 8 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/hydration-goal"] });
      toast({ title: "Water logged!", description: "+8 oz added" });
    },
  });

  const logExerciseMutation = useMutation({
    mutationFn: (minutes: number) => apiRequest("POST", "/api/wellness/exercise-log", { type: "General", duration: minutes, intensity: "moderate" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/exercise-goal"] });
      toast({ title: "Exercise logged!" });
    },
  });

  const logStandMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/stand-log", { duration: 60 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/stand-goal"] });
      toast({ title: "Stand logged!" });
    },
  });

  const streak = dashboard?.streak || { currentStreak: 0, longestStreak: 0 };
  const todayCheckin = dashboard?.recentCheckins?.[0];
  const habits = dashboard?.habits || [];

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return "😄";
    if (score >= 6) return "🙂";
    if (score >= 4) return "😐";
    if (score >= 2) return "😔";
    return "😢";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-command-center-title">
              Recovery Command Center
            </h1>
            <p className="text-gray-400 mt-1">
              Good {getTimeOfDay()}, {user?.firstName || "Warrior"}! Let's crush it today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg">
              <Flame className="w-5 h-5 text-primary" />
              <span className="font-bold text-xl">{streak.currentStreak}</span>
              <span className="text-gray-400 text-sm">day streak</span>
            </div>
            <Dialog open={checkinDialogOpen} onOpenChange={setCheckinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="button-daily-checkin">
                  <Plus className="w-4 h-4 mr-2" />
                  Daily Check-in
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">Daily Check-in</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">How's your mood? {getMoodEmoji(checkinForm.moodScore)}</label>
                    <Slider
                      value={[checkinForm.moodScore]}
                      onValueChange={(v) => setCheckinForm({ ...checkinForm, moodScore: v[0] })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>{checkinForm.moodScore}/10</span>
                      <span>Great</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Energy Level ⚡</label>
                    <Slider
                      value={[checkinForm.energyScore]}
                      onValueChange={(v) => setCheckinForm({ ...checkinForm, energyScore: v[0] })}
                      max={10}
                      min={1}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Exhausted</span>
                      <span>{checkinForm.energyScore}/10</span>
                      <span>Energized</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Pain Level 🩹</label>
                    <Slider
                      value={[checkinForm.painScore]}
                      onValueChange={(v) => setCheckinForm({ ...checkinForm, painScore: v[0] })}
                      max={10}
                      min={0}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>None</span>
                      <span>{checkinForm.painScore}/10</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Sleep (hours)</label>
                      <Input
                        type="number"
                        value={checkinForm.sleepHours}
                        onChange={(e) => setCheckinForm({ ...checkinForm, sleepHours: parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Exercise (mins)</label>
                      <Input
                        type="number"
                        value={checkinForm.exerciseMinutes}
                        onChange={(e) => setCheckinForm({ ...checkinForm, exerciseMinutes: parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Wins Today 🏆</label>
                    <Textarea
                      value={checkinForm.winsToday}
                      onChange={(e) => setCheckinForm({ ...checkinForm, winsToday: e.target.value })}
                      placeholder="What went well today?"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Challenges 💪</label>
                    <Textarea
                      value={checkinForm.challengesToday}
                      onChange={(e) => setCheckinForm({ ...checkinForm, challengesToday: e.target.value })}
                      placeholder="What was difficult?"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Gratitude 🙏</label>
                    <Textarea
                      value={checkinForm.gratitude}
                      onChange={(e) => setCheckinForm({ ...checkinForm, gratitude: e.target.value })}
                      placeholder="What are you grateful for?"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <Button
                    onClick={() => checkinMutation.mutate(checkinForm)}
                    disabled={checkinMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {checkinMutation.isPending ? "Saving..." : "Complete Check-in"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="vitals" data-testid="tab-vitals">Vitals</TabsTrigger>
            <TabsTrigger value="wellness" data-testid="tab-wellness">Wellness</TabsTrigger>
            <TabsTrigger value="habits" data-testid="tab-habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Today's Mood</p>
                      <p className="text-3xl font-bold mt-1">
                        {todayCheckin?.moodScore || "-"}/10
                      </p>
                    </div>
                    <div className="text-4xl">{todayCheckin ? getMoodEmoji(todayCheckin.moodScore) : "📊"}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Energy Level</p>
                      <p className="text-3xl font-bold mt-1">
                        {todayCheckin?.energyScore || "-"}/10
                      </p>
                    </div>
                    <Zap className="w-10 h-10 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Pain Level</p>
                      <p className="text-3xl font-bold mt-1">
                        {todayCheckin?.painScore ?? "-"}/10
                      </p>
                    </div>
                    <Heart className="w-10 h-10 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Sleep</p>
                      <p className="text-3xl font-bold mt-1">
                        {todayCheckin?.sleepHours || "-"}h
                      </p>
                    </div>
                    <Moon className="w-10 h-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    Hydration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-blue-400">
                      {hydrationData?.todayTotal || 0}
                    </p>
                    <p className="text-gray-400">/ {hydrationData?.goal?.dailyTarget || 8} glasses</p>
                  </div>
                  <Progress
                    value={((hydrationData?.todayTotal || 0) / (hydrationData?.goal?.dailyTarget || 8)) * 100}
                    className="h-3 mb-4"
                  />
                  <Button
                    onClick={() => logHydrationMutation.mutate()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={logHydrationMutation.isPending}
                    data-testid="button-log-water"
                  >
                    <Droplets className="w-4 h-4 mr-2" />
                    Log Water (+8oz)
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-green-400">
                      {exerciseData?.todayTotal || 0}
                    </p>
                    <p className="text-gray-400">/ {exerciseData?.goal?.dailyMinutes || 30} mins</p>
                  </div>
                  <Progress
                    value={((exerciseData?.todayTotal || 0) / (exerciseData?.goal?.dailyMinutes || 30)) * 100}
                    className="h-3 mb-4"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => logExerciseMutation.mutate(10)}
                      variant="outline"
                      size="sm"
                      data-testid="button-log-10min"
                    >
                      +10m
                    </Button>
                    <Button
                      onClick={() => logExerciseMutation.mutate(20)}
                      variant="outline"
                      size="sm"
                    >
                      +20m
                    </Button>
                    <Button
                      onClick={() => logExerciseMutation.mutate(30)}
                      variant="outline"
                      size="sm"
                    >
                      +30m
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-primary" />
                    Stand Breaks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-primary">
                      {standData?.todayTotal || 0}
                    </p>
                    <p className="text-gray-400">/ {standData?.goal?.dailyStandTarget || 12} stands</p>
                  </div>
                  <Progress
                    value={((standData?.todayTotal || 0) / (standData?.goal?.dailyStandTarget || 12)) * 100}
                    className="h-3 mb-4"
                  />
                  <Button
                    onClick={() => logStandMutation.mutate()}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={logStandMutation.isPending}
                    data-testid="button-log-stand"
                  >
                    <Footprints className="w-4 h-4 mr-2" />
                    Log Stand Break
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Upcoming Reminders
                  </span>
                  <Link href="/reminders">
                    <Button variant="ghost" size="sm">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reminders && reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.slice(0, 5).map((reminder: any) => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {reminder.type === "medication" && <Pill className="w-5 h-5 text-red-400" />}
                          {reminder.type === "hydration" && <Droplets className="w-5 h-5 text-blue-400" />}
                          {reminder.type === "exercise" && <Activity className="w-5 h-5 text-green-400" />}
                          {reminder.type === "appointment" && <Calendar className="w-5 h-5 text-purple-400" />}
                          {reminder.type === "stand" && <Footprints className="w-5 h-5 text-primary" />}
                          <div>
                            <p className="text-white font-medium">{reminder.title}</p>
                            <p className="text-gray-400 text-sm">{reminder.time}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{reminder.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No reminders set. Add some to stay on track!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Vital Signs Tracking</h2>
              <Dialog open={vitalDialogOpen} onOpenChange={setVitalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90" data-testid="button-log-vitals">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Vitals
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Log Vital Signs</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Systolic (mmHg)</label>
                        <Input
                          type="number"
                          value={vitalForm.systolic}
                          onChange={(e) => setVitalForm({ ...vitalForm, systolic: parseInt(e.target.value) })}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Diastolic (mmHg)</label>
                        <Input
                          type="number"
                          value={vitalForm.diastolic}
                          onChange={(e) => setVitalForm({ ...vitalForm, diastolic: parseInt(e.target.value) })}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Heart Rate (BPM)</label>
                      <Input
                        type="number"
                        value={vitalForm.heartRate}
                        onChange={(e) => setVitalForm({ ...vitalForm, heartRate: parseInt(e.target.value) })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Oxygen Level (%)</label>
                      <Input
                        type="number"
                        value={vitalForm.oxygenLevel}
                        onChange={(e) => setVitalForm({ ...vitalForm, oxygenLevel: parseInt(e.target.value) })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Save Vitals
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-8 h-8 text-red-500" />
                    <Badge className="bg-green-500/20 text-green-400">Normal</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">Blood Pressure</p>
                  <p className="text-2xl font-bold text-white">120/80</p>
                  <p className="text-gray-500 text-xs mt-1">Last: Today 9:00 AM</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-8 h-8 text-primary" />
                    <Badge className="bg-green-500/20 text-green-400">Normal</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">Heart Rate</p>
                  <p className="text-2xl font-bold text-white">72 BPM</p>
                  <p className="text-gray-500 text-xs mt-1">Resting</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Wind className="w-8 h-8 text-blue-400" />
                    <Badge className="bg-green-500/20 text-green-400">Normal</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">Oxygen Level</p>
                  <p className="text-2xl font-bold text-white">98%</p>
                  <p className="text-gray-500 text-xs mt-1">SpO2</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Thermometer className="w-8 h-8 text-yellow-400" />
                    <Badge className="bg-green-500/20 text-green-400">Normal</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">Temperature</p>
                  <p className="text-2xl font-bold text-white">98.6°F</p>
                  <p className="text-gray-500 text-xs mt-1">Body temp</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Stroke Prevention Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-white font-medium">Blood Pressure in Range</p>
                      <p className="text-gray-400 text-sm">Your readings are within healthy limits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-white font-medium">Stay Hydrated</p>
                      <p className="text-gray-400 text-sm">Proper hydration helps maintain healthy blood flow</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wellness" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Weekly Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Hydration</span>
                        <span className="text-white">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Exercise</span>
                        <span className="text-white">70%</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Sleep Quality</span>
                        <span className="text-white">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Check-in Streak</span>
                        <span className="text-white">100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recovery Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{dashboard?.enrollment?.recoveryScore || 75}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 mt-4">Your overall recovery score based on consistency, vitals, and progress</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">+5 from last week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="habits" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  66-Day Habit Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                {habits.length > 0 ? (
                  <div className="space-y-6">
                    {habits.map((habit: any) => (
                      <div key={habit.id} className="p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{habit.habitName}</p>
                            <p className="text-gray-400 text-sm">{habit.habitDescription}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{habit.currentStreak}</p>
                            <p className="text-gray-400 text-xs">day streak</p>
                          </div>
                        </div>
                        <Progress value={(habit.totalCompletions / 66) * 100} className="h-2" />
                        <p className="text-gray-400 text-xs mt-2">{habit.totalCompletions}/66 days completed</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No habits tracked yet</p>
                    <p className="text-gray-500 text-sm">Start building your recovery habits!</p>
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
