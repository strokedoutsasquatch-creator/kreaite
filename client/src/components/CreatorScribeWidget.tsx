import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, MessageCircle, Sparkles, PenLine, BookOpen, Quote } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  quote?: string;
  timestamp: Date;
}

export default function CreatorScribeWidget() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to KreAIte. I'm your Creative Partner, here to help you bring your ideas to life. Whether you're drafting a book, designing a course, or composing music, I can generate content directly into your project. How can I help you create today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Studio-specific context hints
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      let contextHint = "";
      if (location.includes("book-studio")) contextHint = "You're in the Book Studio. I can help you generate chapters, outlines, character profiles, or dialogue. Just describe what you need and I'll draft it directly into your editor.";
      if (location.includes("music-studio")) contextHint = "You're in the Music Studio. I can help compose lyrics, suggest chord progressions, or create song structures. What would you like to create?";
      if (location.includes("course-studio")) contextHint = "You're in the Course Studio. I can help design your curriculum, generate lesson content, create quizzes, or structure learning modules. How can I assist?";
      if (location.includes("video-studio")) contextHint = "You're in the Video Studio. I can help write scripts, create storyboards, or develop video concepts. What's your project?";
      if (location.includes("image-studio")) contextHint = "You're in the Image Studio. I can help generate image prompts, suggest compositions, or describe visual concepts for AI generation.";

      if (contextHint) {
        setMessages(prev => [...prev, {
          id: "context-hint",
          role: "assistant",
          content: contextHint,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, location]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/creator/chat", {
        message,
        context: "creative assistant",
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
        content: "I'm experiencing a temporary connection issue. Please try again in a moment, or continue working on your project while I reconnect.",
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

  // Only show the widget on the homepage - other studios have built-in AI panels
  const isHomepage = location === "/" || location === "";
  
  if (!isHomepage) {
    return null;
  }

  if (!isAuthenticated && !isOpen) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          data-testid="creator-scribe-button-open"
          aria-label="Open AI Creative Scribe"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#FF6B35]/30 rounded-full blur-xl group-hover:bg-[#FF6B35]/50 transition-all duration-300 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-black border-2 border-[#FF6B35] shadow-lg shadow-[#FF6B35]/30 hover:scale-110 transition-transform duration-200">
              <PenLine className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B35] rounded-full border-2 border-black animate-pulse" />
          </div>
        </button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col shadow-2xl border-[#FF6B35]/20 overflow-hidden bg-black text-white font-serif">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
              <BookOpen className="w-16 h-16 text-[#FF6B35]" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Your Creative Partner Awaits</h3>
                <p className="text-sm text-gray-400">Sign in to access AI-powered content generation. I can write chapters, design courses, compose music, and more.</p>
              </div>
              <Button 
                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold"
                onClick={() => window.location.href = "/api/auth/login"}
                data-testid="creator-scribe-button-login"
              >
                Sign In to Create
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#FF6B35]/20 to-black border-b border-[#FF6B35]/30">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black border-2 border-[#FF6B35]">
                    <PenLine className="w-6 h-6 text-[#FF6B35]" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white flex items-center gap-2 tracking-tight">
                    Creative Partner
                    <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                  </h3>
                  <p className="text-[10px] text-[#FF6B35]/70 uppercase tracking-widest font-sans">KreAIte AI Assistant</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  data-testid="creator-scribe-button-close"
                  aria-label="Close chat"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] bg-opacity-5" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                          message.role === "user"
                            ? "bg-[#FF6B35] text-white rounded-br-none shadow-md"
                            : "bg-[#1A1A1A] text-gray-200 rounded-bl-none border border-[#FF6B35]/10 shadow-sm"
                        }`}
                        data-testid={`creator-scribe-message-${message.role}`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        {message.quote && (
                          <div className="mt-2 pt-2 border-t border-[#FF6B35]/20 flex gap-2">
                            <Quote className="w-3 h-3 text-[#FF6B35] flex-shrink-0 mt-1" />
                            <p className="text-xs italic text-gray-400">"{message.quote}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-[#1A1A1A] rounded-lg rounded-bl-none px-4 py-3 border border-[#FF6B35]/10">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-[#FF6B35]/60 rounded-full animate-pulse" />
                          <span className="w-2 h-2 bg-[#FF6B35]/60 rounded-full animate-pulse delay-75" />
                          <span className="w-2 h-2 bg-[#FF6B35]/60 rounded-full animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-[#FF6B35]/20 bg-black">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your creative vision..."
                    className="flex-1 bg-[#1A1A1A] border-[#FF6B35]/20 text-white placeholder:text-gray-600 focus-visible:ring-[#FF6B35] font-sans"
                    disabled={chatMutation.isPending}
                    data-testid="creator-scribe-input"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || chatMutation.isPending}
                    data-testid="creator-scribe-button-send"
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-2 font-sans tracking-tight">
                  Powered by KreAIte &bull; AI-generated content for review
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
