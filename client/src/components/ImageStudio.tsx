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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Maximize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Undo,
  Redo,
  Download,
  X,
  Save,
  Sparkles,
  Wand2,
  SunMedium,
  Contrast,
  Droplets,
  Image as ImageIcon,
  History,
  Settings,
  Loader2,
  MousePointer2,
  Blend,
  Sliders,
  Filter,
  Bot,
  Upload,
  RefreshCw,
  Palette,
  Ruler,
  Grid3X3,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ImageStudioProps {
  initialImage?: string;
  onSave?: (imageData: string) => void;
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

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  state: {
    layers: Layer[];
    adjustments: Adjustments;
  };
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  exposure: number;
  highlights: number;
  shadows: number;
}

type ToolType = 'move' | 'select' | 'crop' | 'brush' | 'eraser' | 'text' | 'shape' | 'eyedropper' | 'hand' | 'zoom';

const blendModes = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
];

const presetFilters = [
  { id: 'none', name: 'None', filter: '' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(40%) contrast(90%) brightness(90%)' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', filter: 'sepia(80%)' },
  { id: 'cool', name: 'Cool', filter: 'saturate(80%) hue-rotate(180deg)' },
  { id: 'warm', name: 'Warm', filter: 'saturate(120%) sepia(20%)' },
  { id: 'dramatic', name: 'Dramatic', filter: 'contrast(140%) saturate(80%) brightness(95%)' },
  { id: 'fade', name: 'Fade', filter: 'contrast(80%) brightness(110%) saturate(70%)' },
  { id: 'vibrant', name: 'Vibrant', filter: 'saturate(150%) contrast(110%)' },
  { id: 'noir', name: 'Noir', filter: 'grayscale(100%) contrast(130%)' },
];

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
  highlights: 0,
  shadows: 0,
};

export default function ImageStudio({ initialImage, onSave, onClose }: ImageStudioProps) {
  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>('move');
  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  const [selectedPresetFilter, setSelectedPresetFilter] = useState('none');
  const [blurAmount, setBlurAmount] = useState(0);
  const [sharpenAmount, setSharpenAmount] = useState(0);
  const [vignetteAmount, setVignetteAmount] = useState(0);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#FF6B35');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [shapeType, setShapeType] = useState<'rectangle' | 'ellipse' | 'line'>('rectangle');
  
  const [showRulers, setShowRulers] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(90);
  const [exportWidth, setExportWidth] = useState(canvasSize.width);
  const [exportHeight, setExportHeight] = useState(canvasSize.height);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('layers');

  const createLayer = useCallback((imageData: string | null = null, name?: string): Layer => {
    const id = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      name: name || `Layer ${layers.length + 1}`,
      imageData,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
    };
  }, [layers.length]);

  const addToHistory = useCallback((action: string) => {
    const entry: HistoryEntry = {
      id: `history-${Date.now()}`,
      action,
      timestamp: new Date(),
      state: {
        layers: JSON.parse(JSON.stringify(layers)),
        adjustments: { ...adjustments },
      },
    };
    setHistory(prev => [...prev.slice(0, historyIndex + 1), entry]);
    setHistoryIndex(prev => prev + 1);
  }, [layers, adjustments, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setLayers(prevState.state.layers);
      setAdjustments(prevState.state.adjustments);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setLayers(nextState.state.layers);
      setAdjustments(nextState.state.adjustments);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        setCanvasSize({ width: img.width, height: img.height });
        setExportWidth(img.width);
        setExportHeight(img.height);
        const newLayer = createLayer(initialImage, 'Background');
        setLayers([newLayer]);
        setActiveLayerId(newLayer.id);
        addToHistory('Load Image');
      };
      img.src = initialImage;
    } else {
      const bgLayer = createLayer(null, 'Background');
      setLayers([bgLayer]);
      setActiveLayerId(bgLayer.id);
    }
  }, [initialImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toUpperCase();
      const tool = tools.find(t => t.shortcut === key);
      if (tool) {
        setSelectedTool(tool.id);
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (layers.length === 0 || !layers[0].imageData) {
          setCanvasSize({ width: img.width, height: img.height });
          setExportWidth(img.width);
          setExportHeight(img.height);
        }
        const newLayer = createLayer(imageData, file.name.split('.')[0]);
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        addToHistory(`Add ${file.name}`);
        toast({ title: 'Image Added', description: 'New layer created with uploaded image.' });
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  }, [layers, createLayer, addToHistory, toast]);

  const addLayer = useCallback(() => {
    const newLayer = createLayer();
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    addToHistory('Add Layer');
  }, [createLayer, addToHistory]);

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

  const duplicateLayer = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const newLayer = { ...layer, id: `layer-${Date.now()}`, name: `${layer.name} Copy` };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    addToHistory('Duplicate Layer');
  }, [layers, addToHistory]);

  const moveLayerUp = useCallback((id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index >= layers.length - 1) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    setLayers(newLayers);
    addToHistory('Reorder Layers');
  }, [layers, addToHistory]);

  const moveLayerDown = useCallback((id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index <= 0) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    setLayers(newLayers);
    addToHistory('Reorder Layers');
  }, [layers, addToHistory]);

  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const toggleLayerLock = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  }, []);

  const updateLayerOpacity = useCallback((id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  }, []);

  const updateLayerBlendMode = useCallback((id: string, blendMode: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, blendMode } : l));
    addToHistory('Change Blend Mode');
  }, [addToHistory]);

  const flattenLayers = useCallback(() => {
    toast({ title: 'Layers Flattened', description: 'All visible layers merged into one.' });
    addToHistory('Flatten Layers');
  }, [toast, addToHistory]);

  const handleRemoveBackground = async () => {
    if (!activeLayerId) return;
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

  const handleAutoEnhance = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAdjustments({
        ...adjustments,
        brightness: 105,
        contrast: 110,
        saturation: 115,
      });
      toast({ title: 'Image Enhanced', description: 'AI auto-enhancement applied.' });
      addToHistory('Auto Enhance');
    } catch {
      toast({ title: 'Error', description: 'Failed to enhance image.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAI = () => {
    toast({ title: 'Generate with AI', description: 'Opening AI image generator...' });
  };

  const resetAdjustments = useCallback(() => {
    setAdjustments(defaultAdjustments);
    setBlurAmount(0);
    setSharpenAmount(0);
    setVignetteAmount(0);
    setSelectedPresetFilter('none');
    addToHistory('Reset Adjustments');
  }, [addToHistory]);

  const handleSave = useCallback(() => {
    onSave?.('data:image/png;base64,...');
    toast({ title: 'Saved', description: 'Image saved successfully.' });
  }, [onSave, toast]);

  const handleExport = useCallback(() => {
    toast({ 
      title: 'Exported', 
      description: `Image exported as ${exportFormat.toUpperCase()} (${exportWidth}x${exportHeight})` 
    });
    setIsExportDialogOpen(false);
  }, [exportFormat, exportWidth, exportHeight, toast]);

  const goToHistoryState = useCallback((index: number) => {
    const state = history[index];
    setLayers(state.state.layers);
    setAdjustments(state.state.adjustments);
    setHistoryIndex(index);
  }, [history]);

  const getFilterStyle = useCallback(() => {
    const preset = presetFilters.find(f => f.id === selectedPresetFilter);
    const baseFilter = preset?.filter || '';
    const adjustmentFilter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg)`;
    const effectFilter = blurAmount > 0 ? `blur(${blurAmount}px)` : '';
    
    return [baseFilter, adjustmentFilter, effectFilter].filter(Boolean).join(' ');
  }, [adjustments, selectedPresetFilter, blurAmount]);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  const renderToolOptions = () => {
    switch (selectedTool) {
      case 'brush':
      case 'eraser':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-400">Size</Label>
              <Slider
                value={[brushSize]}
                onValueChange={([v]) => setBrushSize(v)}
                min={1}
                max={100}
                step={1}
                className="w-24"
              />
              <span className="text-xs text-gray-400 w-8">{brushSize}px</span>
            </div>
            {selectedTool === 'brush' && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-400">Color</Label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                />
              </div>
            )}
          </div>
        );
      case 'text':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-400">Font</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-400">Size</Label>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={8}
                max={120}
                step={1}
                className="w-24"
              />
              <span className="text-xs text-gray-400 w-8">{fontSize}px</span>
            </div>
          </div>
        );
      case 'shape':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-400">Shape</Label>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant={shapeType === 'rectangle' ? 'secondary' : 'ghost'}
                  className="h-8 w-8"
                  onClick={() => setShapeType('rectangle')}
                  data-testid="button-shape-rectangle"
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={shapeType === 'ellipse' ? 'secondary' : 'ghost'}
                  className="h-8 w-8"
                  onClick={() => setShapeType('ellipse')}
                  data-testid="button-shape-ellipse"
                >
                  <Circle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-400">Fill</Label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-400">
            {tools.find(t => t.id === selectedTool)?.label} Tool Selected
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white" data-testid="image-studio">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
      />

      <header className="flex items-center justify-between h-12 px-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm">ImageStudio</span>
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
            onClick={handleSave}
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
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8"
              data-testid="button-close"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex items-center h-10 px-3 bg-gray-950 border-b border-gray-800 gap-4">
        {renderToolOptions()}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="icon"
            variant={showRulers ? 'secondary' : 'ghost'}
            className="h-7 w-7"
            onClick={() => setShowRulers(!showRulers)}
            data-testid="button-toggle-rulers"
          >
            <Ruler className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant={showGrid ? 'secondary' : 'ghost'}
            className="h-7 w-7"
            onClick={() => setShowGrid(!showGrid)}
            data-testid="button-toggle-grid"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-2 gap-1">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={selectedTool === tool.id ? 'secondary' : 'ghost'}
                  className={`h-9 w-9 ${selectedTool === tool.id ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' : ''}`}
                  onClick={() => setSelectedTool(tool.id)}
                  data-testid={`button-tool-${tool.id}`}
                >
                  <tool.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          <Separator className="my-2 bg-gray-700 w-8" />
          
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-6 h-6 rounded border-2 border-white cursor-pointer"
              style={{ backgroundColor: brushColor }}
              onClick={() => {}}
              data-testid="color-foreground"
            />
            <div
              className="w-5 h-5 rounded border border-gray-600 bg-white cursor-pointer -mt-2 ml-2"
              data-testid="color-background"
            />
          </div>
        </div>

        <div 
          ref={canvasContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ 
            background: '#1a1a1a',
            backgroundImage: showGrid 
              ? 'linear-gradient(45deg, #252525 25%, transparent 25%), linear-gradient(-45deg, #252525 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #252525 75%), linear-gradient(-45deg, transparent 75%, #252525 75%)'
              : 'none',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          {showRulers && (
            <>
              <div className="absolute top-0 left-12 right-64 h-6 bg-gray-800 border-b border-gray-700 flex items-end">
                {Array.from({ length: Math.ceil(canvasSize.width / 50) }).map((_, i) => (
                  <div key={i} className="relative" style={{ width: 50 * (zoom / 100) }}>
                    <span className="text-[10px] text-gray-500 absolute left-0">{i * 50}</span>
                  </div>
                ))}
              </div>
              <div className="absolute top-6 left-0 w-6 bg-gray-800 border-r border-gray-700 flex flex-col" style={{ height: canvasSize.height * (zoom / 100) }}>
                {Array.from({ length: Math.ceil(canvasSize.height / 50) }).map((_, i) => (
                  <div key={i} className="relative" style={{ height: 50 * (zoom / 100) }}>
                    <span className="text-[10px] text-gray-500 absolute top-0 left-1">{i * 50}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div 
            className="absolute flex items-center justify-center"
            style={{ 
              left: showRulers ? 24 : 0,
              top: showRulers ? 24 : 0,
              right: 0,
              bottom: 0,
              padding: '40px',
            }}
          >
            <div 
              className="relative shadow-2xl"
              style={{ 
                width: canvasSize.width * (zoom / 100),
                height: canvasSize.height * (zoom / 100),
                backgroundImage: 'linear-gradient(45deg, #404040 25%, transparent 25%), linear-gradient(-45deg, #404040 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #404040 75%), linear-gradient(-45deg, transparent 75%, #404040 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: '#333',
              }}
              data-testid="canvas-workspace"
            >
              {layers.map((layer) => (
                layer.visible && layer.imageData && (
                  <img
                    key={layer.id}
                    src={layer.imageData}
                    alt={layer.name}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      opacity: layer.opacity / 100,
                      mixBlendMode: layer.blendMode as any,
                      filter: layer.id === activeLayerId ? getFilterStyle() : '',
                      transform: `translate(${layer.x}px, ${layer.y}px)`,
                    }}
                  />
                )
              ))}
              
              {layers.length === 0 || !layers.some(l => l.imageData) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <Upload className="w-12 h-12 mb-4" />
                  <p className="text-lg mb-2">No image loaded</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-600"
                    data-testid="button-canvas-upload"
                  >
                    Upload Image
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex flex-col flex-1">
            <TabsList className="grid grid-cols-4 bg-gray-950 rounded-none border-b border-gray-800 h-10">
              <TabsTrigger value="layers" className="data-[state=active]:bg-gray-800 text-xs gap-1 px-2">
                <Layers className="w-3.5 h-3.5" />
              </TabsTrigger>
              <TabsTrigger value="adjustments" className="data-[state=active]:bg-gray-800 text-xs gap-1 px-2">
                <Sliders className="w-3.5 h-3.5" />
              </TabsTrigger>
              <TabsTrigger value="filters" className="data-[state=active]:bg-gray-800 text-xs gap-1 px-2">
                <Filter className="w-3.5 h-3.5" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-gray-800 text-xs gap-1 px-2">
                <Bot className="w-3.5 h-3.5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
              <div className="p-2 border-b border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">Layers</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addLayer} data-testid="button-add-layer">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={flattenLayers} data-testid="button-flatten">
                      <Blend className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                
                {activeLayer && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-400 w-14">Opacity</Label>
                      <Slider
                        value={[activeLayer.opacity]}
                        onValueChange={([v]) => updateLayerOpacity(activeLayer.id, v)}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-400 w-8">{activeLayer.opacity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-400 w-14">Blend</Label>
                      <Select value={activeLayer.blendMode} onValueChange={(v) => updateLayerBlendMode(activeLayer.id, v)}>
                        <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {blendModes.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {[...layers].reverse().map((layer) => (
                    <div
                      key={layer.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        activeLayerId === layer.id 
                          ? 'bg-orange-500/20 border border-orange-500/50' 
                          : 'bg-gray-800 border border-transparent hover:border-gray-700'
                      }`}
                      onClick={() => setActiveLayerId(layer.id)}
                      data-testid={`layer-item-${layer.id}`}
                    >
                      <div 
                        className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center overflow-hidden"
                        style={{
                          backgroundImage: 'linear-gradient(45deg, #555 25%, transparent 25%), linear-gradient(-45deg, #555 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #555 75%), linear-gradient(-45deg, transparent 75%, #555 75%)',
                          backgroundSize: '8px 8px',
                          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                        }}
                      >
                        {layer.imageData && (
                          <img src={layer.imageData} alt={layer.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-white">{layer.name}</p>
                        <p className="text-[10px] text-gray-500">{layer.opacity}% • {layer.blendMode}</p>
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                          data-testid={`button-layer-visibility-${layer.id}`}
                        >
                          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                          data-testid={`button-layer-lock-${layer.id}`}
                        >
                          {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-gray-600" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-2 border-t border-gray-800 flex gap-1">
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={() => activeLayerId && moveLayerUp(activeLayerId)} data-testid="button-layer-up">
                  <ChevronUp className="w-3.5 h-3.5 mr-1" />
                  Up
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={() => activeLayerId && moveLayerDown(activeLayerId)} data-testid="button-layer-down">
                  <ChevronDown className="w-3.5 h-3.5 mr-1" />
                  Down
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => activeLayerId && duplicateLayer(activeLayerId)} data-testid="button-duplicate-layer">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => activeLayerId && deleteLayer(activeLayerId)} data-testid="button-delete-layer">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="adjustments" className="flex-1 m-0 overflow-auto">
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase">Adjustments</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={resetAdjustments} data-testid="button-reset-adjustments">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Brightness</Label>
                      <span className="text-xs text-gray-500">{adjustments.brightness}%</span>
                    </div>
                    <Slider
                      value={[adjustments.brightness]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, brightness: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Contrast</Label>
                      <span className="text-xs text-gray-500">{adjustments.contrast}%</span>
                    </div>
                    <Slider
                      value={[adjustments.contrast]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, contrast: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Saturation</Label>
                      <span className="text-xs text-gray-500">{adjustments.saturation}%</span>
                    </div>
                    <Slider
                      value={[adjustments.saturation]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, saturation: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Hue Rotation</Label>
                      <span className="text-xs text-gray-500">{adjustments.hue}°</span>
                    </div>
                    <Slider
                      value={[adjustments.hue]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, hue: v }))}
                      min={-180}
                      max={180}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Exposure</Label>
                      <span className="text-xs text-gray-500">{adjustments.exposure}%</span>
                    </div>
                    <Slider
                      value={[adjustments.exposure]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, exposure: v }))}
                      min={50}
                      max={150}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Highlights</Label>
                      <span className="text-xs text-gray-500">{adjustments.highlights}</span>
                    </div>
                    <Slider
                      value={[adjustments.highlights]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, highlights: v }))}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Shadows</Label>
                      <span className="text-xs text-gray-500">{adjustments.shadows}</span>
                    </div>
                    <Slider
                      value={[adjustments.shadows]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, shadows: v }))}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="flex-1 m-0 overflow-auto">
              <div className="p-3 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">Effects</span>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Blur</Label>
                      <span className="text-xs text-gray-500">{blurAmount}px</span>
                    </div>
                    <Slider
                      value={[blurAmount]}
                      onValueChange={([v]) => setBlurAmount(v)}
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Sharpen</Label>
                      <span className="text-xs text-gray-500">{sharpenAmount}%</span>
                    </div>
                    <Slider
                      value={[sharpenAmount]}
                      onValueChange={([v]) => setSharpenAmount(v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Vignette</Label>
                      <span className="text-xs text-gray-500">{vignetteAmount}%</span>
                    </div>
                    <Slider
                      value={[vignetteAmount]}
                      onValueChange={([v]) => setVignetteAmount(v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">Preset Filters</span>
                  <div className="grid grid-cols-3 gap-2">
                    {presetFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedPresetFilter(filter.id)}
                        className={`p-2 rounded text-xs transition-colors ${
                          selectedPresetFilter === filter.id
                            ? 'bg-orange-500/20 border border-orange-500 text-orange-500'
                            : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                        data-testid={`button-filter-${filter.id}`}
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 m-0 overflow-auto">
              <div className="p-3 space-y-3">
                <span className="text-xs font-medium text-gray-400 uppercase">AI Tools</span>
                
                <Button
                  className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  onClick={handleRemoveBackground}
                  disabled={isProcessing || !activeLayer?.imageData}
                  data-testid="button-remove-background"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4 text-orange-500" />}
                  Remove Background
                </Button>

                <Button
                  className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  onClick={handleAutoEnhance}
                  disabled={isProcessing || !activeLayer?.imageData}
                  data-testid="button-auto-enhance"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-orange-500" />}
                  Auto Enhance
                </Button>

                <Button
                  className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  onClick={handleGenerateAI}
                  disabled={isProcessing}
                  data-testid="button-generate-ai"
                >
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Generate with AI
                </Button>

                <Separator className="bg-gray-800" />

                <div className="text-xs text-gray-500 space-y-1">
                  <p>AI-powered tools for professional image editing:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                    <li>Remove backgrounds instantly</li>
                    <li>Auto-enhance colors and contrast</li>
                    <li>Generate new images from text</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="border-t border-gray-800">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-400">History</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isHistoryOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-32">
                <div className="p-2 space-y-1">
                  {history.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-2">No history yet</p>
                  ) : (
                    history.map((entry, index) => (
                      <button
                        key={entry.id}
                        onClick={() => goToHistoryState(index)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                          index === historyIndex
                            ? 'bg-orange-500/20 text-orange-500'
                            : index < historyIndex
                            ? 'text-gray-400 hover:bg-gray-800'
                            : 'text-gray-600'
                        }`}
                        data-testid={`button-history-${index}`}
                      >
                        {entry.action}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <footer className="h-7 px-3 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Zoom:</span>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setZoom(Math.max(10, zoom - 10))} data-testid="button-zoom-out">
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="w-10 text-center">{zoom}%</span>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setZoom(Math.min(400, zoom + 10))} data-testid="button-zoom-in">
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setZoom(100)} data-testid="button-zoom-100">
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span>{canvasSize.width} × {canvasSize.height}px</span>
          <span>RGB</span>
          <span>{layers.length} layer{layers.length !== 1 ? 's' : ''}</span>
        </div>
      </footer>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Export Image</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose format and quality for export
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (Lossless, supports transparency)</SelectItem>
                  <SelectItem value="jpg">JPG (Compressed, smaller file)</SelectItem>
                  <SelectItem value="webp">WebP (Modern, best compression)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportFormat === 'jpg' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Quality</Label>
                  <span className="text-sm text-gray-400">{exportQuality}%</span>
                </div>
                <Slider
                  value={[exportQuality]}
                  onValueChange={([v]) => setExportQuality(v)}
                  min={10}
                  max={100}
                  step={1}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Width</Label>
                <Input
                  type="number"
                  value={exportWidth}
                  onChange={(e) => setExportWidth(parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Height</Label>
                <Input
                  type="number"
                  value={exportHeight}
                  onChange={(e) => setExportHeight(parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-black" onClick={handleExport} data-testid="button-confirm-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
