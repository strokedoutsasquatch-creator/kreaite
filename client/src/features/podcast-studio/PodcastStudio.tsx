import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Upload,
  Download,
  Trash2,
  Clock,
  FileAudio,
  Plus,
  Edit3,
  Check,
  Loader2,
  Sparkles,
  Send,
  Image,
  FileText,
  Radio,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Podcast, PodcastEpisode } from "@shared/schema";

export function PodcastStudio() {
  const { toast } = useToast();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // UI state
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null);
  const [showNewPodcastDialog, setShowNewPodcastDialog] = useState(false);
  const [showNewEpisodeDialog, setShowNewEpisodeDialog] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<PodcastEpisode | null>(null);
  const [activeTab, setActiveTab] = useState("record");
  
  // Form state
  const [newPodcastTitle, setNewPodcastTitle] = useState("");
  const [newPodcastDescription, setNewPodcastDescription] = useState("");
  const [newPodcastCategory, setNewPodcastCategory] = useState("");
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeDescription, setNewEpisodeDescription] = useState("");
  const [showNotes, setShowNotes] = useState("");
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Queries
  const { data: podcasts = [], isLoading: isLoadingPodcasts } = useQuery<Podcast[]>({
    queryKey: ["/api/podcasts"],
  });

  const { data: episodes = [], isLoading: isLoadingEpisodes } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/podcasts", selectedPodcast?.id, "episodes"],
    enabled: !!selectedPodcast,
  });

  // Mutations
  const createPodcastMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      return apiRequest("/api/podcasts", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      setShowNewPodcastDialog(false);
      setNewPodcastTitle("");
      setNewPodcastDescription("");
      setNewPodcastCategory("");
      toast({ title: "Podcast created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create podcast", variant: "destructive" });
    },
  });

  const deletePodcastMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/podcasts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      setSelectedPodcast(null);
      toast({ title: "Podcast deleted" });
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; showNotes: string; duration: number; audioUrl?: string }) => {
      if (!selectedPodcast) throw new Error("No podcast selected");
      return apiRequest(`/api/podcasts/${selectedPodcast.id}/episodes`, { 
        method: "POST", 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts", selectedPodcast?.id, "episodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      setShowNewEpisodeDialog(false);
      setNewEpisodeTitle("");
      setNewEpisodeDescription("");
      setShowNotes("");
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      toast({ title: "Episode created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create episode", variant: "destructive" });
    },
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async ({ episodeId, data }: { episodeId: number; data: Partial<PodcastEpisode> }) => {
      if (!selectedPodcast) throw new Error("No podcast selected");
      return apiRequest(`/api/podcasts/${selectedPodcast.id}/episodes/${episodeId}`, { 
        method: "PATCH", 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts", selectedPodcast?.id, "episodes"] });
      setEditingEpisode(null);
      toast({ title: "Episode updated" });
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!selectedPodcast) throw new Error("No podcast selected");
      return apiRequest(`/api/podcasts/${selectedPodcast.id}/episodes/${episodeId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts", selectedPodcast?.id, "episodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      setSelectedEpisode(null);
      toast({ title: "Episode deleted" });
    },
  });

  const transcribeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!selectedPodcast) throw new Error("No podcast selected");
      return apiRequest(`/api/podcasts/${selectedPodcast.id}/episodes/${episodeId}/transcribe`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts", selectedPodcast?.id, "episodes"] });
      toast({ title: "Transcription complete" });
    },
    onError: () => {
      toast({ title: "Transcription failed", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!selectedPodcast) throw new Error("No podcast selected");
      return apiRequest(`/api/podcasts/${selectedPodcast.id}/episodes/${episodeId}/publish`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts", selectedPodcast?.id, "episodes"] });
      toast({ title: "Episode published to marketplace" });
    },
    onError: () => {
      toast({ title: "Failed to publish episode", variant: "destructive" });
    },
  });

  // Waveform visualization
  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !isRecording || isPaused) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF6B35";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Store waveform data for later display
    const avgAmplitude = dataArray.reduce((a, b) => a + Math.abs(b - 128), 0) / bufferLength;
    setWaveformData(prev => [...prev.slice(-100), avgAmplitude]);

    animationRef.current = requestAnimationFrame(drawWaveform);
  }, [isRecording, isPaused]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setWaveformData([]);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);

      // Start waveform animation
      animationRef.current = requestAnimationFrame(drawWaveform);

      toast({ title: "Recording started" });
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
      animationRef.current = requestAnimationFrame(drawWaveform);
      toast({ title: "Recording resumed" });
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      toast({ title: "Recording paused" });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      toast({ title: "Recording stopped" });
    }
  };

  // Handle file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      
      // Try to get duration from audio file
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        setRecordingTime(Math.floor(audio.duration));
      };
      
      toast({ title: "Audio uploaded", description: file.name });
    }
  };

  // Handle cover art upload
  const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArtFile(file);
      setCoverArtPreview(URL.createObjectURL(file));
    }
  };

  // Download recording
  const downloadRecording = () => {
    if (audioBlob && audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
    }
  };

  // Save recording as new episode
  const saveAsEpisode = () => {
    if (!selectedPodcast) {
      toast({ title: "Please select or create a podcast first", variant: "destructive" });
      return;
    }
    setNewEpisodeTitle("");
    setNewEpisodeDescription("");
    setShowNotes("");
    setShowNewEpisodeDialog(true);
  };

  // Create episode with recording
  const handleCreateEpisode = () => {
    if (!newEpisodeTitle.trim()) {
      toast({ title: "Episode title is required", variant: "destructive" });
      return;
    }

    createEpisodeMutation.mutate({
      title: newEpisodeTitle,
      description: newEpisodeDescription,
      showNotes: showNotes,
      duration: recordingTime,
      audioUrl: audioUrl || undefined,
    });
  };

  // Discard recording
  const discardRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setWaveformData([]);
    toast({ title: "Recording discarded" });
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Start waveform drawing when recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  }, [isRecording, isPaused, drawWaveform]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-500/20 text-green-400";
      case "edited": return "bg-blue-500/20 text-blue-400";
      case "recorded": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6" data-testid="podcast-studio">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground mb-2">
          Podcast Studio
        </h1>
        <p className="text-base md:text-lg text-zinc-400">
          Record, edit, and publish your podcasts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Podcasts List */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-950 border-zinc-800/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Your Podcasts
                </CardTitle>
                <Dialog open={showNewPodcastDialog} onOpenChange={setShowNewPodcastDialog}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-new-podcast">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Create New Podcast</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Podcast Title</Label>
                        <Input
                          value={newPodcastTitle}
                          onChange={(e) => setNewPodcastTitle(e.target.value)}
                          placeholder="My Awesome Podcast"
                          className="bg-zinc-900 border-zinc-700"
                          data-testid="input-podcast-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newPodcastDescription}
                          onChange={(e) => setNewPodcastDescription(e.target.value)}
                          placeholder="What is your podcast about?"
                          className="bg-zinc-900 border-zinc-700 min-h-[80px]"
                          data-testid="input-podcast-description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newPodcastCategory} onValueChange={setNewPodcastCategory}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-podcast-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="health">Health & Wellness</SelectItem>
                            <SelectItem value="arts">Arts & Culture</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createPodcastMutation.mutate({
                          title: newPodcastTitle,
                          description: newPodcastDescription,
                          category: newPodcastCategory,
                        })}
                        disabled={!newPodcastTitle.trim() || createPodcastMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                        data-testid="button-create-podcast-submit"
                      >
                        {createPodcastMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Create Podcast
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingPodcasts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : podcasts.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                  <p className="text-zinc-500 text-sm">No podcasts yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Create your first podcast</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {podcasts.map((podcast) => (
                      <div
                        key={podcast.id}
                        onClick={() => setSelectedPodcast(podcast)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover-elevate ${
                          selectedPodcast?.id === podcast.id
                            ? "bg-primary/10 border border"
                            : "bg-zinc-900/50 border border-transparent hover:border-zinc-700"
                        }`}
                        data-testid={`podcast-item-${podcast.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
                            {podcast.coverArtUrl ? (
                              <img 
                                src={podcast.coverArtUrl} 
                                alt="" 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Radio className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {podcast.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {podcast.episodeCount} episodes
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 bg-zinc-900/50 border border-zinc-800/50">
              <TabsTrigger value="record" data-testid="tab-record">
                <Mic className="w-4 h-4 mr-2" />
                Record
              </TabsTrigger>
              <TabsTrigger value="episodes" data-testid="tab-episodes">
                <FileAudio className="w-4 h-4 mr-2" />
                Episodes
              </TabsTrigger>
              <TabsTrigger value="details" data-testid="tab-details">
                <FileText className="w-4 h-4 mr-2" />
                Episode Details
              </TabsTrigger>
            </TabsList>

            {/* Recording Tab */}
            <TabsContent value="record" className="space-y-6">
              <Card className="bg-zinc-950 border-zinc-800/50">
                <CardContent className="p-6 md:p-8">
                  <div className="text-center space-y-6">
                    {/* Recording indicator */}
                    <div className="relative inline-block">
                      <div
                        className={`w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? isPaused
                              ? "bg-yellow-500/20 border-2 border-yellow-500"
                              : "bg-red-500 animate-pulse"
                            : "bg-primary/20 border-2 border-orange-500"
                        }`}
                      >
                        {isRecording ? (
                          isPaused ? (
                            <Pause className="w-10 h-10 md:w-12 md:h-12 text-yellow-500" />
                          ) : (
                            <MicOff className="w-10 h-10 md:w-12 md:h-12 text-foreground" />
                          )
                        ) : (
                          <Mic className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                        )}
                      </div>
                      {isRecording && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                          <Badge className={isPaused ? "bg-yellow-500 text-black" : "bg-red-500 text-foreground animate-pulse"}>
                            {isPaused ? "PAUSED" : "REC"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Timer */}
                    <div className="text-3xl md:text-4xl font-mono text-foreground" data-testid="recording-time">
                      {formatTime(recordingTime)}
                    </div>

                    {/* Waveform Canvas */}
                    {isRecording && (
                      <div className="w-full max-w-lg mx-auto">
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={100}
                          className="w-full h-20 rounded-lg border border-zinc-800 bg-background"
                          data-testid="waveform-canvas"
                        />
                      </div>
                    )}

                    {/* Static waveform visualization from recorded data */}
                    {!isRecording && waveformData.length > 0 && (
                      <div className="w-full max-w-lg mx-auto flex items-end justify-center gap-1 h-16">
                        {waveformData.slice(-50).map((value, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-orange-500 rounded-full transition-all"
                            style={{ height: `${Math.max(4, value * 2)}px` }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {!isRecording ? (
                        <>
                          <Button
                            onClick={startRecording}
                            size="lg"
                            className="bg-red-500 hover:bg-red-600"
                            data-testid="button-start-recording"
                          >
                            <Mic className="w-5 h-5 mr-2" />
                            Start Recording
                          </Button>

                          <label>
                            <Button variant="outline" className="border" asChild>
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Audio
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleAudioUpload}
                              className="hidden"
                              data-testid="input-upload-audio"
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={togglePause}
                            size="lg"
                            variant="outline"
                            className="border-yellow-500 text-yellow-500"
                            data-testid="button-pause-recording"
                          >
                            {isPaused ? (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="w-5 h-5 mr-2" />
                                Pause
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={stopRecording}
                            size="lg"
                            variant="outline"
                            className="border-red-500 text-red-500"
                            data-testid="button-stop-recording"
                          >
                            <Square className="w-5 h-5 mr-2" />
                            Stop
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Audio preview and save */}
                    {audioUrl && !isRecording && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <audio
                            src={audioUrl}
                            controls
                            className="w-full"
                            data-testid="audio-preview"
                          />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          <Button
                            onClick={saveAsEpisode}
                            className="bg-orange-500 hover:bg-orange-600"
                            data-testid="button-save-episode"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Save as Episode
                          </Button>
                          <Button
                            onClick={downloadRecording}
                            variant="outline"
                            className="border-zinc-700"
                            data-testid="button-download-recording"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            onClick={discardRecording}
                            className="border-red-500/30 text-red-400"
                            data-testid="button-discard-recording"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Discard
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Selected podcast info */}
                    {!selectedPodcast && (
                      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Select or create a podcast from the sidebar to save episodes</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Episodes Tab */}
            <TabsContent value="episodes" className="space-y-4">
              <Card className="bg-zinc-950 border-zinc-800/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileAudio className="w-4 h-4 text-primary" />
                      {selectedPodcast ? `${selectedPodcast.title} - Episodes` : "Episodes"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedPodcast ? (
                    <div className="text-center py-12">
                      <Radio className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                      <p className="text-zinc-400">Select a podcast to view episodes</p>
                    </div>
                  ) : isLoadingEpisodes ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : episodes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileAudio className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                      <p className="text-zinc-400">No episodes yet</p>
                      <p className="text-zinc-500 text-sm mt-1">
                        Record or upload audio to create your first episode
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {episodes.map((episode, index) => (
                          <Card
                            key={episode.id}
                            className={`bg-zinc-900/50 border-zinc-800/50 p-4 cursor-pointer transition-colors hover-elevate ${
                              selectedEpisode?.id === episode.id ? "border-orange-500" : ""
                            }`}
                            onClick={() => {
                              setSelectedEpisode(episode);
                              setActiveTab("details");
                            }}
                            data-testid={`episode-card-${episode.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-zinc-500">
                                    EP {episode.episodeNumber || episodes.length - index}
                                  </span>
                                  <Badge className={`text-[10px] ${getStatusColor(episode.status)}`}>
                                    {episode.status}
                                  </Badge>
                                </div>
                                <h3 className="text-sm font-medium text-foreground truncate">
                                  {episode.title}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                  {episode.description || "No description"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(episode.duration)}
                                  </span>
                                  {episode.transcriptionStatus === "completed" && (
                                    <Badge className="text-[10px] bg-purple-500/20 text-purple-400">
                                      Transcribed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!episode.isPublished && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      publishMutation.mutate(episode.id);
                                    }}
                                    disabled={publishMutation.isPending}
                                    data-testid={`button-publish-${episode.id}`}
                                  >
                                    {publishMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEpisode(episode);
                                    setActiveTab("details");
                                  }}
                                  data-testid={`button-edit-${episode.id}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteEpisodeMutation.mutate(episode.id);
                                  }}
                                  disabled={deleteEpisodeMutation.isPending}
                                  className="text-red-400 hover:text-red-300"
                                  data-testid={`button-delete-${episode.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Episode Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {selectedEpisode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Episode Info */}
                  <Card className="bg-zinc-950 border-zinc-800/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Episode Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={editingEpisode?.title ?? selectedEpisode.title}
                          onChange={(e) => setEditingEpisode({
                            ...selectedEpisode,
                            ...editingEpisode,
                            title: e.target.value
                          })}
                          className="bg-zinc-900 border-zinc-700"
                          data-testid="input-episode-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editingEpisode?.description ?? selectedEpisode.description ?? ""}
                          onChange={(e) => setEditingEpisode({
                            ...selectedEpisode,
                            ...editingEpisode,
                            description: e.target.value
                          })}
                          className="bg-zinc-900 border-zinc-700 min-h-[100px]"
                          data-testid="input-episode-description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Show Notes</Label>
                        <Textarea
                          value={editingEpisode?.showNotes ?? selectedEpisode.showNotes ?? ""}
                          onChange={(e) => setEditingEpisode({
                            ...selectedEpisode,
                            ...editingEpisode,
                            showNotes: e.target.value
                          })}
                          placeholder="Add timestamps, links, and notes for your listeners..."
                          className="bg-zinc-900 border-zinc-700 min-h-[150px]"
                          data-testid="input-show-notes"
                        />
                      </div>
                      {editingEpisode && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              updateEpisodeMutation.mutate({
                                episodeId: selectedEpisode.id,
                                data: {
                                  title: editingEpisode.title,
                                  description: editingEpisode.description,
                                  showNotes: editingEpisode.showNotes,
                                }
                              });
                            }}
                            disabled={updateEpisodeMutation.isPending}
                            className="bg-orange-500 hover:bg-orange-600"
                            data-testid="button-save-episode-changes"
                          >
                            {updateEpisodeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingEpisode(null)}
                            className="border-zinc-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cover Art & Actions */}
                  <div className="space-y-4">
                    <Card className="bg-zinc-950 border-zinc-800/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Image className="w-4 h-4 text-primary" />
                          Cover Art
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-square bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden">
                          {selectedEpisode.coverArtUrl || coverArtPreview ? (
                            <img
                              src={coverArtPreview || selectedEpisode.coverArtUrl || ""}
                              alt="Cover art"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <Image className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                              <p className="text-zinc-500 text-sm">No cover art</p>
                            </div>
                          )}
                        </div>
                        <label className="block mt-4">
                          <Button variant="outline" className="w-full border-zinc-700" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Cover Art
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverArtUpload}
                            className="hidden"
                            data-testid="input-cover-art"
                          />
                        </label>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-950 border-zinc-800/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          AI Transcription
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedEpisode.transcriptionStatus === "completed" ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Transcription complete</span>
                            </div>
                            <ScrollArea className="h-40 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                                {selectedEpisode.transcript}
                              </p>
                            </ScrollArea>
                          </div>
                        ) : selectedEpisode.transcriptionStatus === "processing" ? (
                          <div className="flex items-center gap-2 text-yellow-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Transcribing audio...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-zinc-400">
                              Generate an AI transcription of your episode for accessibility and SEO.
                            </p>
                            <Button
                              onClick={() => transcribeMutation.mutate(selectedEpisode.id)}
                              disabled={transcribeMutation.isPending}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                              data-testid="button-transcribe"
                            >
                              {transcribeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                              )}
                              Generate Transcription
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {!selectedEpisode.isPublished && (
                      <Button
                        onClick={() => publishMutation.mutate(selectedEpisode.id)}
                        disabled={publishMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-publish-episode"
                      >
                        {publishMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Publish to Marketplace
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="bg-zinc-950 border-zinc-800/50">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <FileAudio className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                      <p className="text-zinc-400">Select an episode to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Episode Dialog */}
      <Dialog open={showNewEpisodeDialog} onOpenChange={setShowNewEpisodeDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Save as Episode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Episode Title</Label>
              <Input
                value={newEpisodeTitle}
                onChange={(e) => setNewEpisodeTitle(e.target.value)}
                placeholder="Episode title"
                className="bg-zinc-900 border-zinc-700"
                data-testid="input-new-episode-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEpisodeDescription}
                onChange={(e) => setNewEpisodeDescription(e.target.value)}
                placeholder="What is this episode about?"
                className="bg-zinc-900 border-zinc-700 min-h-[80px]"
                data-testid="input-new-episode-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Show Notes</Label>
              <Textarea
                value={showNotes}
                onChange={(e) => setShowNotes(e.target.value)}
                placeholder="Add timestamps, links, and notes..."
                className="bg-zinc-900 border-zinc-700 min-h-[100px]"
                data-testid="input-new-show-notes"
              />
            </div>
            <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Duration: {formatTime(recordingTime)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewEpisodeDialog(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEpisode}
              disabled={!newEpisodeTitle.trim() || createEpisodeMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-create-episode-submit"
            >
              {createEpisodeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Create Episode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
