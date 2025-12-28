import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Lightbulb,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Coins,
  Sparkles,
} from "lucide-react";
import { bookStudioApi, CoachingResult } from "../api";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  type: string;
  original: string;
  suggestion: string;
  explanation: string;
  literaryTechnique?: string;
}

interface WritingCoachOverlayProps {
  content: string;
  genre?: string;
  isEnabled: boolean;
  onToggle: () => void;
  onApplySuggestion?: (original: string, replacement: string) => void;
}

export function WritingCoachOverlay({
  content,
  genre,
  isEnabled,
  onToggle,
  onApplySuggestion,
}: WritingCoachOverlayProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState("");

  const analyzeMutation = useMutation({
    mutationFn: () =>
      bookStudioApi.coach.getSuggestions({
        content: content.substring(0, 5000),
        genre,
        focusAreas: ["clarity", "engagement", "literary quality"],
      }),
    onSuccess: (data) => {
      if (data.coaching?.suggestions) {
        setSuggestions(data.coaching.suggestions);
        setCurrentIndex(0);
        setLastAnalyzedContent(content);
      }
      toast({
        title: "Writing analyzed",
        description: `Found ${data.coaching?.suggestions?.length || 0} suggestions (-${data.creditsUsed} credits)`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("402")) {
        toast({ title: "Insufficient credits", variant: "destructive" });
      }
    },
  });

  const currentSuggestion = suggestions[currentIndex];

  const applySuggestion = () => {
    if (currentSuggestion && onApplySuggestion) {
      onApplySuggestion(currentSuggestion.original, currentSuggestion.suggestion);
      setSuggestions((prev) => prev.filter((_, i) => i !== currentIndex));
      if (currentIndex >= suggestions.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const dismissSuggestion = () => {
    setSuggestions((prev) => prev.filter((_, i) => i !== currentIndex));
    if (currentIndex >= suggestions.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  if (!isEnabled) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-background border hover:bg-primary/10"
        data-testid="button-enable-coach"
      >
        <Lightbulb className="w-4 h-4 mr-2 text-primary" />
        Writing Coach
      </Button>
    );
  }

  return (
    <Card
      className="fixed bottom-4 right-4 z-50 w-80 bg-background border shadow-xl"
      data-testid="writing-coach-overlay"
    >
      <div className="p-3 border-b border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Writing Coach</span>
            {suggestions.length > 0 && (
              <Badge className="bg-primary/20 text-primary text-xs">
                {suggestions.length}
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggle}
            className="h-6 w-6"
            data-testid="button-close-coach"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        {analyzeMutation.isPending ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-xs text-gray-400 mt-2">Analyzing your writing...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center">
              Get AI suggestions to improve your writing
            </p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={!content.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-analyze-writing"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Writing
              <Badge variant="outline" className="ml-2 text-[10px]">
                <Coins className="w-2 h-2 mr-1" />3 cr
              </Badge>
            </Button>
          </div>
        ) : currentSuggestion ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {currentSuggestion.type}
              </Badge>
              <span className="text-xs text-gray-500">
                {currentIndex + 1} / {suggestions.length}
              </span>
            </div>

            <div className="space-y-2">
              <div className="bg-red-500/10 rounded p-2 border border-red-500/20">
                <p className="text-xs text-red-300 line-through">{currentSuggestion.original}</p>
              </div>
              <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                <p className="text-xs text-green-300">{currentSuggestion.suggestion}</p>
              </div>
            </div>

            <p className="text-[10px] text-gray-400">{currentSuggestion.explanation}</p>

            {currentSuggestion.literaryTechnique && (
              <Badge className="text-[10px] bg-purple-500/20 text-purple-300">
                Technique: {currentSuggestion.literaryTechnique}
              </Badge>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="h-8 w-8 border"
                data-testid="button-prev-suggestion"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                onClick={applySuggestion}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                data-testid="button-apply-suggestion"
              >
                <Check className="w-4 h-4 mr-2" />
                Apply
              </Button>

              <Button
                onClick={dismissSuggestion}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-testid="button-dismiss-suggestion"
              >
                <X className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={() => setCurrentIndex(Math.min(suggestions.length - 1, currentIndex + 1))}
                disabled={currentIndex === suggestions.length - 1}
                className="h-8 w-8 border"
                data-testid="button-next-suggestion"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={() => analyzeMutation.mutate()}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-400"
              data-testid="button-reanalyze"
            >
              Re-analyze for new suggestions
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-green-400">All suggestions reviewed!</p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              variant="outline"
              size="sm"
              className="mt-3 border"
              data-testid="button-analyze-again"
            >
              Analyze again
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
