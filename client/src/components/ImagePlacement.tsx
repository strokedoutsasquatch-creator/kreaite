import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image,
  GripVertical,
  Trash2,
  Plus,
  Sparkles,
  Settings2,
  AlignLeft,
  AlignRight,
  AlignCenter,
  Maximize2,
  ArrowUpToLine,
  ArrowDownToLine,
  Lock,
  Unlock,
  Eye,
  Move,
  RefreshCw,
  Check,
  Wand2,
  Layout,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageAsset {
  id: number;
  url: string;
  filename: string;
  purpose: string;
}

export interface ImagePlacementData {
  id: number;
  imageAssetId: number;
  sectionId: number;
  pageNumber?: number;
  position: string;
  size: string;
  customWidth?: number;
  customHeight?: number;
  aspectRatioLocked?: boolean;
}

export interface Chapter {
  id: number;
  title: string;
}

export interface ImagePlacementProps {
  projectId: number;
  chapters: Chapter[];
  images: ImageAsset[];
  placements: ImagePlacementData[];
  onPlacementChange: (placements: ImagePlacementData[]) => void;
  mode: 'auto' | 'manual' | 'hybrid';
}

const POSITION_OPTIONS = [
  { value: 'left', label: 'Left Aligned', icon: AlignLeft, description: 'Text wraps around right' },
  { value: 'right', label: 'Right Aligned', icon: AlignRight, description: 'Text wraps around left' },
  { value: 'center', label: 'Center', icon: AlignCenter, description: 'Text above and below' },
  { value: 'full', label: 'Full Page', icon: Maximize2, description: 'Image takes entire page' },
  { value: 'header', label: 'Header', icon: ArrowUpToLine, description: 'Top of page, small' },
  { value: 'footer', label: 'Footer', icon: ArrowDownToLine, description: 'Bottom of page, small' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small', percentage: 25 },
  { value: 'medium', label: 'Medium', percentage: 50 },
  { value: 'large', label: 'Large', percentage: 75 },
  { value: 'full-width', label: 'Full Width', percentage: 100 },
  { value: 'custom', label: 'Custom', percentage: null },
];

interface PlacementItemProps {
  placement: ImagePlacementData;
  image: ImageAsset | undefined;
  chapters: Chapter[];
  onUpdate: (updated: ImagePlacementData) => void;
  onRemove: () => void;
  isAISuggested?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function PlacementItem({
  placement,
  image,
  chapters,
  onUpdate,
  onRemove,
  isAISuggested = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: PlacementItemProps) {
  const [aspectRatioLocked, setAspectRatioLocked] = useState(placement.aspectRatioLocked ?? true);
  const [showCustomSize, setShowCustomSize] = useState(placement.size === 'custom');

  const handlePositionChange = (value: string) => {
    onUpdate({ ...placement, position: value });
  };

  const handleSizeChange = (value: string) => {
    setShowCustomSize(value === 'custom');
    onUpdate({ ...placement, size: value });
  };

  const handleChapterChange = (value: string) => {
    onUpdate({ ...placement, sectionId: parseInt(value, 10) });
  };

  const handlePageChange = (value: number[]) => {
    onUpdate({ ...placement, pageNumber: value[0] });
  };

  const handleCustomWidthChange = (value: number[]) => {
    const newWidth = value[0];
    if (aspectRatioLocked && placement.customWidth && placement.customHeight) {
      const ratio = placement.customHeight / placement.customWidth;
      onUpdate({ ...placement, customWidth: newWidth, customHeight: Math.round(newWidth * ratio) });
    } else {
      onUpdate({ ...placement, customWidth: newWidth });
    }
  };

  const toggleAspectRatioLock = () => {
    setAspectRatioLocked(!aspectRatioLocked);
    onUpdate({ ...placement, aspectRatioLocked: !aspectRatioLocked });
  };

  const chapter = chapters.find(c => c.id === placement.sectionId);
  const positionOption = POSITION_OPTIONS.find(p => p.value === placement.position);
  const PositionIcon = positionOption?.icon || AlignCenter;

  if (!image) return null;

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-lg p-4 transition-all",
        isDragging && "ring-2 ring-primary opacity-75",
        isAISuggested && "border-primary/50"
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-testid={`placement-item-${placement.id}`}
    >
      {isAISuggested && (
        <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs bg-primary/20 text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Suggested
        </Badge>
      )}

      <div className="flex gap-4">
        <div
          className="cursor-grab active:cursor-grabbing flex items-center text-muted-foreground"
          data-testid={`drag-handle-${placement.id}`}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <img
            src={image.url}
            alt={image.filename}
            className="w-full h-full object-cover"
            data-testid={`placement-image-${placement.id}`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{image.filename}</p>
              <p className="text-xs text-muted-foreground truncate">{image.purpose || 'No purpose specified'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive/70 hover:text-destructive"
              data-testid={`remove-placement-${placement.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Chapter</Label>
              <Select value={String(placement.sectionId)} onValueChange={handleChapterChange}>
                <SelectTrigger className="h-8 text-xs" data-testid={`chapter-select-${placement.id}`}>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={String(ch.id)}>
                      {ch.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Position</Label>
              <Select value={placement.position} onValueChange={handlePositionChange}>
                <SelectTrigger className="h-8 text-xs" data-testid={`position-select-${placement.id}`}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      <div className="flex items-center gap-2">
                        <pos.icon className="w-4 h-4" />
                        <span>{pos.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Select value={placement.size} onValueChange={handleSizeChange}>
              <SelectTrigger className="h-8 text-xs" data-testid={`size-select-${placement.id}`}>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label} {size.percentage && `(${size.percentage}%)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCustomSize && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Custom Dimensions</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleAspectRatioLock}
                  data-testid={`aspect-ratio-lock-${placement.id}`}
                >
                  {aspectRatioLocked ? (
                    <Lock className="w-3 h-3 text-primary" />
                  ) : (
                    <Unlock className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Width</Label>
                  <Slider
                    value={[placement.customWidth || 50]}
                    onValueChange={handleCustomWidthChange}
                    min={10}
                    max={100}
                    step={5}
                    className="flex-1"
                    data-testid={`custom-width-slider-${placement.id}`}
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {placement.customWidth || 50}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Page</Label>
            <Slider
              value={[placement.pageNumber || 1]}
              onValueChange={handlePageChange}
              min={1}
              max={100}
              step={1}
              className="flex-1"
              data-testid={`page-slider-${placement.id}`}
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {placement.pageNumber || 1}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PositionIcon className="w-3 h-3" />
          <span>{positionOption?.label}</span>
          <span className="text-border">|</span>
          <span>{chapter?.title || 'Unassigned'}</span>
          <span className="text-border">|</span>
          <span>Page {placement.pageNumber || 1}</span>
        </div>
      </div>
    </div>
  );
}

interface ImageThumbnailProps {
  image: ImageAsset;
  isPlaced: boolean;
  onAdd: () => void;
}

function ImageThumbnail({ image, isPlaced, onAdd }: ImageThumbnailProps) {
  return (
    <div
      className={cn(
        "group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border transition-all hover-elevate",
        isPlaced && "ring-2 ring-primary/50"
      )}
      data-testid={`image-thumbnail-${image.id}`}
    >
      <img
        src={image.url}
        alt={image.filename}
        className="w-full h-full object-cover"
      />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity"
      )}>
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-xs text-white truncate mb-2">{image.filename}</p>
          {!isPlaced ? (
            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={onAdd}
              data-testid={`add-image-${image.id}`}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          ) : (
            <Badge variant="secondary" className="w-full justify-center text-xs">
              <Check className="w-3 h-3 mr-1" />
              Placed
            </Badge>
          )}
        </div>
      </div>
      {isPlaced && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

interface PreviewPaneProps {
  placements: ImagePlacementData[];
  images: ImageAsset[];
  chapters: Chapter[];
}

function PreviewPane({ placements, images, chapters }: PreviewPaneProps) {
  const groupedPlacements = useMemo(() => {
    const grouped: Record<number, ImagePlacementData[]> = {};
    placements.forEach(p => {
      if (!grouped[p.sectionId]) {
        grouped[p.sectionId] = [];
      }
      grouped[p.sectionId].push(p);
    });
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    });
    return grouped;
  }, [placements]);

  return (
    <div className="space-y-4" data-testid="preview-pane">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Layout Preview</h4>
        <Badge variant="outline" className="text-xs">
          {placements.length} images placed
        </Badge>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {chapters.map(chapter => {
            const chapterPlacements = groupedPlacements[chapter.id] || [];
            return (
              <div key={chapter.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{chapter.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {chapterPlacements.length}
                  </Badge>
                </div>
                
                {chapterPlacements.length > 0 ? (
                  <div className="ml-6 space-y-2">
                    {chapterPlacements.map(placement => {
                      const image = images.find(i => i.id === placement.imageAssetId);
                      const positionOption = POSITION_OPTIONS.find(p => p.value === placement.position);
                      const PositionIcon = positionOption?.icon || AlignCenter;
                      
                      return (
                        <div
                          key={placement.id}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
                          data-testid={`preview-placement-${placement.id}`}
                        >
                          <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                            {image && (
                              <img
                                src={image.url}
                                alt={image.filename}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">
                              {image?.filename || 'Unknown image'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <PositionIcon className="w-3 h-3" />
                              <span>{positionOption?.label}</span>
                              <span>- Page {placement.pageNumber || 1}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="ml-6 text-xs text-muted-foreground">No images placed</p>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function ImagePlacement({
  projectId,
  chapters,
  images,
  placements,
  onPlacementChange,
  mode,
}: ImagePlacementProps) {
  const [selectedMode, setSelectedMode] = useState(mode);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [aiSuggestionIds, setAiSuggestionIds] = useState<Set<number>>(new Set());

  const placedImageIds = useMemo(() => {
    return new Set(placements.map(p => p.imageAssetId));
  }, [placements]);

  const handleAddPlacement = useCallback((imageId: number) => {
    const newPlacement: ImagePlacementData = {
      id: Date.now(),
      imageAssetId: imageId,
      sectionId: chapters[0]?.id || 1,
      pageNumber: 1,
      position: 'center',
      size: 'medium',
      aspectRatioLocked: true,
    };
    onPlacementChange([...placements, newPlacement]);
  }, [chapters, placements, onPlacementChange]);

  const handleUpdatePlacement = useCallback((id: number, updated: ImagePlacementData) => {
    onPlacementChange(placements.map(p => p.id === id ? updated : p));
    setAiSuggestionIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [placements, onPlacementChange]);

  const handleRemovePlacement = useCallback((id: number) => {
    onPlacementChange(placements.filter(p => p.id !== id));
    setAiSuggestionIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [placements, onPlacementChange]);

  const handleGenerateAISuggestions = useCallback(async () => {
    if (images.length === 0) return;

    setIsGeneratingAI(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const unplacedImages = images.filter(img => !placedImageIds.has(img.id));
    const newSuggestions: ImagePlacementData[] = unplacedImages.slice(0, 3).map((image, index) => {
      const positions = ['left', 'right', 'center'];
      const sizes = ['medium', 'large'];
      
      return {
        id: Date.now() + index,
        imageAssetId: image.id,
        sectionId: chapters[Math.min(index, chapters.length - 1)]?.id || 1,
        pageNumber: Math.floor(Math.random() * 20) + 1,
        position: positions[index % positions.length],
        size: sizes[index % sizes.length],
        aspectRatioLocked: true,
      };
    });

    const newIds = new Set(newSuggestions.map(s => s.id));
    setAiSuggestionIds(newIds);
    onPlacementChange([...placements, ...newSuggestions]);
    setIsGeneratingAI(false);
  }, [images, placedImageIds, chapters, placements, onPlacementChange]);

  const handleClearAllPlacements = useCallback(() => {
    onPlacementChange([]);
    setAiSuggestionIds(new Set());
  }, [onPlacementChange]);

  const handleAcceptAllSuggestions = useCallback(() => {
    setAiSuggestionIds(new Set());
  }, []);

  return (
    <div className="h-full flex flex-col bg-background" data-testid="image-placement-container">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layout className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Image Placement</h3>
            <p className="text-sm text-muted-foreground">
              Position images within your manuscript
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {(['auto', 'manual', 'hybrid'] as const).map((m) => (
              <Button
                key={m}
                variant={selectedMode === m ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMode(m)}
                className={cn(
                  "capitalize",
                  selectedMode === m && "bg-primary text-primary-foreground"
                )}
                data-testid={`mode-${m}`}
              >
                {m === 'auto' && <Sparkles className="w-4 h-4 mr-1" />}
                {m === 'manual' && <Move className="w-4 h-4 mr-1" />}
                {m === 'hybrid' && <Wand2 className="w-4 h-4 mr-1" />}
                {m}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-border p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-foreground">Available Images</h4>
            <Badge variant="outline" className="text-xs">
              {images.length}
            </Badge>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2 pr-2">
              {images.map(image => (
                <ImageThumbnail
                  key={image.id}
                  image={image}
                  isPlaced={placedImageIds.has(image.id)}
                  onAdd={() => handleAddPlacement(image.id)}
                />
              ))}
              {images.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center">
                  <Image className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No images available</p>
                  <p className="text-xs text-muted-foreground">Upload images to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {(selectedMode === 'auto' || selectedMode === 'hybrid') && (
            <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">AI Suggestions</span>
                {aiSuggestionIds.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {aiSuggestionIds.size} pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {aiSuggestionIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAcceptAllSuggestions}
                    data-testid="accept-all-suggestions"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept All
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleGenerateAISuggestions}
                  disabled={isGeneratingAI || images.length === 0}
                  data-testid="generate-ai-suggestions"
                >
                  {isGeneratingAI ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  {isGeneratingAI ? 'Analyzing...' : 'Generate Suggestions'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-foreground">
                Placements ({placements.length})
              </h4>
              {placements.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllPlacements}
                  className="text-destructive/70 hover:text-destructive"
                  data-testid="clear-all-placements"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="space-y-3 pr-4">
                {placements.map(placement => (
                  <PlacementItem
                    key={placement.id}
                    placement={placement}
                    image={images.find(i => i.id === placement.imageAssetId)}
                    chapters={chapters}
                    onUpdate={(updated) => handleUpdatePlacement(placement.id, updated)}
                    onRemove={() => handleRemovePlacement(placement.id)}
                    isAISuggested={aiSuggestionIds.has(placement.id)}
                    isDragging={draggedItem === placement.id}
                    onDragStart={() => setDraggedItem(placement.id)}
                    onDragEnd={() => setDraggedItem(null)}
                  />
                ))}
                {placements.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Layout className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">No placements yet</h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {selectedMode === 'auto' || selectedMode === 'hybrid'
                        ? 'Click "Generate Suggestions" to let AI place images, or add them manually from the sidebar.'
                        : 'Select images from the sidebar to add them to your manuscript.'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="w-72 border-l border-border p-4">
          <PreviewPane
            placements={placements}
            images={images}
            chapters={chapters}
          />
        </div>
      </div>
    </div>
  );
}
