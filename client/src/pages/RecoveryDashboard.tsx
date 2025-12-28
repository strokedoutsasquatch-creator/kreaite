import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { 
  Flame, Trophy, BookOpen, MessageCircle, Grid3X3, ShoppingBag, Users,
  CheckCircle2, Target, Star, TrendingUp, Calendar, Heart, Zap, LogOut,
  Plus, UserPlus, DoorOpen, Smile, Activity
} from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";

const motivationalQuotes = [
  "Your recovery is your superpower. Keep pushing.",
  "One day at a time, one rep at a time.",
  "The comeback is always stronger than the setback.",
  "You've survived 100% of your worst days.",
  "Progress, not perfection.",
];

export default function RecoveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkinForm, setCheckinForm] = useState({
    moodScore: 5,
    energyScore: 5,
    painScore: 3,
    winsToday: "",
    challengesToday: "",
    gratitude: "",
  });
  const [createPodOpen, setCreatePodOpen] = useState(false);
  const [newPodName, setNewPodName] = useState("");
  const [newPodDescription, setNewPodDescription] = useState("");
  const [newPodFocus, setNewPodFocus] = useState("");

  const { data: dashboard, isLoading } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
  });

  const { data: userPod } = useQuery<any>({
    queryKey: ["/api/user/pod"],
  });

  const { data: openPods } = useQuery<any[]>({
    queryKey: ["/api/pods"],
    enabled: !userPod,
  });

  const { data: podActivity } = useQuery<any[]>({
    queryKey: ["/api/pods", userPod?.id, "activity"],
    enabled: !!userPod?.id,
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/checkin", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/dashboard"] });
      toast({ title: "Check-in complete!", description: "Great job staying consistent!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save check-in", variant: "destructive" });
    },
  });

  const habitLogMutation = useMutation({
    mutationFn: async (userHabitId: number) => {
      return apiRequest("POST", `/api/recovery/habits/${userHabitId}/log`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/dashboard"] });
    },
  });

  const createPodMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; focusArea: string }) => {
      return apiRequest("POST", "/api/pods", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/pod"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      setCreatePodOpen(false);
      setNewPodName("");
      setNewPodDescription("");
      setNewPodFocus("");
      toast({ title: "Pod created!", description: "You are now the leader of your pod." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create pod", variant: "destructive" });
    },
  });

  const joinPodMutation = useMutation({
    mutationFn: async (podId: number) => {
      return apiRequest("POST", `/api/pods/${podId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/pod"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      toast({ title: "Joined pod!", description: "You're now part of an accountability pod." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Could not join pod", variant: "destructive" });
    },
  });

  const leavePodMutation = useMutation({
    mutationFn: async (podId: number) => {
      return apiRequest("POST", `/api/pods/${podId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/pod"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      toast({ title: "Left pod", description: "You've left the accountability pod." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not leave pod", variant: "destructive" });
    },
  });

  const handleCreatePod = () => {
    if (!newPodName.trim()) return;
    createPodMutation.mutate({
      name: newPodName,
      description: newPodDescription,
      focusArea: newPodFocus,
    });
  };

  const handleCheckinSubmit = () => {
    checkinMutation.mutate(checkinForm);
  };

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading your command center...</div>
      </div>
    );
  }

  const streak = dashboard?.streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  const enrollment = dashboard?.enrollment;
  const habits = dashboard?.habits || [];
  const milestones = dashboard?.milestones || [];
  const todayCheckin = dashboard?.todayCheckin;
  const recoveryScore = dashboard?.recoveryScore || 0;
  const totalPoints = dashboard?.totalPoints || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RecoveryHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h1 className="text-4xl md:text-5xl font-black mb-3" data-testid="text-dashboard-title">
                Welcome back, <span className="text-primary">{user?.firstName || "Warrior"}</span>
              </h1>
              <p className="text-gray-400 text-lg italic" data-testid="text-quote">"{randomQuote}"</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-800 bg-gray-900/50">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="8" fill="none" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    stroke="#FF6B35" strokeWidth="8" fill="none"
                    strokeDasharray={`${recoveryScore * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground" data-testid="text-recovery-score">{recoveryScore}</span>
                  <span className="text-xs text-gray-500 uppercase">Recovery Score</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Flame className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-foreground" data-testid="text-streak">{streak.currentStreak}</span>
                <span className="text-gray-400">day streak</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800 p-6" data-testid="card-checkin">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Check-in
              </h2>
              {todayCheckin && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
            </div>
            
            {todayCheckin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Heart className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-2xl font-bold">{todayCheckin.moodScore}/10</div>
                    <div className="text-xs text-gray-500">Mood</div>
                  </div>
                  <div className="text-center">
                    <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-2xl font-bold">{todayCheckin.energyScore}/10</div>
                    <div className="text-xs text-gray-500">Energy</div>
                  </div>
                  <div className="text-center">
                    <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-2xl font-bold">{todayCheckin.painScore}/10</div>
                    <div className="text-xs text-gray-500">Pain</div>
                  </div>
                </div>
                {todayCheckin.winsToday && (
                  <div className="bg-gray-800/50 rounded p-3">
                    <span className="text-xs text-gray-400 uppercase">Wins:</span>
                    <p className="text-sm text-gray-300">{todayCheckin.winsToday}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Mood (1-10)</label>
                  <Slider
                    value={[checkinForm.moodScore]}
                    onValueChange={(v) => setCheckinForm({ ...checkinForm, moodScore: v[0] })}
                    min={1} max={10} step={1}
                    className="my-2"
                    data-testid="slider-mood"
                  />
                  <div className="text-right text-primary font-bold">{checkinForm.moodScore}</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Energy (1-10)</label>
                  <Slider
                    value={[checkinForm.energyScore]}
                    onValueChange={(v) => setCheckinForm({ ...checkinForm, energyScore: v[0] })}
                    min={1} max={10} step={1}
                    className="my-2"
                    data-testid="slider-energy"
                  />
                  <div className="text-right text-primary font-bold">{checkinForm.energyScore}</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Pain Level (1-10)</label>
                  <Slider
                    value={[checkinForm.painScore]}
                    onValueChange={(v) => setCheckinForm({ ...checkinForm, painScore: v[0] })}
                    min={1} max={10} step={1}
                    className="my-2"
                    data-testid="slider-pain"
                  />
                  <div className="text-right text-primary font-bold">{checkinForm.painScore}</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Today's Wins</label>
                  <Textarea
                    placeholder="What victories did you have today?"
                    value={checkinForm.winsToday}
                    onChange={(e) => setCheckinForm({ ...checkinForm, winsToday: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-foreground"
                    data-testid="input-wins"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Challenges Faced</label>
                  <Textarea
                    placeholder="What challenges did you face?"
                    value={checkinForm.challengesToday}
                    onChange={(e) => setCheckinForm({ ...checkinForm, challengesToday: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-foreground"
                    data-testid="input-challenges"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Gratitude</label>
                  <Textarea
                    placeholder="One thing I'm grateful for..."
                    value={checkinForm.gratitude}
                    onChange={(e) => setCheckinForm({ ...checkinForm, gratitude: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-foreground"
                    data-testid="input-gratitude"
                  />
                </div>
                
                <Button 
                  onClick={handleCheckinSubmit}
                  disabled={checkinMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-foreground font-bold"
                  data-testid="button-checkin-submit"
                >
                  {checkinMutation.isPending ? "Saving..." : "Complete Check-in"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6" data-testid="card-program">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Program Progress
              </h2>
            </div>
            
            {enrollment ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{enrollment.program?.name || "Recovery Program"}</span>
                    <Badge className="bg-primary/20 text-primary border">
                      {enrollment.program?.tier || "Active"}
                    </Badge>
                  </div>
                  <Progress value={enrollment.progressPercentage || 0} className="h-3 bg-gray-800" />
                  <div className="flex justify-between mt-1 text-sm text-gray-400">
                    <span>{enrollment.progressPercentage || 0}% complete</span>
                    <span>{enrollment.program?.estimatedWeeks || 12} weeks</span>
                  </div>
                </div>
                
                {enrollment.currentModule && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-xs text-gray-400 uppercase mb-1">Current Module</div>
                    <div className="font-semibold text-foreground">{enrollment.currentModule.title}</div>
                    {enrollment.currentLesson && (
                      <div className="text-sm text-gray-400 mt-1">Lesson: {enrollment.currentLesson.title}</div>
                    )}
                  </div>
                )}
                
                <Link href="/recovery/academy">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-foreground font-bold" data-testid="button-continue-learning">
                    Continue Learning
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Start your personalized recovery journey</p>
                <Link href="/recovery/builder">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-foreground font-bold" data-testid="button-start-program">
                    Build Your Program
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800 p-6" data-testid="card-habits">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                66-Day Habit Tracker
              </h2>
              <Badge className="bg-gray-800 text-gray-300">{streak.totalActiveDays}/66 days</Badge>
            </div>
            
            <div className="grid grid-cols-11 gap-1 mb-6">
              {Array.from({ length: 66 }).map((_, i) => {
                const isComplete = i < streak.totalActiveDays;
                return (
                  <div 
                    key={i}
                    className={`w-5 h-5 rounded-sm ${isComplete ? 'bg-orange-500' : 'bg-gray-800'}`}
                    title={`Day ${i + 1}`}
                    data-testid={`habit-day-${i + 1}`}
                  />
                );
              })}
            </div>
            
            {habits.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-400 mb-2">Today's Habits</div>
                {habits.map((habit: any) => {
                  const todayLog = habit.logs?.find((l: any) => {
                    const logDate = new Date(l.logDate);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  });
                  const isCompleted = todayLog?.isCompleted;
                  
                  return (
                    <div 
                      key={habit.id}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => habitLogMutation.mutate(habit.id)}
                        disabled={habitLogMutation.isPending}
                        data-testid={`checkbox-habit-${habit.id}`}
                        className="border-orange-500 data-[state=checked]:bg-orange-500"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-foreground'}`}>
                          {habit.customName || habit.habitName}
                        </div>
                        <div className="text-xs text-gray-500">{habit.totalCompletions} completions</div>
                      </div>
                      <div className="text-sm text-primary">{habit.currentStreak} day streak</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-3">No habits tracked yet</p>
                <Link href="/recovery/builder">
                  <Button variant="outline" className="border-orange-500 text-primary hover:bg-primary/10" data-testid="button-add-habit">
                    Add New Habit
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6" data-testid="card-milestones">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Milestones & Achievements
              </h2>
              <Badge className="bg-primary/20 text-primary border">
                <Star className="h-3 w-3 mr-1" /> {totalPoints} pts
              </Badge>
            </div>
            
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.slice(0, 5).map((milestone: any) => (
                  <div 
                    key={milestone.id}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{milestone.name}</div>
                      <div className="text-xs text-gray-500">{milestone.description}</div>
                    </div>
                    <Badge className="bg-gray-700 text-gray-300">+{milestone.pointsAwarded}</Badge>
                  </div>
                ))}
                <Link href="/achievements">
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-orange-500 text-primary hover:bg-primary/10"
                    data-testid="button-view-achievements"
                  >
                    View All Achievements
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Complete check-ins and habits to earn milestones!</p>
                <Link href="/achievements">
                  <Button 
                    variant="outline" 
                    className="mt-4 border-orange-500 text-primary hover:bg-primary/10"
                    data-testid="button-view-achievements-empty"
                  >
                    View Achievement Center
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Accountability Pod Section */}
        <Card className="bg-gray-900 border-gray-800 p-6 mb-8" data-testid="card-accountability-pod">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Accountability Pod
            </h2>
            {userPod && (
              <Badge className="bg-primary/20 text-primary border">
                {userPod.memberCount}/{userPod.maxMembers} members
              </Badge>
            )}
          </div>

          {userPod ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1" data-testid="text-pod-name">{userPod.name}</h3>
                {userPod.description && (
                  <p className="text-sm text-gray-400 mb-3">{userPod.description}</p>
                )}
                {userPod.focusArea && (
                  <Badge className="bg-gray-800 text-gray-300 mb-4">{userPod.focusArea}</Badge>
                )}
              </div>

              {/* Pod Members */}
              <div>
                <div className="text-sm text-gray-400 mb-3">Pod Members</div>
                <div className="flex flex-wrap gap-3" data-testid="pod-members-list">
                  {userPod.members?.map((member: any) => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 bg-gray-800/50 rounded-full pr-3"
                      data-testid={`pod-member-${member.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profileImageUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {member.firstName?.[0] || "?"}{member.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">
                        {member.firstName || "Member"}
                        {member.role === "leader" && (
                          <Star className="h-3 w-3 inline ml-1 text-primary" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pod Activity Feed */}
              {podActivity && podActivity.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </div>
                  <div className="space-y-2" data-testid="pod-activity-feed">
                    {podActivity.slice(0, 5).map((activity: any) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg"
                        data-testid={`activity-${activity.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.profileImageUrl} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {activity.firstName?.[0] || "?"}{activity.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{activity.firstName || "Member"}</span>
                            {activity.type === "checkin" && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Checked in
                              </Badge>
                            )}
                          </div>
                          {activity.winsToday && (
                            <p className="text-xs text-gray-400 truncate">{activity.winsToday}</p>
                          )}
                          {activity.moodScore && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Smile className="h-3 w-3" />
                              Mood: {activity.moodScore}/10
                              <Zap className="h-3 w-3 ml-2" />
                              Energy: {activity.energyScore}/10
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => leavePodMutation.mutate(userPod.id)}
                disabled={leavePodMutation.isPending}
                className="border-gray-700 text-gray-400 hover:text-foreground hover:border-gray-500"
                data-testid="button-leave-pod"
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                {leavePodMutation.isPending ? "Leaving..." : "Leave Pod"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Join an accountability pod for peer support</p>
                <p className="text-xs text-gray-500">Stay motivated with fellow recovery warriors</p>
              </div>

              {/* Open Pods to Join */}
              {openPods && openPods.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3">Available Pods</div>
                  <div className="space-y-2" data-testid="open-pods-list">
                    {openPods.slice(0, 3).map((pod: any) => (
                      <div 
                        key={pod.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                        data-testid={`open-pod-${pod.id}`}
                      >
                        <div>
                          <div className="font-medium text-foreground">{pod.name}</div>
                          <div className="text-xs text-gray-500">
                            {pod.memberCount}/{pod.maxMembers} members
                            {pod.focusArea && ` • ${pod.focusArea}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinPodMutation.mutate(pod.id)}
                          disabled={joinPodMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600 text-foreground"
                          data-testid={`button-join-pod-${pod.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Pod */}
              <div className="flex justify-center gap-3">
                <Dialog open={createPodOpen} onOpenChange={setCreatePodOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600 text-foreground"
                      data-testid="button-create-pod"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Pod
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800 text-foreground">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Create Accountability Pod</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Start a pod and invite other warriors to join your recovery journey.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Pod Name *</label>
                        <Input
                          placeholder="e.g., Morning Warriors"
                          value={newPodName}
                          onChange={(e) => setNewPodName(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-foreground"
                          data-testid="input-pod-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Description</label>
                        <Textarea
                          placeholder="What's your pod about?"
                          value={newPodDescription}
                          onChange={(e) => setNewPodDescription(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-foreground"
                          data-testid="input-pod-description"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Focus Area</label>
                        <Input
                          placeholder="e.g., Physical Therapy, Mindfulness"
                          value={newPodFocus}
                          onChange={(e) => setNewPodFocus(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-foreground"
                          data-testid="input-pod-focus"
                        />
                      </div>
                      <Button
                        onClick={handleCreatePod}
                        disabled={createPodMutation.isPending || !newPodName.trim()}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-foreground"
                        data-testid="button-confirm-create-pod"
                      >
                        {createPodMutation.isPending ? "Creating..." : "Create Pod"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6 mb-8" data-testid="card-ai-coach">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              AI Coach Insight
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/10 to-gray-900 rounded-lg p-6 border border">
            <p className="text-gray-300 mb-4">
              {todayCheckin 
                ? `Great check-in today! Your mood is at ${todayCheckin.moodScore}/10 and energy at ${todayCheckin.energyScore}/10. ${todayCheckin.moodScore >= 7 ? "You're doing amazing - keep that momentum going!" : "Remember, recovery isn't linear. Every day you show up matters."}`
                : "Hey warrior! Don't forget to complete your daily check-in. Tracking your progress is key to seeing how far you've come."}
            </p>
            <Button variant="outline" className="border-orange-500 text-primary hover:bg-primary/10" data-testid="button-chat-coach">
              Chat with Sasquatch Coach
            </Button>
          </div>
        </Card>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/survival-grid">
              <Card className="bg-gray-900 border-gray-800 p-4 hover-elevate cursor-pointer" data-testid="action-survival-grid">
                <Grid3X3 className="h-8 w-8 text-primary mb-2" />
                <div className="font-semibold text-foreground">Survival Grid</div>
                <div className="text-xs text-gray-500">Exercises & Protocols</div>
              </Card>
            </Link>
            
            <Link href="/community">
              <Card className="bg-gray-900 border-gray-800 p-4 hover-elevate cursor-pointer" data-testid="action-community">
                <Users className="h-8 w-8 text-primary mb-2" />
                <div className="font-semibold text-foreground">Community</div>
                <div className="text-xs text-gray-500">Connect with Warriors</div>
              </Card>
            </Link>
            
            <Link href="/recovery/academy">
              <Card className="bg-gray-900 border-gray-800 p-4 hover-elevate cursor-pointer" data-testid="action-academy">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <div className="font-semibold text-foreground">Academy</div>
                <div className="text-xs text-gray-500">Courses & Learning</div>
              </Card>
            </Link>
            
            <Link href="/marketplace">
              <Card className="bg-gray-900 border-gray-800 p-4 hover-elevate cursor-pointer" data-testid="action-marketplace">
                <ShoppingBag className="h-8 w-8 text-primary mb-2" />
                <div className="font-semibold text-foreground">Marketplace</div>
                <div className="text-xs text-gray-500">Recovery Tools</div>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
