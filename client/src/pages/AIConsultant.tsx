import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import {
  Bot,
  Brain,
  BookOpen,
  GraduationCap,
  FileText,
  Upload,
  Plus,
  Settings,
  Play,
  MessageSquare,
  Users,
  DollarSign,
  Sparkles,
  Loader2,
  Send,
  Check,
  ExternalLink,
  Copy,
  Share2,
} from "lucide-react";

interface ConsultantBot {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  sourceMaterials: number;
  conversations: number;
  earnings: number;
  status: "training" | "active" | "paused";
  expertise: string[];
}

const mockBots: ConsultantBot[] = [
  {
    id: "1",
    name: "Book Writing Expert",
    description: "Trained on my 5 published books about creative writing and storytelling",
    sourceMaterials: 5,
    conversations: 1247,
    earnings: 3741,
    status: "active",
    expertise: ["Creative Writing", "Storytelling", "Publishing"],
  },
  {
    id: "2", 
    name: "Music Production Coach",
    description: "Based on my 10+ years of music production experience and course content",
    sourceMaterials: 12,
    conversations: 892,
    earnings: 2676,
    status: "active",
    expertise: ["Music Production", "Mixing", "Sound Design"],
  },
];

export default function AIConsultant() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-consultants");
  const [selectedBot, setSelectedBot] = useState<ConsultantBot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotDescription, setNewBotDescription] = useState("");
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [chatInput, setChatInput] = useState("");

  const handleCreateBot = () => {
    if (!newBotName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your AI Consultant.",
        variant: "destructive",
      });
      return;
    }
    setIsCreating(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsCreating(false);
          toast({
            title: "AI Consultant Created!",
            description: `${newBotName} is ready to help your audience.`,
          });
          setNewBotName("");
          setNewBotDescription("");
          return 100;
        }
        return p + 5;
      });
    }, 300);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [
      ...prev,
      { role: "user", content: chatInput },
    ]);
    setChatInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "Based on my training from your content, I can help explain this concept. Let me break it down into key points that align with your teaching methodology..." 
        },
      ]);
    }, 1000);
  };

  const copyEmbedCode = (botId: string) => {
    const code = `<script src="https://kreaite.xyz/embed/consultant/${botId}.js"></script>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CreatorHeader />
      
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 px-4">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-6 bg-primary/20 text-primary border" data-testid="badge-ai-consultant">
                <Bot className="w-3 h-3 mr-1" />
                AI Consultant
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground" data-testid="heading-ai-consultant">
                Train AI on
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"> Your Content</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-ai-consultant-subtitle">
                Create an AI clone that answers questions 24/7 based on your books, courses, 
                and expertise. Earn while you sleep.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-zinc-900 border-zinc-800 text-center">
                <CardContent className="pt-6">
                  <Brain className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-2">Upload Your Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Books, courses, doctrines, transcripts - any knowledge you want to share
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800 text-center">
                <CardContent className="pt-6">
                  <Bot className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-2">AI Learns Your Style</h3>
                  <p className="text-sm text-muted-foreground">
                    Your AI consultant answers questions exactly how you would
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800 text-center">
                <CardContent className="pt-6">
                  <DollarSign className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-2">Earn 24/7</h3>
                  <p className="text-sm text-muted-foreground">
                    Charge per conversation or include with course purchases
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-900 border border mb-8">
                <TabsTrigger value="my-consultants" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2">
                  <Bot className="w-4 h-4" />
                  My Consultants
                </TabsTrigger>
                <TabsTrigger value="create" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2">
                  <Plus className="w-4 h-4" />
                  Create New
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2">
                  <DollarSign className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-consultants" className="space-y-6">
                {mockBots.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center">
                      <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground mb-2">No AI Consultants Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first AI consultant to start earning from your expertise.
                      </p>
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600 text-black gap-2"
                        onClick={() => setActiveTab("create")}
                      >
                        <Plus className="w-4 h-4" />
                        Create Your First Consultant
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {mockBots.map((bot) => (
                      <Card 
                        key={bot.id} 
                        className={`bg-zinc-900 border-zinc-800 cursor-pointer transition-all hover-elevate ${
                          selectedBot?.id === bot.id ? 'border-orange-500 ring-2 ring-orange-500/20' : ''
                        }`}
                        onClick={() => setSelectedBot(bot)}
                        data-testid={`card-bot-${bot.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  <Bot className="w-6 h-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg text-foreground">{bot.name}</CardTitle>
                                <CardDescription className="text-sm">{bot.description}</CardDescription>
                              </div>
                            </div>
                            <Badge 
                              className={bot.status === "active" 
                                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              {bot.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {bot.expertise.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs border text-primary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-foreground">{bot.sourceMaterials}</div>
                              <div className="text-xs text-muted-foreground">Sources</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-foreground">{bot.conversations.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Chats</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">${bot.earnings.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Earned</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedBot && (
                  <Card className="bg-zinc-900 border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">Test {selectedBot.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border gap-1"
                            onClick={() => copyEmbedCode(selectedBot.id)}
                          >
                            <Copy className="w-3 h-3" />
                            Embed Code
                          </Button>
                          <Button variant="outline" size="sm" className="border gap-1">
                            <Share2 className="w-3 h-3" />
                            Share Link
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-zinc-800 rounded-lg h-64 mb-4 p-4">
                        <ScrollArea className="h-full">
                          {chatMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              <MessageSquare className="w-6 h-6 mr-2" />
                              Start a conversation to test your AI Consultant
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {chatMessages.map((msg, i) => (
                                <div 
                                  key={i} 
                                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                  <div 
                                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                                      msg.role === "user" 
                                        ? "bg-orange-500 text-black" 
                                        : "bg-zinc-700 text-foreground"
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask your AI Consultant a question..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="bg-zinc-800 border-zinc-700"
                          data-testid="input-chat"
                        />
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600 text-black"
                          onClick={handleSendMessage}
                          data-testid="button-send"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="create">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-foreground">Create New AI Consultant</CardTitle>
                    <CardDescription>
                      Upload your content and train an AI that represents your expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Consultant Name</label>
                      <Input
                        placeholder="e.g., Creative Writing Expert"
                        value={newBotName}
                        onChange={(e) => setNewBotName(e.target.value)}
                        className="bg-zinc-800 border-zinc-700"
                        data-testid="input-bot-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <Textarea
                        placeholder="Describe what this AI consultant is an expert in..."
                        value={newBotDescription}
                        onChange={(e) => setNewBotDescription(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                        data-testid="textarea-bot-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Training Materials</label>
                      <div className="border-2 border-dashed border rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                        <p className="text-foreground font-medium mb-2">Drag & drop files or click to upload</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          PDF, EPUB, DOCX, TXT, or paste content directly
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <Button variant="outline" size="sm" className="border gap-1">
                            <BookOpen className="w-3 h-3" />
                            From Books
                          </Button>
                          <Button variant="outline" size="sm" className="border gap-1">
                            <GraduationCap className="w-3 h-3" />
                            From Courses
                          </Button>
                          <Button variant="outline" size="sm" className="border gap-1">
                            <FileText className="w-3 h-3" />
                            From Doctrines
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isCreating && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Training AI on your content...</span>
                          <span className="text-primary">{trainingProgress}%</span>
                        </div>
                        <Progress value={trainingProgress} className="h-2" />
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" className="border">
                        Save Draft
                      </Button>
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600 text-black gap-2"
                        onClick={handleCreateBot}
                        disabled={isCreating}
                        data-testid="button-create-bot"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Training...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Create Consultant
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="pt-6 text-center">
                      <Bot className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-foreground">2</div>
                      <div className="text-sm text-muted-foreground">Active Consultants</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="pt-6 text-center">
                      <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-foreground">2,139</div>
                      <div className="text-sm text-muted-foreground">Total Conversations</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="pt-6 text-center">
                      <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-foreground">847</div>
                      <div className="text-sm text-muted-foreground">Unique Users</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="pt-6 text-center">
                      <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-primary">$6,417</div>
                      <div className="text-sm text-muted-foreground">Total Earnings</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-foreground">Monetization Options</CardTitle>
                    <CardDescription>Choose how you want to earn from your AI Consultants</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Pay Per Conversation</h4>
                        <p className="text-sm text-muted-foreground">Charge users per chat session</p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border">
                        $0.50 - $5.00 per chat
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Bundle with Course</h4>
                        <p className="text-sm text-muted-foreground">Include as course bonus</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Included with purchase
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Subscription Access</h4>
                        <p className="text-sm text-muted-foreground">Monthly subscription for unlimited chats</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        $9.99 - $49.99/month
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
