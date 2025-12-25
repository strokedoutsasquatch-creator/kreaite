import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Move,
  Square,
  Crop,
  Paintbrush,
  Eraser,
  Type,
  Circle,
  Pipette,
  Hand,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Layers,
  ChevronUp,
  ChevronDown,
  Undo,
  Redo,
  Download,
  X,
  Save,
  Sparkles,
  Wand2,
  SunMedium,
  Contrast,
  Image as ImageIcon,
  Loader2,
  MousePointer2,
  Upload,
  Copy,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Scissors,
  Video,
  Music,
  Film,
  Share2,
  Link,
  Magnet,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Zap,
  Grid3X3,
  Bot,
  ImagePlus,
  VideoIcon,
  Gauge,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MediaStudioProps {
  mode?: 'image' | 'video';
  initialMedia?: string;
  projectId?: string;
  onSave?: (projectData: any) => void;
  onExport?: (exportData: { url: string; format: string }) => void;
  onClose?: () => void;
}

interface Layer {
  id: string;
  name: string;
  imageData: string | null;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  x: number;
  y: number;
}

interface Track {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effects';
  name: string;
  locked: boolean;
  muted: boolean;
  color: string;
}

interface Clip {
  id: string;
  trackId: string;
  assetId?: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  text?: string;
  textStyle?: {
    font: string;
    size: number;
    color: string;
    animation: string;
  };
  effectType?: string;
  name: string;
}

interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  url: string;
  duration?: number;
  thumbnail?: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  exposure: number;
}

type ToolType = 'move' | 'select' | 'crop' | 'brush' | 'eraser' | 'text' | 'shape' | 'eyedropper' | 'hand' | 'zoom';

const tools: { id: ToolType; icon: typeof Move; label: string; shortcut: string }[] = [
  { id: 'move', icon: Move, label: 'Move', shortcut: 'V' },
  { id: 'select', icon: MousePointer2, label: 'Selection', shortcut: 'M' },
  { id: 'crop', icon: Crop, label: 'Crop', shortcut: 'C' },
  { id: 'brush', icon: Paintbrush, label: 'Brush', shortcut: 'B' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'shape', icon: Square, label: 'Shape', shortcut: 'U' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
  { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom', shortcut: 'Z' },
];

const defaultAdjustments: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  exposure: 100,
};

const defaultTracks: Track[] = [
  { id: 'video-1', type: 'video', name: 'Video 1', locked: false, muted: false, color: '#3B82F6' },
  { id: 'video-2', type: 'video', name: 'Video 2', locked: false, muted: false, color: '#8B5CF6' },
  { id: 'audio-1', type: 'audio', name: 'Audio 1', locked: false, muted: false, color: '#10B981' },
  { id: 'audio-2', type: 'audio', name: 'Audio 2', locked: false, muted: false, color: '#14B8A6' },
  { id: 'text-1', type: 'text', name: 'Text', locked: false, muted: false, color: '#F59E0B' },
  { id: 'effects-1', type: 'effects', name: 'Effects', locked: false, muted: false, color: '#EC4899' },
];

const transitionPresets = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade' },
  { id: 'slide-left', name: 'Slide Left' },
  { id: 'slide-right', name: 'Slide Right' },
  { id: 'zoom-in', name: 'Zoom In' },
  { id: 'zoom-out', name: 'Zoom Out' },
  { id: 'dissolve', name: 'Dissolve' },
  { id: 'wipe', name: 'Wipe' },
];

const textAnimationPresets = [
  { id: 'none', name: 'None' },
  { id: 'fade-in', name: 'Fade In' },
  { id: 'slide-up', name: 'Slide Up' },
  { id: 'slide-down', name: 'Slide Down' },
  { id: 'typewriter', name: 'Typewriter' },
  { id: 'bounce', name: 'Bounce' },
  { id: 'scale', name: 'Scale' },
];

const speedPresets = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

const blendModes = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
];

export default function MediaStudio({
  mode: initialMode = 'video',
  initialMedia,
  projectId,
  onSave,
  onExport,
  onClose,
}: MediaStudioProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'image' | 'video'>(initialMode);
  const [projectName, setProjectName] = useState('Untitled Project');
  
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  const [timelineZoom, setTimelineZoom] = useState(50);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(20);
  
  const [selectedTool, setSelectedTool] = useState<ToolType>('move');
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportQuality, setExportQuality] = useState(80);
  const [exportResolution, setExportResolution] = useState('1080p');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('clips');
  
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#FF6B35');
  
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [resizingClip, setResizingClip] = useState<{ id: string; edge: 'left' | 'right' } | null>(null);

  useEffect(() => {
    setPixelsPerSecond(10 + (timelineZoom / 100) * 40);
  }, [timelineZoom]);

  useEffect(() => {
    if (initialMedia) {
      if (mode === 'image') {
        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: 'Background',
          imageData: initialMedia,
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal',
          x: 0,
          y: 0,
        };
        setLayers([newLayer]);
        setActiveLayerId(newLayer.id);
      } else {
        const newAsset: Asset = {
          id: `asset-${Date.now()}`,
          type: 'video',
          name: 'Main Video',
          url: initialMedia,
          duration: 60,
        };
        setAssets([newAsset]);
        const newClip: Clip = {
          id: `clip-${Date.now()}`,
          trackId: 'video-1',
          assetId: newAsset.id,
          startTime: 0,
          duration: 60,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          name: 'Main Video',
        };
        setClips([newClip]);
      }
      addToHistory('Load Media');
    } else {
      if (mode === 'image') {
        const bgLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: 'Background',
          imageData: null,
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal',
          x: 0,
          y: 0,
        };
        setLayers([bgLayer]);
        setActiveLayerId(bgLayer.id);
      }
    }
  }, [initialMedia, mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && mode === 'video') {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, mode]);

  const addToHistory = useCallback((action: string) => {
    const entry: HistoryEntry = {
      id: `history-${Date.now()}`,
      action,
      timestamp: new Date(),
    };
    setHistory(prev => [...prev.slice(0, historyIndex + 1), entry]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      toast({ title: 'Undo', description: 'Action undone' });
    }
  }, [historyIndex, toast]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      toast({ title: 'Redo', description: 'Action redone' });
    }
  }, [history.length, historyIndex, toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');
        const isImage = file.type.startsWith('image/');

        if (mode === 'video') {
          const newAsset: Asset = {
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
            name: file.name,
            url,
            duration: isVideo || isAudio ? 30 : undefined,
          };
          setAssets(prev => [...prev, newAsset]);

          if (isVideo || isImage) {
            const trackId = isVideo ? 'video-1' : 'text-1';
            const newClip: Clip = {
              id: `clip-${Date.now()}`,
              trackId,
              assetId: newAsset.id,
              startTime: clips.length > 0 ? Math.max(...clips.map(c => c.startTime + c.duration)) : 0,
              duration: newAsset.duration || 5,
              trimStart: 0,
              trimEnd: 0,
              speed: 1,
              name: file.name,
            };
            setClips(prev => [...prev, newClip]);
          } else if (isAudio) {
            const newClip: Clip = {
              id: `clip-${Date.now()}`,
              trackId: 'audio-1',
              assetId: newAsset.id,
              startTime: 0,
              duration: newAsset.duration || 30,
              trimStart: 0,
              trimEnd: 0,
              speed: 1,
              name: file.name,
            };
            setClips(prev => [...prev, newClip]);
          }
        } else if (isImage) {
          const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            name: file.name.split('.')[0],
            imageData: url,
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            x: 0,
            y: 0,
          };
          setLayers(prev => [...prev, newLayer]);
          setActiveLayerId(newLayer.id);
        }

        addToHistory(`Import ${file.name}`);
        toast({ title: 'Media Added', description: `${file.name} has been imported.` });
      };
      reader.readAsDataURL(file);
    });
  }, [mode, clips, addToHistory, toast]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const skipBackward = useCallback(() => {
    setCurrentTime(prev => Math.max(0, prev - 5));
  }, []);

  const skipForward = useCallback(() => {
    setCurrentTime(prev => Math.min(duration, prev + 5));
  }, [duration]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = x / pixelsPerSecond;
    setCurrentTime(Math.max(0, Math.min(duration, newTime)));
  }, [pixelsPerSecond, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      imageData: null,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    addToHistory('Add Layer');
  }, [layers.length, addToHistory]);

  const deleteLayer = useCallback((id: string) => {
    if (layers.length <= 1) {
      toast({ title: 'Cannot Delete', description: 'At least one layer must exist.', variant: 'destructive' });
      return;
    }
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(layers[0]?.id || null);
    }
    addToHistory('Delete Layer');
  }, [layers, activeLayerId, addToHistory, toast]);

  const addTrack = useCallback((type: Track['type']) => {
    const count = tracks.filter(t => t.type === type).length + 1;
    const colors = {
      video: '#3B82F6',
      audio: '#10B981',
      text: '#F59E0B',
      effects: '#EC4899',
    };
    const newTrack: Track = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
      locked: false,
      muted: false,
      color: colors[type],
    };
    setTracks(prev => [...prev, newTrack]);
    addToHistory(`Add ${type} track`);
  }, [tracks, addToHistory]);

  const addTextClip = useCallback(() => {
    const textTrack = tracks.find(t => t.type === 'text');
    if (!textTrack) return;

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      trackId: textTrack.id,
      startTime: currentTime,
      duration: 5,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      name: 'Text',
      text: 'Enter text here',
      textStyle: {
        font: 'Arial',
        size: 48,
        color: '#ffffff',
        animation: 'none',
      },
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    addToHistory('Add Text');
  }, [tracks, currentTime, addToHistory]);

  const splitClipAtPlayhead = useCallback(() => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) {
      toast({ title: 'Cannot Split', description: 'Playhead must be within the clip', variant: 'destructive' });
      return;
    }

    const splitPoint = currentTime - clip.startTime;
    const clip1: Clip = { ...clip, duration: splitPoint };
    const clip2: Clip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: currentTime,
      duration: clip.duration - splitPoint,
      trimStart: clip.trimStart + splitPoint,
      name: `${clip.name} (2)`,
    };

    setClips(prev => prev.map(c => c.id === clip.id ? clip1 : c).concat(clip2));
    addToHistory('Split Clip');
    toast({ title: 'Clip Split', description: 'Clip has been split at playhead' });
  }, [selectedClipId, clips, currentTime, addToHistory, toast]);

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    setClips(prev => prev.filter(c => c.id !== selectedClipId));
    setSelectedClipId(null);
    addToHistory('Delete Clip');
  }, [selectedClipId, addToHistory]);

  const duplicateClip = useCallback(() => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    const newClip: Clip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: clip.startTime + clip.duration,
      name: `${clip.name} (copy)`,
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    addToHistory('Duplicate Clip');
  }, [selectedClipId, clips, addToHistory]);

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: 'Background Removed', description: 'AI has removed the background.' });
      addToHistory('Remove Background');
    } catch {
      toast({ title: 'Error', description: 'Failed to remove background.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast({ title: 'Image Generated', description: 'AI image has been generated.' });
      addToHistory('Generate Image');
    } catch {
      toast({ title: 'Error', description: 'Failed to generate image.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast({ title: 'Video Generated', description: 'AI video has been generated.' });
      addToHistory('Generate Video');
    } catch {
      toast({ title: 'Error', description: 'Failed to generate video.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoEnhance = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAdjustments({
        brightness: 105,
        contrast: 110,
        saturation: 115,
        hue: 0,
        exposure: 102,
      });
      toast({ title: 'Enhanced', description: 'Auto enhancement applied.' });
      addToHistory('Auto Enhance');
    } catch {
      toast({ title: 'Error', description: 'Failed to enhance.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProject = useCallback(() => {
    const projectData = {
      id: projectId || `project-${Date.now()}`,
      name: projectName,
      mode,
      layers,
      tracks,
      clips,
      assets,
      duration,
      adjustments,
    };
    onSave?.(projectData);
    toast({ title: 'Saved!', description: `Project "${projectName}" saved successfully.` });
    setIsSaveDialogOpen(false);
  }, [projectId, projectName, mode, layers, tracks, clips, assets, duration, adjustments, onSave, toast]);

  const handleExport = useCallback(() => {
    const exportData = {
      url: 'exported-media-url',
      format: exportFormat,
    };
    onExport?.(exportData);
    toast({ 
      title: 'Export Started', 
      description: `Exporting ${mode} as ${exportFormat.toUpperCase()} at ${exportResolution}` 
    });
    setIsExportDialogOpen(false);
  }, [mode, exportFormat, exportResolution, onExport, toast]);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(`https://mediastudio.app/share/${projectId || 'new'}`);
    toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);
  const activeLayer = layers.find(l => l.id === activeLayerId);

  const renderTimeRuler = () => {
    const marks = [];
    const step = 5;
    for (let i = 0; i <= duration; i += step) {
      marks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: i * pixelsPerSecond }}
        >
          <span className="text-xs text-gray-500">{formatTime(i).slice(0, 5)}</span>
          <div className="h-2 w-px bg-gray-600" />
        </div>
      );
    }
    return marks;
  };

  const renderClips = (trackId: string) => {
    return clips
      .filter(clip => clip.trackId === trackId)
      .map(clip => {
        const track = tracks.find(t => t.id === trackId);
        const isSelected = clip.id === selectedClipId;
        const width = clip.duration * pixelsPerSecond;
        const left = clip.startTime * pixelsPerSecond;

        return (
          <div
            key={clip.id}
            className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-orange-500 z-10' : ''
            }`}
            style={{
              left,
              width,
              backgroundColor: track?.color || '#3B82F6',
            }}
            onClick={() => setSelectedClipId(clip.id)}
            data-testid={`clip-${clip.id}`}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
              onMouseDown={(e) => {
                e.stopPropagation();
                setResizingClip({ id: clip.id, edge: 'left' });
              }}
            />
            <div className="px-2 py-1 truncate text-xs font-medium text-white">
              {clip.text || clip.name}
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
              onMouseDown={(e) => {
                e.stopPropagation();
                setResizingClip({ id: clip.id, edge: 'right' });
              }}
            />
          </div>
        );
      });
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white" data-testid="media-studio">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*,audio/*"
        multiple
        onChange={handleFileUpload}
      />

      <header className="flex items-center justify-between h-12 px-3 bg-[#1a1a1a] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm">MediaStudio</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-gray-700" />
          
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <Button
              size="sm"
              variant={mode === 'image' ? 'secondary' : 'ghost'}
              className={`h-7 px-3 text-xs ${mode === 'image' ? 'bg-orange-500 text-black' : ''}`}
              onClick={() => setMode('image')}
              data-testid="button-mode-image"
            >
              <ImageIcon className="w-3.5 h-3.5 mr-1" />
              Image
            </Button>
            <Button
              size="sm"
              variant={mode === 'video' ? 'secondary' : 'ghost'}
              className={`h-7 px-3 text-xs ${mode === 'video' ? 'bg-orange-500 text-black' : ''}`}
              onClick={() => setMode('video')}
              data-testid="button-mode-video"
            >
              <Video className="w-3.5 h-3.5 mr-1" />
              Video
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-gray-700" />
          
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={undo}
              disabled={historyIndex <= 0}
              data-testid="button-undo"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              data-testid="button-redo"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1"
            data-testid="button-upload"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSaveDialogOpen(true)}
            className="gap-1"
            data-testid="button-save"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-black gap-1"
            onClick={() => setIsExportDialogOpen(true)}
            data-testid="button-export"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsShareDialogOpen(true)}
            className="gap-1"
            data-testid="button-share"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          {onClose && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} data-testid="button-close">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-14 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-2 gap-1">
          {tools.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={selectedTool === tool.id ? 'secondary' : 'ghost'}
                  className={`h-10 w-10 ${selectedTool === tool.id ? 'bg-orange-500/20 text-orange-500' : ''}`}
                  onClick={() => setSelectedTool(tool.id)}
                  data-testid={`button-tool-${tool.id}`}
                >
                  <tool.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          ))}
          <Separator className="my-2 w-8 bg-gray-700" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                onClick={() => setCanvasZoom(prev => Math.max(25, prev - 25))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom Out</TooltipContent>
          </Tooltip>
          <span className="text-xs text-gray-400">{canvasZoom}%</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                onClick={() => setCanvasZoom(prev => Math.min(400, prev + 25))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom In</TooltipContent>
          </Tooltip>
        </aside>

        <main className="flex-1 flex flex-col bg-black overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {mode === 'video' ? (
              <div
                className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
                style={{
                  width: `${(16 * 30) * (canvasZoom / 100)}px`,
                  height: `${(9 * 30) * (canvasZoom / 100)}px`,
                }}
              >
                {initialMedia ? (
                  <video
                    ref={videoRef}
                    src={initialMedia}
                    className="w-full h-full object-contain"
                    style={{
                      filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg)`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No video loaded</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Import Media
                      </Button>
                    </div>
                  </div>
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700"
                >
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
                style={{
                  width: `${800 * (canvasZoom / 100)}px`,
                  height: `${600 * (canvasZoom / 100)}px`,
                }}
              >
                {layers.map(layer => (
                  layer.visible && layer.imageData && (
                    <img
                      key={layer.id}
                      src={layer.imageData}
                      alt={layer.name}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{
                        opacity: layer.opacity / 100,
                        mixBlendMode: layer.blendMode as any,
                        filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg)`,
                      }}
                    />
                  )
                ))}
                {layers.every(l => !l.imageData) && (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No image loaded</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Import Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {mode === 'video' && (
            <div className="bg-[#1a1a1a] border-t border-gray-800">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={skipBackward}
                    data-testid="button-skip-back"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 bg-orange-500 text-black hover:bg-orange-600"
                    onClick={togglePlayPause}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={skipForward}
                    data-testid="button-skip-forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-mono text-gray-300 ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsMuted(!isMuted)}
                      data-testid="button-mute"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={([v]) => {
                        setVolume(v);
                        setIsMuted(v === 0);
                      }}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>

                  <Separator orientation="vertical" className="h-6 bg-gray-700" />

                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-4 h-4 text-gray-500" />
                    <Slider
                      value={[timelineZoom]}
                      onValueChange={([v]) => setTimelineZoom(v)}
                      min={10}
                      max={200}
                      step={10}
                      className="w-24"
                    />
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                  </div>

                  <Button
                    size="sm"
                    variant={snapToGrid ? 'secondary' : 'ghost'}
                    className={`gap-1 h-7 ${snapToGrid ? 'bg-orange-500/20 text-orange-500' : ''}`}
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    data-testid="button-snap"
                  >
                    <Magnet className="w-3.5 h-3.5" />
                    Snap
                  </Button>

                  <Select onValueChange={(v) => addTrack(v as Track['type'])}>
                    <SelectTrigger className="w-28 h-7 bg-gray-800 border-gray-700">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <SelectValue placeholder="Add Track" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Track</SelectItem>
                      <SelectItem value="audio">Audio Track</SelectItem>
                      <SelectItem value="text">Text Track</SelectItem>
                      <SelectItem value="effects">Effects Track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative h-8 border-b border-gray-800 bg-gray-900/50 overflow-hidden">
                <div
                  ref={timelineRef}
                  className="absolute inset-0 cursor-pointer"
                  style={{ width: duration * pixelsPerSecond }}
                  onClick={handleTimelineClick}
                >
                  {renderTimeRuler()}
                </div>
              </div>

              <ScrollArea className="h-48">
                <div className="min-w-max" style={{ width: duration * pixelsPerSecond + 200 }}>
                  {tracks.map(track => (
                    <div key={track.id} className="flex border-b border-gray-800">
                      <div className="w-32 flex-shrink-0 px-2 py-1 bg-gray-900 border-r border-gray-800 flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: track.color }} />
                        <span className="text-xs text-gray-400 truncate">{track.name}</span>
                        <div className="flex-1" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => {
                            setTracks(prev => prev.map(t => 
                              t.id === track.id ? { ...t, muted: !t.muted } : t
                            ));
                          }}
                          data-testid={`button-mute-track-${track.id}`}
                        >
                          {track.muted ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => {
                            setTracks(prev => prev.map(t => 
                              t.id === track.id ? { ...t, locked: !t.locked } : t
                            ));
                          }}
                          data-testid={`button-lock-track-${track.id}`}
                        >
                          {track.locked ? <Lock className="w-3 h-3 text-yellow-500" /> : <Unlock className="w-3 h-3" />}
                        </Button>
                      </div>
                      <div
                        className="flex-1 h-10 relative bg-gray-900/30"
                        style={{ width: duration * pixelsPerSecond }}
                      >
                        {renderClips(track.id)}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-500 pointer-events-none z-20"
                  style={{ left: 128 + currentTime * pixelsPerSecond }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rotate-45" />
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-800">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 h-7"
                  onClick={splitClipAtPlayhead}
                  disabled={!selectedClipId}
                  data-testid="button-split"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Split
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 h-7"
                  onClick={deleteSelectedClip}
                  disabled={!selectedClipId}
                  data-testid="button-delete-clip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 h-7"
                  onClick={duplicateClip}
                  disabled={!selectedClipId}
                  data-testid="button-duplicate-clip"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 h-7"
                  onClick={addTextClip}
                  data-testid="button-add-text"
                >
                  <Type className="w-3.5 h-3.5" />
                  Add Text
                </Button>

                {selectedClip && (
                  <>
                    <Separator orientation="vertical" className="h-5 bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-400">Speed:</Label>
                      <Select
                        value={selectedClip.speed.toString()}
                        onValueChange={(v) => {
                          setClips(prev => prev.map(c => 
                            c.id === selectedClipId ? { ...c, speed: parseFloat(v) } : c
                          ));
                        }}
                      >
                        <SelectTrigger className="w-20 h-7 bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {speedPresets.map(s => (
                            <SelectItem key={s.value} value={s.value.toString()}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="w-72 bg-[#1a1a1a] border-l border-gray-800 flex flex-col">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex flex-col flex-1">
            <TabsList className="w-full justify-start rounded-none border-b border-gray-800 bg-transparent h-10 px-2">
              {mode === 'video' ? (
                <>
                  <TabsTrigger value="clips" className="text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
                    <Film className="w-3.5 h-3.5 mr-1" />
                    Clips
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    Assets
                  </TabsTrigger>
                </>
              ) : (
                <TabsTrigger value="layers" className="text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Layers
                </TabsTrigger>
              )}
              <TabsTrigger value="adjust" className="text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
                <SunMedium className="w-3.5 h-3.5 mr-1" />
                Adjust
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                AI
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {mode === 'video' && (
                <>
                  <TabsContent value="clips" className="m-0 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Clip Properties</h3>
                    </div>
                    {selectedClip ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Name</Label>
                          <Input
                            value={selectedClip.name}
                            onChange={(e) => {
                              setClips(prev => prev.map(c => 
                                c.id === selectedClipId ? { ...c, name: e.target.value } : c
                              ));
                            }}
                            className="h-8 bg-gray-800 border-gray-700"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-400">Start</Label>
                            <Input
                              value={formatTime(selectedClip.startTime)}
                              readOnly
                              className="h-7 text-xs bg-gray-800 border-gray-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-400">Duration</Label>
                            <Input
                              value={formatTime(selectedClip.duration)}
                              readOnly
                              className="h-7 text-xs bg-gray-800 border-gray-700"
                            />
                          </div>
                        </div>

                        {selectedClip.text !== undefined && (
                          <>
                            <Separator className="bg-gray-700" />
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-400">Text Content</Label>
                              <Input
                                value={selectedClip.text}
                                onChange={(e) => {
                                  setClips(prev => prev.map(c => 
                                    c.id === selectedClipId ? { ...c, text: e.target.value } : c
                                  ));
                                }}
                                className="h-8 bg-gray-800 border-gray-700"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-400">Font Size</Label>
                              <Slider
                                value={[selectedClip.textStyle?.size || 48]}
                                onValueChange={([v]) => {
                                  setClips(prev => prev.map(c => 
                                    c.id === selectedClipId ? { 
                                      ...c, 
                                      textStyle: { ...c.textStyle!, size: v } 
                                    } : c
                                  ));
                                }}
                                min={12}
                                max={200}
                                step={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-400">Animation</Label>
                              <Select
                                value={selectedClip.textStyle?.animation || 'none'}
                                onValueChange={(v) => {
                                  setClips(prev => prev.map(c => 
                                    c.id === selectedClipId ? { 
                                      ...c, 
                                      textStyle: { ...c.textStyle!, animation: v } 
                                    } : c
                                  ));
                                }}
                              >
                                <SelectTrigger className="h-8 bg-gray-800 border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {textAnimationPresets.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-400">Color</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={selectedClip.textStyle?.color || '#ffffff'}
                                  onChange={(e) => {
                                    setClips(prev => prev.map(c => 
                                      c.id === selectedClipId ? { 
                                        ...c, 
                                        textStyle: { ...c.textStyle!, color: e.target.value } 
                                      } : c
                                    ));
                                  }}
                                  className="w-10 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                                />
                                <Input
                                  value={selectedClip.textStyle?.color || '#ffffff'}
                                  onChange={(e) => {
                                    setClips(prev => prev.map(c => 
                                      c.id === selectedClipId ? { 
                                        ...c, 
                                        textStyle: { ...c.textStyle!, color: e.target.value } 
                                      } : c
                                    ));
                                  }}
                                  className="h-8 bg-gray-800 border-gray-700 font-mono text-xs"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <Separator className="bg-gray-700" />
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Transition</Label>
                          <Select defaultValue="none">
                            <SelectTrigger className="h-8 bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {transitionPresets.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Select a clip to edit</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="assets" className="m-0 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Media Assets</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-add-asset"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {assets.length > 0 ? (
                      <div className="space-y-2">
                        {assets.map(asset => (
                          <div
                            key={asset.id}
                            className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
                            data-testid={`asset-${asset.id}`}
                          >
                            <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
                              {asset.type === 'video' && <Video className="w-5 h-5 text-blue-400" />}
                              {asset.type === 'audio' && <Music className="w-5 h-5 text-green-400" />}
                              {asset.type === 'image' && <ImageIcon className="w-5 h-5 text-purple-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{asset.name}</p>
                              <p className="text-xs text-gray-500">
                                {asset.duration ? formatTime(asset.duration) : 'Image'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No assets imported</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Import Media
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </>
              )}

              {mode === 'image' && (
                <TabsContent value="layers" className="m-0 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Layers</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={addLayer}
                      data-testid="button-add-layer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {[...layers].reverse().map((layer, index) => (
                      <div
                        key={layer.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          activeLayerId === layer.id ? 'bg-orange-500/20 ring-1 ring-orange-500' : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                        onClick={() => setActiveLayerId(layer.id)}
                        data-testid={`layer-${layer.id}`}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, visible: !l.visible } : l
                            ));
                          }}
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-500" />}
                        </Button>
                        <div className="w-8 h-8 bg-gray-900 rounded overflow-hidden">
                          {layer.imageData && (
                            <img src={layer.imageData} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="flex-1 text-xs truncate">{layer.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, locked: !l.locked } : l
                            ));
                          }}
                        >
                          {layer.locked ? <Lock className="w-3.5 h-3.5 text-yellow-500" /> : <Unlock className="w-3.5 h-3.5 text-gray-500" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {activeLayer && (
                    <>
                      <Separator className="bg-gray-700" />
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-gray-400">Opacity</Label>
                            <span className="text-xs text-gray-400">{activeLayer.opacity}%</span>
                          </div>
                          <Slider
                            value={[activeLayer.opacity]}
                            onValueChange={([v]) => {
                              setLayers(prev => prev.map(l => 
                                l.id === activeLayerId ? { ...l, opacity: v } : l
                              ));
                            }}
                            max={100}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Blend Mode</Label>
                          <Select
                            value={activeLayer.blendMode}
                            onValueChange={(v) => {
                              setLayers(prev => prev.map(l => 
                                l.id === activeLayerId ? { ...l, blendMode: v } : l
                              ));
                            }}
                          >
                            <SelectTrigger className="h-8 bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {blendModes.map(b => (
                                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              )}

              <TabsContent value="adjust" className="m-0 p-3 space-y-4">
                <h3 className="text-sm font-medium">Adjustments</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <SunMedium className="w-3.5 h-3.5" />
                        Brightness
                      </Label>
                      <span className="text-xs text-gray-400">{adjustments.brightness}%</span>
                    </div>
                    <Slider
                      value={[adjustments.brightness]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, brightness: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <Contrast className="w-3.5 h-3.5" />
                        Contrast
                      </Label>
                      <span className="text-xs text-gray-400">{adjustments.contrast}%</span>
                    </div>
                    <Slider
                      value={[adjustments.contrast]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, contrast: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        Saturation
                      </Label>
                      <span className="text-xs text-gray-400">{adjustments.saturation}%</span>
                    </div>
                    <Slider
                      value={[adjustments.saturation]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, saturation: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <Grid3X3 className="w-3.5 h-3.5" />
                        Hue Rotate
                      </Label>
                      <span className="text-xs text-gray-400">{adjustments.hue}°</span>
                    </div>
                    <Slider
                      value={[adjustments.hue]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, hue: v }))}
                      min={-180}
                      max={180}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5" />
                        Exposure
                      </Label>
                      <span className="text-xs text-gray-400">{adjustments.exposure}%</span>
                    </div>
                    <Slider
                      value={[adjustments.exposure]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, exposure: v }))}
                      min={50}
                      max={150}
                      step={1}
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setAdjustments(defaultAdjustments)}
                  data-testid="button-reset-adjustments"
                >
                  Reset All
                </Button>
              </TabsContent>

              <TabsContent value="ai" className="m-0 p-3 space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  AI Tools
                </h3>
                
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700"
                    onClick={handleRemoveBackground}
                    disabled={isProcessing}
                    data-testid="button-remove-bg"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Remove Background
                  </Button>

                  <Button
                    className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700"
                    onClick={handleGenerateImage}
                    disabled={isProcessing}
                    data-testid="button-generate-image"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Generate Image
                  </Button>

                  <Button
                    className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700"
                    onClick={handleGenerateVideo}
                    disabled={isProcessing}
                    data-testid="button-generate-video"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
                    Generate Video
                  </Button>

                  <Button
                    className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700"
                    onClick={handleAutoEnhance}
                    disabled={isProcessing}
                    data-testid="button-auto-enhance"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Auto Enhance
                  </Button>

                  <Button
                    className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700"
                    disabled
                    data-testid="button-upscale"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Upscale (Coming Soon)
                  </Button>
                </div>

                <div className="pt-2 text-xs text-gray-500">
                  <p>AI tools use advanced machine learning to enhance and generate media content.</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>Enter a name for your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Project"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-black" onClick={handleSaveProject}>
              <Save className="w-4 h-4 mr-2" />
              Save Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Export {mode === 'video' ? 'Video' : 'Image'}</DialogTitle>
            <DialogDescription>Configure your export settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mode === 'video' ? (
                    <>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={exportResolution} onValueChange={setExportResolution}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (1280x720)</SelectItem>
                  <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                  <SelectItem value="4k">4K (3840x2160)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quality</Label>
                <span className="text-sm text-gray-400">{exportQuality}%</span>
              </div>
              <Slider
                value={[exportQuality]}
                onValueChange={([v]) => setExportQuality(v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-black" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
            <DialogDescription>Share your project with others</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`https://mediastudio.app/share/${projectId || 'new'}`}
                  readOnly
                  className="bg-gray-800 border-gray-700"
                />
                <Button variant="outline" onClick={handleCopyShareLink}>
                  <Link className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Separator className="bg-gray-700" />
            <div className="space-y-2">
              <Label>Share on Social</Label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">Twitter</Button>
                <Button variant="outline" className="flex-1">Facebook</Button>
                <Button variant="outline" className="flex-1">LinkedIn</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
