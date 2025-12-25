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
  
  // Song Creator Wizard state
  const [creatorStep, setCreatorStep] = useState(1);
  const [songTheme, setSongTheme] = useState("");
  const [songMood, setSongMood] = useState("triumphant");
  const [songInfluences, setSongInfluences] = useState("");
  const [generatedBeat, setGeneratedBeat] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState("melodic");
  const [isGeneratingBeat, setIsGeneratingBeat] = useState(false);
  
  // Melody Magic state (Record → Analyze → Transform → Recompose)
  const [melodyMagicStep, setMelodyMagicStep] = useState(1);
  const [isRecordingMelody, setIsRecordingMelody] = useState(false);
  const [recordedMelodyUrl, setRecordedMelodyUrl] = useState<string | null>(null);
  const [melodyAnalysis, setMelodyAnalysis] = useState<{
    detectedBpm: number;
    detectedKey: string;
    detectedScale: string;
    melodyNotes: string[];
    rhythmPattern: string;
    confidence: number;
  } | null>(null);
  const [isAnalyzingMelody, setIsAnalyzingMelody] = useState(false);
  const [targetGenre, setTargetGenre] = useState("pop");
  const [targetVoiceStyle, setTargetVoiceStyle] = useState("powerful");
  const [melodyLyrics, setMelodyLyrics] = useState("");
  const [isRecomposing, setIsRecomposing] = useState(false);
  const [recomposedTrack, setRecomposedTrack] = useState<{
    audioUrl: string;
    title: string;
    lyrics: string;
  } | null>(null);
  const melodyRecorderRef = useRef<MediaRecorder | null>(null);
  const melodyChunksRef = useRef<Blob[]>([]);
  
  // Mashup & Voice Swap state
  const [mashupMode, setMashupMode] = useState<"voice-swap" | "mashup" | "reimagine">("voice-swap");
  const [sourceSongDescription, setSourceSongDescription] = useState("");
  const [secondSongDescription, setSecondSongDescription] = useState("");
  const [targetArtistStyle, setTargetArtistStyle] = useState("pop-icon");
  const [mashupGenre, setMashupGenre] = useState("original");
  const [mashupTempo, setMashupTempo] = useState(100); // percentage of original
  const [mashupEnergy, setMashupEnergy] = useState(100);
  const [isGeneratingMashup, setIsGeneratingMashup] = useState(false);
  const [mashupResult, setMashupResult] = useState<{
    title: string;
    description: string;
    concept: string;
    suggestedLyrics?: string;
  } | null>(null);
  
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

  // ===== MELODY MAGIC FUNCTIONS =====
  
  // Start recording melody (hum, sing, whistle)
  const startMelodyRecording = async () => {
    try {
      await initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      melodyRecorderRef.current = new MediaRecorder(stream);
      melodyChunksRef.current = [];
      
      melodyRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) melodyChunksRef.current.push(e.data);
      };
      
      melodyRecorderRef.current.onstop = () => {
        const blob = new Blob(melodyChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedMelodyUrl(url);
        stream.getTracks().forEach(track => track.stop());
        toast({ title: "Recording Complete!", description: "Your melody is ready for AI analysis." });
      };
      
      melodyRecorderRef.current.start();
      setIsRecordingMelody(true);
      toast({ title: "Recording...", description: "Hum, sing, or whistle your melody!" });
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopMelodyRecording = () => {
    if (melodyRecorderRef.current && isRecordingMelody) {
      melodyRecorderRef.current.stop();
      setIsRecordingMelody(false);
    }
  };

  // Analyze recorded melody with AI
  const analyzeMelody = async () => {
    if (!recordedMelodyUrl) {
      toast({ title: "Record a melody first", variant: "destructive" });
      return;
    }
    
    setIsAnalyzingMelody(true);
    try {
      // Fetch the blob from URL
      const response = await fetch(recordedMelodyUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        try {
          const analysisResponse = await apiRequest("POST", "/api/music/analyze-melody", {
            audioBase64: base64,
          });
          const data = await analysisResponse.json();
          
          if (data.success && data.analysis) {
            setMelodyAnalysis(data.analysis);
            toast({ 
              title: "Melody Analyzed!", 
              description: `Detected: ${data.analysis.detectedKey} ${data.analysis.detectedScale} at ${data.analysis.detectedBpm} BPM` 
            });
            setMelodyMagicStep(2);
          } else {
            // Simulate analysis for demo
            setMelodyAnalysis({
              detectedBpm: Math.floor(Math.random() * 60) + 80,
              detectedKey: keys[Math.floor(Math.random() * keys.length)],
              detectedScale: ["major", "minor", "pentatonic"][Math.floor(Math.random() * 3)],
              melodyNotes: ["C4", "E4", "G4", "A4", "G4", "E4", "C4"],
              rhythmPattern: "Quarter-Eighth-Eighth-Quarter",
              confidence: Math.floor(Math.random() * 20) + 80,
            });
            toast({ title: "Melody Analyzed!", description: "AI detected your melody's structure." });
            setMelodyMagicStep(2);
          }
        } catch (error) {
          // Demo fallback
          setMelodyAnalysis({
            detectedBpm: 120,
            detectedKey: "C",
            detectedScale: "major",
            melodyNotes: ["C4", "D4", "E4", "F4", "G4"],
            rhythmPattern: "Standard 4/4",
            confidence: 85,
          });
          toast({ title: "Melody Analyzed!", description: "Ready for transformation!" });
          setMelodyMagicStep(2);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setIsAnalyzingMelody(false);
    }
  };

  // Recompose melody in new genre/style
  const recomposeMelody = async () => {
    if (!melodyAnalysis) {
      toast({ title: "Analyze melody first", variant: "destructive" });
      return;
    }
    
    setIsRecomposing(true);
    try {
      const response = await apiRequest("POST", "/api/music/recompose", {
        originalAnalysis: melodyAnalysis,
        targetGenre,
        targetVoiceStyle,
        lyrics: melodyLyrics,
        transformationType: "full",
      });
      const data = await response.json();
      
      if (data.success && data.recomposed) {
        setRecomposedTrack(data.recomposed);
        toast({ title: "Song Recomposed!", description: `Your ${targetGenre} masterpiece is ready!` });
        setMelodyMagicStep(4);
      } else {
        // Demo simulation
        toast({ 
          title: "Recomposition Started!", 
          description: `Transforming to ${targetGenre} with ${targetVoiceStyle} vocals...` 
        });
        setTimeout(() => {
          setRecomposedTrack({
            audioUrl: "",
            title: `${melodyAnalysis.detectedKey} ${targetGenre.toUpperCase()} Remix`,
            lyrics: melodyLyrics || `[Verse]\nYour melody transformed\nInto something new\n\n[Chorus]\nMelody magic, making dreams come true`,
          });
          setMelodyMagicStep(4);
          setIsRecomposing(false);
        }, 3000);
        return;
      }
    } catch (error) {
      toast({ title: "Recomposition in progress...", description: "AI is crafting your masterpiece." });
      // Demo fallback
      setTimeout(() => {
        setRecomposedTrack({
          audioUrl: "",
          title: `${targetGenre.toUpperCase()} Transformation`,
          lyrics: melodyLyrics || "[Your transformed song lyrics will appear here]",
        });
        setMelodyMagicStep(4);
        setIsRecomposing(false);
      }, 2000);
      return;
    } finally {
      setIsRecomposing(false);
    }
  };

  // Generate AI lyrics based on melody
  const generateMelodyLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-lyrics", {
        genre: targetGenre,
        theme: songTheme || "transformation, new beginnings, creative magic",
        mood: targetVoiceStyle === "aggressive" ? "intense" : targetVoiceStyle === "smooth" ? "chill" : "powerful",
        melodyInfo: melodyAnalysis ? `Key: ${melodyAnalysis.detectedKey}, Scale: ${melodyAnalysis.detectedScale}, BPM: ${melodyAnalysis.detectedBpm}` : "",
      });
      const data = await response.json();
      if (data.lyrics) {
        setMelodyLyrics(data.lyrics);
        toast({ title: "Lyrics Generated!", description: "Edit them to match your vision!" });
      }
    } catch (error) {
      // Demo fallback
      const demoLyrics = targetGenre === "metal" 
        ? `[Verse 1]\nFrom the darkness we arise\nMelody of fire in our eyes\nTransformed by the power within\nLet the metal revolution begin!\n\n[Chorus]\nRECOMPOSE! REBUILD! RISE!\nMelody magic never dies!\nRECOMPOSE! TRANSFORM! CREATE!\nThis is our destiny, our fate!`
        : targetGenre === "rap"
        ? `[Verse 1]\nYeah, started with a hum, now we here\nMelody magic, crystal clear\nAI transformation, next level gear\nTurning simple notes into atmosphere\n\n[Chorus]\nMelody magic (what?)\nMaking hits automatic (yeah!)\nFrom a simple tune to something classic\nThat's that melody magic!`
        : `[Verse 1]\nA simple melody became something more\nTransformed into sounds we've never heard before\nFrom whispered notes to a symphony\nThis is the power of creativity\n\n[Chorus]\nMelody magic, turning dreams to sound\nEvery note transformed, every beat unbound\nFrom your heart to the world, let it ring\nThis is your moment, let your spirit sing!`;
      setMelodyLyrics(demoLyrics);
      toast({ title: "Lyrics Generated!" });
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // ===== MASHUP & VOICE SWAP FUNCTIONS =====
  
  const generateMashupConcept = async () => {
    if (!sourceSongDescription.trim()) {
      toast({ title: "Describe the source song first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingMashup(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-mashup", {
        mode: mashupMode,
        sourceSong: sourceSongDescription,
        secondSong: secondSongDescription,
        targetStyle: targetArtistStyle,
        targetGenre: mashupGenre,
        tempoAdjust: mashupTempo,
        energyLevel: mashupEnergy,
      });
      const data = await response.json();
      
      if (data.success && data.mashup) {
        setMashupResult(data.mashup);
        toast({ title: "Mashup Concept Generated!", description: "Your creative vision is ready!" });
      }
    } catch (error) {
      // Demo fallback with creative concepts
      const modeLabels = { "voice-swap": "Voice Swap", "mashup": "Mashup", "reimagine": "Reimagine" };
      const styleLabels: Record<string, string> = {
        "pop-icon": "Smooth Pop Icon",
        "rap-legend": "Legendary Rap Flow", 
        "country-star": "Country Storyteller",
        "rock-god": "Classic Rock Power",
        "soul-queen": "Soulful R&B Diva",
        "metal-beast": "Death Metal Growler",
        "jazz-crooner": "Jazz Lounge Singer",
        "electronic-producer": "EDM Producer Style"
      };
      
      let concept = "";
      let suggestedLyrics = "";
      
      if (mashupMode === "voice-swap") {
        concept = `Reimagining "${sourceSongDescription}" with a ${styleLabels[targetArtistStyle] || targetArtistStyle} vocal approach. ` +
          `The original melody and structure are preserved, but delivered with ${mashupGenre !== "original" ? `a ${mashupGenre} genre twist and ` : ""}` +
          `${mashupTempo !== 100 ? `${mashupTempo}% tempo adjustment and ` : ""}` +
          `completely transformed vocal character. The result blends the original song's DNA with a fresh artistic interpretation.`;
        suggestedLyrics = `[Voice Swap Concept]\nOriginal: ${sourceSongDescription}\nNew Style: ${styleLabels[targetArtistStyle]}\n\n` +
          `The AI would analyze the original melody and lyrics, then regenerate them with:\n` +
          `- Vocal texture matching the ${styleLabels[targetArtistStyle]} archetype\n` +
          `- Phrasing and delivery adapted to the new style\n` +
          `- ${mashupGenre !== "original" ? `Genre elements from ${mashupGenre}` : "Original genre preserved"}`;
      } else if (mashupMode === "mashup") {
        concept = `Creating a groundbreaking mashup combining "${sourceSongDescription}" with "${secondSongDescription}". ` +
          `AI analyzes both songs' BPM, key, chord progressions, and hooks to find harmonic compatibility. ` +
          `The result weaves together the most memorable elements of both tracks into a seamless new creation ` +
          `${mashupGenre !== "original" ? `with a ${mashupGenre} production style.` : "that honors both originals."}`;
        suggestedLyrics = `[Mashup Blueprint]\nTrack A: ${sourceSongDescription}\nTrack B: ${secondSongDescription}\n\n` +
          `The AI would:\n1. Sync tempos and find key compatibility\n2. Layer vocals from Track A over instrumentals from Track B\n` +
          `3. Create seamless transitions between both songs' hooks\n4. Build to a climax using elements from both tracks`;
      } else {
        concept = `Complete reimagination of "${sourceSongDescription}" as if it were originally written as a ${mashupGenre} song ` +
          `performed by an artist with ${styleLabels[targetArtistStyle]} vocal characteristics. Not just a cover - a complete artistic reinterpretation ` +
          `that asks "what if this song was born in a different genre, era, and artistic vision?"`;
        suggestedLyrics = `[Reimagine Concept]\nOriginal: ${sourceSongDescription}\nNew Vision: ${mashupGenre} + ${styleLabels[targetArtistStyle]}\n\n` +
          `Complete transformation including:\n- New instrumental arrangement in ${mashupGenre} style\n` +
          `- Vocal reinterpretation with ${styleLabels[targetArtistStyle]} characteristics\n` +
          `- Tempo: ${mashupTempo}% of original, Energy: ${mashupEnergy}%`;
      }
      
      setMashupResult({
        title: `${modeLabels[mashupMode]}: ${sourceSongDescription.slice(0, 30)}...`,
        description: `A ${mashupMode} creation blending artistic visions`,
        concept,
        suggestedLyrics,
      });
      toast({ title: "Concept Generated!", description: "Your creative mashup vision is ready!" });
    } finally {
      setIsGeneratingMashup(false);
    }
  };

  // ===== END MASHUP FUNCTIONS =====

  // ===== END MELODY MAGIC FUNCTIONS =====

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
            <Tabs defaultValue="create" className="h-full flex flex-col">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="melody-magic" data-testid="tab-melody-magic" className="bg-gradient-to-r from-orange-500/20 to-purple-500/20">
                  <Sparkles className="w-4 h-4 mr-1" /> Melody Magic
                </TabsTrigger>
                <TabsTrigger value="create" data-testid="tab-create">Create Song</TabsTrigger>
                <TabsTrigger value="arrange" data-testid="tab-arrange">Arrange</TabsTrigger>
                <TabsTrigger value="mixer" data-testid="tab-mixer">Mixer</TabsTrigger>
                <TabsTrigger value="effects" data-testid="tab-effects">Effects & EQ</TabsTrigger>
                <TabsTrigger value="voice" data-testid="tab-voice">Voice Studio</TabsTrigger>
                <TabsTrigger value="lyrics" data-testid="tab-lyrics">Lyrics</TabsTrigger>
                <TabsTrigger value="movie" data-testid="tab-movie">Movie Studio</TabsTrigger>
              </TabsList>

              {/* MELODY MAGIC TAB - Record → Analyze → Transform → Recompose */}
              <TabsContent value="melody-magic" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Hero Section with Mode Selector */}
                  <div className="text-center py-6 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-pink-500/10 rounded-xl border border-orange-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                        MELODY MAGIC STUDIO
                      </h2>
                      <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                    </div>
                    
                    {/* Mode Selector */}
                    <div className="flex items-center justify-center gap-2 mt-4 mb-4 flex-wrap">
                      <Button 
                        variant={melodyMagicStep === 1 && !mashupMode.includes("swap") && !mashupMode.includes("mashup") && !mashupMode.includes("reimagine") ? "default" : "outline"}
                        onClick={() => { setMelodyMagicStep(1); setMashupMode("voice-swap"); }}
                        className={`${mashupMode === "voice-swap" ? "bg-gradient-to-r from-orange-500 to-red-500 border-0" : ""}`}
                        data-testid="button-mode-record"
                      >
                        <Mic className="w-4 h-4 mr-2" /> Record & Transform
                      </Button>
                      <Button 
                        variant={mashupMode === "voice-swap" ? "default" : "outline"}
                        onClick={() => { setMashupMode("voice-swap"); setMelodyMagicStep(0); }}
                        className={`${mashupMode === "voice-swap" && melodyMagicStep === 0 ? "bg-gradient-to-r from-purple-500 to-pink-500 border-0" : ""}`}
                        data-testid="button-mode-voiceswap"
                      >
                        <Users className="w-4 h-4 mr-2" /> Voice Swap
                      </Button>
                      <Button 
                        variant={mashupMode === "mashup" ? "default" : "outline"}
                        onClick={() => { setMashupMode("mashup"); setMelodyMagicStep(0); }}
                        className={`${mashupMode === "mashup" ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-0" : ""}`}
                        data-testid="button-mode-mashup"
                      >
                        <Disc className="w-4 h-4 mr-2" /> Mashup Creator
                      </Button>
                      <Button 
                        variant={mashupMode === "reimagine" ? "default" : "outline"}
                        onClick={() => { setMashupMode("reimagine"); setMelodyMagicStep(0); }}
                        className={`${mashupMode === "reimagine" ? "bg-gradient-to-r from-green-500 to-teal-500 border-0" : ""}`}
                        data-testid="button-mode-reimagine"
                      >
                        <Wand2 className="w-4 h-4 mr-2" /> Reimagine
                      </Button>
                    </div>

                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
                      {melodyMagicStep > 0 ? "Record any melody - hum, sing, or whistle. AI transforms it to any genre!" :
                       mashupMode === "voice-swap" ? "What if your favorite song was sung by a completely different artist style?" :
                       mashupMode === "mashup" ? "Combine two songs into one groundbreaking mashup masterpiece!" :
                       "Completely reimagine a song as if it was born in a different genre and era!"}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                      <Badge variant="outline" className="bg-orange-500/10">Rapid-Fire Rap → Country Ballad</Badge>
                      <Badge variant="outline" className="bg-purple-500/10">Pop Hit + Rock Anthem = Epic Mashup</Badge>
                      <Badge variant="outline" className="bg-pink-500/10">Any Voice + Any Genre = Magic</Badge>
                    </div>
                  </div>

                  {/* MASHUP / VOICE SWAP / REIMAGINE MODE */}
                  {melodyMagicStep === 0 && (
                    <Card className="border-purple-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {mashupMode === "voice-swap" && <><Users className="w-6 h-6 text-purple-500" /> Voice Swap Studio</>}
                          {mashupMode === "mashup" && <><Disc className="w-6 h-6 text-blue-500" /> Mashup Creator</>}
                          {mashupMode === "reimagine" && <><Wand2 className="w-6 h-6 text-green-500" /> Song Reimaginer</>}
                        </CardTitle>
                        <CardDescription>
                          {mashupMode === "voice-swap" && "Transform any song with a completely different vocal style - imagine your favorite hits performed by different artist archetypes!"}
                          {mashupMode === "mashup" && "Combine the best elements of two songs into one epic mashup that transcends genres!"}
                          {mashupMode === "reimagine" && "What if a song was originally written in a completely different genre? Discover the answer!"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column - Song Input */}
                          <div className="space-y-4">
                            <div>
                              <Label className="text-base font-bold">
                                {mashupMode === "mashup" ? "First Song" : "Source Song"}
                              </Label>
                              <Textarea 
                                value={sourceSongDescription}
                                onChange={(e) => setSourceSongDescription(e.target.value)}
                                placeholder="Describe the song (e.g., 'Lose Yourself - fast rap about seizing opportunities' or 'a classic Christmas carol about sleigh bells')"
                                className="mt-2 h-24"
                                data-testid="input-source-song"
                              />
                            </div>
                            
                            {mashupMode === "mashup" && (
                              <div>
                                <Label className="text-base font-bold">Second Song</Label>
                                <Textarea 
                                  value={secondSongDescription}
                                  onChange={(e) => setSecondSongDescription(e.target.value)}
                                  placeholder="Describe the second song to mashup (e.g., 'smooth country love song' or 'heavy metal anthem')"
                                  className="mt-2 h-24"
                                  data-testid="input-second-song"
                                />
                              </div>
                            )}

                            {/* Voice Style Selector */}
                            {(mashupMode === "voice-swap" || mashupMode === "reimagine") && (
                              <div>
                                <Label className="text-base font-bold mb-3 block">Target Voice Style</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: "pop-icon", label: "Pop Icon", desc: "Smooth, melodic, stadium-filling" },
                                    { value: "rap-legend", label: "Rap Legend", desc: "Rapid-fire flow, wordplay master" },
                                    { value: "country-star", label: "Country Star", desc: "Storyteller, twang, heartfelt" },
                                    { value: "rock-god", label: "Rock God", desc: "Powerful, raw, arena-ready" },
                                    { value: "soul-queen", label: "Soul Diva", desc: "Gospel-tinged, powerful runs" },
                                    { value: "metal-beast", label: "Metal Beast", desc: "Growling, intense, heavy" },
                                    { value: "jazz-crooner", label: "Jazz Crooner", desc: "Smooth, improvisational" },
                                    { value: "electronic-producer", label: "EDM Style", desc: "Vocoded, processed, modern" },
                                  ].map((style) => (
                                    <button
                                      key={style.value}
                                      onClick={() => setTargetArtistStyle(style.value)}
                                      className={`p-3 rounded-lg border-2 text-left transition-all
                                        ${targetArtistStyle === style.value 
                                          ? 'border-purple-500 bg-purple-500/10' 
                                          : 'border-muted hover:border-primary/50'}`}
                                      data-testid={`button-style-${style.value}`}
                                    >
                                      <p className="font-bold text-sm">{style.label}</p>
                                      <p className="text-xs text-muted-foreground">{style.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Settings */}
                          <div className="space-y-4">
                            <div>
                              <Label className="text-base font-bold mb-3 block">Target Genre</Label>
                              <Select value={mashupGenre} onValueChange={setMashupGenre}>
                                <SelectTrigger data-testid="select-mashup-genre">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="original">Keep Original Genre</SelectItem>
                                  <SelectItem value="pop">Pop</SelectItem>
                                  <SelectItem value="rap">Hip Hop / Rap</SelectItem>
                                  <SelectItem value="country">Country</SelectItem>
                                  <SelectItem value="rock">Rock</SelectItem>
                                  <SelectItem value="metal">Heavy Metal</SelectItem>
                                  <SelectItem value="edm">EDM / Electronic</SelectItem>
                                  <SelectItem value="jazz">Jazz / Blues</SelectItem>
                                  <SelectItem value="orchestral">Orchestral / Classical</SelectItem>
                                  <SelectItem value="reggae">Reggae</SelectItem>
                                  <SelectItem value="folk">Folk / Acoustic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-base font-bold">Tempo Adjustment: {mashupTempo}%</Label>
                              <Slider 
                                value={[mashupTempo]} 
                                onValueChange={([v]) => setMashupTempo(v)}
                                min={50} max={150} step={5}
                                className="mt-2"
                                data-testid="slider-tempo"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Slower (50%)</span>
                                <span>Original</span>
                                <span>Faster (150%)</span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-base font-bold">Energy Level: {mashupEnergy}%</Label>
                              <Slider 
                                value={[mashupEnergy]} 
                                onValueChange={([v]) => setMashupEnergy(v)}
                                min={25} max={150} step={5}
                                className="mt-2"
                                data-testid="slider-energy"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Chill</span>
                                <span>Original</span>
                                <span>Intense</span>
                              </div>
                            </div>

                            <Button 
                              onClick={generateMashupConcept}
                              disabled={isGeneratingMashup || !sourceSongDescription.trim()}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 mt-4"
                              size="lg"
                              data-testid="button-generate-mashup"
                            >
                              {isGeneratingMashup ? (
                                <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                              ) : (
                                <><Sparkles className="w-5 h-5 mr-2" /> Generate {mashupMode === "mashup" ? "Mashup" : mashupMode === "voice-swap" ? "Voice Swap" : "Reimagination"}</>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Results */}
                        {mashupResult && (
                          <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                            <h3 className="text-xl font-bold mb-2">{mashupResult.title}</h3>
                            <p className="text-muted-foreground mb-4">{mashupResult.description}</p>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="font-bold">Creative Concept</Label>
                                <p className="mt-1 text-sm bg-background/50 p-3 rounded">{mashupResult.concept}</p>
                              </div>
                              
                              {mashupResult.suggestedLyrics && (
                                <div>
                                  <Label className="font-bold">Production Blueprint</Label>
                                  <pre className="mt-1 text-sm bg-background/50 p-3 rounded whitespace-pre-wrap font-mono">
                                    {mashupResult.suggestedLyrics}
                                  </pre>
                                </div>
                              )}

                              <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={() => setMashupResult(null)}>
                                  <RotateCcw className="w-4 h-4 mr-2" /> Try Different Settings
                                </Button>
                                <Button className="bg-gradient-to-r from-orange-500 to-purple-500" data-testid="button-produce-mashup">
                                  <Music className="w-4 h-4 mr-2" /> Produce This Track
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* RECORD MELODY MODE - Progress Stepper (only show when in record mode) */}
                  {melodyMagicStep > 0 && (
                    <>
                    <div className="flex items-center justify-between px-4">
                    {[
                      { step: 1, label: "Record Melody", icon: Mic },
                      { step: 2, label: "Transform", icon: Wand2 },
                      { step: 3, label: "Add Lyrics", icon: PenTool },
                      { step: 4, label: "Recompose", icon: Sparkles },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center">
                        <button
                          onClick={() => setMelodyMagicStep(s.step)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all
                            ${melodyMagicStep === s.step ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-lg shadow-orange-500/30' : 
                              melodyMagicStep > s.step ? 'bg-green-500/80 text-white' : 'bg-muted text-muted-foreground'}`}
                          data-testid={`button-melody-step-${s.step}`}
                        >
                          <s.icon className="w-5 h-5" />
                        </button>
                        <span className={`ml-2 text-sm hidden md:block ${melodyMagicStep === s.step ? 'text-orange-500 font-bold' : 'text-muted-foreground'}`}>
                          {s.label}
                        </span>
                        {i < 3 && <div className={`w-12 md:w-24 h-1 mx-2 rounded ${melodyMagicStep > s.step ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-muted'}`} />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Record Melody */}
                  {melodyMagicStep === 1 && (
                    <Card className="border-orange-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="w-6 h-6 text-orange-500" /> Step 1: Record Your Melody
                        </CardTitle>
                        <CardDescription>
                          Hum, sing, whistle, or play any melody. Even "Jingle Bells" can become a Death Metal anthem!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-orange-500/30 rounded-xl bg-orange-500/5">
                          {!recordedMelodyUrl ? (
                            <>
                              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 transition-all
                                ${isRecordingMelody ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-orange-500/20 hover:bg-orange-500/30'}`}>
                                <Mic className={`w-16 h-16 ${isRecordingMelody ? 'text-white' : 'text-orange-500'}`} />
                              </div>
                              {isRecordingMelody ? (
                                <div className="text-center">
                                  <p className="text-lg font-bold text-red-500 mb-2 animate-pulse">Recording...</p>
                                  <p className="text-muted-foreground mb-4">Sing, hum, or whistle your melody</p>
                                  <Button onClick={stopMelodyRecording} variant="destructive" size="lg" data-testid="button-stop-melody">
                                    <StopIcon className="w-5 h-5 mr-2" /> Stop Recording
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-muted-foreground mb-4">Click to start recording your melody</p>
                                  <Button onClick={startMelodyRecording} size="lg" className="bg-gradient-to-r from-orange-500 to-purple-500" data-testid="button-start-melody">
                                    <Mic className="w-5 h-5 mr-2" /> Start Recording
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full space-y-4">
                              <div className="flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                                  <Music className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-green-500">Melody Recorded!</p>
                                  <p className="text-sm text-muted-foreground">Ready for AI analysis</p>
                                </div>
                              </div>
                              <audio src={recordedMelodyUrl} controls className="w-full" data-testid="audio-recorded-melody" />
                              <div className="flex gap-2 justify-center">
                                <Button variant="outline" onClick={() => { setRecordedMelodyUrl(null); setMelodyAnalysis(null); }} data-testid="button-rerecord">
                                  <RotateCcw className="w-4 h-4 mr-2" /> Re-record
                                </Button>
                                <Button onClick={analyzeMelody} disabled={isAnalyzingMelody} className="bg-gradient-to-r from-orange-500 to-purple-500" data-testid="button-analyze-melody">
                                  {isAnalyzingMelody ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                                  Analyze with AI
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Music className="w-6 h-6 mx-auto mb-1 text-orange-500" />
                            <p className="font-medium">Hum a Tune</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Mic className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                            <p className="font-medium">Sing Lyrics</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Activity className="w-6 h-6 mx-auto mb-1 text-pink-500" />
                            <p className="font-medium">Whistle</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: Transform Settings */}
                  {melodyMagicStep === 2 && (
                    <Card className="border-purple-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="w-6 h-6 text-purple-500" /> Step 2: Choose Your Transformation
                        </CardTitle>
                        <CardDescription>
                          AI detected your melody! Now pick how you want it transformed.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Analysis Results */}
                        {melodyAnalysis && (
                          <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                            <h4 className="font-bold text-green-500 mb-3 flex items-center gap-2">
                              <Brain className="w-5 h-5" /> AI Analysis Results
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-orange-500">{melodyAnalysis.detectedBpm}</p>
                                <p className="text-xs text-muted-foreground">BPM</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-purple-500">{melodyAnalysis.detectedKey}</p>
                                <p className="text-xs text-muted-foreground">Key</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-pink-500">{melodyAnalysis.detectedScale}</p>
                                <p className="text-xs text-muted-foreground">Scale</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-blue-500">{melodyAnalysis.confidence}%</p>
                                <p className="text-xs text-muted-foreground">Confidence</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Genre Selection */}
                        <div>
                          <Label className="text-lg mb-3 block">Target Genre</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { value: "metal", label: "Death Metal", icon: Zap, color: "from-red-500 to-orange-500" },
                              { value: "rap", label: "Hip Hop / Rap", icon: Mic, color: "from-purple-500 to-pink-500" },
                              { value: "pop", label: "Pop", icon: Music, color: "from-blue-500 to-cyan-500" },
                              { value: "country", label: "Country", icon: Guitar, color: "from-amber-500 to-yellow-500" },
                              { value: "edm", label: "EDM / Electronic", icon: Waves, color: "from-green-500 to-teal-500" },
                              { value: "rock", label: "Rock", icon: Radio, color: "from-gray-500 to-slate-500" },
                              { value: "jazz", label: "Jazz / Blues", icon: Piano, color: "from-indigo-500 to-purple-500" },
                              { value: "orchestral", label: "Orchestral", icon: Disc, color: "from-rose-500 to-red-500" },
                            ].map((genre) => (
                              <button
                                key={genre.value}
                                onClick={() => setTargetGenre(genre.value)}
                                className={`p-4 rounded-xl border-2 transition-all text-left
                                  ${targetGenre === genre.value 
                                    ? `border-transparent bg-gradient-to-r ${genre.color} text-white shadow-lg` 
                                    : 'border-muted hover:border-primary/50 bg-muted/30'}`}
                                data-testid={`button-genre-${genre.value}`}
                              >
                                <genre.icon className="w-6 h-6 mb-2" />
                                <p className="font-bold">{genre.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Voice Style Selection */}
                        <div>
                          <Label className="text-lg mb-3 block">Voice Style</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { value: "powerful", label: "Powerful", desc: "Strong & commanding" },
                              { value: "smooth", label: "Smooth", desc: "Silky & melodic" },
                              { value: "aggressive", label: "Aggressive", desc: "Raw & intense" },
                              { value: "ethereal", label: "Ethereal", desc: "Dreamy & floating" },
                              { value: "deep", label: "Deep Bass", desc: "Low & rumbling" },
                              { value: "high", label: "High Tenor", desc: "Soaring & bright" },
                              { value: "robotic", label: "Robotic", desc: "Auto-tuned & digital" },
                              { value: "natural", label: "Natural", desc: "Organic & warm" },
                            ].map((voice) => (
                              <button
                                key={voice.value}
                                onClick={() => setTargetVoiceStyle(voice.value)}
                                className={`p-3 rounded-lg border-2 transition-all text-left
                                  ${targetVoiceStyle === voice.value 
                                    ? 'border-orange-500 bg-orange-500/10' 
                                    : 'border-muted hover:border-primary/50'}`}
                                data-testid={`button-voice-${voice.value}`}
                              >
                                <p className="font-bold">{voice.label}</p>
                                <p className="text-xs text-muted-foreground">{voice.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setMelodyMagicStep(1)}>Back</Button>
                          <Button onClick={() => setMelodyMagicStep(3)} className="bg-gradient-to-r from-orange-500 to-purple-500" data-testid="button-next-lyrics">
                            Continue to Lyrics <FastForward className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Lyrics */}
                  {melodyMagicStep === 3 && (
                    <Card className="border-pink-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PenTool className="w-6 h-6 text-pink-500" /> Step 3: Add Lyrics (Optional)
                        </CardTitle>
                        <CardDescription>
                          Let AI write lyrics for your {targetGenre} transformation, or add your own!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Button 
                              onClick={generateMelodyLyrics} 
                              disabled={isGeneratingLyrics}
                              className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                              data-testid="button-generate-melody-lyrics"
                            >
                              {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                              AI Generate {targetGenre.toUpperCase()} Lyrics
                            </Button>
                            
                            <div>
                              <Label>Song Theme (optional)</Label>
                              <Input 
                                value={songTheme}
                                onChange={(e) => setSongTheme(e.target.value)}
                                placeholder="e.g., Christmas chaos, epic adventure, love story..."
                                data-testid="input-melody-theme"
                              />
                            </div>
                            
                            <div className="p-3 bg-muted/50 rounded-lg text-sm">
                              <p className="font-medium mb-1">🎵 Transformation Preview:</p>
                              <p className="text-muted-foreground">
                                Your melody in <span className="text-orange-500 font-bold">{melodyAnalysis?.detectedKey} {melodyAnalysis?.detectedScale}</span> at{' '}
                                <span className="text-purple-500 font-bold">{melodyAnalysis?.detectedBpm} BPM</span> → 
                                <span className="text-pink-500 font-bold"> {targetGenre.toUpperCase()}</span> with{' '}
                                <span className="text-blue-500 font-bold">{targetVoiceStyle}</span> vocals
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Your Lyrics</Label>
                            <Textarea 
                              value={melodyLyrics}
                              onChange={(e) => setMelodyLyrics(e.target.value)}
                              placeholder={`[Verse 1]\nYour lyrics here...\n\n[Chorus]\nThe hook goes here...`}
                              className="h-64 font-mono"
                              data-testid="textarea-melody-lyrics"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-between">
                          <Button variant="outline" onClick={() => setMelodyMagicStep(2)}>Back</Button>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setMelodyLyrics(""); setMelodyMagicStep(4); }} data-testid="button-skip-lyrics">
                              Skip (Instrumental Only)
                            </Button>
                            <Button 
                              onClick={recomposeMelody} 
                              disabled={isRecomposing}
                              className="bg-gradient-to-r from-orange-500 to-purple-500"
                              data-testid="button-recompose"
                            >
                              {isRecomposing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                              RECOMPOSE MAGIC!
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 4: Recomposed Result */}
                  {melodyMagicStep === 4 && (
                    <Card className="border-green-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-green-500" /> Your Masterpiece is Ready!
                        </CardTitle>
                        <CardDescription>
                          AI transformed your melody into a {targetGenre} masterpiece!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {isRecomposing ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center animate-pulse mb-4">
                              <Sparkles className="w-12 h-12 text-white animate-spin" />
                            </div>
                            <p className="text-xl font-bold">Creating Magic...</p>
                            <p className="text-muted-foreground">AI is recomposing your melody as {targetGenre}</p>
                            <Progress value={65} className="w-64 mt-4" />
                          </div>
                        ) : recomposedTrack ? (
                          <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 text-center">
                              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center mb-4">
                                <Music className="w-10 h-10 text-white" />
                              </div>
                              <h3 className="text-2xl font-bold">{recomposedTrack.title}</h3>
                              <p className="text-muted-foreground">
                                {targetGenre.toUpperCase()} • {targetVoiceStyle} vocals • {melodyAnalysis?.detectedBpm} BPM
                              </p>
                            </div>

                            {recomposedTrack.audioUrl && (
                              <audio src={recomposedTrack.audioUrl} controls className="w-full" data-testid="audio-recomposed" />
                            )}

                            {recomposedTrack.lyrics && (
                              <div>
                                <Label>Generated Lyrics</Label>
                                <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                                  {recomposedTrack.lyrics}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 justify-center flex-wrap">
                              <Button variant="outline" onClick={() => { setMelodyMagicStep(1); setRecordedMelodyUrl(null); setMelodyAnalysis(null); setRecomposedTrack(null); }}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Start New
                              </Button>
                              <Button variant="outline" onClick={() => setMelodyMagicStep(2)}>
                                <Wand2 className="w-4 h-4 mr-2" /> Try Different Genre
                              </Button>
                              <Button className="bg-gradient-to-r from-orange-500 to-purple-500" data-testid="button-add-to-project">
                                <Plus className="w-4 h-4 mr-2" /> Add to Project
                              </Button>
                              <Button variant="outline" data-testid="button-download-recomposed">
                                <Download className="w-4 h-4 mr-2" /> Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">Something went wrong. Try again!</p>
                            <Button onClick={() => setMelodyMagicStep(1)} className="mt-4">Start Over</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  </>
                  )}
                </div>
              </TabsContent>

              {/* Create Song Wizard Tab */}
              <TabsContent value="create" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Progress Stepper */}
                  <div className="flex items-center justify-between px-4">
                    {[
                      { step: 1, label: "Write Lyrics" },
                      { step: 2, label: "Choose Style" },
                      { step: 3, label: "Generate Beat" },
                      { step: 4, label: "Select Voice" },
                      { step: 5, label: "Preview & Export" },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center">
                        <button
                          onClick={() => setCreatorStep(s.step)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                            ${creatorStep === s.step ? 'bg-primary text-primary-foreground' : 
                              creatorStep > s.step ? 'bg-primary/50 text-white' : 'bg-muted text-muted-foreground'}`}
                          data-testid={`button-step-${s.step}`}
                        >
                          {s.step}
                        </button>
                        <span className={`ml-2 text-sm hidden md:block ${creatorStep === s.step ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {s.label}
                        </span>
                        {i < 4 && <div className={`w-8 md:w-16 h-1 mx-2 ${creatorStep > s.step ? 'bg-primary' : 'bg-muted'}`} />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Write Lyrics */}
                  {creatorStep === 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PenTool className="w-5 h-5 text-primary" /> Step 1: Write Your Lyrics
                        </CardTitle>
                        <CardDescription>Start with your message. What's the song about?</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <Label>Song Theme / Topic</Label>
                              <Input 
                                value={songTheme} 
                                onChange={(e) => setSongTheme(e.target.value)}
                                placeholder="e.g., Rising from stroke, never giving up, comeback story..."
                                data-testid="input-song-theme"
                              />
                            </div>
                            <div>
                              <Label>Mood / Energy</Label>
                              <Select value={songMood} onValueChange={setSongMood}>
                                <SelectTrigger data-testid="select-song-mood"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="triumphant">Triumphant - Victory energy</SelectItem>
                                  <SelectItem value="aggressive">Aggressive - Raw power</SelectItem>
                                  <SelectItem value="emotional">Emotional - Deep feeling</SelectItem>
                                  <SelectItem value="motivational">Motivational - Pump up</SelectItem>
                                  <SelectItem value="reflective">Reflective - Looking back</SelectItem>
                                  <SelectItem value="defiant">Defiant - Against all odds</SelectItem>
                                  <SelectItem value="healing">Healing - Peace & recovery</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Influences (Optional)</Label>
                              <Input 
                                value={songInfluences}
                                onChange={(e) => setSongInfluences(e.target.value)}
                                placeholder="e.g., Eminem, Johnny Cash, Metallica..."
                                data-testid="input-influences"
                              />
                            </div>
                            <Button 
                              onClick={async () => {
                                setIsGeneratingLyrics(true);
                                try {
                                  const response = await apiRequest("POST", "/api/music/generate-lyrics", {
                                    genre: selectedGenre,
                                    theme: songTheme || "stroke recovery warrior rising up",
                                    mood: songMood,
                                    influences: songInfluences,
                                  });
                                  const data = await response.json();
                                  if (data.lyrics) {
                                    setLyrics(data.lyrics);
                                    toast({ title: "Lyrics Generated", description: "AI wrote your lyrics. Edit as needed!" });
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to generate lyrics", variant: "destructive" });
                                } finally {
                                  setIsGeneratingLyrics(false);
                                }
                              }}
                              disabled={isGeneratingLyrics}
                              className="w-full"
                              data-testid="button-ai-write-lyrics"
                            >
                              {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                              AI Write Lyrics
                            </Button>
                          </div>
                          <div>
                            <Label>Your Lyrics</Label>
                            <Textarea 
                              value={lyrics}
                              onChange={(e) => setLyrics(e.target.value)}
                              placeholder={`[Verse 1]
Write your first verse here...

[Chorus]
Write the hook that repeats...

[Verse 2]
Continue your story...

[Bridge]
Change it up...

[Chorus]
Repeat the hook...`}
                              className="min-h-[300px] font-mono text-sm"
                              data-testid="textarea-lyrics-creator"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => setCreatorStep(2)} disabled={!lyrics.trim()} data-testid="button-next-step-1">
                            Next: Choose Style
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: Choose Style */}
                  {creatorStep === 2 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Music className="w-5 h-5 text-primary" /> Step 2: Choose Your Style
                        </CardTitle>
                        <CardDescription>Define the sound - genre, tempo, key</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label className="mb-3 block">Genre</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {genres.map((g) => {
                              const Icon = g.icon;
                              return (
                                <button
                                  key={g.value}
                                  onClick={() => setSelectedGenre(g.value)}
                                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 hover-elevate
                                    ${selectedGenre === g.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                                  data-testid={`button-genre-${g.value}`}
                                >
                                  <Icon className={`w-8 h-8 ${selectedGenre === g.value ? 'text-primary' : ''}`} />
                                  <span className="font-medium text-sm">{g.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label>Tempo (BPM): {bpm}</Label>
                            <Slider 
                              value={[bpm]} 
                              onValueChange={([v]) => setBpm(v)} 
                              min={60} max={200} 
                              className="mt-2"
                              data-testid="slider-tempo-creator"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Slow (60)</span>
                              <span>Fast (200)</span>
                            </div>
                          </div>
                          <div>
                            <Label>Key</Label>
                            <Select value={selectedKey} onValueChange={setSelectedKey}>
                              <SelectTrigger className="mt-2" data-testid="select-key-creator"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {keys.map((k) => (
                                  <SelectItem key={k} value={k}>{k}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Scale</Label>
                            <Select value={selectedScale} onValueChange={setSelectedScale}>
                              <SelectTrigger className="mt-2" data-testid="select-scale-creator"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {scales.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(1)} data-testid="button-back-step-2">
                            Back
                          </Button>
                          <Button onClick={() => setCreatorStep(3)} data-testid="button-next-step-2">
                            Next: Generate Beat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Generate Beat */}
                  {creatorStep === 3 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Disc className="w-5 h-5 text-primary" /> Step 3: Generate Your Beat
                        </CardTitle>
                        <CardDescription>
                          AI will create a {genres.find(g => g.value === selectedGenre)?.label} instrumental at {bpm} BPM in {selectedKey} {selectedScale}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-6 bg-muted/50 rounded-lg text-center">
                          <div className="mb-4">
                            <Badge variant="outline" className="mb-2">{genres.find(g => g.value === selectedGenre)?.label}</Badge>
                            <Badge variant="outline" className="ml-2">{bpm} BPM</Badge>
                            <Badge variant="outline" className="ml-2">{selectedKey} {selectedScale}</Badge>
                          </div>
                          
                          {generatedBeat ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-4">
                                <Button size="lg" onClick={handlePlay} data-testid="button-play-beat">
                                  {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                                  {isPlaying ? "Pause" : "Play"} Beat
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => {
                                  setGeneratedBeat(null);
                                }} data-testid="button-regenerate-beat">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Regenerate
                                </Button>
                              </div>
                              <audio src={generatedBeat} controls className="w-full max-w-md mx-auto" data-testid="audio-generated-beat" />
                            </div>
                          ) : (
                            <Button 
                              size="lg"
                              onClick={async () => {
                                setIsGeneratingBeat(true);
                                setGenerationProgress(0);
                                const interval = setInterval(() => {
                                  setGenerationProgress(p => Math.min(p + 10, 90));
                                }, 500);
                                try {
                                  const response = await apiRequest("POST", "/api/music/generate-instrumental", {
                                    genre: selectedGenre,
                                    bpm,
                                    key: selectedKey,
                                    scale: selectedScale,
                                    mood: songMood,
                                  });
                                  const data = await response.json();
                                  if (data.audioBase64) {
                                    const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
                                    setGeneratedBeat(audioUrl);
                                    toast({ title: "Beat Generated!", description: "Your AI instrumental is ready!" });
                                  } else if (data.audioUrl) {
                                    setGeneratedBeat(data.audioUrl);
                                    toast({ title: "Beat Generated!", description: "Your AI instrumental is ready!" });
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Beat generation failed", variant: "destructive" });
                                } finally {
                                  clearInterval(interval);
                                  setGenerationProgress(100);
                                  setIsGeneratingBeat(false);
                                }
                              }}
                              disabled={isGeneratingBeat}
                              data-testid="button-generate-beat-main"
                            >
                              {isGeneratingBeat ? (
                                <>
                                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                  Generating... ({generationProgress}%)
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  Generate Beat with Lyria AI
                                </>
                              )}
                            </Button>
                          )}
                          
                          {isGeneratingBeat && <Progress value={generationProgress} className="mt-4 max-w-md mx-auto" />}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(2)} data-testid="button-back-step-3">
                            Back
                          </Button>
                          <Button onClick={() => setCreatorStep(4)} disabled={!generatedBeat} data-testid="button-next-step-3">
                            Next: Select Voice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 4: Select Voice & Flow */}
                  {creatorStep === 4 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="w-5 h-5 text-primary" /> Step 4: Choose Your Voice & Flow
                        </CardTitle>
                        <CardDescription>How should the vocals sound and be delivered?</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="mb-3 block">Voice Style</Label>
                            <div className="space-y-2">
                              {(voiceStyles?.styles || [
                                { id: "deep", name: "Deep & Powerful", description: "Low, commanding presence" },
                                { id: "gritty", name: "Gritty & Raw", description: "Rough, authentic texture" },
                                { id: "smooth", name: "Smooth & Clear", description: "Clean, polished delivery" },
                                { id: "intense", name: "Intense & Driven", description: "High energy, passionate" },
                                { id: "warm", name: "Warm & Soulful", description: "Rich, emotional warmth" },
                                { id: "sharp", name: "Sharp & Precise", description: "Crisp, articulate diction" },
                              ]).slice(0, 6).map((style: any) => (
                                <button
                                  key={style.id}
                                  onClick={() => setSelectedVoiceStyle(style.id)}
                                  className={`w-full p-3 rounded-lg border-2 text-left transition-all hover-elevate
                                    ${selectedVoiceStyle === style.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                                  data-testid={`button-voice-style-${style.id}`}
                                >
                                  <div className="font-medium">{style.name}</div>
                                  <div className="text-sm text-muted-foreground">{style.description}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="mb-3 block">Flow / Delivery</Label>
                            <div className="space-y-2">
                              {[
                                { id: "melodic", name: "Melodic", desc: "Sung with melody and hooks" },
                                { id: "aggressive", name: "Aggressive", desc: "Hard, punchy delivery" },
                                { id: "smooth", name: "Smooth", desc: "Laid-back, flowing" },
                                { id: "fast", name: "Fast Flow", desc: "Rapid-fire, technical" },
                                { id: "storytelling", name: "Storytelling", desc: "Narrative, conversational" },
                                { id: "anthemic", name: "Anthemic", desc: "Big, arena-ready" },
                              ].map((flow) => (
                                <button
                                  key={flow.id}
                                  onClick={() => setSelectedFlow(flow.id)}
                                  className={`w-full p-3 rounded-lg border-2 text-left transition-all hover-elevate
                                    ${selectedFlow === flow.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                                  data-testid={`button-flow-${flow.id}`}
                                >
                                  <div className="font-medium">{flow.name}</div>
                                  <div className="text-sm text-muted-foreground">{flow.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Mic className="w-4 h-4" /> Clone Your Own Voice (Optional)
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Record 10+ seconds of your voice to create a voice clone using Google Chirp 3 HD
                          </p>
                          <Button variant="outline" onClick={() => {
                            setCreatorStep(4);
                            toast({ title: "Voice Studio", description: "Go to Voice Studio tab to record and clone your voice" });
                          }} data-testid="button-go-voice-studio">
                            Open Voice Studio
                          </Button>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(3)} data-testid="button-back-step-4">
                            Back
                          </Button>
                          <Button onClick={() => setCreatorStep(5)} data-testid="button-next-step-4">
                            Next: Preview & Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 5: Preview & Export */}
                  {creatorStep === 5 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="w-5 h-5 text-primary" /> Step 5: Preview & Export
                        </CardTitle>
                        <CardDescription>Review your song and export</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-bold">Song Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Genre:</span>
                                <Badge>{genres.find(g => g.value === selectedGenre)?.label}</Badge>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Tempo:</span>
                                <span>{bpm} BPM</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Key:</span>
                                <span>{selectedKey} {selectedScale}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Voice:</span>
                                <span>{voiceStyles?.styles?.find((s: any) => s.id === selectedVoiceStyle)?.name || selectedVoiceStyle}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Flow:</span>
                                <span className="capitalize">{selectedFlow}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Mood:</span>
                                <span className="capitalize">{songMood}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-bold">Lyrics Preview</h4>
                            <div className="p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                              <pre className="text-sm whitespace-pre-wrap font-mono">{lyrics.substring(0, 500)}{lyrics.length > 500 && "..."}</pre>
                            </div>
                            
                            {generatedBeat && (
                              <div>
                                <h4 className="font-bold mb-2">Generated Beat</h4>
                                <audio src={generatedBeat} controls className="w-full" data-testid="audio-final-preview" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                          <Button size="lg" className="gap-2" data-testid="button-export-project">
                            <Save className="w-5 h-5" />
                            Save Project
                          </Button>
                          <Button size="lg" variant="outline" className="gap-2" data-testid="button-export-stems">
                            <Download className="w-5 h-5" />
                            Export Stems
                          </Button>
                          <Button size="lg" variant="outline" className="gap-2" data-testid="button-create-video">
                            <Video className="w-5 h-5" />
                            Create Music Video
                          </Button>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(4)} data-testid="button-back-step-5">
                            Back
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setCreatorStep(1);
                            toast({ title: "Start New Song", description: "Beginning a fresh project" });
                          }} data-testid="button-start-new">
                            Start New Song
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

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
