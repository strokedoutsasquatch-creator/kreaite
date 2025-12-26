import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Edit3,
  FileCheck,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Coins,
  X,
} from "lucide-react";
import { bookStudioApi, EditResult } from "../api";
import { useToast } from "@/hooks/use-toast";

const editingPhases = [
  {
    id: "developmental",
    label: "Developmental Edit",
    icon: Layers,
    credits: 10,
    description: "Structure, pacing, character arcs, plot holes",
    color: "bg-purple-500",
  },
  {
    id: "line",
    label: "Line Edit",
    icon: Edit3,
    credits: 7,
    description: "Sentence flow, word choice, voice consistency",
    color: "bg-blue-500",
  },
  {
    id: "copy",
    label: "Copy Edit",
    icon: FileCheck,
    credits: 5,
    description: "Grammar, punctuation, style guide compliance",
    color: "bg-green-500",
  },
  {
    id: "proofread",
    label: "Proofread",
    icon: CheckCircle,
    credits: 3,
    description: "Typos, final polish, publish-ready check",
    color: "bg-orange-500",
  },
];

interface EditingPhasesPanelProps {
  content: string;
  genre?: string;
  onApplyEdit?: (editedContent: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function EditingPhasesPanel({
  content,
  genre,
  onApplyEdit,
  isOpen,
  onClose,
}: EditingPhasesPanelProps) {
  const { toast } = useToast();
  const [activePhase, setActivePhase] = useState("developmental");
  const [styleGuide, setStyleGuide] = useState("Chicago");
  const [result, setResult] = useState<EditResult | null>(null);

  const developmentalMutation = useMutation({
    mutationFn: () => bookStudioApi.editing.developmental({ content, genre }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Developmental edit complete", description: `Used ${data.creditsUsed} credits` });
    },
    onError: (error: any) => {
      if (error.message?.includes('402')) {
        toast({ title: "Insufficient credits", description: "You need more credits for this edit", variant: "destructive" });
      } else {
        toast({ title: "Edit failed", description: error.message, variant: "destructive" });
      }
    },
  });

  const lineMutation = useMutation({
    mutationFn: () => bookStudioApi.editing.line({ content }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Line edit complete", description: `Used ${data.creditsUsed} credits` });
    },
    onError: (error: any) => {
      toast({ title: "Edit failed", description: error.message, variant: "destructive" });
    },
  });

  const copyMutation = useMutation({
    mutationFn: () => bookStudioApi.editing.copy({ content, styleGuide }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Copy edit complete", description: `Used ${data.creditsUsed} credits` });
    },
    onError: (error: any) => {
      toast({ title: "Edit failed", description: error.message, variant: "destructive" });
    },
  });

  const proofreadMutation = useMutation({
    mutationFn: () => bookStudioApi.editing.proofread({ content }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Proofread complete", description: `Used ${data.creditsUsed} credits` });
    },
    onError: (error: any) => {
      toast({ title: "Edit failed", description: error.message, variant: "destructive" });
    },
  });

  const runEdit = () => {
    setResult(null);
    switch (activePhase) {
      case "developmental":
        developmentalMutation.mutate();
        break;
      case "line":
        lineMutation.mutate();
        break;
      case "copy":
        copyMutation.mutate();
        break;
      case "proofread":
        proofreadMutation.mutate();
        break;
    }
  };

  const isLoading =
    developmentalMutation.isPending ||
    lineMutation.isPending ||
    copyMutation.isPending ||
    proofreadMutation.isPending;

  const currentPhase = editingPhases.find((p) => p.id === activePhase)!;
  const PhaseIcon = currentPhase.icon;

  if (!isOpen) return null;

  return (
    <Card className="w-96 h-full bg-black border-orange-500/20 flex flex-col" data-testid="editing-phases-panel">
      <CardHeader className="pb-2 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Professional Editing
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6" data-testid="button-close-editing">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="p-3 border-b border-orange-500/10">
        <div className="flex gap-1">
          {editingPhases.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = activePhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => {
                  setActivePhase(phase.id);
                  setResult(null);
                }}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-orange-500/20 border border-orange-500"
                    : "bg-black/30 border border-transparent hover:border-orange-500/30"
                }`}
                data-testid={`button-phase-${phase.id}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${phase.color}`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] text-gray-400">{index + 1}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <CardContent className="p-3 space-y-3">
          <div className="bg-black/30 rounded-lg p-3 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPhase.color}`}>
                <PhaseIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{currentPhase.label}</h3>
                <p className="text-xs text-gray-400">{currentPhase.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-orange-500" />
                {currentPhase.credits} credits
              </Badge>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{content.split(/\s+/).length} words to analyze</span>
            </div>
          </div>

          {activePhase === "copy" && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Style Guide</label>
              <Select value={styleGuide} onValueChange={setStyleGuide}>
                <SelectTrigger className="bg-black/50 border-orange-500/30" data-testid="select-style-guide">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chicago">Chicago Manual of Style</SelectItem>
                  <SelectItem value="APA">APA</SelectItem>
                  <SelectItem value="MLA">MLA</SelectItem>
                  <SelectItem value="AP">AP Stylebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={runEdit}
            disabled={isLoading || !content.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600"
            data-testid="button-run-edit"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run {currentPhase.label}
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">Results</h4>
                <Badge className="bg-green-500/20 text-green-400">
                  -{result.creditsUsed} credits
                </Badge>
              </div>

              {result.edit ? (
                <div className="space-y-3">
                  {result.edit.overallAssessment && (
                    <div className="bg-black/30 rounded p-2 border border-orange-500/10">
                      <p className="text-xs text-gray-300">{result.edit.overallAssessment}</p>
                    </div>
                  )}

                  {result.edit.structureScore && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Structure", score: result.edit.structureScore },
                        { label: "Pacing", score: result.edit.pacingScore },
                        { label: "Character", score: result.edit.characterScore },
                      ].map((item) => (
                        <div key={item.label} className="bg-black/30 rounded p-2 text-center">
                          <div className="text-lg font-bold text-orange-500">{item.score}/10</div>
                          <div className="text-[10px] text-gray-400">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.edit.suggestions && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-400">Suggestions</h5>
                      {result.edit.suggestions.slice(0, 5).map((s: any, i: number) => (
                        <div key={i} className="bg-black/30 rounded p-2 border-l-2 border-orange-500">
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="outline" className="text-[10px]">{s.area || s.type}</Badge>
                            {s.priority && (
                              <Badge
                                className={`text-[10px] ${
                                  s.priority === "high"
                                    ? "bg-red-500/20 text-red-400"
                                    : s.priority === "medium"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {s.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-300">{s.issue || s.original}</p>
                          {s.fix && (
                            <p className="text-xs text-green-400 mt-1">
                              <ArrowRight className="w-3 h-3 inline mr-1" />
                              {s.fix}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.edit.editedContent && onApplyEdit && (
                    <Button
                      onClick={() => onApplyEdit(result.edit.editedContent)}
                      className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                      data-testid="button-apply-edit"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Edited Content
                    </Button>
                  )}

                  {result.edit.strengthsToKeep && (
                    <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                      <h5 className="text-xs font-medium text-green-400 mb-1">Strengths</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {result.edit.strengthsToKeep.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : result.raw ? (
                <div className="bg-black/30 rounded p-2 border border-orange-500/10">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">{result.raw}</pre>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
