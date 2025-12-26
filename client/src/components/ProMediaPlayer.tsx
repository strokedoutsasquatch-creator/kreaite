import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
}

interface Bookmark {
  id: string;
  time: number;
  label: string;
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
}: ProMediaPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      onTimeUpdate?.(media.currentTime);

      const chapter = chapters.find(
        (c) => media.currentTime >= c.startTime && (!c.endTime || media.currentTime < c.endTime)
      );
      setCurrentChapter(chapter || null);
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("ended", handleEnded);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("ended", handleEnded);
    };
  }, [chapters, onTimeUpdate, onEnded]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = time;
    setCurrentTime(time);
  };

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
    const newBookmark: Bookmark = {
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

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="bg-black border-orange-500/20 overflow-hidden" data-testid="pro-media-player">
      {type === "video" ? (
        <div className="relative aspect-video bg-black">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            className="w-full h-full"
            poster={coverImage}
            data-testid="video-element"
          />
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              data-testid="button-play-overlay"
            >
              <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 flex items-center gap-4">
          {coverImage && (
            <img src={coverImage} alt={title} className="w-16 h-16 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{title || "Untitled"}</h3>
            {artist && <p className="text-xs text-gray-400 truncate">{artist}</p>}
            {currentChapter && (
              <Badge variant="outline" className="text-[10px] mt-1">
                {currentChapter.title}
              </Badge>
            )}
          </div>
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} data-testid="audio-element" />
        </div>
      )}

      <CardContent className="p-3 space-y-3">
        <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden cursor-pointer group">
          <div
            className="absolute inset-y-0 left-0 bg-orange-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
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

            {allowBookmarks && (
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

            {allowDownload && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => window.open(src, "_blank")}
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
