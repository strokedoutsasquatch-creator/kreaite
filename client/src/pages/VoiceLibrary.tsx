import { useState } from "react";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mic2, Play, Pause, Plus, Trash2, Upload, Download, Wand2,
  Sparkles, Volume2, VolumeX, ArrowLeft, Loader2, User, Check
} from "lucide-react";

const voiceTypes = [
  { value: "narrator", label: "Narrator" },
  { value: "character", label: "Character" },
  { value: "singer", label: "Singer" },
  { value: "hero", label: "Hero" },
  { value: "villain", label: "Villain" },
  { value: "child", label: "Child" },
  { value: "elder", label: "Elder" },
  { value: "robot", label: "Robot/AI" }
];

interface VoiceClone {
  id: number;
  name: string;
  description: string;
  voiceType: string;
  sampleAudioUrl: string;
  isPublic: boolean;
}

export default function VoiceLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("library");
  
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceDesc, setNewVoiceDesc] = useState("");
  const [newVoiceType, setNewVoiceType] = useState("narrator");
  const [sampleText, setSampleText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data: voicesData, isLoading } = useQuery({
    queryKey: ["/api/voices"],
    enabled: !!user
  });

  const { data: publicVoices } = useQuery({
    queryKey: ["/api/voices/public"]
  });

  const createVoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/voices", {
        name: newVoiceName,
        description: newVoiceDesc,
        voiceType: newVoiceType,
        sampleAudioUrl: "",
        isPublic: false
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voices"] });
      setNewVoiceName("");
      setNewVoiceDesc("");
      toast({ title: "Voice Created!", description: "Your voice clone is ready to use" });
    },
    onError: (error: any) => {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    }
  });

  const deleteVoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/voices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voices"] });
      toast({ title: "Voice Deleted" });
    }
  });

  const togglePlay = (id: number) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const voices = (voicesData as any)?.voices || [];

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
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Mic2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Voice Cloning Library</h1>
            <p className="text-zinc-400">Create and manage reusable AI voices</p>
          </div>
          <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Ultra-Premium
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="library" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Mic2 className="w-4 h-4 mr-2" /> My Voices
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Plus className="w-4 h-4 mr-2" /> Create Voice
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <User className="w-4 h-4 mr-2" /> Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            {voices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voices.map((voice: VoiceClone) => (
                  <Card key={voice.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                          <Mic2 className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex gap-2">
                          {voice.isPublic && (
                            <Badge variant="secondary" className="text-xs">Public</Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteVoiceMutation.mutate(voice.id)}
                            data-testid={`button-delete-voice-${voice.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{voice.name}</CardTitle>
                      <CardDescription className="text-zinc-400 line-clamp-2">
                        {voice.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="mb-3">{voice.voiceType}</Badge>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => togglePlay(voice.id)}
                          className="flex-1"
                          data-testid={`button-play-voice-${voice.id}`}
                        >
                          {playingId === voice.id ? (
                            <><Pause className="w-4 h-4 mr-2" /> Stop</>
                          ) : (
                            <><Play className="w-4 h-4 mr-2" /> Preview</>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-use-voice-${voice.id}`}>
                          <Check className="w-4 h-4 mr-2" /> Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="text-center py-12">
                  <Mic2 className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <h3 className="text-xl font-medium mb-2">No Voice Clones Yet</h3>
                  <p className="text-zinc-400 mb-4">Create your first AI voice clone to use across all studios</p>
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-create-first-voice"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Voice Clone
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-orange-400" />
                    Voice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Voice Name</Label>
                    <Input
                      value={newVoiceName}
                      onChange={(e) => setNewVoiceName(e.target.value)}
                      placeholder="e.g., Epic Narrator"
                      className="bg-zinc-800 border-zinc-700"
                      data-testid="input-voice-name"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newVoiceDesc}
                      onChange={(e) => setNewVoiceDesc(e.target.value)}
                      placeholder="Describe the voice characteristics..."
                      className="bg-zinc-800 border-zinc-700"
                      data-testid="input-voice-desc"
                    />
                  </div>
                  
                  <div>
                    <Label>Voice Type</Label>
                    <Select value={newVoiceType} onValueChange={setNewVoiceType}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-voice-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-orange-400" />
                    Voice Sample
                  </CardTitle>
                  <CardDescription>Record or upload a voice sample</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-8 border-2 border-dashed border-zinc-700 rounded-lg text-center">
                    <Mic2 className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-zinc-400 mb-4">Record a 30-second sample or upload audio</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={() => setIsRecording(!isRecording)}
                        data-testid="button-record"
                      >
                        {isRecording ? (
                          <><Pause className="w-4 h-4 mr-2" /> Stop Recording</>
                        ) : (
                          <><Mic2 className="w-4 h-4 mr-2" /> Record Sample</>
                        )}
                      </Button>
                      <Button variant="outline" data-testid="button-upload">
                        <Upload className="w-4 h-4 mr-2" /> Upload File
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Sample Text (for TTS preview)</Label>
                    <Textarea
                      value={sampleText}
                      onChange={(e) => setSampleText(e.target.value)}
                      placeholder="Enter text to preview the voice..."
                      className="bg-zinc-800 border-zinc-700"
                      data-testid="input-sample-text"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={() => createVoiceMutation.mutate()}
              disabled={createVoiceMutation.isPending || !newVoiceName.trim()}
              size="lg"
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-create-voice"
            >
              {createVoiceMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Create Voice Clone</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Community Voices</CardTitle>
                <CardDescription>Public voice clones shared by other creators</CardDescription>
              </CardHeader>
              <CardContent>
                {(publicVoices as any)?.voices?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(publicVoices as any).voices.map((voice: VoiceClone) => (
                      <div key={voice.id} className="p-4 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Mic2 className="w-5 h-5 text-orange-400" />
                          <span className="font-medium">{voice.name}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">{voice.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{voice.voiceType}</Badge>
                          <Button variant="outline" size="sm" className="ml-auto" data-testid={`button-clone-${voice.id}`}>
                            <Download className="w-4 h-4 mr-1" /> Clone
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No public voices available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
