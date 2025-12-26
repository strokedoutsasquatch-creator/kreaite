import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Gem,
  ChevronDown,
  ChevronUp,
  Mic2,
  BookOpen,
  Settings2,
  Coins,
  Check,
  Pencil
} from 'lucide-react';

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
  exampleOutput?: string;
}

interface AISettingsProps {
  selectedTier: number;
  setSelectedTier: (id: number) => void;
  selectedVoice: number;
  setSelectedVoice: (id: number) => void;
  customVoice?: string;
  setCustomVoice?: (voice: string) => void;
  userCredits?: number;
  compact?: boolean;
  showGenre?: boolean;
}

const tierIcons: Record<string, any> = {
  'Draft': Zap,
  'Standard': Sparkles,
  'Premium': Crown,
  'Ultra': Gem,
};

const tierColors: Record<string, string> = {
  'Draft': 'border-zinc-600 hover:border-zinc-500',
  'Standard': 'border-blue-600 hover:border-blue-500',
  'Premium': 'border-purple-600 hover:border-purple-500',
  'Ultra': 'border-orange-500 hover:border-orange-400',
};

const tierSelectedColors: Record<string, string> = {
  'Draft': 'border-zinc-400 bg-zinc-900/50',
  'Standard': 'border-blue-500 bg-blue-950/30',
  'Premium': 'border-purple-500 bg-purple-950/30',
  'Ultra': 'border-orange-500 bg-orange-950/30',
};

export function AISettingsPanel({
  selectedTier,
  setSelectedTier,
  selectedVoice,
  setSelectedVoice,
  customVoice = '',
  setCustomVoice,
  userCredits = 100,
  compact = false,
  showGenre = true,
}: AISettingsProps) {
  const [qualityOpen, setQualityOpen] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);

  const { data: tiers = [] } = useQuery<QualityTier[]>({
    queryKey: ['/api/ai/quality-tiers'],
  });

  const { data: voices = [] } = useQuery<VoicePreset[]>({
    queryKey: ['/api/ai/voice-presets'],
  });

  const selectedTierData = tiers.find(t => t.id === selectedTier);
  const selectedVoiceData = voices.find(v => v.id === selectedVoice);
  
  const narrativeVoices = voices.filter(v => v.category === 'narrative' || v.category === 'poetic' || v.category === 'educational' || v.category === 'conversational');
  const genreVoices = voices.filter(v => v.category === 'genre');
  const customVoicePreset = voices.find(v => v.category === 'custom');

  const canAfford = (cost: number) => userCredits >= cost;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium" data-testid="text-credit-balance">{userCredits} credits</span>
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <Badge variant="outline" className="gap-1">
          {selectedTierData && (() => {
            const Icon = tierIcons[selectedTierData.name] || Sparkles;
            return <Icon className="w-3 h-3" />;
          })()}
          {selectedTierData?.name || 'Standard'}
          <span className="text-orange-500">({selectedTierData?.creditCost || 3}c)</span>
        </Badge>
        {selectedVoiceData && selectedVoiceData.name !== 'Custom' && (
          <Badge variant="secondary" className="gap-1">
            <Mic2 className="w-3 h-3" />
            {selectedVoiceData.name}
          </Badge>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          className="ml-auto h-7"
          onClick={() => setQualityOpen(!qualityOpen)}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-orange-500" />
          <span className="font-semibold">AI Settings</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
          <Coins className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold" data-testid="text-credit-balance">{userCredits}</span>
          <span className="text-xs text-muted-foreground">credits</span>
        </div>
      </div>

      <Collapsible open={qualityOpen} onOpenChange={setQualityOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto hover-elevate">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Quality Tier</span>
              {selectedTierData && (
                <Badge variant="outline" className="ml-2" data-testid="text-credit-cost">
                  {selectedTierData.creditCost} credits
                </Badge>
              )}
            </div>
            {qualityOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-2 gap-2">
            {tiers.map((tier) => {
              const Icon = tierIcons[tier.name] || Sparkles;
              const isSelected = selectedTier === tier.id;
              const affordable = canAfford(tier.creditCost);
              
              return (
                <Card
                  key={tier.id}
                  data-testid={`select-quality-tier-${tier.id}`}
                  onClick={() => affordable && setSelectedTier(tier.id)}
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? tierSelectedColors[tier.name] 
                      : tierColors[tier.name]
                  } ${!affordable ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${tier.name === 'Ultra' ? 'text-orange-500' : ''}`} />
                      <span className="font-semibold">{tier.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{tier.description}</p>
                  <Badge 
                    variant={tier.name === 'Ultra' ? 'default' : 'secondary'}
                    className={tier.name === 'Ultra' ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' : ''}
                  >
                    {tier.creditCost} credit{tier.creditCost !== 1 ? 's' : ''}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={voiceOpen} onOpenChange={setVoiceOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto hover-elevate">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Voice & Tone</span>
              {selectedVoiceData && selectedVoiceData.name !== 'Custom' && (
                <Badge variant="secondary" className="ml-2">{selectedVoiceData.name}</Badge>
              )}
            </div>
            {voiceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <ScrollArea className="h-64">
            <div className="space-y-2 pr-4">
              {narrativeVoices.map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <Card
                    key={voice.id}
                    data-testid={`select-voice-${voice.id}`}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-950/20' 
                        : 'border-zinc-800 hover:border-zinc-600'
                    } hover-elevate`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{voice.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>
                        {voice.exampleOutput && (
                          <p className="text-xs text-zinc-500 mt-2 italic line-clamp-2">
                            "{voice.exampleOutput}"
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {customVoicePreset && (
                <Card
                  data-testid={`select-voice-${customVoicePreset.id}`}
                  onClick={() => setSelectedVoice(customVoicePreset.id)}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedVoice === customVoicePreset.id 
                      ? 'border-orange-500 bg-orange-950/20' 
                      : 'border-zinc-800 hover:border-zinc-600'
                  } hover-elevate`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Pencil className="w-4 h-4" />
                    <span className="font-medium">Custom Voice</span>
                    {selectedVoice === customVoicePreset.id && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Define your own unique voice and style</p>
                  {selectedVoice === customVoicePreset.id && setCustomVoice && (
                    <Textarea
                      data-testid="input-custom-voice"
                      placeholder="Describe your desired voice, tone, and style... (e.g., 'Write like a wise grandmother sharing stories by the fireplace, warm and nostalgic with gentle humor')"
                      value={customVoice}
                      onChange={(e) => setCustomVoice(e.target.value)}
                      className="mt-2 min-h-[80px] text-sm"
                    />
                  )}
                </Card>
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {showGenre && genreVoices.length > 0 && (
        <Collapsible open={genreOpen} onOpenChange={setGenreOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto hover-elevate">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Genre / Format</span>
              </div>
              {genreOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ScrollArea className="h-48">
              <div className="grid grid-cols-2 gap-2 pr-4">
                {genreVoices.map((genre) => {
                  const isSelected = selectedVoice === genre.id;
                  return (
                    <Card
                      key={genre.id}
                      data-testid={`select-genre-${genre.id}`}
                      onClick={() => setSelectedVoice(genre.id)}
                      className={`p-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-950/20' 
                          : 'border-zinc-800 hover:border-zinc-600'
                      } hover-elevate`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{genre.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-orange-500" />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default AISettingsPanel;
