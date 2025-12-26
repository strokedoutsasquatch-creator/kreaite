import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Video,
  Mic,
  Upload,
  Play,
  Loader2,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  Camera,
  Wand2,
  Image,
  Volume2,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  Share2,
  Grid3X3,
  FileText,
  Pause,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AvatarVideo {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "created" | "started";
  resultUrl?: string;
  script: string;
  createdAt: string;
  voiceId?: string;
  avatarType: "upload" | "preset" | "generated";
}

interface AvatarPreset {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  category: string;
}

interface VoiceOption {
  id: string;
  name: string;
  provider: string;
  lang: string;
}

const MAX_SCRIPT_LENGTH = 5000;

export function AvatarStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("en-US-JennyNeural");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [avatarDescription, setAvatarDescription] = useState("");
  const [generatedAvatarImage, setGeneratedAvatarImage] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<AvatarVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSample, setVoiceSample] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: presetsData, isLoading: presetsLoading } = useQuery<{
    presets: AvatarPreset[];
    voices: VoiceOption[];
  }>({
    queryKey: ["/api/avatar/presets"],
  });

  const { data: serviceStatus } = useQuery<{ configured: boolean; provider: string }>({
    queryKey: ["/api/avatar/status"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      let imageSource = avatarImage;
      if (selectedPreset) {
        const preset = presetsData?.presets.find((p) => p.id === selectedPreset);
        if (preset) {
          imageSource = preset.imageUrl;
        }
      } else if (generatedAvatarImage) {
        imageSource = generatedAvatarImage;
      }

      const res = await apiRequest("POST", "/api/avatar/generate", {
        script,
        voiceId: selectedVoice,
        avatarImage: imageSource,
        presetId: selectedPreset,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const avatarType = selectedPreset ? "preset" : generatedAvatarImage ? "generated" : "upload";
      const newVideo: AvatarVideo = {
        id: data.id || Date.now().toString(),
        status: "processing",
        script,
        createdAt: new Date().toISOString(),
        voiceId: selectedVoice,
        avatarType,
      };
      setGeneratedVideos((prev) => [newVideo, ...prev]);
      toast({ title: "Video generation started", description: "This may take 2-5 minutes" });
      pollVideoStatus(newVideo.id);
    },
    onError: (error: any) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/avatar/generate-image", {
        description: avatarDescription,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedAvatarImage(data.imageUrl);
      setAvatarImage(null);
      setSelectedPreset(null);
      toast({ title: "Avatar generated", description: "Your custom avatar is ready" });
    },
    onError: (error: any) => {
      toast({ title: "Avatar generation failed", description: error.message, variant: "destructive" });
    },
  });

  const pollVideoStatus = async (videoId: string) => {
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setGeneratedVideos((prev) =>
          prev.map((v) => (v.id === videoId ? { ...v, status: "failed" as const } : v))
        );
        toast({ title: "Generation timed out", variant: "destructive" });
        return;
      }

      try {
        const res = await fetch(`/api/avatar/status/${videoId}`);
        const data = await res.json();

        if (data.status === "completed" || data.status === "done") {
          setGeneratedVideos((prev) =>
            prev.map((v) =>
              v.id === videoId ? { ...v, status: "completed", resultUrl: data.resultUrl } : v
            )
          );
          toast({ title: "Video ready!", description: "Your avatar video is ready to view" });
        } else if (data.status === "failed" || data.status === "error") {
          setGeneratedVideos((prev) =>
            prev.map((v) => (v.id === videoId ? { ...v, status: "failed" } : v))
          );
          toast({ title: "Generation failed", description: data.error || "Unknown error", variant: "destructive" });
        } else {
          attempts++;
          setTimeout(poll, 3000);
        }
      } catch {
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload an image under 10MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result as string);
        setSelectedPreset(null);
        setGeneratedAvatarImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceSample(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started", description: "Speak clearly for 10-15 seconds" });
    } catch (error) {
      toast({ title: "Microphone access denied", description: "Please enable microphone access", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording saved", description: "Voice sample captured" });
    }
  };

  const getActiveAvatar = (): string | null => {
    if (avatarImage) return avatarImage;
    if (generatedAvatarImage) return generatedAvatarImage;
    if (selectedPreset) {
      const preset = presetsData?.presets.find((p) => p.id === selectedPreset);
      return preset?.imageUrl || null;
    }
    return null;
  };

  const canGenerate = script.trim().length > 0 && getActiveAvatar() !== null;

  const copyVideoLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Video URL copied to clipboard" });
  };

  const downloadVideo = (url: string, id: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `avatar-video-${id}.mp4`;
    a.click();
  };

  const voices = presetsData?.voices || [
    { id: "en-US-JennyNeural", name: "Jenny (American Female)", provider: "microsoft", lang: "en-US" },
    { id: "en-US-GuyNeural", name: "Guy (American Male)", provider: "microsoft", lang: "en-US" },
    { id: "en-GB-SoniaNeural", name: "Sonia (British Female)", provider: "microsoft", lang: "en-GB" },
    { id: "en-GB-RyanNeural", name: "Ryan (British Male)", provider: "microsoft", lang: "en-GB" },
  ];

  const presets = presetsData?.presets || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" data-testid="avatar-studio">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">
          AI Avatar Studio
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Create stunning talking avatar videos with AI
        </p>
        {serviceStatus && !serviceStatus.configured && (
          <Badge variant="outline" className="mt-4 border-yellow-500/50 text-yellow-400">
            <AlertCircle className="w-3 h-3 mr-1" />
            D-ID API not configured
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50">
          <TabsTrigger value="create" className="data-[state=active]:bg-orange-500/20" data-testid="tab-create">
            <Sparkles className="w-4 h-4 mr-2" />
            Create
          </TabsTrigger>
          <TabsTrigger value="presets" className="data-[state=active]:bg-orange-500/20" data-testid="tab-presets">
            <Grid3X3 className="w-4 h-4 mr-2" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="voice" className="data-[state=active]:bg-orange-500/20" data-testid="tab-voice">
            <Mic className="w-4 h-4 mr-2" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500/20" data-testid="tab-videos">
            <Video className="w-4 h-4 mr-2" />
            Videos
            {generatedVideos.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {generatedVideos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Camera className="w-4 h-4 text-orange-500" />
                  Avatar Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`aspect-square rounded-lg border-2 border-dashed ${
                    getActiveAvatar() ? "border-orange-500" : "border-zinc-700"
                  } flex items-center justify-center overflow-hidden bg-zinc-900/50`}
                >
                  {getActiveAvatar() ? (
                    <img
                      src={getActiveAvatar()!}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      data-testid="img-avatar-preview"
                    />
                  ) : (
                    <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center" data-testid="label-upload-avatar">
                      <User className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                      <p className="text-sm text-zinc-400">Upload your photo</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Front-facing headshot with good lighting
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="input-upload-avatar"
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-2">
                  <label className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-zinc-700"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </span>
                    </Button>
                  </label>
                  {getActiveAvatar() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAvatarImage(null);
                        setSelectedPreset(null);
                        setGeneratedAvatarImage(null);
                      }}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      data-testid="button-remove-avatar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-500">Or generate with AI</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                    placeholder="Describe your ideal avatar... (e.g., professional woman in her 30s, dark hair, friendly smile, business casual)"
                    className="min-h-[80px] bg-zinc-900/50 border-zinc-700 text-sm"
                    data-testid="textarea-avatar-description"
                  />
                  <Button
                    onClick={() => generateAvatarMutation.mutate()}
                    disabled={!avatarDescription.trim() || generateAvatarMutation.isPending}
                    variant="outline"
                    className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                    data-testid="button-generate-avatar"
                  >
                    {generateAvatarMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Avatar...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Avatar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-orange-500" />
                  Script & Voice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Voice Selection</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-700" data-testid="select-voice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-zinc-400">Your Script</label>
                    <span className={`text-xs ${script.length > MAX_SCRIPT_LENGTH ? "text-red-400" : "text-zinc-500"}`}>
                      {script.length} / {MAX_SCRIPT_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value.slice(0, MAX_SCRIPT_LENGTH))}
                    placeholder="Write what you want your avatar to say. Use natural language for the best results..."
                    className="min-h-[200px] bg-zinc-900/50 border-zinc-700 resize-none"
                    data-testid="textarea-script"
                  />
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] border-zinc-700">
                      <Clock className="w-3 h-3 mr-1" />
                      ~{Math.ceil(script.split(" ").filter(Boolean).length / 150)} min
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-zinc-700">
                      {script.split(" ").filter(Boolean).length} words
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={!canGenerate || generateMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  data-testid="button-generate-video"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Generation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Avatar Video
                    </>
                  )}
                </Button>

                {!canGenerate && (
                  <p className="text-xs text-zinc-500 text-center">
                    {!getActiveAvatar() ? "Select or upload an avatar image" : "Enter a script to generate"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Image className="w-4 h-4 text-orange-500" />
                Avatar Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {presetsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setAvatarImage(null);
                        setGeneratedAvatarImage(null);
                        setActiveTab("create");
                        toast({ title: "Preset selected", description: preset.name });
                      }}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPreset === preset.id
                          ? "border-orange-500 ring-2 ring-orange-500/20"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                      data-testid={`preset-${preset.id}`}
                    >
                      <div className="aspect-square bg-zinc-900">
                        <img
                          src={preset.imageUrl}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 bg-zinc-900/50">
                        <p className="text-sm font-medium text-white truncate">{preset.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{preset.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-950 border border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4 text-orange-500" />
                  Voice Cloning (Beta)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Record a 10-15 second voice sample to create a custom voice clone for your avatars.
                </p>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    className={isRecording ? "" : "border-orange-500/30"}
                    data-testid="button-record-voice"
                  >
                    {isRecording ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  {voiceSample && (
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sample recorded
                    </Badge>
                  )}
                </div>

                {voiceSample && (
                  <audio controls src={voiceSample} className="w-full mt-4" data-testid="audio-voice-sample" />
                )}

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-400">
                      <p className="font-medium text-orange-400 mb-1">Tips for best results:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Speak clearly at a consistent volume</li>
                        <li>Use a quiet environment</li>
                        <li>Read a paragraph of natural text</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Volume2 className="w-4 h-4 text-orange-500" />
                  Available Voices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {voices.map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => {
                          setSelectedVoice(voice.id);
                          toast({ title: "Voice selected", description: voice.name });
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedVoice === voice.id
                            ? "bg-orange-500/20 border border-orange-500/30"
                            : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700"
                        }`}
                        data-testid={`voice-option-${voice.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{voice.name}</p>
                            <p className="text-xs text-zinc-500">{voice.lang}</p>
                          </div>
                          {selectedVoice === voice.id && (
                            <CheckCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-orange-500" />
                Generated Videos
                <Badge variant="secondary" className="ml-2">
                  {generatedVideos.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-400">No videos generated yet</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Create your first avatar video in the Create tab
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-orange-500/30"
                    onClick={() => setActiveTab("create")}
                    data-testid="button-go-to-create"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Video
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedVideos.map((video) => (
                    <Card
                      key={video.id}
                      className="bg-zinc-900/50 border-zinc-800 overflow-hidden"
                      data-testid={`video-card-${video.id}`}
                    >
                      <div className="aspect-video bg-black relative flex items-center justify-center">
                        {video.status === "completed" && video.resultUrl ? (
                          <video
                            ref={videoRef}
                            src={video.resultUrl}
                            controls
                            className="w-full h-full"
                            data-testid={`video-player-${video.id}`}
                          />
                        ) : video.status === "processing" || video.status === "started" || video.status === "created" ? (
                          <div className="text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400">Processing...</p>
                            <p className="text-xs text-zinc-500 mt-1">This may take 2-5 minutes</p>
                          </div>
                        ) : video.status === "failed" ? (
                          <div className="text-center">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-sm text-red-400">Generation Failed</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-red-500/30"
                              onClick={() => {
                                setScript(video.script);
                                setActiveTab("create");
                              }}
                              data-testid={`button-retry-${video.id}`}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">Pending</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-zinc-400 line-clamp-2">{video.script}</p>
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-[10px] ${
                              video.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : video.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {video.status === "processing" || video.status === "started" ? "Processing" : video.status}
                          </Badge>
                          {video.status === "completed" && video.resultUrl && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => copyVideoLink(video.resultUrl!)}
                                data-testid={`button-copy-${video.id}`}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => downloadVideo(video.resultUrl!, video.id)}
                                data-testid={`button-download-${video.id}`}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => window.open(video.resultUrl, "_blank")}
                                data-testid={`button-open-${video.id}`}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-600">
                          {new Date(video.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-orange-500/5 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">About AI Avatar Generation</p>
              <p className="text-xs text-zinc-400 mt-1">
                AI avatars use advanced neural rendering to create realistic talking head videos.
              </p>
              <ul className="text-xs text-zinc-400 mt-2 space-y-1 list-disc list-inside">
                <li>Use clear, front-facing photos with good lighting for best results</li>
                <li>Avoid photos with glasses, heavy shadows, or complex backgrounds</li>
                <li>Scripts under 500 words produce the highest quality videos</li>
                <li>Generation typically takes 2-5 minutes depending on script length</li>
                <li>Generated videos can be downloaded or shared directly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
