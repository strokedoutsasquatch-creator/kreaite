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
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as Tone from "tone";
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Mic, MicOff,
  Music, Drum, Guitar, Piano, Waves, Sparkles, Wand2, FileAudio, Video,
  Download, Plus, Trash2, Settings, Headphones, Radio, Zap, Brain, PenTool,
  Save, RefreshCw, Upload, Film, Clapperboard, User, Users, Disc, RotateCcw,
  FastForward, Rewind, CircleDot, Square as StopIcon, Activity
} from "lucide-react";

// Genre configurations
const genres = [
  { value: "rap", label: "Southern Rap", icon: Mic },
  { value: "pop", label: "Pop", icon: Music },
  { value: "country", label: "Country Rock", icon: Guitar },
  { value: "metal", label: "Death Metal", icon: Zap },
  { value: "rock", label: "Modern Rock", icon: Radio },
  { value: "punk", label: "Punk", icon: Drum },
  { value: "edm", label: "EDM / Bassnectar", icon: Waves },
  { value: "ambient", label: "Ambient Healing", icon: Sparkles },
];

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scales = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "pentatonic", label: "Pentatonic" },
  { value: "blues", label: "Blues" },
  { value: "dorian", label: "Dorian" },
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
  audioUrl?: string;
}

interface EQBand {
  frequency: number;
  gain: number;
  Q: number;
}

export default function MusicStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [masterVolume, setMasterVolume] = useState(80);
  const [bpm, setBpm] = useState(120);
  
  // Project settings
  const [selectedKey, setSelectedKey] = useState("C");
  const [selectedScale, setSelectedScale] = useState("minor");
  const [selectedGenre, setSelectedGenre] = useState("rock");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [lyrics, setLyrics] = useState("");
  
  // Generation states
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingInstrumental, setIsGeneratingInstrumental] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Voice cloning
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState("southernRap");
  const [voiceText, setVoiceText] = useState("");
  const [clonedVoiceKey, setClonedVoiceKey] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  
  // Movie studio
  const [moviePremise, setMoviePremise] = useState("");
  const [movieGenre, setMovieGenre] = useState("action");
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [storyboardFrames, setStoryboardFrames] = useState<string[]>([]);
  
  // EQ state (8-band parametric)
  const [eqBands, setEqBands] = useState<EQBand[]>([
    { frequency: 60, gain: 0, Q: 1 },
    { frequency: 170, gain: 0, Q: 1 },
    { frequency: 310, gain: 0, Q: 1 },
    { frequency: 600, gain: 0, Q: 1 },
    { frequency: 1000, gain: 0, Q: 1 },
    { frequency: 3000, gain: 0, Q: 1 },
    { frequency: 6000, gain: 0, Q: 1 },
    { frequency: 12000, gain: 0, Q: 1 },
  ]);
  
  // Effects state
  const [reverbMix, setReverbMix] = useState(30);
  const [delayTime, setDelayTime] = useState(50);
  const [delayFeedback, setDelayFeedback] = useState(30);
  const [compThreshold, setCompThreshold] = useState(-20);
  const [compRatio, setCompRatio] = useState(4);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(false);
  const [autoTuneSpeed, setAutoTuneSpeed] = useState(50);
  
  // Tracks
  const [tracks, setTracks] = useState<Track[]>([
    { id: "1", name: "Drums", type: "drums", volume: 80, pan: 50, muted: false, solo: false, color: "bg-red-500" },
    { id: "2", name: "Bass", type: "bass", volume: 75, pan: 50, muted: false, solo: false, color: "bg-blue-500" },
    { id: "3", name: "Synth Lead", type: "synth", volume: 70, pan: 45, muted: false, solo: false, color: "bg-purple-500" },
    { id: "4", name: "Guitar", type: "guitar", volume: 65, pan: 55, muted: false, solo: false, color: "bg-orange-500" },
  ]);

  // Audio refs
  const toneStarted = useRef(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const channelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const masterGainRef = useRef<Tone.Gain | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const compressorRef = useRef<Tone.Compressor | null>(null);
  const eqRef = useRef<Tone.EQ3 | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch voice styles
  const { data: voiceStyles } = useQuery({
    queryKey: ['/api/voice/styles'],
  });

  // Fetch audio presets
  const { data: audioPresets } = useQuery({
    queryKey: ['/api/audio/presets'],
  });

  // Fetch video styles
  const { data: videoStyles } = useQuery({
    queryKey: ['/api/video/styles'],
  });

  // Initialize Tone.js with real effects chain
  const initAudio = async () => {
    if (!toneStarted.current) {
      await Tone.start();
      toneStarted.current = true;
      
      // Create master effects chain
      compressorRef.current = new Tone.Compressor({
        threshold: compThreshold,
        ratio: compRatio,
        attack: 0.003,
        release: 0.25,
      });
      
      eqRef.current = new Tone.EQ3({
        low: eqBands[0].gain,
        mid: eqBands[3].gain,
        high: eqBands[6].gain,
      });
      
      reverbRef.current = new Tone.Reverb({
        decay: 2.5,
        wet: reverbMix / 100,
      });
      
      delayRef.current = new Tone.FeedbackDelay({
        delayTime: delayTime / 1000,
        feedback: delayFeedback / 100,
        wet: 0.3,
      });
      
      masterGainRef.current = new Tone.Gain(masterVolume / 100);
      
      // Connect effects chain: compressor -> EQ -> reverb -> delay -> master -> output
      compressorRef.current.connect(eqRef.current);
      eqRef.current.connect(reverbRef.current);
      reverbRef.current.connect(delayRef.current);
      delayRef.current.connect(masterGainRef.current);
      masterGainRef.current.toDestination();
      
      Tone.getTransport().bpm.value = bpm;
    }
  };

  // Update BPM
  useEffect(() => {
    if (toneStarted.current) {
      Tone.getTransport().bpm.value = bpm;
    }
  }, [bpm]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume / 100;
    }
  }, [masterVolume]);

  // Update effects in real-time
  useEffect(() => {
    if (reverbRef.current) reverbRef.current.wet.value = reverbMix / 100;
  }, [reverbMix]);

  useEffect(() => {
    if (delayRef.current) {
      delayRef.current.delayTime.value = delayTime / 1000;
      delayRef.current.feedback.value = delayFeedback / 100;
    }
  }, [delayTime, delayFeedback]);

  useEffect(() => {
    if (compressorRef.current) {
      compressorRef.current.threshold.value = compThreshold;
      compressorRef.current.ratio.value = compRatio;
    }
  }, [compThreshold, compRatio]);

  // Load audio for tracks with audioUrl
  useEffect(() => {
    tracks.forEach(track => {
      if (track.audioUrl && !playersRef.current.has(track.id)) {
        const channel = new Tone.Channel({
          volume: Tone.gainToDb(track.volume / 100),
          pan: (track.pan - 50) / 50,
          mute: track.muted,
        });
        
        const player = new Tone.Player({
          url: track.audioUrl,
          loop: true,
          onload: () => {
            toast({ title: `${track.name} loaded` });
          },
        });
        
        player.connect(channel);
        if (compressorRef.current) {
          channel.connect(compressorRef.current);
        }
        
        playersRef.current.set(track.id, player);
        channelsRef.current.set(track.id, channel);
      }
    });
  }, [tracks]);

  // Update individual track channels
  useEffect(() => {
    tracks.forEach(track => {
      const channel = channelsRef.current.get(track.id);
      if (channel) {
        channel.volume.value = Tone.gainToDb(track.volume / 100);
        channel.pan.value = (track.pan - 50) / 50;
        channel.mute = track.muted;
      }
    });
  }, [tracks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playersRef.current.forEach(player => player.dispose());
      channelsRef.current.forEach(channel => channel.dispose());
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = async () => {
    await initAudio();
    if (isPlaying) {
      // Pause all players
      playersRef.current.forEach(player => {
        if (player.state === "started") player.stop();
      });
      Tone.getTransport().pause();
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    } else {
      // Start all players that have audio loaded
      const startTime = Tone.now();
      playersRef.current.forEach((player, trackId) => {
        const track = tracks.find(t => t.id === trackId);
        if (track && !track.muted && player.loaded) {
          player.start(startTime);
        }
      });
      Tone.getTransport().start();
      
      // Update time display
      timeIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= duration) {
            handleStop();
            return 0;
          }
          return next;
        });
      }, 100);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    // Stop all players
    playersRef.current.forEach(player => {
      if (player.state === "started") player.stop();
    });
    Tone.getTransport().stop();
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTrack = (type: Track["type"]) => {
    const colors: Record<string, string> = {
      drums: "bg-red-500", bass: "bg-blue-500", synth: "bg-purple-500",
      guitar: "bg-orange-500", vocals: "bg-green-500", ai: "bg-primary",
    };
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type, volume: 75, pan: 50, muted: false, solo: false,
      color: colors[type] || "bg-gray-500",
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: string) => setTracks(tracks.filter(t => t.id !== id));

  // Generate lyrics
  const generateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-lyrics", {
        genre: selectedGenre,
        theme: "stroke recovery, overcoming adversity, rising from challenges, REBUILD REWIRE RISE",
        mood: selectedScale === "minor" ? "intense, powerful, raw emotion" : "uplifting, triumphant, victorious",
      });
      const data = await response.json();
      setLyrics(data.lyrics || "");
      toast({ title: "Lyrics Generated!", description: "AI wrote your song lyrics." });
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // Generate instrumental
  const generateInstrumental = async () => {
    setIsGeneratingInstrumental(true);
    setGenerationProgress(0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(p => Math.min(p + 5, 90));
    }, 500);

    try {
      const response = await apiRequest("POST", "/api/music/generate-instrumental", {
        genre: selectedGenre, bpm, key: selectedKey, scale: selectedScale,
        description: `Production-grade ${selectedGenre} track for stroke recovery motivation`,
      });
      const data = await response.json();
      
      if (data.success && data.audioBase64) {
        // Add AI track with audio
        const newTrack: Track = {
          id: Date.now().toString(),
          name: `AI ${selectedGenre.toUpperCase()}`,
          type: "ai", volume: 80, pan: 50, muted: false, solo: false,
          color: "bg-primary",
          audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
        };
        setTracks([...tracks, newTrack]);
        toast({ title: "Instrumental Generated!", description: "AI track added to your project." });
      } else {
        toast({ title: "Generation queued", description: data.message || "Check back soon." });
      }
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => setGenerationProgress(0), 1000);
      setIsGeneratingInstrumental(false);
    }
  };

  // Synthesize voice
  const synthesizeVoice = async () => {
    if (!voiceText.trim()) {
      toast({ title: "Enter text first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingVoice(true);
    try {
      const response = await apiRequest("POST", "/api/voice/synthesize", {
        text: voiceText,
        style: selectedVoiceStyle,
      });
      const data = await response.json();
      
      if (data.success && data.audioBase64) {
        // Play the audio
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.play();
        toast({ title: "Voice Generated!", description: `${selectedVoiceStyle} style applied.` });
      }
    } catch (error) {
      toast({ title: "Voice synthesis failed", variant: "destructive" });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Record voice for cloning
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      recordedChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          // Clone voice
          try {
            const response = await apiRequest("POST", "/api/voice/clone", {
              audioBase64: base64,
              name: `${user?.name || 'User'}'s Voice`,
            });
            const data = await response.json();
            if (data.success) {
              setClonedVoiceKey(data.voiceCloneKey);
              toast({ title: "Voice Cloned!", description: "Your voice is ready to use." });
            }
          } catch (error) {
            toast({ title: "Cloning failed", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setIsRecordingVoice(true);
      toast({ title: "Recording...", description: "Speak for at least 10 seconds." });
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder.current && isRecordingVoice) {
      mediaRecorder.current.stop();
      setIsRecordingVoice(false);
    }
  };

  // Generate movie script
  const generateScript = async () => {
    if (!moviePremise.trim()) {
      toast({ title: "Enter a premise first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingScript(true);
    try {
      const response = await apiRequest("POST", "/api/video/generate-script", {
        premise: moviePremise,
        genre: movieGenre,
        sceneCount: 5,
      });
      const data = await response.json();
      
      if (data.success && data.script) {
        setGeneratedScript(data.script);
        toast({ title: "Script Generated!", description: `${data.script.scenes?.length || 0} scenes created.` });
      }
    } catch (error) {
      toast({ title: "Script generation failed", variant: "destructive" });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate storyboard
  const generateStoryboard = async (sceneIndex: number) => {
    if (!generatedScript?.scenes?.[sceneIndex]) return;
    
    const scene = generatedScript.scenes[sceneIndex];
    try {
      const response = await apiRequest("POST", "/api/video/generate-storyboard", {
        scene,
        style: movieGenre,
        frameCount: 3,
      });
      const data = await response.json();
      
      if (data.success && data.frames) {
        setStoryboardFrames(prev => [...prev, ...data.frames]);
        toast({ title: "Storyboard Generated!" });
      }
    } catch (error) {
      toast({ title: "Storyboard generation failed", variant: "destructive" });
    }
  };

  // Apply EQ preset
  const applyEQPreset = (presetId: string) => {
    const preset = audioPresets?.presets?.eq?.find((p: any) => p.id === presetId);
    if (preset?.bands) {
      setEqBands(preset.bands);
      toast({ title: `${preset.name} Applied` });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
            <Badge variant="outline" className="text-primary">
              {selectedGenre.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-save">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" data-testid="button-create-video">
              <Video className="w-4 h-4 mr-1" /> Create Video
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 border-r border-border bg-card/30 p-4 flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Genre</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger data-testid="select-genre"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {genres.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger data-testid="select-key"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {keys.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Scale</Label>
                  <Select value={selectedScale} onValueChange={setSelectedScale}>
                    <SelectTrigger data-testid="select-scale"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {scales.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">BPM: {bpm}</Label>
                <Slider value={[bpm]} onValueChange={([v]) => setBpm(v)} min={60} max={200} data-testid="slider-bpm" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" size="sm"
                onClick={generateInstrumental} disabled={isGeneratingInstrumental}
                data-testid="button-generate-instrumental">
                {isGeneratingInstrumental ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Beat (Lyria)
              </Button>
              {isGeneratingInstrumental && <Progress value={generationProgress} className="h-2" />}
              
              <Button className="w-full justify-start" variant="outline" size="sm"
                onClick={generateLyrics} disabled={isGeneratingLyrics}
                data-testid="button-generate-lyrics">
                {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                Generate Lyrics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Add Track</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="icon" onClick={() => addTrack("drums")} data-testid="button-add-drums"><Drum className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("bass")} data-testid="button-add-bass"><Waves className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("synth")} data-testid="button-add-synth"><Piano className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("guitar")} data-testid="button-add-guitar"><Guitar className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("vocals")} data-testid="button-add-vocals"><Mic className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("ai")} data-testid="button-add-ai"><Sparkles className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 overflow-hidden">
            <Tabs defaultValue="arrange" className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="arrange" data-testid="tab-arrange">Arrange</TabsTrigger>
                <TabsTrigger value="mixer" data-testid="tab-mixer">Mixer</TabsTrigger>
                <TabsTrigger value="effects" data-testid="tab-effects">Effects & EQ</TabsTrigger>
                <TabsTrigger value="voice" data-testid="tab-voice">Voice Studio</TabsTrigger>
                <TabsTrigger value="lyrics" data-testid="tab-lyrics">Lyrics</TabsTrigger>
                <TabsTrigger value="movie" data-testid="tab-movie">Movie Studio</TabsTrigger>
              </TabsList>

              {/* Arrange Tab */}
              <TabsContent value="arrange" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {tracks.map((track) => (
                          <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate" data-testid={`track-${track.id}`}>
                            <div className={`w-3 h-12 rounded ${track.color}`} />
                            <div className="w-32">
                              <Input value={track.name} onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                                className="h-8 text-sm" data-testid={`input-track-name-${track.id}`} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant={track.muted ? "default" : "ghost"} size="icon" className="h-8 w-8"
                                onClick={() => updateTrack(track.id, { muted: !track.muted })} data-testid={`button-mute-${track.id}`}>
                                {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </Button>
                              <Button variant={track.solo ? "default" : "ghost"} size="icon" className="h-8 w-8"
                                onClick={() => updateTrack(track.id, { solo: !track.solo })} data-testid={`button-solo-${track.id}`}>
                                <Headphones className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex-1 h-12 bg-background rounded-md border border-border relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center px-2">
                                {[...Array(32)].map((_, i) => (
                                  <div key={i} className={`flex-1 mx-px ${track.color} opacity-30`}
                                    style={{ height: `${Math.random() * 60 + 20}%` }} />
                                ))}
                              </div>
                            </div>
                            <div className="w-24">
                              <Slider value={[track.volume]} onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                                max={100} data-testid={`slider-volume-${track.id}`} />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeTrack(track.id)} data-testid={`button-delete-${track.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mixer Tab */}
              <TabsContent value="mixer" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <div className="flex gap-4 h-full overflow-x-auto">
                      {tracks.map((track) => (
                        <div key={track.id} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 w-24 flex-shrink-0" data-testid={`mixer-channel-${track.id}`}>
                          <span className="text-xs font-medium truncate w-full text-center">{track.name}</span>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="h-40 w-4 bg-background rounded-full border relative overflow-hidden">
                              <div className={`absolute bottom-0 w-full ${track.color}`} style={{ height: `${track.volume}%` }} />
                            </div>
                          </div>
                          <Slider value={[track.volume]} onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                            max={100} orientation="vertical" className="h-32" />
                          <div className="flex gap-1">
                            <Button variant={track.muted ? "default" : "outline"} size="icon" className="h-6 w-6"
                              onClick={() => updateTrack(track.id, { muted: !track.muted })}><span className="text-xs">M</span></Button>
                            <Button variant={track.solo ? "default" : "outline"} size="icon" className="h-6 w-6"
                              onClick={() => updateTrack(track.id, { solo: !track.solo })}><span className="text-xs">S</span></Button>
                          </div>
                        </div>
                      ))}
                      <Separator orientation="vertical" />
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 w-24 flex-shrink-0">
                        <span className="text-xs font-bold">MASTER</span>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-40 w-4 bg-background rounded-full border relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-primary" style={{ height: `${masterVolume}%` }} />
                          </div>
                        </div>
                        <Slider value={[masterVolume]} onValueChange={([v]) => setMasterVolume(v)}
                          max={100} orientation="vertical" className="h-32" data-testid="slider-master-volume" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {/* 8-Band EQ */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">8-Band Parametric EQ</CardTitle>
                        <div className="flex gap-2">
                          {audioPresets?.presets?.eq?.slice(0, 4).map((p: any) => (
                            <Button key={p.id} variant="outline" size="sm" onClick={() => applyEQPreset(p.id)}
                              data-testid={`button-eq-preset-${p.id}`}>{p.name}</Button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 items-end h-48">
                        {eqBands.map((band, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <Slider value={[band.gain + 12]} onValueChange={([v]) => {
                              const newBands = [...eqBands];
                              newBands[i].gain = v - 12;
                              setEqBands(newBands);
                            }} min={0} max={24} orientation="vertical" className="h-32" data-testid={`slider-eq-band-${i}`} />
                            <span className="text-xs text-muted-foreground">{band.frequency >= 1000 ? `${band.frequency/1000}k` : band.frequency}</span>
                            <span className="text-xs font-mono">{band.gain > 0 ? '+' : ''}{band.gain}dB</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Compressor */}
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Compressor</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Threshold: {compThreshold}dB</Label>
                          <Slider value={[compThreshold + 60]} onValueChange={([v]) => setCompThreshold(v - 60)}
                            max={60} data-testid="slider-comp-threshold" />
                        </div>
                        <div>
                          <Label className="text-xs">Ratio: {compRatio}:1</Label>
                          <Slider value={[compRatio]} onValueChange={([v]) => setCompRatio(v)}
                            min={1} max={20} data-testid="slider-comp-ratio" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Reverb */}
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Reverb</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Mix: {reverbMix}%</Label>
                          <Slider value={[reverbMix]} onValueChange={([v]) => setReverbMix(v)}
                            max={100} data-testid="slider-reverb-mix" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Delay */}
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Delay</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Time: {delayTime}ms</Label>
                          <Slider value={[delayTime]} onValueChange={([v]) => setDelayTime(v)}
                            max={1000} data-testid="slider-delay-time" />
                        </div>
                        <div>
                          <Label className="text-xs">Feedback: {delayFeedback}%</Label>
                          <Slider value={[delayFeedback]} onValueChange={([v]) => setDelayFeedback(v)}
                            max={90} data-testid="slider-delay-feedback" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Auto-Tune */}
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Auto-Tune</CardTitle>
                          <Switch checked={autoTuneEnabled} onCheckedChange={setAutoTuneEnabled} data-testid="switch-autotune" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Speed: {autoTuneSpeed === 0 ? 'T-Pain' : autoTuneSpeed}</Label>
                          <Slider value={[autoTuneSpeed]} onValueChange={([v]) => setAutoTuneSpeed(v)}
                            max={100} disabled={!autoTuneEnabled} data-testid="slider-autotune-speed" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Voice Studio Tab */}
              <TabsContent value="voice" className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Voice Cloning */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-primary" /> Clone Your Voice
                      </CardTitle>
                      <CardDescription>Record 10+ seconds to clone your voice</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        <Button size="lg" variant={isRecordingVoice ? "destructive" : "default"}
                          onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                          data-testid="button-record-voice">
                          {isRecordingVoice ? (
                            <><StopIcon className="w-6 h-6 mr-2" /> Stop Recording</>
                          ) : (
                            <><CircleDot className="w-6 h-6 mr-2" /> Start Recording</>
                          )}
                        </Button>
                      </div>
                      {isRecordingVoice && (
                        <div className="flex items-center justify-center gap-2 text-destructive">
                          <Activity className="w-4 h-4 animate-pulse" />
                          <span>Recording... speak clearly for at least 10 seconds</span>
                        </div>
                      )}
                      {clonedVoiceKey && (
                        <Badge variant="outline" className="w-full justify-center py-2 text-green-500">
                          Voice Cloned Successfully!
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Voice Synthesis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" /> Voice Synthesis
                      </CardTitle>
                      <CardDescription>Generate speech in any style</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Voice Style</Label>
                        <Select value={selectedVoiceStyle} onValueChange={setSelectedVoiceStyle}>
                          <SelectTrigger data-testid="select-voice-style"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {voiceStyles?.styles?.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>{s.name} - {s.description}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Text to Speak</Label>
                        <Textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)}
                          placeholder="Enter text to synthesize... Try: 'REBUILD. REWIRE. RISE. I am unstoppable!'"
                          className="min-h-[100px]" data-testid="textarea-voice-text" />
                      </div>
                      <Button className="w-full" onClick={synthesizeVoice} disabled={isGeneratingVoice}
                        data-testid="button-synthesize-voice">
                        {isGeneratingVoice ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Volume2 className="w-4 h-4 mr-2" />}
                        Generate Voice
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Lyrics Tab */}
              <TabsContent value="lyrics" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Song Lyrics</h3>
                      <Button size="sm" onClick={generateLyrics} disabled={isGeneratingLyrics} data-testid="button-generate-lyrics-tab">
                        {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        AI Generate
                      </Button>
                    </div>
                    <Textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
                      placeholder="Write your lyrics here or use AI to generate them..."
                      className="flex-1 resize-none font-mono" data-testid="textarea-lyrics" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Movie Studio Tab */}
              <TabsContent value="movie" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Film className="w-5 h-5 text-primary" /> AI Movie Generator
                      </CardTitle>
                      <CardDescription>Create movie scripts and storyboards with AI</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Movie Premise</Label>
                          <Textarea value={moviePremise} onChange={(e) => setMoviePremise(e.target.value)}
                            placeholder="A stroke survivor discovers they can clone themselves and must face their villain self to achieve full recovery..."
                            className="min-h-[120px]" data-testid="textarea-movie-premise" />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Genre</Label>
                            <Select value={movieGenre} onValueChange={setMovieGenre}>
                              <SelectTrigger data-testid="select-movie-genre"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {videoStyles?.styles?.map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={generateScript} disabled={isGeneratingScript}
                            data-testid="button-generate-script">
                            {isGeneratingScript ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Clapperboard className="w-4 h-4 mr-2" />}
                            Generate Script
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {generatedScript && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{generatedScript.title}</CardTitle>
                        <CardDescription>{generatedScript.synopsis}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {generatedScript.scenes?.map((scene: any, i: number) => (
                              <Card key={i} className="bg-muted/50">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Scene {i + 1}: {scene.setting}</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => generateStoryboard(i)}
                                      data-testid={`button-storyboard-${i}`}>
                                      <Film className="w-4 h-4 mr-1" /> Generate Storyboard
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <p className="text-sm text-muted-foreground">{scene.description}</p>
                                  <div className="space-y-1">
                                    {scene.dialogue?.map((line: string, j: number) => (
                                      <p key={j} className="text-sm font-mono">{line}</p>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{scene.mood}</Badge>
                                    {scene.characters?.map((c: string) => (
                                      <Badge key={c} variant="secondary">{c}</Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {storyboardFrames.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Storyboard</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {storyboardFrames.map((frame, i) => (
                            <img key={i} src={frame} alt={`Frame ${i + 1}`} className="rounded-lg border" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Transport Controls */}
          <div className="border-t border-border bg-card/50 p-4">
            <div className="max-w-[1800px] mx-auto flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)} data-testid="button-skip-back">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="icon" onClick={handlePlay} className={isPlaying ? "bg-green-600 hover:bg-green-700" : ""}
                  data-testid="button-play">
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
                <Slider value={[currentTime]} onValueChange={([v]) => setCurrentTime(v)}
                  max={duration} className="cursor-pointer" data-testid="slider-timeline" />
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider value={[masterVolume]} onValueChange={([v]) => setMasterVolume(v)}
                  max={100} className="w-24" data-testid="slider-master-volume-transport" />
              </div>

              <Badge variant="outline" data-testid="badge-bpm">{bpm} BPM</Badge>
              <Badge variant="outline" data-testid="badge-key">{selectedKey} {selectedScale}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
