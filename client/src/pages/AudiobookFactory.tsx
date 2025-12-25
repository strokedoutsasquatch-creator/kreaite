import { useState } from "react";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Headphones, Book, Mic2, Play, Pause, Plus, Upload, Download,
  Wand2, Sparkles, Volume2, ArrowLeft, Loader2, Clock, Sliders,
  FileAudio, ChevronRight, Check, Settings
} from "lucide-react";

const narratorVoices = [
  { value: "morgan", label: "Morgan (Deep, Authoritative)" },
  { value: "emma", label: "Emma (Warm, Friendly)" },
  { value: "james", label: "James (British, Refined)" },
  { value: "aria", label: "Aria (Young, Energetic)" },
  { value: "david", label: "David (Classic Narrator)" },
  { value: "sarah", label: "Sarah (Soothing, Calm)" }
];

interface AudiobookProject {
  id: number;
  bookId: number;
  bookTitle: string;
  status: string;
  narrator: string;
  progress: number;
  chapters: Array<{
    number: number;
    title: string;
    status: string;
    audioUrl?: string;
  }>;
}

export default function AudiobookFactory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [currentStep, setCurrentStep] = useState(1);
  
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedNarrator, setSelectedNarrator] = useState("morgan");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [masteringPreset, setMasteringPreset] = useState("audiobook");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { data: audiobooksData, isLoading } = useQuery({
    queryKey: ["/api/audiobooks"],
    enabled: !!user
  });

  const { data: booksData } = useQuery({
    queryKey: ["/api/books"],
    enabled: !!user
  });

  const startProductionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/audiobooks", {
        bookId: selectedBook,
        narrator: selectedNarrator,
        speed: speed[0],
        pitch: pitch[0],
        masteringPreset
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audiobooks"] });
      setCurrentStep(1);
      setSelectedBook(null);
      toast({ title: "Production Started!", description: "Your audiobook is being generated" });
    },
    onError: (error: any) => {
      toast({ title: "Production Failed", description: error.message, variant: "destructive" });
    }
  });

  const audiobooks = (audiobooksData as any)?.audiobooks || [];
  const books = (booksData as any)?.books || [];

  const steps = [
    { num: 1, title: "Select Book", icon: Book },
    { num: 2, title: "Choose Narrator", icon: Mic2 },
    { num: 3, title: "Mastering Settings", icon: Sliders },
    { num: 4, title: "Generate", icon: Sparkles }
  ];

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
          <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Audiobook Factory</h1>
            <p className="text-zinc-400">Book → TTS narration → mastered audiobook</p>
          </div>
          <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Ultra-Premium
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="projects" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Headphones className="w-4 h-4 mr-2" /> My Audiobooks
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Plus className="w-4 h-4 mr-2" /> Create Audiobook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {audiobooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {audiobooks.map((audiobook: AudiobookProject) => (
                  <Card key={audiobook.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{audiobook.bookTitle}</CardTitle>
                          <CardDescription>Narrator: {audiobook.narrator}</CardDescription>
                        </div>
                        <Badge className={
                          audiobook.status === "completed" ? "bg-green-500/20 text-green-400" :
                          audiobook.status === "processing" ? "bg-orange-500/20 text-orange-400" :
                          "bg-zinc-500/20 text-zinc-400"
                        }>
                          {audiobook.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {audiobook.status === "processing" && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{audiobook.progress}%</span>
                          </div>
                          <Progress value={audiobook.progress} className="h-2" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-play-${audiobook.id}`}>
                          <Play className="w-4 h-4 mr-2" /> Preview
                        </Button>
                        {audiobook.status === "completed" && (
                          <Button variant="outline" size="sm" data-testid={`button-download-${audiobook.id}`}>
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="text-center py-12">
                  <Headphones className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <h3 className="text-xl font-medium mb-2">No Audiobooks Yet</h3>
                  <p className="text-zinc-400 mb-4">Transform your books into professional audiobooks</p>
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-create-first"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Audiobook
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    currentStep === step.num 
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                      : currentStep > step.num 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {currentStep > step.num ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-zinc-600 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {currentStep === 1 && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-orange-400" />
                    Select Your Book
                  </CardTitle>
                  <CardDescription>Choose a manuscript to convert to audiobook</CardDescription>
                </CardHeader>
                <CardContent>
                  {books.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {books.map((book: any) => (
                        <div
                          key={book.id}
                          onClick={() => setSelectedBook(book.id)}
                          className={`p-4 rounded-lg cursor-pointer transition-all ${
                            selectedBook === book.id 
                              ? "bg-orange-500/20 border-2 border-orange-500" 
                              : "bg-zinc-800 border-2 border-transparent hover:border-zinc-600"
                          }`}
                          data-testid={`card-book-${book.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Book className="w-8 h-8 text-orange-400" />
                            <div>
                              <h4 className="font-medium">{book.title}</h4>
                              <p className="text-sm text-zinc-400">{book.wordCount?.toLocaleString()} words</p>
                            </div>
                            {selectedBook === book.id && (
                              <Check className="w-5 h-5 text-orange-400 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="mb-4">No books available. Create a book first in Book Studio.</p>
                      <Link href="/book-studio">
                        <Button variant="outline" data-testid="button-goto-book-studio">
                          Go to Book Studio
                        </Button>
                      </Link>
                    </div>
                  )}
                  {selectedBook && (
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
                      data-testid="button-next-step"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-orange-400" />
                    Choose Narrator Voice
                  </CardTitle>
                  <CardDescription>Select an AI voice for narration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {narratorVoices.map((voice) => (
                      <div
                        key={voice.value}
                        onClick={() => setSelectedNarrator(voice.value)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedNarrator === voice.value 
                            ? "bg-orange-500/20 border-2 border-orange-500" 
                            : "bg-zinc-800 border-2 border-transparent hover:border-zinc-600"
                        }`}
                        data-testid={`card-narrator-${voice.value}`}
                      >
                        <div className="flex items-center gap-3">
                          <Mic2 className="w-6 h-6 text-orange-400" />
                          <div className="flex-1">
                            <h4 className="font-medium">{voice.label}</h4>
                          </div>
                          <Button variant="ghost" size="icon" data-testid={`button-preview-${voice.value}`}>
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step">
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      data-testid="button-next-step"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-orange-400" />
                    Mastering Settings
                  </CardTitle>
                  <CardDescription>Fine-tune the audio output</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Speech Speed: {speed[0].toFixed(1)}x</Label>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                      data-testid="slider-speed"
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Pitch Adjustment: {pitch[0] > 0 ? "+" : ""}{pitch[0]}</Label>
                    <Slider
                      value={pitch}
                      onValueChange={setPitch}
                      min={-10}
                      max={10}
                      step={1}
                      className="w-full"
                      data-testid="slider-pitch"
                    />
                  </div>
                  
                  <div>
                    <Label>Mastering Preset</Label>
                    <Select value={masteringPreset} onValueChange={setMasteringPreset}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-preset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audiobook">Audiobook Standard</SelectItem>
                        <SelectItem value="podcast">Podcast Style</SelectItem>
                        <SelectItem value="broadcast">Broadcast Quality</SelectItem>
                        <SelectItem value="intimate">Intimate/Close</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step">
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(4)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      data-testid="button-next-step"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    Ready to Generate
                  </CardTitle>
                  <CardDescription>Review your settings and start production</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-zinc-800/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Narrator</span>
                      <span>{narratorVoices.find(v => v.value === selectedNarrator)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Speed</span>
                      <span>{speed[0].toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Mastering</span>
                      <span className="capitalize">{masteringPreset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Estimated Time</span>
                      <span>~15 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Cost</span>
                      <span className="text-green-400">$16.00</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} data-testid="button-back-step">
                      Back
                    </Button>
                    <Button
                      onClick={() => startProductionMutation.mutate()}
                      disabled={startProductionMutation.isPending}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      data-testid="button-generate"
                    >
                      {startProductionMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting...</>
                      ) : (
                        <><Wand2 className="w-5 h-5 mr-2" /> Generate Audiobook</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
