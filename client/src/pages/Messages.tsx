import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  MessageCircle, Send, Search, Plus, Image, Smile, MoreVertical,
  Phone, Video, Info, Check, CheckCheck, Loader2, Users, ArrowLeft
} from "lucide-react";

interface Conversation {
  id: number;
  type: "direct" | "group";
  name: string | null;
  lastMessageAt: string;
  participants: {
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl: string;
    };
    lastReadAt: string | null;
  }[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount?: number;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversations", selectedConversation?.id, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await fetch(`/api/messages/conversations/${selectedConversation.id}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users/search"],
    queryFn: async () => {
      const res = await fetch("/api/users/search");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: newChatOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      return apiRequest("POST", `/api/messages/conversations/${conversationId}/messages`, { content });
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequest("POST", "/api/messages/conversations", { participantIds: [participantId] });
    },
    onSuccess: (data: any) => {
      setNewChatOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setSelectedConversation(data);
      setMobileShowChat(true);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const otherParticipants = conv.participants?.filter(p => p.userId !== user?.id);
    if (otherParticipants?.length === 1) {
      const p = otherParticipants[0].user;
      return `${p.firstName} ${p.lastName}`;
    }
    return "Group Chat";
  };

  const getConversationAvatar = (conv: Conversation) => {
    const otherParticipants = conv.participants?.filter(p => p.userId !== user?.id);
    return otherParticipants?.[0]?.user?.profileImageUrl;
  };

  const getInitials = (conv: Conversation) => {
    const name = getConversationName(conv);
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({ conversationId: selectedConversation.id, content: newMessage });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold" data-testid="text-messages-title">Messages</h1>
          <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-message">
                <Plus className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Start a Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Search users..."
                  className="bg-gray-800 border-gray-700"
                />
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {users?.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => createConversationMutation.mutate(u.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={u.profileImageUrl} />
                          <AvatarFallback className="bg-gray-700 text-primary">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-white font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-gray-400 text-sm">{u.email}</p>
                        </div>
                      </button>
                    ))}
                    {(!users || users.length === 0) && (
                      <p className="text-gray-400 text-center py-4">No users found</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="px-2">
                  {conversations
                    .filter(c => 
                      getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMobileShowChat(true);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedConversation?.id === conv.id
                            ? "bg-gray-800"
                            : "hover:bg-gray-800/50"
                        }`}
                        data-testid={`conversation-${conv.id}`}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getConversationAvatar(conv)} />
                            <AvatarFallback className="bg-gray-700 text-primary">
                              {getInitials(conv)}
                            </AvatarFallback>
                          </Avatar>
                          {conv.type === "group" && (
                            <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5">
                              <Users className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium truncate">
                              {getConversationName(conv)}
                            </p>
                            <span className="text-gray-500 text-xs">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-400 text-sm truncate flex-1">
                              {conv.lastMessage?.content || "No messages yet"}
                            </p>
                            {(conv.unreadCount || 0) > 0 && (
                              <Badge className="bg-primary text-white text-xs px-1.5 py-0.5 min-w-[20px]">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No conversations yet</p>
                  <p className="text-gray-500 text-sm">Start a new message to connect!</p>
                </div>
              )}
            </ScrollArea>
          </div>

          <div className={`flex-1 flex flex-col ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileShowChat(false)}
                      className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Avatar>
                      <AvatarImage src={getConversationAvatar(selectedConversation)} />
                      <AvatarFallback className="bg-gray-700 text-primary">
                        {getInitials(selectedConversation)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">
                        {getConversationName(selectedConversation)}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {selectedConversation.type === "group"
                          ? `${selectedConversation.participants?.length || 0} members`
                          : "Online"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Info className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                              {!isOwn && (
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={message.sender?.profileImageUrl} />
                                  <AvatarFallback className="bg-gray-700 text-primary text-xs">
                                    {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwn
                                      ? "bg-primary text-white rounded-br-md"
                                      : "bg-gray-800 text-white rounded-bl-md"
                                  }`}
                                >
                                  {message.content}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                                  <span className="text-gray-500 text-xs">
                                    {formatTime(message.createdAt)}
                                  </span>
                                  {isOwn && (
                                    message.isRead ? (
                                      <CheckCheck className="w-3 h-3 text-primary" />
                                    ) : (
                                      <Check className="w-3 h-3 text-gray-500" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No messages yet</p>
                      <p className="text-gray-500 text-sm">Send a message to start the conversation</p>
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Image className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-900 border-gray-800"
                      data-testid="input-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Select a conversation</p>
                  <p className="text-gray-500">Choose from your existing chats or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
