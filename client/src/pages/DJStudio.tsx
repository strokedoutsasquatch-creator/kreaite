import { useState } from "react";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Disc3, Play, Pause, Volume2, VolumeX, Plus, Save, Trash2,
  Sliders, Wand2, Sparkles, ArrowLeft, Loader2, RotateCcw,
  FastForward, Rewind, Settings, Headphones, Radio, Zap
} from "lucide-react";

interface DJPreset {
  id: number;
  name: string;
  eq: { low: number; mid: number; high: number };
  compression: { threshold: number; ratio: number; attack: number; release: number };
  effects: { reverb: number; delay: number; filter: number };
  isPublic: boolean;
}

const defaultEQ = { low: 0, mid: 0, high: 0 };
const defaultCompression = { threshold: -24, ratio: 4, attack: 10, release: 100 };
const defaultEffects = { reverb: 0, delay: 0, filter: 100 };

export default function DJStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("mixer");
  
  const [presetName, setPresetName] = useState("");
  const [eq, setEq] = useState(defaultEQ);
  const [compression, setCompression] = useState(defaultCompression);
  const [effects, setEffects] = useState(defaultEffects);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScratchMode, setIsScratchMode] = useState(false);
  const [scratchPosition, setScratchPosition] = useState(0);
  const [bpm, setBpm] = useState([120]);
  const [masterVolume, setMasterVolume] = useState([80]);

  const { data: presetsData, isLoading } = useQuery({
    queryKey: ["/api/dj/presets"],
    enabled: !!user
  });

  const { data: publicPresets } = useQuery({
    queryKey: ["/api/dj/presets/public"]
  });

  const savePresetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dj/presets", {
        name: presetName,
        eq,
        compression,
        effects,
        isPublic: false
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dj/presets"] });
      setPresetName("");
      toast({ title: "Preset Saved!", description: "Your DJ preset is ready to use" });
    },
    onError: (error: any) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    }
  });

  const loadPreset = (preset: DJPreset) => {
    setEq(preset.eq);
    setCompression(preset.compression);
    setEffects(preset.effects);
    setPresetName(preset.name);
    toast({ title: "Preset Loaded", description: preset.name });
  };

  const resetToDefault = () => {
    setEq(defaultEQ);
    setCompression(defaultCompression);
    setEffects(defaultEffects);
    setPresetName("");
  };

  const presets = (presetsData as any)?.presets || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator-hub">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <Disc3 className="w-8 h-8 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">DJ/Mixing Studio</h1>
            <p className="text-zinc-400">Professional audio mixing with turntable scratching</p>
          </div>
          <Badge className="ml-auto bg-primary/20 text-primary border">
            <Sparkles className="w-3 h-3 mr-1" /> Ultra-Premium
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="mixer" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Sliders className="w-4 h-4 mr-2" /> Mixer
            </TabsTrigger>
            <TabsTrigger value="turntable" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Disc3 className="w-4 h-4 mr-2" /> Turntable
            </TabsTrigger>
            <TabsTrigger value="presets" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Settings className="w-4 h-4 mr-2" /> Presets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mixer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    8-Band EQ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Low: {eq.low > 0 ? "+" : ""}{eq.low} dB</Label>
                    <Slider
                      value={[eq.low]}
                      onValueChange={([v]) => setEq({...eq, low: v})}
                      min={-12}
                      max={12}
                      step={1}
                      className="w-full"
                      data-testid="slider-eq-low"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Mid: {eq.mid > 0 ? "+" : ""}{eq.mid} dB</Label>
                    <Slider
                      value={[eq.mid]}
                      onValueChange={([v]) => setEq({...eq, mid: v})}
                      min={-12}
                      max={12}
                      step={1}
                      className="w-full"
                      data-testid="slider-eq-mid"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">High: {eq.high > 0 ? "+" : ""}{eq.high} dB</Label>
                    <Slider
                      value={[eq.high]}
                      onValueChange={([v]) => setEq({...eq, high: v})}
                      min={-12}
                      max={12}
                      step={1}
                      className="w-full"
                      data-testid="slider-eq-high"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Compressor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Threshold: {compression.threshold} dB</Label>
                    <Slider
                      value={[compression.threshold]}
                      onValueChange={([v]) => setCompression({...compression, threshold: v})}
                      min={-60}
                      max={0}
                      step={1}
                      className="w-full"
                      data-testid="slider-threshold"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Ratio: {compression.ratio}:1</Label>
                    <Slider
                      value={[compression.ratio]}
                      onValueChange={([v]) => setCompression({...compression, ratio: v})}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                      data-testid="slider-ratio"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Attack: {compression.attack} ms</Label>
                    <Slider
                      value={[compression.attack]}
                      onValueChange={([v]) => setCompression({...compression, attack: v})}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-attack"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Release: {compression.release} ms</Label>
                    <Slider
                      value={[compression.release]}
                      onValueChange={([v]) => setCompression({...compression, release: v})}
                      min={10}
                      max={1000}
                      step={10}
                      className="w-full"
                      data-testid="slider-release"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-primary" />
                    Effects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Reverb: {effects.reverb}%</Label>
                    <Slider
                      value={[effects.reverb]}
                      onValueChange={([v]) => setEffects({...effects, reverb: v})}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-reverb"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Delay: {effects.delay}%</Label>
                    <Slider
                      value={[effects.delay]}
                      onValueChange={([v]) => setEffects({...effects, delay: v})}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-delay"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Filter: {effects.filter}%</Label>
                    <Slider
                      value={[effects.filter]}
                      onValueChange={([v]) => setEffects({...effects, filter: v})}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-filter"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center gap-2 flex-1">
                  <Volume2 className="w-5 h-5 text-zinc-400" />
                  <Slider
                    value={masterVolume}
                    onValueChange={setMasterVolume}
                    min={0}
                    max={100}
                    className="w-48"
                    data-testid="slider-master-volume"
                  />
                  <span className="text-sm text-zinc-400">{masterVolume[0]}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">BPM:</Label>
                  <Slider
                    value={bpm}
                    onValueChange={setBpm}
                    min={60}
                    max={200}
                    className="w-32"
                    data-testid="slider-bpm"
                  />
                  <span className="text-sm font-mono w-12">{bpm[0]}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isPlaying ? "destructive" : "default"}
                    onClick={() => setIsPlaying(!isPlaying)}
                    data-testid="button-play"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" onClick={resetToDefault} data-testid="button-reset">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="bg-zinc-800 border-zinc-700 max-w-xs"
                data-testid="input-preset-name"
              />
              <Button
                onClick={() => savePresetMutation.mutate()}
                disabled={savePresetMutation.isPending || !presetName.trim()}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="button-save-preset"
              >
                {savePresetMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preset
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="turntable" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc3 className="w-5 h-5 text-primary" />
                    Deck A
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div 
                    className={`w-64 h-64 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center cursor-pointer transition-transform ${isPlaying ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '2s' }}
                    data-testid="turntable-deck-a"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-orange-500 flex items-center justify-center">
                      <Disc3 className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" size="sm" data-testid="button-rewind-a">
                      <Rewind className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={isPlaying ? "destructive" : "default"}
                      onClick={() => setIsPlaying(!isPlaying)}
                      data-testid="button-play-a"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-forward-a">
                      <FastForward className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <Label>Scratch Mode</Label>
                    <Switch
                      checked={isScratchMode}
                      onCheckedChange={setIsScratchMode}
                      data-testid="switch-scratch"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc3 className="w-5 h-5 text-primary" />
                    Deck B
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div 
                    className="w-64 h-64 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center cursor-pointer"
                    data-testid="turntable-deck-b"
                  >
                    <div className="w-16 h-16 rounded-full bg-pink-500/20 border-2 border-pink-500 flex items-center justify-center">
                      <Disc3 className="w-8 h-8 text-pink-400" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" size="sm" data-testid="button-rewind-b">
                      <Rewind className="w-4 h-4" />
                    </Button>
                    <Button variant="default" data-testid="button-play-b">
                      <Play className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-forward-b">
                      <FastForward className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Crossfader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-primary">A</span>
                  <Slider
                    value={[50]}
                    min={0}
                    max={100}
                    className="flex-1"
                    data-testid="slider-crossfader"
                  />
                  <span className="text-sm text-pink-400">B</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presets" className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>My Presets</CardTitle>
                <CardDescription>Your saved DJ presets</CardDescription>
              </CardHeader>
              <CardContent>
                {presets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presets.map((preset: DJPreset) => (
                      <div key={preset.id} className="p-4 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{preset.name}</h4>
                          <Button variant="ghost" size="icon" data-testid={`button-delete-${preset.id}`}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1 mb-3">
                          <p>EQ: L{preset.eq.low} M{preset.eq.mid} H{preset.eq.high}</p>
                          <p>Comp: {preset.compression.ratio}:1 @ {preset.compression.threshold}dB</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => loadPreset(preset)}
                          data-testid={`button-load-${preset.id}`}
                        >
                          Load Preset
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No presets saved yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Community Presets</CardTitle>
                <CardDescription>Popular presets from other DJs</CardDescription>
              </CardHeader>
              <CardContent>
                {(publicPresets as any)?.presets?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(publicPresets as any).presets.map((preset: DJPreset) => (
                      <div key={preset.id} className="p-4 bg-zinc-800/50 rounded-lg">
                        <h4 className="font-medium mb-2">{preset.name}</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => loadPreset(preset)}
                          data-testid={`button-load-community-${preset.id}`}
                        >
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No community presets available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
