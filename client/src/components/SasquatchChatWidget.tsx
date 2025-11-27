import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, MessageCircle, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import sasquatchLogo from "@assets/sos logo_1764267698485.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  quote?: string;
  timestamp: Date;
}

export default function SasquatchChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey survivor! I'm the Stroked Out Sasquatch, your recovery coach. Ready to crush some exercises today? Tell me what's on your mind or how your recovery is going!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/coach/chat", {
        message,
        history: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        quote: data.quote,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Having a moment here, but don't let that stop you! Keep pushing through your exercises. Your comeback is happening one rep at a time!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          data-testid="button-open-sasquatch-chat"
          aria-label="Open recovery coach chat"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:bg-primary/50 transition-all duration-300 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-lg shadow-primary/30 hover:scale-110 transition-transform duration-200">
              <img
                src={sasquatchLogo}
                alt="Stroked Out Sasquatch Coach"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
        </button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col shadow-2xl border-primary/20 overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/20 to-primary/5 border-b border-border">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                <img
                  src={sasquatchLogo}
                  alt="Stroked Out Sasquatch"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                Stroked Out Sasquatch
                <Sparkles className="w-4 h-4 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">Your Recovery Coach</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-sasquatch-chat"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                    data-testid={`chat-message-${message.role}`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.quote && (
                      <div className="mt-2 pt-2 border-t border-primary/20">
                        <p className="text-xs italic text-primary/80">"{message.quote}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your progress..."
                className="flex-1"
                disabled={chatMutation.isPending}
                data-testid="input-sasquatch-chat"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || chatMutation.isPending}
                data-testid="button-send-sasquatch-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Powered by Recovery University
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
