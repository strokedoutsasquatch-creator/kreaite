import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { MusicSandboxProject } from "@shared/schema";
import {
  Plus,
  Music,
  Drum,
  Wand2,
  Save,
  Loader2,
  FileAudio,
  Mic,
  Radio,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const PROJECT_TYPES = [
  { value: "beat", label: "Beat", icon: Drum },
  { value: "melody", label: "Melody", icon: Music },
  { value: "soundtrack", label: "Soundtrack", icon: FileAudio },
  { value: "jingle", label: "Jingle", icon: Radio },
  { value: "song", label: "Song", icon: Mic },
];

const GENRES = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hip-hop", label: "Hip-Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" },
  { value: "country", label: "Country" },
  { value: "r&b", label: "R&B" },
  { value: "ambient", label: "Ambient" },
  { value: "cinematic", label: "Cinematic" },
];

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const TIME_SIGNATURES = [
  { value: "4/4", label: "4/4 (Common)" },
  { value: "3/4", label: "3/4 (Waltz)" },
  { value: "6/8", label: "6/8 (Compound)" },
  { value: "2/4", label: "2/4 (March)" },
  { value: "5/4", label: "5/4 (Odd)" },
];

export default function MusicSandbox() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectType, setProjectType] = useState("beat");
  const [title, setTitle] = useState("Untitled Project");
  const [genre, setGenre] = useState("pop");
  const [tempo, setTempo] = useState(120);
  const [musicalKey, setMusicalKey] = useState("C");
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [lyrics, setLyrics] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState<any>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<MusicSandboxProject[]>({
    queryKey: ["/api/music-sandbox"],
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/music-sandbox", {
        title: "New Project",
        projectType: "beat",
        userId: user?.id,
      });
      return res.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/music-sandbox"] });
      loadProject(newProject);
      toast({ title: "Project created", description: "Your new music sandbox project is ready." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<MusicSandboxProject>) => {
      if (!selectedProjectId) return;
      const res = await apiRequest("PATCH", `/api/music-sandbox/${selectedProjectId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/music-sandbox"] });
      toast({ title: "Saved", description: "Project saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save project", variant: "destructive" });
    },
  });

  const generateBeatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/music-sandbox/generate-beat", {
        genre,
        tempo,
        key: musicalKey,
        timeSignature,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedOutput(data);
      toast({ title: "Beat generated", description: "AI has created your beat pattern." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate beat", variant: "destructive" });
    },
  });

  const generateMelodyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/music-sandbox/generate-melody", {
        genre,
        tempo,
        key: musicalKey,
        timeSignature,
        mood: projectType === "soundtrack" ? "cinematic" : "uplifting",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedOutput(data);
      toast({ title: "Melody generated", description: "AI has composed your melody." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate melody", variant: "destructive" });
    },
  });

  const lyricsToMusicMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/music-sandbox/lyrics-to-music", {
        lyrics,
        genre,
        tempo,
        key: musicalKey,
        timeSignature,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedOutput(data);
      toast({ title: "Music generated", description: "AI has transformed your lyrics into music." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate music from lyrics", variant: "destructive" });
    },
  });

  const loadProject = (project: MusicSandboxProject) => {
    setSelectedProjectId(project.id);
    setTitle(project.title);
    setProjectType(project.projectType);
    setGenre(project.genre || "pop");
    setTempo(project.tempo || 120);
    setMusicalKey(project.key || "C");
    setTimeSignature(project.timeSignature || "4/4");
    setLyrics(project.lyrics || "");
    setGeneratedOutput(project.patterns || project.structure || null);
  };

  const handleSave = () => {
    updateProjectMutation.mutate({
      title,
      projectType,
      genre,
      tempo,
      key: musicalKey,
      timeSignature,
      lyrics: projectType === "song" ? lyrics : undefined,
      patterns: generatedOutput,
    });
  };

  const currentTypeInfo = PROJECT_TYPES.find(t => t.value === projectType);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        <aside className="w-72 border-r border-gray-800 bg-gray-950 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Music Sandbox
              </h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => createProjectMutation.mutate()}
                disabled={createProjectMutation.isPending}
                data-testid="button-create-project"
              >
                {createProjectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <p className="text-xs mt-1">Create your first project</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {projects.map((project) => {
                    const TypeIcon = PROJECT_TYPES.find(t => t.value === project.projectType)?.icon || Music;
                    return (
                      <button
                        key={project.id}
                        onClick={() => loadProject(project)}
                        data-testid={`button-project-${project.id}`}
                        className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors hover-elevate ${
                          selectedProjectId === project.id
                            ? "bg-primary/10 border border"
                            : "hover:bg-gray-800"
                        }`}
                      >
                        <TypeIcon className={`w-4 h-4 ${selectedProjectId === project.id ? "text-primary" : "text-gray-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{project.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{project.projectType}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="p-4 border-b border-gray-800 flex items-center justify-between gap-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold bg-transparent border-none focus-visible:ring-0 max-w-md"
              placeholder="Project Title"
              data-testid="input-project-title"
            />
            <Button
              onClick={handleSave}
              disabled={!selectedProjectId || updateProjectMutation.isPending}
              data-testid="button-save-project"
            >
              {updateProjectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Project
            </Button>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <Tabs value={projectType} onValueChange={setProjectType} data-testid="tabs-project-type">
                <TabsList className="bg-gray-900 border border-gray-800">
                  {PROJECT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <TabsTrigger
                        key={type.value}
                        value={type.value}
                        className="data-[state=active]:bg-orange-500 data-[state=active]:text-foreground"
                        data-testid={`tab-${type.value}`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {PROJECT_TYPES.map((type) => (
                  <TabsContent key={type.value} value={type.value} className="mt-6">
                    <Card className="bg-gray-950 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <type.icon className="w-5 h-5 text-primary" />
                          {type.label} Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="genre">Genre</Label>
                            <Select value={genre} onValueChange={setGenre} data-testid="select-genre">
                              <SelectTrigger id="genre" data-testid="trigger-genre">
                                <SelectValue placeholder="Select genre" />
                              </SelectTrigger>
                              <SelectContent>
                                {GENRES.map((g) => (
                                  <SelectItem key={g.value} value={g.value}>
                                    {g.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="key">Key</Label>
                            <Select value={musicalKey} onValueChange={setMusicalKey} data-testid="select-key">
                              <SelectTrigger id="key" data-testid="trigger-key">
                                <SelectValue placeholder="Select key" />
                              </SelectTrigger>
                              <SelectContent>
                                {KEYS.map((k) => (
                                  <SelectItem key={k} value={k}>
                                    {k}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Tempo</Label>
                              <Badge variant="outline" className="font-mono">
                                {tempo} BPM
                              </Badge>
                            </div>
                            <Slider
                              value={[tempo]}
                              onValueChange={(v) => setTempo(v[0])}
                              min={60}
                              max={200}
                              step={1}
                              className="w-full"
                              data-testid="slider-tempo"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="time-signature">Time Signature</Label>
                            <Select value={timeSignature} onValueChange={setTimeSignature} data-testid="select-time-signature">
                              <SelectTrigger id="time-signature" data-testid="trigger-time-signature">
                                <SelectValue placeholder="Select time signature" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SIGNATURES.map((ts) => (
                                  <SelectItem key={ts.value} value={ts.value}>
                                    {ts.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {type.value === "song" && (
                          <div className="space-y-2">
                            <Label htmlFor="lyrics">Lyrics</Label>
                            <Textarea
                              id="lyrics"
                              value={lyrics}
                              onChange={(e) => setLyrics(e.target.value)}
                              placeholder="Enter your song lyrics here..."
                              className="min-h-[200px] bg-gray-900 border-gray-700"
                              data-testid="textarea-lyrics"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              <Separator className="bg-gray-800" />

              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Generation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => generateBeatMutation.mutate()}
                      disabled={generateBeatMutation.isPending}
                      variant="outline"
                      className="border-orange-500/50 hover:bg-primary/10"
                      data-testid="button-generate-beat"
                    >
                      {generateBeatMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Drum className="w-4 h-4 mr-2" />
                      )}
                      Generate Beat
                    </Button>

                    <Button
                      onClick={() => generateMelodyMutation.mutate()}
                      disabled={generateMelodyMutation.isPending}
                      variant="outline"
                      className="border-orange-500/50 hover:bg-primary/10"
                      data-testid="button-generate-melody"
                    >
                      {generateMelodyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Music className="w-4 h-4 mr-2" />
                      )}
                      Generate Melody
                    </Button>

                    <Button
                      onClick={() => lyricsToMusicMutation.mutate()}
                      disabled={lyricsToMusicMutation.isPending || !lyrics.trim()}
                      variant="outline"
                      className="border-orange-500/50 hover:bg-primary/10"
                      data-testid="button-lyrics-to-music"
                    >
                      {lyricsToMusicMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      Lyrics to Music
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {generatedOutput && (
                <Card className="bg-gray-950 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileAudio className="w-5 h-5 text-primary" />
                      Generated Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <pre
                        className="text-sm text-gray-300 bg-gray-900 p-4 rounded-md overflow-auto"
                        data-testid="output-display"
                      >
                        {JSON.stringify(generatedOutput, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
