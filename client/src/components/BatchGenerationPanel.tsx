import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Zap, 
  Sparkles, 
  Crown, 
  Gem,
  Coins,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Download,
  Pencil,
  Store,
  Loader2,
  AlertTriangle,
  FileText,
  Video,
  Music,
  GraduationCap,
  Image,
  Layers
} from 'lucide-react';
import { useCreditBalance } from '@/lib/hooks/useCredits';
import { useCreateJob, useJobStream } from '@/lib/hooks/useJobs';

type StudioType = 'book' | 'video' | 'music' | 'course' | 'image';

interface BatchGenerationPanelProps {
  studioType: StudioType;
  onComplete: (results: BatchResult[]) => void;
}

interface QualityTier {
  id: number;
  name: string;
  description: string;
  creditCost: number;
  model: string;
}

interface VoicePreset {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface BatchResult {
  id: string;
  index: number;
  status: 'pending' | 'completed' | 'failed';
  content?: string;
  preview?: string;
  error?: string;
}

const contentTypesByStudio: Record<StudioType, { value: string; label: string }[]> = {
  book: [
    { value: 'chapter', label: 'Book Chapters' },
    { value: 'outline', label: 'Book Outlines' },
    { value: 'scene', label: 'Story Scenes' },
    { value: 'character', label: 'Character Profiles' },
  ],
  video: [
    { value: 'script', label: 'Video Scripts' },
    { value: 'storyboard', label: 'Storyboard Descriptions' },
    { value: 'voiceover', label: 'Voiceover Scripts' },
    { value: 'caption', label: 'Video Captions' },
  ],
  music: [
    { value: 'lyrics', label: 'Song Lyrics' },
    { value: 'melody', label: 'Melody Descriptions' },
    { value: 'arrangement', label: 'Arrangement Notes' },
    { value: 'jingle', label: 'Jingles' },
  ],
  course: [
    { value: 'lesson', label: 'Lesson Content' },
    { value: 'quiz', label: 'Quiz Questions' },
    { value: 'summary', label: 'Module Summaries' },
    { value: 'exercise', label: 'Practice Exercises' },
  ],
  image: [
    { value: 'prompt', label: 'Image Prompts' },
    { value: 'description', label: 'Product Descriptions' },
    { value: 'alt_text', label: 'Alt Text' },
    { value: 'social_post', label: 'Social Posts' },
  ],
};

const studioIcons: Record<StudioType, any> = {
  book: FileText,
  video: Video,
  music: Music,
  course: GraduationCap,
  image: Image,
};

const tierIcons: Record<string, any> = {
  'Draft': Zap,
  'Standard': Sparkles,
  'Premium': Crown,
  'Ultra': Gem,
};

export function BatchGenerationPanel({ studioType, onComplete }: BatchGenerationPanelProps) {
  const [contentType, setContentType] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(5);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [selectedVoice, setSelectedVoice] = useState<number | null>(null);
  const [template, setTemplate] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: creditBalance } = useCreditBalance();
  const { data: tiers = [] } = useQuery<QualityTier[]>({
    queryKey: ['/api/ai/quality-tiers'],
  });
  const { data: voices = [] } = useQuery<VoicePreset[]>({
    queryKey: ['/api/ai/voice-presets'],
  });

  const createJob = useCreateJob();
  const { job, isConnected } = useJobStream(activeJobId);

  const StudioIcon = studioIcons[studioType];
  const contentTypes = contentTypesByStudio[studioType] || [];
  const selectedTierData = tiers.find(t => t.id === selectedTier);
  const creditCostPerItem = selectedTierData?.creditCost || 3;
  const estimatedCredits = creditCostPerItem * quantity;
  const userBalance = creditBalance?.total || 0;
  const canAfford = userBalance >= estimatedCredits;

  useEffect(() => {
    if (contentTypes.length > 0 && !contentType) {
      setContentType(contentTypes[0].value);
    }
  }, [contentTypes, contentType]);

  useEffect(() => {
    if (job) {
      if (job.data?.results) {
        setResults(job.data.results);
      }
      if (job.status === 'completed' || job.status === 'failed') {
        setIsGenerating(false);
        if (job.status === 'completed' && job.result?.items) {
          onComplete(job.result.items);
        }
      }
    }
  }, [job, onComplete]);

  const handleStartGeneration = async () => {
    if (!canAfford || !template.trim()) return;

    setIsGenerating(true);
    setResults([]);

    try {
      const response = await createJob.mutateAsync({
        type: 'batch_generation',
        data: {
          studioType,
          contentType,
          quantity,
          qualityTierId: selectedTier,
          voicePresetId: selectedVoice,
          template,
        },
        metadata: {
          estimatedCredits,
        },
      });
      setActiveJobId(response.id);
    } catch (error) {
      setIsGenerating(false);
      console.error('Failed to start batch generation:', error);
    }
  };

  const progress = job?.progress || 0;
  const completedCount = results.filter(r => r.status === 'completed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <Card className="bg-black border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <Layers className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Batch Generation</CardTitle>
            <CardDescription className="text-zinc-400">
              Generate multiple {studioType} assets at once
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
          <Coins className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-white" data-testid="text-credit-balance">
            {userBalance}
          </span>
          <span className="text-xs text-zinc-500">credits</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isGenerating && results.length === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-300">Content Type</Label>
                <Select 
                  value={contentType} 
                  onValueChange={setContentType}
                  data-testid="select-content-type"
                >
                  <SelectTrigger 
                    className="bg-zinc-900 border-zinc-700 text-white"
                    data-testid="select-content-type-trigger"
                  >
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {contentTypes.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        className="text-white hover:bg-zinc-800"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-300">
                  Quantity <span className="text-zinc-500">(1-50)</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-zinc-900 border-zinc-700 text-white"
                  data-testid="input-quantity"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-300">Quality Tier</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tiers.map((tier) => {
                  const Icon = tierIcons[tier.name] || Sparkles;
                  const isSelected = selectedTier === tier.id;
                  const tierAffordable = userBalance >= tier.creditCost * quantity;
                  
                  return (
                    <button
                      key={tier.id}
                      onClick={() => tierAffordable && setSelectedTier(tier.id)}
                      disabled={!tierAffordable}
                      data-testid={`select-quality-tier-${tier.id}`}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-950/30' 
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                      } ${!tierAffordable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover-elevate'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                          {tier.name}
                        </span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${isSelected ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {tier.creditCost}c each
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-300">
                Voice Preset <span className="text-zinc-500">(optional)</span>
              </Label>
              <Select 
                value={selectedVoice?.toString() || ''} 
                onValueChange={(val) => setSelectedVoice(val ? parseInt(val) : null)}
              >
                <SelectTrigger 
                  className="bg-zinc-900 border-zinc-700 text-white"
                  data-testid="select-voice-preset-trigger"
                >
                  <SelectValue placeholder="Select voice preset (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="" className="text-zinc-400">
                    No voice preset
                  </SelectItem>
                  {voices.map((voice) => (
                    <SelectItem 
                      key={voice.id} 
                      value={voice.id.toString()}
                      className="text-white hover:bg-zinc-800"
                    >
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-300">Template / Prompt</Label>
              <Textarea
                placeholder={`Describe what you want to generate. Use {index} for item numbers.\n\nExample: "Write chapter {index} of a recovery guide focusing on..."`}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="min-h-[120px] bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                data-testid="input-template"
              />
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-orange-500" />
                  <span className="text-lg font-bold text-white" data-testid="text-estimated-cost">
                    {estimatedCredits}
                  </span>
                  <span className="text-sm text-zinc-500">credits</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  {quantity} × {creditCostPerItem} credits ({selectedTierData?.name || 'Standard'})
                </span>
                {!canAfford && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Insufficient credits</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleStartGeneration}
              disabled={!canAfford || !template.trim() || createJob.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              data-testid="button-start-generation"
            >
              {createJob.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Batch Generation
                </>
              )}
            </Button>
          </>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
                <div>
                  <p className="font-medium text-white" data-testid="text-progress-status">
                    Generating...
                  </p>
                  <p className="text-sm text-zinc-500">
                    {completedCount} of {quantity} completed
                  </p>
                </div>
              </div>
              {isConnected && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Live
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="text-white font-medium" data-testid="text-progress-percentage">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-zinc-800"
                data-testid="progress-bar"
              />
            </div>

            {job?.data?.currentItem && (
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-sm text-zinc-400">Currently generating:</p>
                <p className="text-white font-medium" data-testid="text-current-item">
                  Item {job.data.currentItem} of {quantity}
                </p>
              </div>
            )}

            {results.length > 0 && (
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div 
                      key={result.id || index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900"
                      data-testid={`result-item-${index}`}
                    >
                      {result.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : result.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                      )}
                      <span className="text-sm text-zinc-300">
                        Item {result.index + 1}
                      </span>
                      {result.preview && (
                        <span className="text-xs text-zinc-500 truncate flex-1">
                          {result.preview}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {!isGenerating && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-white" data-testid="text-completion-status">
                    Generation Complete
                  </p>
                  <p className="text-sm text-zinc-500">
                    {completedCount} successful, {failedCount} failed
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResults([]);
                  setActiveJobId(null);
                }}
                data-testid="button-new-batch"
              >
                New Batch
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                {results.map((result, index) => (
                  <Card 
                    key={result.id || index} 
                    className={`bg-zinc-900 ${
                      result.status === 'failed' 
                        ? 'border-red-500/50' 
                        : 'border-zinc-800'
                    }`}
                    data-testid={`result-card-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {result.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="font-medium text-white">
                              Item {result.index + 1}
                            </span>
                            <Badge 
                              variant="secondary"
                              className={result.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                              }
                            >
                              {result.status}
                            </Badge>
                          </div>
                          {result.status === 'completed' && result.preview && (
                            <p className="text-sm text-zinc-400 line-clamp-2">
                              {result.preview}
                            </p>
                          )}
                          {result.status === 'failed' && result.error && (
                            <p className="text-sm text-red-400">
                              {result.error}
                            </p>
                          )}
                        </div>
                        {result.status === 'completed' && (
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              data-testid={`button-download-${index}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              data-testid={`button-edit-${index}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              data-testid={`button-publish-${index}`}
                            >
                              <Store className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700"
                data-testid="button-download-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-publish-all"
              >
                <Store className="w-4 h-4 mr-2" />
                Publish to Marketplace
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BatchGenerationPanel;
