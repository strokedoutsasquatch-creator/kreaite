import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Paperclip,
  Image,
  Music,
  FileText,
  Video,
  Mic,
  MoreVertical,
  Download,
  Copy,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Settings,
  History,
} from "lucide-react";

export interface ConversationMessage {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  contentType?: "text" | "audio" | "image" | "action";
  attachments?: any[];
  actionType?: string;
  actionResult?: any;
  createdAt?: Date;
}

export interface ConversationSession {
  id: number;
  title: string;
  studio: string;
  status: "active" | "paused" | "completed" | "archived";
  metadata?: any;
  createdAt: Date;
}

interface ConversationPanelProps {
  studio: string;
  projectId?: number;
  systemPrompt?: string;
  placeholder?: string;
  title?: string;
  quickActions?: Array<{
    id: string;
    label: string;
    icon: typeof Sparkles;
    prompt: string;
  }>;
  onActionResult?: (result: any) => void;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export default function ConversationPanel({
  studio,
  projectId,
  systemPrompt,
  placeholder = "Ask AI to help you create...",
  title = "AI Assistant",
  quickActions = [],
  onActionResult,
  isCollapsible = true,
  defaultCollapsed = false,
  className = "",
}: ConversationPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ['/api/conversations', studio],
    enabled: !!user,
  });

  const messagesQuery = useQuery({
    queryKey: ['/api/conversations', currentSessionId, 'messages'],
    enabled: !!currentSessionId,
  });

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data as ConversationMessage[]);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/conversations/message', {
        sessionId: currentSessionId,
        studio,
        projectId,
        systemPrompt,
        content,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Set session ID from server response
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
      }
      // Update messages from server response
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          contentType: m.contentType || 'text',
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        })));
      } else if (data.response) {
        // Fallback: append AI response if messages array not returned
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: data.response,
          createdAt: new Date(),
        }]);
      }
      if (data.actionResult && onActionResult) {
        onActionResult(data.actionResult);
      }
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', studio] });
    },
    onError: (error) => {
      setIsStreaming(false);
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
      }]);
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming) return;
    
    const userMessage: ConversationMessage = {
      role: "user",
      content: inputValue,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setInputValue("");
    
    sendMessageMutation.mutate(inputValue);
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInputValue(action.prompt);
    handleSend();
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const loadSession = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setShowHistory(false);
  };

  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-black border-0 shadow-lg z-50"
        onClick={() => setIsCollapsed(false)}
        data-testid="button-expand-chat"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  const panelContent = (
    <>
      <CardHeader className="pb-2 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-sm text-white">{title}</CardTitle>
              <p className="text-xs text-muted-foreground capitalize">{studio} Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowHistory(!showHistory)}
              data-testid="button-history"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={startNewSession}
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {isCollapsible && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsCollapsed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {showHistory ? (
          <div className="flex-1 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Recent Conversations</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {(sessionsQuery.data as ConversationSession[] || []).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover-elevate"
                    onClick={() => loadSession(session.id)}
                  >
                    <div className="font-medium text-sm text-white">{session.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {(!sessionsQuery.data || (sessionsQuery.data as any[]).length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No previous conversations
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-orange-500/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Start a conversation to get AI assistance with your {studio} project.
                    </p>
                    {quickActions.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {quickActions.slice(0, 3).map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            size="sm"
                            className="border-orange-500/30 text-xs gap-1"
                            onClick={() => handleQuickAction(action)}
                          >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 border border-orange-500/20 shrink-0">
                      {msg.role === "user" ? (
                        <>
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-zinc-800 text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-orange-500/20 text-orange-500">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={`flex-1 px-4 py-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-orange-500 text-black"
                          : "bg-zinc-800 text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.actionResult && (
                        <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            Action completed
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 border border-orange-500/20">
                      <AvatarFallback className="bg-orange-500/20 text-orange-500">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-zinc-800 px-4 py-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-orange-500/20">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="bg-zinc-800 border-zinc-700 text-sm"
                  disabled={isStreaming}
                  data-testid="input-chat-message"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 bg-orange-500 hover:bg-orange-600 text-black"
                  onClick={handleSend}
                  disabled={isStreaming || !inputValue.trim()}
                  data-testid="button-send-message"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl h-[80vh] bg-zinc-900 border-orange-500/20 flex flex-col">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          {panelContent}
        </Card>
      </div>
    );
  }

  return (
    <Card 
      className={`bg-zinc-900 border-orange-500/20 flex flex-col ${className}`}
      data-testid="conversation-panel"
    >
      {panelContent}
    </Card>
  );
}
