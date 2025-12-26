import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  List,
  X,
  Rewind,
  FastForward,
  Lock,
  Unlock,
  ShoppingCart,
  Eye,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  Video,
  Check,
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
}

interface MediaBookmark {
  id: string;
  time: number;
  label: string;
}

interface QualityOption {
  id: string;
  label: string;
  src: string;
  bitrate?: number;
}

interface PlaylistItem {
  id: string;
  title: string;
  artist?: string;
  src: string;
  coverImage?: string;
  duration?: number;
  isLocked?: boolean;
  previewDuration?: number;
}

interface ProMediaPlayerProps {
  src: string;
  type: "audio" | "video";
  title?: string;
  artist?: string;
  coverImage?: string;
  chapters?: Chapter[];
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  showWaveform?: boolean;
  allowDownload?: boolean;
  allowBookmarks?: boolean;
  contentId?: string;
  isOwned?: boolean;
  isLocked?: boolean;
  previewDuration?: number;
  trailerSrc?: string;
  onPurchase?: () => void;
  price?: number;
  playlist?: PlaylistItem[];
  qualityOptions?: QualityOption[];
  onPlaylistItemChange?: (item: PlaylistItem, index: number) => void;
  autoSaveProgress?: boolean;
  initialProgress?: number;
}

const PREVIEW_DURATION_AUDIO = 30;
const PREVIEW_DURATION_VIDEO = 60;

function getProgressKey(contentId: string): string {
  return `media_progress_${contentId}`;
}

function saveProgress(contentId: string, time: number): void {
  if (contentId) {
    localStorage.setItem(getProgressKey(contentId), time.toString());
  }
}

function loadProgress(contentId: string): number {
  if (!contentId) return 0;
  const saved = localStorage.getItem(getProgressKey(contentId));
  return saved ? parseFloat(saved) : 0;
}

export function ProMediaPlayer({
  src,
  type,
  title,
  artist,
  coverImage,
  chapters = [],
  onTimeUpdate,
  onEnded,
  showWaveform = true,
  allowDownload = false,
  allowBookmarks = true,
  contentId,
  isOwned = true,
  isLocked = false,
  previewDuration,
  trailerSrc,
  onPurchase,
  price,
  playlist = [],
  qualityOptions = [],
  onPlaylistItemChange,
  autoSaveProgress = true,
  initialProgress,
}: ProMediaPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [bookmarks, setBookmarks] = useState<MediaBookmark[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>(qualityOptions[0]?.id || "auto");
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(!isOwned && isLocked);
  const [showLockedOverlay, setShowLockedOverlay] = useState(!isOwned && isLocked);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const effectivePreviewDuration = previewDuration || 
    (type === "audio" ? PREVIEW_DURATION_AUDIO : PREVIEW_DURATION_VIDEO);

  const effectiveSrc = (isPreviewMode && trailerSrc) ? trailerSrc : 
    (qualityOptions.find(q => q.id === currentQuality)?.src || src);

  const currentPlaylistItem = playlist.length > 0 ? playlist[currentPlaylistIndex] : null;

  useEffect(() => {
    if (contentId && autoSaveProgress) {
      const savedProgress = initialProgress ?? loadProgress(contentId);
      if (savedProgress > 0 && mediaRef.current) {
        mediaRef.current.currentTime = savedProgress;
        setCurrentTime(savedProgress);
      }
    }
  }, [contentId, autoSaveProgress, initialProgress]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      const time = media.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      if (autoSaveProgress && contentId && !isPreviewMode) {
        saveProgress(contentId, time);
      }

      if (isPreviewMode && !isOwned && time >= effectivePreviewDuration) {
        media.pause();
        setIsPlaying(false);
        setShowLockedOverlay(true);
      }

      const chapter = chapters.find(
        (c) => time >= c.startTime && (!c.endTime || time < c.endTime)
      );
      setCurrentChapter(chapter || null);
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      
      if (playlist.length > 0) {
        handleNextTrack();
      } else {
        onEnded?.();
      }
    };

    const handleProgress = () => {
      if (media.buffered.length > 0) {
        const bufferedEnd = media.buffered.end(media.buffered.length - 1);
        setBuffered((bufferedEnd / media.duration) * 100);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("ended", handleEnded);
    media.addEventListener("progress", handleProgress);
    media.addEventListener("waiting", handleWaiting);
    media.addEventListener("canplay", handleCanPlay);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("ended", handleEnded);
      media.removeEventListener("progress", handleProgress);
      media.removeEventListener("waiting", handleWaiting);
      media.removeEventListener("canplay", handleCanPlay);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
    };
  }, [chapters, onTimeUpdate, onEnded, autoSaveProgress, contentId, isPreviewMode, isOwned, effectivePreviewDuration, playlist.length]);

  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (showLockedOverlay && !isOwned) {
      return;
    }

    if (isPlaying) {
      media.pause();
    } else {
      media.play().catch(console.error);
    }
  }, [isPlaying, showLockedOverlay, isOwned]);

  const seek = useCallback((time: number) => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPreviewMode && !isOwned && time > effectivePreviewDuration) {
      time = effectivePreviewDuration;
    }

    media.currentTime = time;
    setCurrentTime(time);
  }, [isPreviewMode, isOwned, effectivePreviewDuration]);

  const skipForward = () => seek(Math.min(currentTime + 10, duration));
  const skipBackward = () => seek(Math.max(currentTime - 10, 0));

  const changeVolume = (value: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changePlaybackRate = () => {
    const media = mediaRef.current;
    if (!media) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    media.playbackRate = rates[nextIndex];
    setPlaybackRate(rates[nextIndex]);
  };

  const addBookmark = () => {
    const newBookmark: MediaBookmark = {
      id: Date.now().toString(),
      time: currentTime,
      label: `Bookmark at ${formatTime(currentTime)}`,
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const goToChapter = (chapter: Chapter) => {
    seek(chapter.startTime);
    setShowChapters(false);
  };

  const changeQuality = (qualityId: string) => {
    const media = mediaRef.current;
    const currentTimeBeforeChange = media?.currentTime || 0;
    setCurrentQuality(qualityId);
    
    setTimeout(() => {
      if (mediaRef.current) {
        mediaRef.current.currentTime = currentTimeBeforeChange;
        if (isPlaying) {
          mediaRef.current.play().catch(console.error);
        }
      }
    }, 100);
  };

  const handleNextTrack = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex: number;
    if (repeatMode === "one") {
      nextIndex = currentPlaylistIndex;
      seek(0);
      mediaRef.current?.play().catch(console.error);
      return;
    } else if (shuffleEnabled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentPlaylistIndex + 1;
      if (nextIndex >= playlist.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          onEnded?.();
          return;
        }
      }
    }

    setCurrentPlaylistIndex(nextIndex);
    onPlaylistItemChange?.(playlist[nextIndex], nextIndex);
  }, [playlist, currentPlaylistIndex, repeatMode, shuffleEnabled, seek, onEnded, onPlaylistItemChange]);

  const handlePrevTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex = currentPlaylistIndex - 1;
    if (prevIndex < 0) {
      prevIndex = repeatMode === "all" ? playlist.length - 1 : 0;
    }

    setCurrentPlaylistIndex(prevIndex);
    onPlaylistItemChange?.(playlist[prevIndex], prevIndex);
  }, [playlist, currentPlaylistIndex, currentTime, repeatMode, seek, onPlaylistItemChange]);

  const playPlaylistItem = (index: number) => {
    if (playlist[index]?.isLocked && !isOwned) {
      return;
    }
    setCurrentPlaylistIndex(index);
    onPlaylistItemChange?.(playlist[index], index);
    setShowPlaylist(false);
  };

  const toggleRepeat = () => {
    const modes: ("none" | "all" | "one")[] = ["none", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const handleDownload = async () => {
    if (!isOwned || isLocked) return;
    
    try {
      const response = await fetch(effectiveSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "download"}.${type === "audio" ? "mp3" : "mp4"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(effectiveSrc, "_blank");
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && type === "video") {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const previewProgress = duration > 0 ? (effectivePreviewDuration / duration) * 100 : 0;

  return (
    <Card 
      ref={containerRef}
      className="bg-black border-orange-500/20 overflow-hidden relative" 
      data-testid="pro-media-player"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => type === "video" && isPlaying && setShowControls(false)}
    >
      {type === "video" ? (
        <div className="relative aspect-video bg-black">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={effectiveSrc}
            className={`w-full h-full ${showLockedOverlay && !isOwned ? "blur-md" : ""}`}
            poster={coverImage}
            data-testid="video-element"
            playsInline
          />
          
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showLockedOverlay && !isOwned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                <Lock className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Premium Content</h3>
              <p className="text-gray-400 mb-4 text-center max-w-xs">
                {isPreviewMode 
                  ? `Preview ended. Purchase to continue watching.`
                  : `This content requires purchase to access.`}
              </p>
              {price !== undefined && (
                <p className="text-2xl font-bold text-orange-500 mb-4">${price.toFixed(2)}</p>
              )}
              <div className="flex gap-3">
                {isPreviewMode && !trailerSrc && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      seek(0);
                      setShowLockedOverlay(false);
                    }}
                    className="border-orange-500/50"
                    data-testid="button-replay-preview"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Replay Preview
                  </Button>
                )}
                {onPurchase && (
                  <Button
                    onClick={onPurchase}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-purchase"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase to Unlock
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isPlaying && !showLockedOverlay && (
            <button
              onClick={togglePlay}
              className={`absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors ${showControls ? "opacity-100" : "opacity-0"}`}
              data-testid="button-play-overlay"
            >
              <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}

          {type === "video" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className={`absolute top-3 right-3 h-8 w-8 bg-black/50 hover:bg-black/70 transition-opacity ${showControls ? "opacity-100" : "opacity-0"}`}
              data-testid="button-fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          )}

          {isPreviewMode && !showLockedOverlay && (
            <Badge 
              className="absolute top-3 left-3 bg-orange-500/90 text-white"
              data-testid="badge-preview-mode"
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview Mode ({formatTime(Math.max(0, effectivePreviewDuration - currentTime))} remaining)
            </Badge>
          )}
        </div>
      ) : (
        <div className={`p-4 flex items-center gap-4 ${showLockedOverlay && !isOwned ? "relative" : ""}`}>
          {showLockedOverlay && !isOwned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 rounded-t-lg">
              <Lock className="w-8 h-8 text-orange-500 mb-2" />
              <p className="text-sm text-gray-400 mb-2">
                {isPreviewMode ? "Preview ended" : "Locked content"}
              </p>
              {price !== undefined && (
                <p className="text-lg font-bold text-orange-500 mb-2">${price.toFixed(2)}</p>
              )}
              <div className="flex gap-2">
                {isPreviewMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      seek(0);
                      setShowLockedOverlay(false);
                    }}
                    className="border-orange-500/50 text-xs"
                    data-testid="button-replay-preview-audio"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Replay
                  </Button>
                )}
                {onPurchase && (
                  <Button
                    size="sm"
                    onClick={onPurchase}
                    className="bg-orange-500 hover:bg-orange-600 text-xs"
                    data-testid="button-purchase-audio"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Purchase
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="relative">
            {coverImage ? (
              <img 
                src={currentPlaylistItem?.coverImage || coverImage} 
                alt={currentPlaylistItem?.title || title} 
                className={`w-16 h-16 rounded-lg object-cover ${showLockedOverlay && !isOwned ? "blur-sm" : ""}`}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
            )}
            {!isOwned && isLocked && !showLockedOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <Lock className="w-6 h-6 text-orange-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {currentPlaylistItem?.title || title || "Untitled"}
            </h3>
            {(currentPlaylistItem?.artist || artist) && (
              <p className="text-xs text-gray-400 truncate">
                {currentPlaylistItem?.artist || artist}
              </p>
            )}
            {currentChapter && (
              <Badge variant="outline" className="text-[10px] mt-1">
                {currentChapter.title}
              </Badge>
            )}
            {isPreviewMode && !showLockedOverlay && (
              <Badge className="text-[10px] mt-1 bg-orange-500/20 text-orange-400 border-orange-500/30">
                <Eye className="w-2 h-2 mr-1" />
                Preview ({formatTime(Math.max(0, effectivePreviewDuration - currentTime))})
              </Badge>
            )}
          </div>
          <audio 
            ref={mediaRef as React.RefObject<HTMLAudioElement>} 
            src={currentPlaylistItem?.src || effectiveSrc} 
            data-testid="audio-element" 
          />
        </div>
      )}

      <CardContent className={`p-3 space-y-3 transition-opacity ${type === "video" && !showControls && isPlaying ? "opacity-0" : "opacity-100"}`}>
        <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden cursor-pointer group">
          <div
            className="absolute inset-y-0 left-0 bg-gray-600/50 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          
          {isPreviewMode && !isOwned && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              style={{ left: `${Math.min(previewProgress, 100)}%` }}
              title="Preview limit"
            />
          )}
          
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${(chapter.startTime / duration) * 100}%` }}
              title={chapter.title}
            />
          ))}
          {bookmarks.map((bookmark) => (
            <button
              key={bookmark.id}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 hover:scale-150 transition-transform"
              style={{ left: `${(bookmark.time / duration) * 100}%` }}
              onClick={() => seek(bookmark.time)}
              title={bookmark.label}
              data-testid={`bookmark-${bookmark.id}`}
            />
          ))}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            data-testid="slider-progress"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {playlist.length > 0 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShuffleEnabled(!shuffleEnabled)}
                  className={`h-7 w-7 ${shuffleEnabled ? "text-orange-500" : ""}`}
                  data-testid="button-shuffle"
                >
                  <Shuffle className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePrevTrack}
                  className="h-8 w-8"
                  data-testid="button-prev-track"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={skipBackward}
              className="h-8 w-8"
              data-testid="button-skip-back"
            >
              <Rewind className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600"
              disabled={showLockedOverlay && !isOwned}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={skipForward}
              className="h-8 w-8"
              data-testid="button-skip-forward"
            >
              <FastForward className="w-4 h-4" />
            </Button>
            {playlist.length > 0 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNextTrack}
                  className="h-8 w-8"
                  data-testid="button-next-track"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleRepeat}
                  className={`h-7 w-7 ${repeatMode !== "none" ? "text-orange-500" : ""}`}
                  data-testid="button-repeat"
                >
                  {repeatMode === "one" ? <Repeat1 className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={changePlaybackRate}
              className="text-xs h-7 px-2"
              data-testid="button-playback-rate"
            >
              {playbackRate}x
            </Button>

            {qualityOptions.length > 0 && (
              <Select value={currentQuality} onValueChange={changeQuality}>
                <SelectTrigger className="h-7 w-20 text-xs" data-testid="select-quality">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  {qualityOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-1 w-24">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="h-7 w-7"
                data-testid="button-mute"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={([v]) => changeVolume(v)}
                max={1}
                step={0.1}
                className="w-16"
                data-testid="slider-volume"
              />
            </div>

            {allowBookmarks && isOwned && (
              <Button
                size="icon"
                variant="ghost"
                onClick={addBookmark}
                className="h-7 w-7"
                data-testid="button-add-bookmark"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            )}

            {chapters.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowChapters(!showChapters)}
                className="h-7 w-7"
                data-testid="button-chapters"
              >
                <List className="w-4 h-4" />
              </Button>
            )}

            {playlist.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="h-7 w-7"
                data-testid="button-playlist"
              >
                {showPlaylist ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            )}

            {allowDownload && isOwned && !isLocked && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDownload}
                className="h-7 w-7"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {showChapters && chapters.length > 0 && (
          <div className="border-t border-orange-500/20 pt-2 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Chapters</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowChapters(false)}
                className="h-5 w-5"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(chapter)}
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between ${
                    currentChapter?.id === chapter.id
                      ? "bg-orange-500/20 text-orange-400"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                  data-testid={`chapter-${chapter.id}`}
                >
                  <span className="truncate">{chapter.title}</span>
                  <span className="text-gray-500 ml-2">{formatTime(chapter.startTime)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showPlaylist && playlist.length > 0 && (
          <div className="border-t border-orange-500/20 pt-2 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">
                Playlist ({playlist.length} items)
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPlaylist(false)}
                className="h-5 w-5"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {playlist.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => playPlaylistItem(index)}
                  disabled={item.isLocked && !isOwned}
                  className={`w-full text-left p-2 rounded text-xs flex items-center gap-2 ${
                    currentPlaylistIndex === index
                      ? "bg-orange-500/20 text-orange-400"
                      : item.isLocked && !isOwned
                      ? "opacity-50 cursor-not-allowed text-gray-500"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                  data-testid={`playlist-item-${item.id}`}
                >
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center shrink-0">
                    {currentPlaylistIndex === index && isPlaying ? (
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-orange-500 animate-pulse" />
                        <div className="w-0.5 h-2 bg-orange-500 animate-pulse delay-75" />
                        <div className="w-0.5 h-4 bg-orange-500 animate-pulse delay-150" />
                      </div>
                    ) : item.isLocked && !isOwned ? (
                      <Lock className="w-3 h-3" />
                    ) : item.coverImage ? (
                      <img src={item.coverImage} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <Music className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    {item.artist && <p className="truncate text-gray-500">{item.artist}</p>}
                  </div>
                  {item.duration && (
                    <span className="text-gray-500">{formatTime(item.duration)}</span>
                  )}
                  {currentPlaylistIndex === index && (
                    <Check className="w-4 h-4 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {bookmarks.length > 0 && (
          <div className="border-t border-orange-500/20 pt-2 mt-2">
            <span className="text-xs font-medium text-gray-400 mb-1 block">Bookmarks</span>
            <div className="flex flex-wrap gap-1">
              {bookmarks.map((bookmark) => (
                <Badge
                  key={bookmark.id}
                  variant="outline"
                  className="text-[10px] cursor-pointer hover:bg-blue-500/20"
                  onClick={() => seek(bookmark.time)}
                  data-testid={`badge-bookmark-${bookmark.id}`}
                >
                  <BookmarkCheck className="w-3 h-3 mr-1 text-blue-400" />
                  {formatTime(bookmark.time)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
