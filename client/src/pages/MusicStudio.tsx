import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  Music,
  Drum,
  Guitar,
  Piano,
  Waves,
  Sparkles,
  Wand2,
  FileAudio,
  Video,
  Download,
  Plus,
  Trash2,
  Settings,
  Headphones,
  Radio,
  Zap,
  Brain,
  PenTool,
  Save,
  RefreshCw,
} from "lucide-react";

const genres = [
  { value: "rap", label: "Rap / Hip-Hop", icon: Mic },
  { value: "pop", label: "Pop", icon: Music },
  { value: "country", label: "Country / Southern Rock", icon: Guitar },
  { value: "metal", label: "Death Metal", icon: Zap },
  { value: "rock", label: "Modern Rock", icon: Radio },
  { value: "punk", label: "Punk", icon: Drum },
  { value: "edm", label: "EDM / Electronic", icon: Waves },
  { value: "ambient", label: "Ambient / Therapeutic", icon: Sparkles },
];

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scales = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "pentatonic", label: "Pentatonic" },
  { value: "blues", label: "Blues" },
  { value: "dorian", label: "Dorian" },
  { value: "mixolydian", label: "Mixolydian" },
];

interface Track {
  id: string;
  name: string;
  type: "drums" | "bass" | "synth" | "guitar" | "vocals" | "ai";
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
}

export default function MusicStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [masterVolume, setMasterVolume] = useState(80);
  const [bpm, setBpm] = useState(120);
  const [selectedKey, setSelectedKey] = useState("C");
  const [selectedScale, setSelectedScale] = useState("minor");
  const [selectedGenre, setSelectedGenre] = useState("rock");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [lyrics, setLyrics] = useState("");
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingInstrumental, setIsGeneratingInstrumental] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([
    { id: "1", name: "Drums", type: "drums", volume: 80, pan: 50, muted: false, solo: false, color: "bg-red-500" },
    { id: "2", name: "Bass", type: "bass", volume: 75, pan: 50, muted: false, solo: false, color: "bg-blue-500" },
    { id: "3", name: "Synth Lead", type: "synth", volume: 70, pan: 45, muted: false, solo: false, color: "bg-purple-500" },
    { id: "4", name: "Guitar", type: "guitar", volume: 65, pan: 55, muted: false, solo: false, color: "bg-orange-500" },
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => setIsPlaying(!isPlaying);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTrack = (type: Track["type"]) => {
    const colors: Record<string, string> = {
      drums: "bg-red-500",
      bass: "bg-blue-500",
      synth: "bg-purple-500",
      guitar: "bg-orange-500",
      vocals: "bg-green-500",
      ai: "bg-primary",
    };
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      volume: 75,
      pan: 50,
      muted: false,
      solo: false,
      color: colors[type] || "bg-gray-500",
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const generateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-lyrics", {
        genre: selectedGenre,
        theme: "stroke recovery, overcoming adversity, rising from challenges",
        mood: selectedScale === "minor" ? "intense, powerful" : "uplifting, triumphant",
      });
      const data = await response.json();
      setLyrics(data.lyrics || "");
      toast({ title: "Lyrics generated!", description: "AI has written your song lyrics." });
    } catch (error) {
      toast({ title: "Generation failed", description: "Could not generate lyrics. Try again.", variant: "destructive" });
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const generateInstrumental = async () => {
    setIsGeneratingInstrumental(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-instrumental", {
        genre: selectedGenre,
        bpm,
        key: selectedKey,
        scale: selectedScale,
        duration: 30,
      });
      const data = await response.json();
      if (data.audioUrl) {
        addTrack("ai");
        toast({ title: "Instrumental generated!", description: "AI track added to your project." });
      }
    } catch (error) {
      toast({ title: "Generation failed", description: "Could not generate instrumental. Try again.", variant: "destructive" });
    } finally {
      setIsGeneratingInstrumental(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/50 p-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">Stroke Lyfe Studio</span>
            </div>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-64 bg-background"
              data-testid="input-project-title"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-save">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm" data-testid="button-create-video">
              <Video className="w-4 h-4 mr-1" />
              Create Video
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-72 border-r border-border bg-card/30 p-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Genre</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger data-testid="select-genre">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger data-testid="select-key">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {keys.map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Scale</Label>
                  <Select value={selectedScale} onValueChange={setSelectedScale}>
                    <SelectTrigger data-testid="select-scale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scales.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">BPM: {bpm}</Label>
                <Slider
                  value={[bpm]}
                  onValueChange={([v]) => setBpm(v)}
                  min={60}
                  max={200}
                  step={1}
                  data-testid="slider-bpm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                AI Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                onClick={generateInstrumental}
                disabled={isGeneratingInstrumental}
                data-testid="button-generate-instrumental"
              >
                {isGeneratingInstrumental ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Generate Instrumental
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                onClick={generateLyrics}
                disabled={isGeneratingLyrics}
                data-testid="button-generate-lyrics"
              >
                {isGeneratingLyrics ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PenTool className="w-4 h-4 mr-2" />
                )}
                Generate Lyrics
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                data-testid="button-generate-vocals"
              >
                <Mic className="w-4 h-4 mr-2" />
                Generate Vocals
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Add Track</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="icon" onClick={() => addTrack("drums")} data-testid="button-add-drums">
                <Drum className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("bass")} data-testid="button-add-bass">
                <Waves className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("synth")} data-testid="button-add-synth">
                <Piano className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("guitar")} data-testid="button-add-guitar">
                <Guitar className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("vocals")} data-testid="button-add-vocals">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("ai")} data-testid="button-add-ai">
                <Sparkles className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 overflow-hidden">
            <Tabs defaultValue="arrange" className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="arrange" data-testid="tab-arrange">Arrange</TabsTrigger>
                <TabsTrigger value="mixer" data-testid="tab-mixer">Mixer</TabsTrigger>
                <TabsTrigger value="lyrics" data-testid="tab-lyrics">Lyrics</TabsTrigger>
                <TabsTrigger value="effects" data-testid="tab-effects">Effects</TabsTrigger>
              </TabsList>

              <TabsContent value="arrange" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {tracks.map((track, index) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                            data-testid={`track-${track.id}`}
                          >
                            <div className={`w-3 h-12 rounded ${track.color}`} />
                            <div className="w-32">
                              <Input
                                value={track.name}
                                onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                                className="h-8 text-sm"
                                data-testid={`input-track-name-${track.id}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={track.muted ? "default" : "ghost"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateTrack(track.id, { muted: !track.muted })}
                                data-testid={`button-mute-${track.id}`}
                              >
                                {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant={track.solo ? "default" : "ghost"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateTrack(track.id, { solo: !track.solo })}
                                data-testid={`button-solo-${track.id}`}
                              >
                                <Headphones className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex-1 h-12 bg-background rounded-md border border-border relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center px-2">
                                {[...Array(32)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`flex-1 mx-px ${track.color} opacity-30`}
                                    style={{ height: `${Math.random() * 60 + 20}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="w-24">
                              <Slider
                                value={[track.volume]}
                                onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                                max={100}
                                data-testid={`slider-volume-${track.id}`}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeTrack(track.id)}
                              data-testid={`button-delete-${track.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mixer" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <div className="flex gap-4 h-full">
                      {tracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 w-24"
                          data-testid={`mixer-channel-${track.id}`}
                        >
                          <span className="text-xs font-medium truncate w-full text-center">{track.name}</span>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="h-40 w-4 bg-background rounded-full border relative overflow-hidden">
                              <div
                                className={`absolute bottom-0 w-full ${track.color}`}
                                style={{ height: `${track.volume}%` }}
                              />
                            </div>
                          </div>
                          <Slider
                            value={[track.volume]}
                            onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                            max={100}
                            orientation="vertical"
                            className="h-32"
                          />
                          <div className="flex gap-1">
                            <Button
                              variant={track.muted ? "default" : "outline"}
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateTrack(track.id, { muted: !track.muted })}
                            >
                              <span className="text-xs">M</span>
                            </Button>
                            <Button
                              variant={track.solo ? "default" : "outline"}
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateTrack(track.id, { solo: !track.solo })}
                            >
                              <span className="text-xs">S</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Separator orientation="vertical" />
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 w-24">
                        <span className="text-xs font-bold">MASTER</span>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-40 w-4 bg-background rounded-full border relative overflow-hidden">
                            <div
                              className="absolute bottom-0 w-full bg-primary"
                              style={{ height: `${masterVolume}%` }}
                            />
                          </div>
                        </div>
                        <Slider
                          value={[masterVolume]}
                          onValueChange={([v]) => setMasterVolume(v)}
                          max={100}
                          orientation="vertical"
                          className="h-32"
                          data-testid="slider-master-volume"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lyrics" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Song Lyrics</h3>
                      <Button
                        size="sm"
                        onClick={generateLyrics}
                        disabled={isGeneratingLyrics}
                        data-testid="button-generate-lyrics-tab"
                      >
                        {isGeneratingLyrics ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        AI Generate
                      </Button>
                    </div>
                    <Textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      placeholder="Write your lyrics here or use AI to generate them...

[Verse 1]
Your verse lyrics...

[Chorus]
Your chorus lyrics...

[Verse 2]
Continue the story..."
                      className="flex-1 resize-none font-mono"
                      data-testid="textarea-lyrics"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="effects" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Reverb</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs">Room Size</Label>
                            <Slider defaultValue={[30]} max={100} data-testid="slider-reverb-room" />
                          </div>
                          <div>
                            <Label className="text-xs">Wet/Dry</Label>
                            <Slider defaultValue={[40]} max={100} data-testid="slider-reverb-wet" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Delay</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs">Time</Label>
                            <Slider defaultValue={[50]} max={100} data-testid="slider-delay-time" />
                          </div>
                          <div>
                            <Label className="text-xs">Feedback</Label>
                            <Slider defaultValue={[30]} max={100} data-testid="slider-delay-feedback" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Compressor</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs">Threshold</Label>
                            <Slider defaultValue={[60]} max={100} data-testid="slider-comp-threshold" />
                          </div>
                          <div>
                            <Label className="text-xs">Ratio</Label>
                            <Slider defaultValue={[40]} max={100} data-testid="slider-comp-ratio" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">EQ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs">Low</Label>
                            <Slider defaultValue={[50]} max={100} data-testid="slider-eq-low" />
                          </div>
                          <div>
                            <Label className="text-xs">Mid</Label>
                            <Slider defaultValue={[50]} max={100} data-testid="slider-eq-mid" />
                          </div>
                          <div>
                            <Label className="text-xs">High</Label>
                            <Slider defaultValue={[50]} max={100} data-testid="slider-eq-high" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t border-border bg-card/50 p-4">
            <div className="max-w-[1800px] mx-auto flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)} data-testid="button-skip-back">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handlePlay}
                  className={isPlaying ? "bg-green-600 hover:bg-green-700" : ""}
                  data-testid="button-play"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleStop} data-testid="button-stop">
                  <Square className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-skip-forward">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span data-testid="text-current-time">{formatTime(currentTime)}</span>
                <span>/</span>
                <span data-testid="text-duration">{formatTime(duration)}</span>
              </div>

              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={([v]) => setCurrentTime(v)}
                  max={duration}
                  className="cursor-pointer"
                  data-testid="slider-timeline"
                />
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[masterVolume]}
                  onValueChange={([v]) => setMasterVolume(v)}
                  max={100}
                  className="w-24"
                  data-testid="slider-master-volume-transport"
                />
              </div>

              <Badge variant="outline" data-testid="badge-bpm">
                {bpm} BPM
              </Badge>
              <Badge variant="outline" data-testid="badge-key">
                {selectedKey} {selectedScale}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
