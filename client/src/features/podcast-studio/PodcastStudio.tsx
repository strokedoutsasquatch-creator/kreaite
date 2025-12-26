import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Upload,
  Download,
  Trash2,
  Scissors,
  Volume2,
  AudioWaveform,
  Clock,
  FileAudio,
  Plus,
  Edit3,
  Check,
  Loader2,
  Sparkles,
  Settings,
  Share2,
} from "lucide-react";
import { ProMediaPlayer } from "@/components/ProMediaPlayer";
import { useToast } from "@/hooks/use-toast";

interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl?: string;
  duration: number;
  status: "draft" | "recorded" | "edited" | "published";
  createdAt: string;
}

interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
}

export function PodcastStudio() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
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
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      toast({ title: "Audio uploaded", description: file.name });
    }
  };

  const createEpisode = () => {
    const newEpisode: Episode = {
      id: Date.now().toString(),
      title: "Untitled Episode",
      description: "",
      duration: recordingTime,
      status: audioUrl ? "recorded" : "draft",
      createdAt: new Date().toISOString(),
      audioUrl: audioUrl || undefined,
    };
    setEpisodes((prev) => [newEpisode, ...prev]);
    setCurrentEpisode(newEpisode);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    toast({ title: "Episode created" });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8" data-testid="podcast-studio">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">Podcast Studio</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">Your Audio Sanctuary</p>
      </div>

      <Tabs defaultValue="record" className="space-y-4">
        <TabsList className="grid grid-cols-3 bg-zinc-900/50 border border-zinc-800/50">
          <TabsTrigger value="record" data-testid="tab-record">
            <Mic className="w-4 h-4 mr-2" />
            Record
          </TabsTrigger>
          <TabsTrigger value="edit" data-testid="tab-edit">
            <Scissors className="w-4 h-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="episodes" data-testid="tab-episodes">
            <FileAudio className="w-4 h-4 mr-2" />
            Episodes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-red-500 animate-pulse"
                        : "bg-orange-500/20 border-2 border-orange-500"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-12 h-12 text-white" />
                    ) : (
                      <Mic className="w-12 h-12 text-orange-500" />
                    )}
                  </div>
                  {isRecording && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-red-500 text-white animate-pulse">REC</Badge>
                    </div>
                  )}
                </div>

                <div className="text-4xl font-mono text-white">{formatTime(recordingTime)}</div>

                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-red-500 hover:bg-red-600"
                      data-testid="button-start-recording"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="outline"
                      className="border-red-500 text-red-500"
                      data-testid="button-stop-recording"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}

                  <label>
                    <Button variant="outline" className="border-orange-500/30" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Audio
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-upload-audio"
                    />
                  </label>
                </div>

                {audioUrl && (
                  <div className="mt-6 space-y-4">
                    <ProMediaPlayer src={audioUrl} type="audio" title="Recording" showWaveform />
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={createEpisode}
                        className="bg-orange-500 hover:bg-orange-600"
                        data-testid="button-save-episode"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save as Episode
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAudioBlob(null);
                          setAudioUrl(null);
                          setRecordingTime(0);
                        }}
                        className="border-red-500/30 text-red-400"
                        data-testid="button-discard-recording"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Discard
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Scissors className="w-4 h-4 text-orange-500" />
                Audio Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentEpisode?.audioUrl ? (
                <div className="space-y-4">
                  <ProMediaPlayer
                    src={currentEpisode.audioUrl}
                    type="audio"
                    title={currentEpisode.title}
                    showWaveform
                    allowBookmarks
                  />

                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" className="border-orange-500/30" data-testid="button-trim">
                      <Scissors className="w-4 h-4 mr-2" />
                      Trim
                    </Button>
                    <Button variant="outline" className="border-orange-500/30" data-testid="button-split">
                      Split
                    </Button>
                    <Button variant="outline" className="border-orange-500/30" data-testid="button-normalize">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Normalize
                    </Button>
                    <Button variant="outline" className="border-orange-500/30" data-testid="button-enhance">
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Enhance
                    </Button>
                  </div>

                  <div className="bg-black/50 rounded p-3 border border-orange-500/10">
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Segments</h4>
                    {segments.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No segments yet. Use trim/split tools to create segments.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {segments.map((segment) => (
                          <div
                            key={segment.id}
                            className="flex items-center justify-between bg-black/30 rounded p-2"
                          >
                            <span className="text-xs text-white">{segment.label || "Segment"}</span>
                            <span className="text-xs text-gray-400">
                              {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AudioWaveform className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">Select an episode to edit</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="episodes" className="space-y-4">
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <FileAudio className="w-4 h-4 text-orange-500" />
                  Your Episodes
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-new-episode"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Episode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {episodes.length === 0 ? (
                <div className="text-center py-12">
                  <FileAudio className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No episodes yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Record or upload audio to create your first episode
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {episodes.map((episode) => (
                      <Card
                        key={episode.id}
                        className={`bg-black/50 border-orange-500/10 p-3 cursor-pointer hover:border-orange-500/30 transition-colors ${
                          currentEpisode?.id === episode.id ? "border-orange-500" : ""
                        }`}
                        onClick={() => setCurrentEpisode(episode)}
                        data-testid={`episode-card-${episode.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">{episode.title}</h3>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {episode.description || "No description"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={`text-[10px] ${
                                  episode.status === "published"
                                    ? "bg-green-500/20 text-green-400"
                                    : episode.status === "edited"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : episode.status === "recorded"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {episode.status}
                              </Badge>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(episode.duration)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <Share2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <Download className="w-3 h-3" />
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
      </Tabs>
    </div>
  );
}
