import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  Settings,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AvatarVideo {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultUrl?: string;
  script: string;
  createdAt: string;
}

const voices = [
  { id: "en-US-1", label: "American English (Male)", lang: "en-US" },
  { id: "en-US-2", label: "American English (Female)", lang: "en-US" },
  { id: "en-GB-1", label: "British English (Male)", lang: "en-GB" },
  { id: "en-GB-2", label: "British English (Female)", lang: "en-GB" },
  { id: "es-ES-1", label: "Spanish (Female)", lang: "es-ES" },
  { id: "fr-FR-1", label: "French (Female)", lang: "fr-FR" },
  { id: "de-DE-1", label: "German (Male)", lang: "de-DE" },
];

export function AvatarStudio() {
  const { toast } = useToast();
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("en-US-1");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<AvatarVideo[]>([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/avatar/generate", {
        script,
        voiceId: selectedVoice,
        avatarImage,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const newVideo: AvatarVideo = {
        id: data.id || Date.now().toString(),
        status: "processing",
        script,
        createdAt: new Date().toISOString(),
      };
      setGeneratedVideos((prev) => [newVideo, ...prev]);
      toast({ title: "Video generation started", description: "This may take a few minutes" });
      pollVideoStatus(newVideo.id);
    },
    onError: (error: any) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const pollVideoStatus = async (videoId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setGeneratedVideos((prev) =>
          prev.map((v) => (v.id === videoId ? { ...v, status: "failed" as const } : v))
        );
        return;
      }

      try {
        const res = await fetch(`/api/avatar/status/${videoId}`);
        const data = await res.json();

        if (data.status === "completed") {
          setGeneratedVideos((prev) =>
            prev.map((v) =>
              v.id === videoId ? { ...v, status: "completed", resultUrl: data.resultUrl } : v
            )
          );
          toast({ title: "Video ready!", description: "Your avatar video is ready to view" });
        } else if (data.status === "failed") {
          setGeneratedVideos((prev) =>
            prev.map((v) => (v.id === videoId ? { ...v, status: "failed" } : v))
          );
          toast({ title: "Generation failed", variant: "destructive" });
        } else {
          attempts++;
          setTimeout(poll, 5000);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8" data-testid="avatar-studio">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">Avatar Studio</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">Bring Your Vision to Life</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-orange-500" />
              Your Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`aspect-square rounded-lg border-2 border-dashed ${
                avatarImage ? "border-orange-500" : "border-zinc-700"
              } flex items-center justify-center overflow-hidden`}
            >
              {avatarImage ? (
                <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <label className="cursor-pointer text-center p-4" data-testid="label-upload-avatar">
                  <User className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm text-zinc-400">Upload your photo</p>
                  <p className="text-xs text-zinc-500 mt-1">For best results, use a front-facing headshot</p>
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

            {avatarImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAvatarImage(null)}
                className="w-full border-orange-500/30"
                data-testid="button-remove-avatar"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Photo
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Mic className="w-4 h-4 text-orange-500" />
              Script & Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-black/50 border-orange-500/30" data-testid="select-voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Script</label>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Write what you want your avatar to say..."
                className="min-h-[150px] bg-black/50 border-orange-500/20"
                data-testid="textarea-script"
              />
              <p className="text-xs text-gray-500 mt-1">{script.length} characters</p>
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!script.trim() || !avatarImage || generateMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-generate-video"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {generatedVideos.length > 0 && (
        <Card className="bg-black border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Video className="w-4 h-4 text-orange-500" />
              Generated Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedVideos.map((video) => (
                <Card key={video.id} className="bg-black/50 border-orange-500/10" data-testid={`video-card-${video.id}`}>
                  <div className="aspect-video bg-gray-900 rounded-t-lg overflow-hidden flex items-center justify-center">
                    {video.status === "completed" && video.resultUrl ? (
                      <video
                        src={video.resultUrl}
                        controls
                        className="w-full h-full"
                        data-testid={`video-player-${video.id}`}
                      />
                    ) : video.status === "processing" ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Processing...</p>
                      </div>
                    ) : video.status === "failed" ? (
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-red-400">Failed</p>
                      </div>
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-400 line-clamp-2">{video.script}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        className={`text-[10px] ${
                          video.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : video.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {video.status}
                      </Badge>
                      {video.status === "completed" && video.resultUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => window.open(video.resultUrl, "_blank")}
                          data-testid={`button-download-${video.id}`}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-orange-500/5 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">About AI Avatars</p>
              <p className="text-xs text-gray-400 mt-1">
                AI avatars use your photo to create realistic talking head videos. For best results:
              </p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                <li>Use a clear, front-facing photo with good lighting</li>
                <li>Avoid photos with glasses or heavy shadows</li>
                <li>Keep scripts under 500 words for optimal quality</li>
                <li>Generation typically takes 2-5 minutes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
