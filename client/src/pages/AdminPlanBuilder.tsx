import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Settings, Plus, Users, FileText, Dumbbell, Apple, Brain, Heart,
  Target, Calendar, Clock, Save, Send, Trash2, Copy, Edit, Eye,
  Loader2, CheckCircle2, AlertCircle, Search, Filter
} from "lucide-react";

interface RecoveryPlan {
  id: number;
  name: string;
  description: string;
  category: "diet" | "exercise" | "recovery" | "cognitive" | "comprehensive";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  isTemplate: boolean;
  isPublished: boolean;
  createdBy: string;
  assignedTo: string[];
  exercises: PlanExercise[];
  dietPlan: DietPlan | null;
  goals: string[];
  schedule: PlanSchedule[];
  createdAt: string;
}

interface PlanExercise {
  id: number;
  name: string;
  category: string;
  sets: number;
  reps: number;
  duration: number;
  frequency: string;
  notes: string;
}

interface DietPlan {
  meals: {
    name: string;
    time: string;
    foods: string[];
    notes: string;
  }[];
  restrictions: string[];
  goals: string[];
  calories: number;
  hydrationGoal: number;
}

interface PlanSchedule {
  day: string;
  activities: {
    time: string;
    activity: string;
    duration: number;
  }[];
}

export default function AdminPlanBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("plans");
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [assignPlanOpen, setAssignPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RecoveryPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    category: "comprehensive" as const,
    difficulty: "beginner" as const,
    duration: 4,
    isTemplate: true,
    isPublished: false,
    goals: [] as string[],
  });
  const [newGoal, setNewGoal] = useState("");

  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    category: "upper_extremity",
    sets: 3,
    reps: 10,
    duration: 30,
    frequency: "daily",
    notes: "",
  });

  const [mealForm, setMealForm] = useState({
    name: "",
    time: "08:00",
    foods: [] as string[],
    notes: "",
  });
  const [newFood, setNewFood] = useState("");

  const { data: plans, isLoading } = useQuery<RecoveryPlan[]>({
    queryKey: ["/api/admin/plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/plans");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users/search"],
    queryFn: async () => {
      const res = await fetch("/api/users/search");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: exercises } = useQuery<any[]>({
    queryKey: ["/api/exercises"],
    queryFn: async () => {
      const res = await fetch("/api/exercises");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setCreatePlanOpen(false);
      setPlanForm({
        name: "",
        description: "",
        category: "comprehensive",
        difficulty: "beginner",
        duration: 4,
        isTemplate: true,
        isPublished: false,
        goals: [],
      });
      toast({ title: "Plan created!", description: "Recovery plan saved successfully" });
    },
  });

  const assignPlanMutation = useMutation({
    mutationFn: async ({ planId, userIds }: { planId: number; userIds: string[] }) => {
      return apiRequest("POST", `/api/admin/plans/${planId}/assign`, { userIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setAssignPlanOpen(false);
      toast({ title: "Plan assigned!", description: "Users will be notified" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return apiRequest("DELETE", `/api/admin/plans/${planId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plan deleted" });
    },
  });

  const addGoal = () => {
    if (newGoal.trim()) {
      setPlanForm({ ...planForm, goals: [...planForm.goals, newGoal.trim()] });
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setPlanForm({ ...planForm, goals: planForm.goals.filter((_, i) => i !== index) });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "diet": return <Apple className="w-5 h-5 text-green-400" />;
      case "exercise": return <Dumbbell className="w-5 h-5 text-blue-400" />;
      case "cognitive": return <Brain className="w-5 h-5 text-purple-400" />;
      case "recovery": return <Heart className="w-5 h-5 text-red-400" />;
      default: return <Target className="w-5 h-5 text-primary" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "diet": return "Diet Plan";
      case "exercise": return "Exercise Program";
      case "cognitive": return "Cognitive Training";
      case "recovery": return "Recovery Protocol";
      default: return "Comprehensive Plan";
    }
  };

  const filteredPlans = plans?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.includes(searchQuery.toLowerCase())
  );

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-title">
              Recovery Plan Builder
            </h1>
            <p className="text-gray-400 mt-1">
              Create and assign recovery plans to survivors
            </p>
          </div>
          <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-plan">
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Recovery Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-400 mb-2 block">Plan Name</label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g., 12-Week Upper Body Recovery"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-400 mb-2 block">Description</label>
                    <Textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Describe the plan and its goals..."
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Category</label>
                    <Select
                      value={planForm.category}
                      onValueChange={(v: any) => setPlanForm({ ...planForm, category: v })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="diet">Diet</SelectItem>
                        <SelectItem value="cognitive">Cognitive</SelectItem>
                        <SelectItem value="recovery">Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Difficulty</label>
                    <Select
                      value={planForm.difficulty}
                      onValueChange={(v: any) => setPlanForm({ ...planForm, difficulty: v })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Duration (weeks)</label>
                    <Input
                      type="number"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({ ...planForm, duration: parseInt(e.target.value) })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={planForm.isTemplate}
                        onCheckedChange={(v) => setPlanForm({ ...planForm, isTemplate: v })}
                      />
                      <span className="text-sm text-gray-400">Template</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={planForm.isPublished}
                        onCheckedChange={(v) => setPlanForm({ ...planForm, isPublished: v })}
                      />
                      <span className="text-sm text-gray-400">Published</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Goals</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add a goal..."
                      className="bg-gray-800 border-gray-700"
                      onKeyPress={(e) => e.key === "Enter" && addGoal()}
                    />
                    <Button type="button" onClick={addGoal} variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planForm.goals.map((goal, i) => (
                      <Badge key={i} variant="outline" className="py-1 px-3">
                        {goal}
                        <button onClick={() => removeGoal(i)} className="ml-2 text-gray-400 hover:text-foreground">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => createPlanMutation.mutate(planForm)}
                  disabled={createPlanMutation.isPending || !planForm.name}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 mb-6">
            <TabsTrigger value="plans" data-testid="tab-plans">
              Recovery Plans ({plans?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              Templates
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="tab-assignments">
              Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plans..."
                  className="pl-10 bg-gray-900 border-gray-800"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredPlans && filteredPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => (
                  <Card key={plan.id} className="bg-gray-900 border-gray-800" data-testid={`plan-${plan.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        {getCategoryIcon(plan.category)}
                        <div className="flex gap-2">
                          {plan.isTemplate && (
                            <Badge variant="outline">Template</Badge>
                          )}
                          <Badge className={plan.isPublished ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                            {plan.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{plan.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {plan.duration} weeks
                        </span>
                        <span className="capitalize">{plan.difficulty}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {plan.assignedTo?.length || 0}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setAssignPlanOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Assign
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePlanMutation.mutate(plan.id)}
                          className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="py-12 text-center">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No recovery plans yet</p>
                  <p className="text-gray-500 mb-4">Create your first plan to help survivors recover</p>
                  <Button onClick={() => setCreatePlanOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-foreground">Pre-built Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Beginner Upper Body", category: "exercise", duration: 8 },
                    { name: "Cognitive Recovery", category: "cognitive", duration: 12 },
                    { name: "Heart-Healthy Diet", category: "diet", duration: 4 },
                    { name: "Full Recovery Program", category: "comprehensive", duration: 16 },
                  ].map((template, i) => (
                    <Card key={i} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(template.category)}
                            <div>
                              <p className="text-foreground font-medium">{template.name}</p>
                              <p className="text-gray-400 text-sm">{template.duration} weeks</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Copy className="w-4 h-4 mr-2" />
                            Use
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-foreground">Active Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {users && users.length > 0 ? (
                  <div className="space-y-4">
                    {users.slice(0, 10).map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.profileImageUrl} />
                            <AvatarFallback className="bg-gray-700 text-primary">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-foreground font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-gray-400 text-sm">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">No active plan</Badge>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            Assign Plan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No users to assign plans to</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={assignPlanOpen} onOpenChange={setAssignPlanOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Assign: {selectedPlan?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Search users..."
                className="bg-gray-800 border-gray-700"
              />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {users?.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Checkbox id={`user-${u.id}`} />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.profileImageUrl} />
                      <AvatarFallback className="bg-gray-700 text-primary text-xs">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor={`user-${u.id}`} className="flex-1 cursor-pointer">
                      <p className="text-foreground text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </label>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => selectedPlan && assignPlanMutation.mutate({ planId: selectedPlan.id, userIds: [] })}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Assign to Selected Users
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
