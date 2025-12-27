import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Sparkles,
  Save,
  ChevronDown,
  ChevronRight,
  Film,
  Users,
  MessageSquare,
  FileText,
  Loader2,
  Clapperboard,
  User,
  Edit3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ScreenplayProject } from "@shared/schema";

interface Character {
  id: string;
  name: string;
  description: string;
  arc: string;
}

interface Scene {
  id: string;
  heading: string;
  description: string;
}

interface Beat {
  id: string;
  title: string;
  description: string;
  expanded?: boolean;
}

const GENRES = [
  "Drama",
  "Comedy",
  "Action",
  "Thriller",
  "Horror",
  "Sci-Fi",
  "Romance",
  "Documentary",
  "Animation",
  "Crime",
  "Fantasy",
  "Mystery",
];

const FORMATS = [
  { value: "feature", label: "Feature Film" },
  { value: "short", label: "Short Film" },
  { value: "series", label: "TV Series" },
  { value: "pilot", label: "Pilot Episode" },
];

export default function ScriptStudio() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: projects = [], isLoading: projectsLoading } = useQuery<ScreenplayProject[]>({
    queryKey: ["/api/screenplay"],
    enabled: !!user,
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const createProjectMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/screenplay", { title });
      return res.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenplay"] });
      setSelectedProjectId(newProject.id);
      setNewProjectDialogOpen(false);
      setNewProjectTitle("");
      toast({ title: "Project created", description: "Your screenplay project has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create project.", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<ScreenplayProject>) => {
      const res = await apiRequest("PATCH", `/api/screenplay/${selectedProjectId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenplay"] });
      toast({ title: "Saved", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    },
  });

  const generateLoglineMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/screenplay/${selectedProjectId}/generate-logline`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenplay"] });
      toast({ title: "Logline generated", description: "AI has generated a logline for your screenplay." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate logline.", variant: "destructive" });
    },
  });

  const generateBeatsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/screenplay/${selectedProjectId}/generate-beats`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenplay"] });
      toast({ title: "Beats generated", description: "AI has generated a beat sheet for your screenplay." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate beats.", variant: "destructive" });
    },
  });

  const generateDialogueMutation = useMutation({
    mutationFn: async (sceneId: string) => {
      const res = await apiRequest("POST", `/api/screenplay/${selectedProjectId}/generate-dialogue`, { sceneId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenplay"] });
      toast({ title: "Dialogue generated", description: "AI has generated dialogue for the scene." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate dialogue.", variant: "destructive" });
    },
  });

  const characters: Character[] = (selectedProject?.characters as Character[]) || [];
  const scenes: Scene[] = (selectedProject?.scenes as Scene[]) || [];
  const beats: Beat[] = (selectedProject?.beats as Beat[]) || [];
  const dialogue: Record<string, string> = (selectedProject?.dialogue as Record<string, string>) || {};

  const addCharacter = () => {
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: "New Character",
      description: "",
      arc: "",
    };
    updateProjectMutation.mutate({ characters: [...characters, newCharacter] as any });
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    const updated = characters.map((c) => (c.id === id ? { ...c, ...updates } : c));
    updateProjectMutation.mutate({ characters: updated as any });
  };

  const deleteCharacter = (id: string) => {
    const updated = characters.filter((c) => c.id !== id);
    updateProjectMutation.mutate({ characters: updated as any });
  };

  const addScene = () => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      heading: "INT. LOCATION - DAY",
      description: "",
    };
    updateProjectMutation.mutate({ scenes: [...scenes, newScene] as any });
  };

  const updateScene = (id: string, updates: Partial<Scene>) => {
    const updated = scenes.map((s) => (s.id === id ? { ...s, ...updates } : s));
    updateProjectMutation.mutate({ scenes: updated as any });
  };

  const deleteScene = (id: string) => {
    const updated = scenes.filter((s) => s.id !== id);
    updateProjectMutation.mutate({ scenes: updated as any });
  };

  const toggleBeat = (id: string) => {
    const updated = beats.map((b) => (b.id === id ? { ...b, expanded: !b.expanded } : b));
    updateProjectMutation.mutate({ beats: updated as any });
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <CreatorHeader />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-8 text-center">
              <Clapperboard className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Sign in to access Script Studio</h2>
              <p className="text-zinc-400">Create and manage your screenplay projects with AI assistance.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <CreatorHeader />
      <div className="flex h-[calc(100vh-64px)]">
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col" data-testid="sidebar-projects">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-orange-500" />
              Projects
            </h2>
            <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-create-project">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-white">New Screenplay Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="project-title" className="text-zinc-300">Project Title</Label>
                    <Input
                      id="project-title"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      placeholder="Enter project title..."
                      className="bg-zinc-900 border-zinc-700 text-white mt-2"
                      data-testid="input-new-project-title"
                    />
                  </div>
                  <Button
                    onClick={() => createProjectMutation.mutate(newProjectTitle)}
                    disabled={!newProjectTitle.trim() || createProjectMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    data-testid="button-create-project-confirm"
                  >
                    {createProjectMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {projects.length === 0 ? (
                <p className="text-zinc-500 text-sm p-4 text-center">No projects yet. Create your first screenplay!</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedProjectId === project.id
                        ? "bg-orange-500/20 border border-orange-500/50"
                        : "hover-elevate"
                    }`}
                    data-testid={`button-project-${project.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-orange-500" />
                      <span className="text-white font-medium truncate">{project.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {project.genre && (
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                          {project.genre}
                        </Badge>
                      )}
                      {project.format && (
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                          {project.format}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedProject ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Clapperboard className="w-20 h-20 mx-auto text-zinc-700 mb-4" />
                <h3 className="text-xl text-zinc-400 mb-2">Select a project or create a new one</h3>
                <Button
                  onClick={() => setNewProjectDialogOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-create-project-empty"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Screenplay
                </Button>
              </div>
            </div>
          ) : (
            <>
              <header className="border-b border-zinc-800 p-4 bg-zinc-950" data-testid="header-project">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {editingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-white text-xl font-bold w-64"
                          data-testid="input-edit-title"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            updateProjectMutation.mutate({ title: tempTitle });
                            setEditingTitle(false);
                          }}
                          className="bg-orange-500 hover:bg-orange-600"
                          data-testid="button-save-title"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTempTitle(selectedProject.title);
                          setEditingTitle(true);
                        }}
                        className="flex items-center gap-2 hover-elevate rounded p-1"
                        data-testid="button-edit-title"
                      >
                        <h1 className="text-2xl font-bold text-white">{selectedProject.title}</h1>
                        <Edit3 className="w-4 h-4 text-zinc-500" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedProject.genre || ""}
                      onValueChange={(value) => updateProjectMutation.mutate({ genre: value })}
                    >
                      <SelectTrigger className="w-32 bg-zinc-900 border-zinc-700 text-white" data-testid="select-genre">
                        <SelectValue placeholder="Genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre} className="text-white">
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedProject.format || "feature"}
                      onValueChange={(value) => updateProjectMutation.mutate({ format: value })}
                    >
                      <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-white" data-testid="select-format">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {FORMATS.map((format) => (
                          <SelectItem key={format.value} value={format.value} className="text-white">
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="bg-zinc-900 border-b border-zinc-800 rounded-none px-4 h-12 justify-start gap-1">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500"
                      data-testid="tab-overview"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="beats"
                      className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500"
                      data-testid="tab-beats"
                    >
                      <Film className="w-4 h-4 mr-2" />
                      Beat Sheet
                    </TabsTrigger>
                    <TabsTrigger
                      value="characters"
                      className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500"
                      data-testid="tab-characters"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Characters
                    </TabsTrigger>
                    <TabsTrigger
                      value="scenes"
                      className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500"
                      data-testid="tab-scenes"
                    >
                      <Clapperboard className="w-4 h-4 mr-2" />
                      Scenes
                    </TabsTrigger>
                    <TabsTrigger
                      value="dialogue"
                      className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500"
                      data-testid="tab-dialogue"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Dialogue
                    </TabsTrigger>
                    <TabsTrigger
                      value="script"
                      className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500"
                      data-testid="tab-script"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Full Script
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="flex-1">
                    <TabsContent value="overview" className="p-6 m-0">
                      <Card className="bg-zinc-950 border-zinc-800" data-testid="section-logline">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-orange-500" />
                              Logline
                            </CardTitle>
                            <Button
                              onClick={() => generateLoglineMutation.mutate()}
                              disabled={generateLoglineMutation.isPending}
                              variant="outline"
                              className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                              data-testid="button-generate-logline"
                            >
                              {generateLoglineMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                              )}
                              Generate Logline
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            value={selectedProject.logline || ""}
                            onChange={(e) => updateProjectMutation.mutate({ logline: e.target.value })}
                            placeholder="A compelling one-sentence summary of your screenplay..."
                            className="bg-zinc-900 border-zinc-700 text-white min-h-[100px] resize-none"
                            data-testid="textarea-logline"
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="beats" className="p-6 m-0">
                      <Card className="bg-zinc-950 border-zinc-800" data-testid="section-beats">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              <Film className="w-5 h-5 text-orange-500" />
                              Beat Sheet
                            </CardTitle>
                            <Button
                              onClick={() => generateBeatsMutation.mutate()}
                              disabled={generateBeatsMutation.isPending}
                              variant="outline"
                              className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                              data-testid="button-generate-beats"
                            >
                              {generateBeatsMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                              )}
                              Generate Beats
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {beats.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">
                              No beats yet. Click "Generate Beats" to create a beat sheet based on your logline.
                            </p>
                          ) : (
                            beats.map((beat, index) => (
                              <Collapsible
                                key={beat.id}
                                open={beat.expanded}
                                onOpenChange={() => toggleBeat(beat.id)}
                              >
                                <CollapsibleTrigger className="w-full" data-testid={`beat-trigger-${index}`}>
                                  <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg hover-elevate">
                                    {beat.expanded ? (
                                      <ChevronDown className="w-4 h-4 text-orange-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                                    )}
                                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                                      {index + 1}
                                    </Badge>
                                    <span className="text-white font-medium">{beat.title}</span>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 bg-zinc-900/50 rounded-b-lg border-t border-zinc-800">
                                    <p className="text-zinc-300">{beat.description}</p>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="characters" className="p-6 m-0">
                      <Card className="bg-zinc-950 border-zinc-800" data-testid="section-characters">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              <Users className="w-5 h-5 text-orange-500" />
                              Characters
                            </CardTitle>
                            <Button
                              onClick={addCharacter}
                              variant="outline"
                              className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                              data-testid="button-add-character"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Character
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {characters.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">
                              No characters yet. Click "Add Character" to create your first character.
                            </p>
                          ) : (
                            characters.map((character) => (
                              <Card key={character.id} className="bg-zinc-900 border-zinc-800" data-testid={`card-character-${character.id}`}>
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-orange-500" />
                                      </div>
                                      <Input
                                        value={character.name}
                                        onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                                        className="bg-zinc-800 border-zinc-700 text-white font-semibold w-48"
                                        placeholder="Character name"
                                        data-testid={`input-character-name-${character.id}`}
                                      />
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteCharacter(character.id)}
                                      className="text-zinc-500 hover:text-red-500"
                                      data-testid={`button-delete-character-${character.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div>
                                    <Label className="text-zinc-400 text-sm">Description</Label>
                                    <Textarea
                                      value={character.description}
                                      onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
                                      placeholder="Physical appearance, personality, background..."
                                      className="bg-zinc-800 border-zinc-700 text-white mt-1 resize-none"
                                      data-testid={`textarea-character-description-${character.id}`}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-zinc-400 text-sm">Character Arc</Label>
                                    <Textarea
                                      value={character.arc}
                                      onChange={(e) => updateCharacter(character.id, { arc: e.target.value })}
                                      placeholder="How does this character change throughout the story?"
                                      className="bg-zinc-800 border-zinc-700 text-white mt-1 resize-none"
                                      data-testid={`textarea-character-arc-${character.id}`}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="scenes" className="p-6 m-0">
                      <Card className="bg-zinc-950 border-zinc-800" data-testid="section-scenes">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              <Clapperboard className="w-5 h-5 text-orange-500" />
                              Scene List
                            </CardTitle>
                            <Button
                              onClick={addScene}
                              variant="outline"
                              className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                              data-testid="button-add-scene"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Scene
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {scenes.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">
                              No scenes yet. Click "Add Scene" to create your first scene.
                            </p>
                          ) : (
                            scenes.map((scene, index) => (
                              <Card
                                key={scene.id}
                                className={`bg-zinc-900 border-zinc-800 cursor-pointer transition-colors ${
                                  selectedSceneId === scene.id ? "border-orange-500" : ""
                                }`}
                                onClick={() => setSelectedSceneId(scene.id)}
                                data-testid={`card-scene-${scene.id}`}
                              >
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                                      Scene {index + 1}
                                    </Badge>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteScene(scene.id);
                                      }}
                                      className="text-zinc-500 hover:text-red-500"
                                      data-testid={`button-delete-scene-${scene.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={scene.heading}
                                    onChange={(e) => updateScene(scene.id, { heading: e.target.value })}
                                    className="bg-zinc-800 border-zinc-700 text-white font-mono uppercase"
                                    placeholder="INT./EXT. LOCATION - TIME"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`input-scene-heading-${scene.id}`}
                                  />
                                  <Textarea
                                    value={scene.description}
                                    onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                                    placeholder="Scene description and action..."
                                    className="bg-zinc-800 border-zinc-700 text-white resize-none"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`textarea-scene-description-${scene.id}`}
                                  />
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="dialogue" className="p-6 m-0">
                      <Card className="bg-zinc-950 border-zinc-800" data-testid="section-dialogue">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-orange-500" />
                              Dialogue Generator
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {scenes.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">
                              Add scenes first to generate dialogue.
                            </p>
                          ) : (
                            <>
                              <div>
                                <Label className="text-zinc-300">Select Scene</Label>
                                <Select
                                  value={selectedSceneId || ""}
                                  onValueChange={setSelectedSceneId}
                                >
                                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-2" data-testid="select-dialogue-scene">
                                    <SelectValue placeholder="Choose a scene..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                    {scenes.map((scene, index) => (
                                      <SelectItem key={scene.id} value={scene.id} className="text-white">
                                        Scene {index + 1}: {scene.heading}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {selectedSceneId && (
                                <>
                                  <Button
                                    onClick={() => generateDialogueMutation.mutate(selectedSceneId)}
                                    disabled={generateDialogueMutation.isPending}
                                    className="bg-orange-500 hover:bg-orange-600"
                                    data-testid="button-generate-dialogue"
                                  >
                                    {generateDialogueMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                      <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    Generate Dialogue
                                  </Button>

                                  <Separator className="bg-zinc-800" />

                                  <div>
                                    <Label className="text-zinc-300">Generated Dialogue</Label>
                                    <div className="mt-2 p-4 bg-zinc-900 rounded-lg font-mono text-sm whitespace-pre-wrap min-h-[200px]" data-testid="text-dialogue-output">
                                      {dialogue[selectedSceneId] ? (
                                        <p className="text-white">{dialogue[selectedSceneId]}</p>
                                      ) : (
                                        <p className="text-zinc-500">
                                          No dialogue generated yet. Click "Generate Dialogue" to create dialogue for this scene.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="script" className="p-6 m-0">
                      <Card className="bg-zinc-950 border-zinc-800" data-testid="section-full-script">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-500" />
                            Full Script
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white rounded-lg p-8 min-h-[600px] font-mono text-sm leading-relaxed" data-testid="script-preview">
                            <div className="max-w-xl mx-auto text-black">
                              <div className="text-center mb-8">
                                <h1 className="text-xl font-bold uppercase tracking-wider">{selectedProject.title}</h1>
                                {selectedProject.logline && (
                                  <p className="text-gray-600 mt-2 text-xs italic">{selectedProject.logline}</p>
                                )}
                              </div>

                              {scenes.length > 0 ? (
                                scenes.map((scene, index) => (
                                  <div key={scene.id} className="mb-8">
                                    <p className="uppercase font-bold">{scene.heading}</p>
                                    {scene.description && (
                                      <p className="mt-2">{scene.description}</p>
                                    )}
                                    {dialogue[scene.id] && (
                                      <div className="mt-4 whitespace-pre-wrap">{dialogue[scene.id]}</div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-400 text-center">
                                  Add scenes to see your screenplay here.
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
