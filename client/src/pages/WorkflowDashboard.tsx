import { useState } from "react";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  GitBranch, Play, Pause, Plus, Clock, DollarSign, ChevronRight,
  Sparkles, ArrowLeft, Loader2, Check, X, AlertCircle, Book,
  Headphones, GraduationCap, Film, Music, Video, Zap
} from "lucide-react";

interface WorkflowTemplate {
  type: string;
  name: string;
  description: string;
  steps: string[];
  stepCount: number;
  estimatedDuration: number;
  estimatedCost: number;
}

interface WorkflowJob {
  id: number;
  workflowId: number;
  stepName: string;
  status: string;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

interface CreatorWorkflow {
  id: number;
  type: string;
  status: string;
  progress: number;
  currentStep: string;
  createdAt: string;
  jobs: WorkflowJob[];
}

const workflowIcons: Record<string, any> = {
  book_to_audiobook: Headphones,
  book_to_course: GraduationCap,
  movie_production: Film,
  music_to_video: Video
};

export default function WorkflowDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templatesData } = useQuery({
    queryKey: ["/api/workflows/templates"]
  });

  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ["/api/workflows"],
    enabled: !!user
  });

  const { data: estimateData } = useQuery({
    queryKey: ["/api/workflows/estimate", selectedTemplate],
    enabled: !!selectedTemplate
  });

  const startWorkflowMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("POST", "/api/workflows", { type, sourceId: 1 });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setSelectedTemplate(null);
      toast({ title: "Workflow Started!", description: "Your automation is running" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to Start", description: error.message, variant: "destructive" });
    }
  });

  const templates = (templatesData as any)?.templates || [];
  const workflows = (workflowsData as any)?.workflows || [];
  const activeWorkflows = workflows.filter((w: CreatorWorkflow) => w.status === "running" || w.status === "pending");
  const completedWorkflows = workflows.filter((w: CreatorWorkflow) => w.status === "completed" || w.status === "failed");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "running": return "bg-orange-500/20 text-orange-400";
      case "pending": return "bg-blue-500/20 text-blue-400";
      case "failed": return "bg-red-500/20 text-red-400";
      default: return "bg-zinc-500/20 text-zinc-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <Check className="w-4 h-4" />;
      case "running": return <Loader2 className="w-4 h-4 animate-spin" />;
      case "failed": return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator-hub">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600">
            <GitBranch className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Workflow Orchestration</h1>
            <p className="text-zinc-400">Automate content creation across studios</p>
          </div>
          <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Ultra-Premium
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Zap className="w-4 h-4 mr-2" /> Active ({activeWorkflows.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <GitBranch className="w-4 h-4 mr-2" /> Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Clock className="w-4 h-4 mr-2" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeWorkflows.length > 0 ? (
              <div className="space-y-4">
                {activeWorkflows.map((workflow: CreatorWorkflow) => {
                  const Icon = workflowIcons[workflow.type] || GitBranch;
                  return (
                    <Card key={workflow.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                              <Icon className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{workflow.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                              <CardDescription>Current: {workflow.currentStep}</CardDescription>
                            </div>
                          </div>
                          <Badge className={getStatusColor(workflow.status)}>
                            {getStatusIcon(workflow.status)}
                            <span className="ml-1">{workflow.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{workflow.progress}%</span>
                          </div>
                          <Progress value={workflow.progress} className="h-2" />
                        </div>
                        {workflow.jobs && (
                          <div className="space-y-2">
                            {workflow.jobs.map((job: WorkflowJob) => (
                              <div key={job.id} className="flex items-center gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  job.status === "completed" ? "bg-green-400" :
                                  job.status === "running" ? "bg-orange-400 animate-pulse" :
                                  job.status === "failed" ? "bg-red-400" : "bg-zinc-600"
                                }`} />
                                <span className="flex-1">{job.stepName}</span>
                                <span className="text-zinc-500">{job.progress}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="text-center py-12">
                  <GitBranch className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <h3 className="text-xl font-medium mb-2">No Active Workflows</h3>
                  <p className="text-zinc-400 mb-4">Start a workflow to automate your content creation</p>
                  <Button 
                    onClick={() => setActiveTab("templates")}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-browse-templates"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Browse Templates
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template: WorkflowTemplate) => {
                const Icon = workflowIcons[template.type] || GitBranch;
                return (
                  <Card 
                    key={template.type} 
                    className={`bg-zinc-900/50 border-zinc-800 cursor-pointer transition-all ${
                      selectedTemplate === template.type ? "border-orange-500" : "hover:border-zinc-600"
                    }`}
                    onClick={() => setSelectedTemplate(template.type)}
                    data-testid={`card-template-${template.type}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-orange-500/20">
                            <Icon className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                        </div>
                        {selectedTemplate === template.type && (
                          <Check className="w-5 h-5 text-orange-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.steps.map((step, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {i + 1}. {step}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            ~{Math.round(template.estimatedDuration / 60)} min
                          </span>
                          <span className="text-green-400">
                            <DollarSign className="w-4 h-4 inline" />
                            {(template.estimatedCost / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedTemplate && (
              <Card className="bg-gradient-to-r from-orange-500/20 to-rose-500/20 border-orange-500/30">
                <CardContent className="flex items-center justify-between py-6">
                  <div>
                    <h3 className="text-xl font-bold">Ready to Start</h3>
                    <p className="text-zinc-400">
                      Estimated cost: ${estimateData ? ((estimateData as any).totalCost / 100).toFixed(2) : "..."}
                    </p>
                  </div>
                  <Button
                    onClick={() => startWorkflowMutation.mutate(selectedTemplate)}
                    disabled={startWorkflowMutation.isPending}
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-start-workflow"
                  >
                    {startWorkflowMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting...</>
                    ) : (
                      <><Play className="w-5 h-5 mr-2" /> Start Workflow</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {completedWorkflows.length > 0 ? (
              <div className="space-y-4">
                {completedWorkflows.map((workflow: CreatorWorkflow) => {
                  const Icon = workflowIcons[workflow.type] || GitBranch;
                  return (
                    <Card key={workflow.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="p-2 rounded-lg bg-zinc-800">
                          <Icon className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{workflow.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                          <p className="text-sm text-zinc-500">{new Date(workflow.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge className={getStatusColor(workflow.status)}>
                          {getStatusIcon(workflow.status)}
                          <span className="ml-1">{workflow.status}</span>
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="text-center py-12 text-zinc-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No workflow history yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
