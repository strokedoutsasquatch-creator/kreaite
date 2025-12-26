import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Send,
  Loader2,
  Bot,
  User,
  X,
  Coins,
  Sparkles,
  Lightbulb,
  Quote,
  Palette,
  PenTool,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bookStudioApi, CoachingResult } from "../api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  creditsUsed?: number;
  suggestions?: CoachingResult["coaching"];
}

const quickPrompts = [
  { label: "Story structure", prompt: "How can I improve my story's three-act structure?", icon: BookOpen },
  { label: "Character depth", prompt: "How do I make my characters more three-dimensional?", icon: User },
  { label: "Show don't tell", prompt: "Help me convert telling to showing in my writing", icon: PenTool },
  { label: "Dialogue tips", prompt: "How can I write more natural, distinctive dialogue?", icon: Quote },
  { label: "Pacing issues", prompt: "My story feels slow. How do I improve pacing?", icon: Sparkles },
  { label: "Hook readers", prompt: "How do I create a compelling opening hook?", icon: Lightbulb },
];

interface LiteraryChatPanelProps {
  currentContent?: string;
  genre?: string;
  isOpen: boolean;
  onClose: () => void;
  onInsertSuggestion?: (text: string) => void;
}

export function LiteraryChatPanel({
  currentContent = "",
  genre = "",
  isOpen,
  onClose,
  onInsertSuggestion,
}: LiteraryChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [includeContent, setIncludeContent] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const contentToAnalyze = includeContent && currentContent ? currentContent.substring(0, 3000) : "";
      return bookStudioApi.coach.getSuggestions({
        content: `${message}\n\n${contentToAnalyze ? `[Current manuscript excerpt for context:]\n${contentToAnalyze}` : "[No manuscript content provided]"}`,
        genre,
        focusAreas: ["literary techniques", "story craft", "engagement"],
      });
    },
    onSuccess: (data, message) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.coaching?.overallFeedback || data.raw || "I analyzed your writing.",
        creditsUsed: data.creditsUsed,
        suggestions: data.coaching,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      if (error.message?.includes("402")) {
        toast({ title: "Insufficient credits", description: "You need 3 credits for each message", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const sendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  if (!isOpen) return null;

  return (
    <Card className="w-96 h-full bg-black border-orange-500/20 flex flex-col" data-testid="literary-chat-panel">
      <CardHeader className="pb-2 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-orange-500" />
            Literary AI Expert
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] flex items-center gap-1">
              <Coins className="w-3 h-3 text-orange-500" />
              3 cr/msg
            </Badge>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6" data-testid="button-close-chat">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeContent}
              onChange={(e) => setIncludeContent(e.target.checked)}
              className="w-3 h-3 rounded border-orange-500/30 bg-black/50"
              data-testid="checkbox-include-content"
            />
            Include current chapter for context
          </label>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <CardContent className="p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-orange-500/50" />
                <p className="text-sm text-gray-400">Ask about literary techniques, story craft, or get feedback on your writing</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Quick prompts:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickPrompts.map((prompt) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={prompt.label}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className="p-2 text-left bg-black/30 rounded border border-orange-500/20 hover:border-orange-500/50 transition-colors"
                        data-testid={`button-prompt-${prompt.label.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Icon className="w-3 h-3 text-orange-500" />
                          <span className="text-xs font-medium text-white">{prompt.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    message.role === "user"
                      ? "bg-orange-500/20 text-white"
                      : "bg-black/50 border border-orange-500/20"
                  }`}
                >
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{message.content}</p>
                  
                  {message.suggestions?.suggestions && message.suggestions.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.suggestions.slice(0, 3).map((s, i) => (
                        <div key={i} className="bg-black/30 rounded p-1.5 text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="outline" className="text-[9px] px-1">{s.type}</Badge>
                            {s.literaryTechnique && (
                              <Badge className="text-[9px] px-1 bg-purple-500/20 text-purple-300">
                                {s.literaryTechnique}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 line-through text-[10px]">{s.original}</p>
                          <p className="text-green-400 text-[10px] mt-0.5">{s.suggestion}</p>
                          {onInsertSuggestion && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 text-[10px] mt-1 text-orange-400"
                              onClick={() => onInsertSuggestion(s.suggestion)}
                              data-testid={`button-insert-suggestion-${i}`}
                            >
                              Insert
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {message.creditsUsed && (
                    <p className="text-[10px] text-gray-500 mt-1">-{message.creditsUsed} credits</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {chatMutation.isPending && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-black/50 border border-orange-500/20 rounded-lg p-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              </div>
            </div>
          )}
        </CardContent>
      </ScrollArea>

      <div className="p-3 border-t border-orange-500/20">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about writing techniques..."
            className="min-h-[60px] max-h-[100px] bg-black/50 border-orange-500/20 text-sm resize-none"
            data-testid="textarea-chat-input"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 h-auto"
            data-testid="button-send-chat"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
