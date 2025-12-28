import { useState } from "react";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Film, Clapperboard, Users, Mic2, Image, Play, Pause, Plus, Trash2,
  Wand2, Sparkles, Download, Save, ChevronRight, Clock, Video,
  FileText, Camera, Volume2, Loader2, ArrowLeft
} from "lucide-react";

interface Character {
  name: string;
  description: string;
  voiceType: string;
  appearances: number[];
}

interface Scene {
  sceneNumber: number;
  description: string;
  dialogue: Array<{ character: string; line: string; emotion: string }>;
  cameraAngles: string[];
  storyboardUrl?: string;
}

interface MovieProject {
  id: number;
  title: string;
  genre: string;
  premise: string;
  characters: Character[];
  scenes: Scene[];
  status: string;
}

const genres = [
  { value: "action", label: "Action" },
  { value: "comedy", label: "Comedy" },
  { value: "horror", label: "Horror" },
  { value: "romance", label: "Romance" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "thriller", label: "Thriller" }
];

const voiceTypes = [
  { value: "hero", label: "Hero" },
  { value: "villain", label: "Villain" },
  { value: "narrator", label: "Narrator" },
  { value: "opera", label: "Opera Singer" },
  { value: "deathMetal", label: "Death Metal" },
  { value: "threeStooges", label: "Three Stooges" },
  { value: "arnold", label: "Arnold Style" },
  { value: "morgan", label: "Morgan Style" },
  { value: "valley", label: "Valley Girl" }
];

export default function MovieStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  
  const [selectedGenre, setSelectedGenre] = useState("action");
  const [premise, setPremise] = useState("");
  const [characterCount, setCharacterCount] = useState(3);
  const [projectTitle, setProjectTitle] = useState("");
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterDesc, setNewCharacterDesc] = useState("");
  const [newCharacterVoice, setNewCharacterVoice] = useState("hero");
  
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [storyboardImages, setStoryboardImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { data: optionsData } = useQuery({
    queryKey: ["/api/movie/options"]
  });

  const generateScriptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/movie/generate-script", {
        genre: selectedGenre,
        premise,
        characterCount,
        title: projectTitle
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedScript(data.script);
      if (data.script?.characters) {
        setCharacters(data.script.characters);
      }
      toast({ title: "Script Generated!", description: "Your screenplay is ready for review" });
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const startPipelineMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/movie/pipeline", {
        genre: selectedGenre,
        premise,
        characterCount,
        title: projectTitle,
        characters
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Production Started!", description: "Your movie is being generated" });
    },
    onError: (error: any) => {
      toast({ title: "Pipeline Failed", description: error.message, variant: "destructive" });
    }
  });

  const addCharacter = () => {
    if (!newCharacterName.trim()) return;
    setCharacters([...characters, {
      name: newCharacterName,
      description: newCharacterDesc,
      voiceType: newCharacterVoice,
      appearances: []
    }]);
    setNewCharacterName("");
    setNewCharacterDesc("");
    setNewCharacterVoice("hero");
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator-hub">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
            <Film className="w-8 h-8 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Movie Studio</h1>
            <p className="text-zinc-400">AI-powered film production pipeline</p>
          </div>
          <Badge className="ml-auto bg-primary/20 text-primary border">
            <Sparkles className="w-3 h-3 mr-1" /> Ultra-Premium
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="projects" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Clapperboard className="w-4 h-4 mr-2" /> Projects
            </TabsTrigger>
            <TabsTrigger value="script" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <FileText className="w-4 h-4 mr-2" /> Script Generator
            </TabsTrigger>
            <TabsTrigger value="characters" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Characters
            </TabsTrigger>
            <TabsTrigger value="storyboard" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Image className="w-4 h-4 mr-2" /> Storyboard
            </TabsTrigger>
            <TabsTrigger value="dialogue" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Mic2 className="w-4 h-4 mr-2" /> Dialogue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Your Movie Projects</CardTitle>
                <CardDescription>Manage your film productions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-zinc-500">
                  <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No movie projects yet</p>
                  <Button 
                    onClick={() => setActiveTab("script")} 
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-new-project"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create New Movie
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    Script Generator
                  </CardTitle>
                  <CardDescription>AI-powered screenplay creation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Movie Title</Label>
                    <Input
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="Enter your movie title"
                      className="bg-zinc-800 border-zinc-700"
                      data-testid="input-movie-title"
                    />
                  </div>
                  
                  <div>
                    <Label>Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-genre">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre.value} value={genre.value}>
                            {genre.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Premise / Story Idea</Label>
                    <Textarea
                      value={premise}
                      onChange={(e) => setPremise(e.target.value)}
                      placeholder="Describe your movie premise..."
                      className="bg-zinc-800 border-zinc-700 min-h-[120px]"
                      data-testid="input-premise"
                    />
                  </div>
                  
                  <div>
                    <Label>Number of Characters: {characterCount}</Label>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      value={characterCount}
                      onChange={(e) => setCharacterCount(parseInt(e.target.value))}
                      className="w-full"
                      data-testid="slider-characters"
                    />
                  </div>
                  
                  <Button
                    onClick={() => generateScriptMutation.mutate()}
                    disabled={generateScriptMutation.isPending || !premise.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    data-testid="button-generate-script"
                  >
                    {generateScriptMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Script</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Generated Script Preview</CardTitle>
                  <CardDescription>Review your AI-generated screenplay</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedScript ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4 text-sm">
                        <div className="p-3 bg-zinc-800 rounded-lg">
                          <h4 className="font-bold text-primary">{generatedScript.title}</h4>
                          <p className="text-zinc-400 mt-1">{generatedScript.logline}</p>
                        </div>
                        {generatedScript.scenes?.map((scene: any, i: number) => (
                          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg">
                            <Badge className="mb-2">Scene {scene.sceneNumber}</Badge>
                            <p className="text-zinc-300">{scene.description}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-zinc-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Generate a script to preview it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="characters" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Add Character</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newCharacterName}
                      onChange={(e) => setNewCharacterName(e.target.value)}
                      placeholder="Character name"
                      className="bg-zinc-800 border-zinc-700"
                      data-testid="input-character-name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newCharacterDesc}
                      onChange={(e) => setNewCharacterDesc(e.target.value)}
                      placeholder="Character description"
                      className="bg-zinc-800 border-zinc-700"
                      data-testid="input-character-desc"
                    />
                  </div>
                  <div>
                    <Label>Voice Type</Label>
                    <Select value={newCharacterVoice} onValueChange={setNewCharacterVoice}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-voice">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceTypes.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={addCharacter} 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    data-testid="button-add-character"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Character
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Cast ({characters.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {characters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {characters.map((char, i) => (
                        <div key={i} className="p-4 bg-zinc-800/50 rounded-lg flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{char.name}</h4>
                            <p className="text-sm text-zinc-400 line-clamp-2">{char.description}</p>
                            <Badge className="mt-2" variant="secondary">{char.voiceType}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeCharacter(i)}
                            data-testid={`button-remove-character-${i}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No characters added yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="storyboard" className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Storyboard Gallery
                </CardTitle>
                <CardDescription>AI-generated visual frames for each scene</CardDescription>
              </CardHeader>
              <CardContent>
                {storyboardImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {storyboardImages.map((url, i) => (
                      <div key={i} className="aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                        <img src={url} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Generate a script first to create storyboards</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dialogue" className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-primary" />
                  Multi-Character Dialogue
                </CardTitle>
                <CardDescription>AI voice synthesis with unique character voices</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedScript?.scenes ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {generatedScript.scenes.map((scene: any, i: number) => (
                        <div key={i} className="p-4 bg-zinc-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Badge>Scene {scene.sceneNumber}</Badge>
                            <Button variant="outline" size="sm" data-testid={`button-play-scene-${i}`}>
                              <Play className="w-4 h-4 mr-2" /> Play Dialogue
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {scene.dialogue?.map((line: any, j: number) => (
                              <div key={j} className="flex items-start gap-3 p-2 bg-zinc-900/50 rounded">
                                <Badge variant="secondary" className="shrink-0">{line.character}</Badge>
                                <p className="text-sm text-zinc-300">{line.line}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Generate a script first to synthesize dialogue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-gradient-to-r from-orange-500/20 to-rose-500/20 border">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <h3 className="text-xl font-bold">Full Production Pipeline</h3>
              <p className="text-zinc-400">Generate complete movie: script → storyboards → dialogue → video</p>
            </div>
            <Button
              onClick={() => startPipelineMutation.mutate()}
              disabled={startPipelineMutation.isPending || !premise.trim()}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-start-pipeline"
            >
              {startPipelineMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting...</>
              ) : (
                <><Clapperboard className="w-5 h-5 mr-2" /> Start Production</>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
