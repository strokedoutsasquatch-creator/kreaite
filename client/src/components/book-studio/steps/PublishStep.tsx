import { useState } from "react";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layout,
  Rocket,
  FileDown,
  Eye,
  Save,
  Store,
  Printer,
  DollarSign,
  Globe,
  Zap,
  ChevronLeft,
  Wand2,
  RefreshCw,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const trimSizes = [
  { value: "5x8", label: '5" x 8" (Digest)' },
  { value: "5.5x8.5", label: '5.5" x 8.5" (US Trade)' },
  { value: "6x9", label: '6" x 9" (US Trade)' },
  { value: "7x10", label: '7" x 10" (Textbook)' },
  { value: "8.5x11", label: '8.5" x 11" (Letter)' },
];

const fontChoices = [
  { value: "garamond", label: "Garamond (Classic)" },
  { value: "times", label: "Times New Roman (Traditional)" },
  { value: "georgia", label: "Georgia (Modern Serif)" },
  { value: "palatino", label: "Palatino (Elegant)" },
  { value: "baskerville", label: "Baskerville (Literary)" },
];

export default function PublishStep() {
  const { toast } = useToast();
  const {
    bookOutline,
    printSettings,
    savePrintSettings,
    isbnData,
    setIsbnData,
    setCurrentStep,
    marketingBlurbs,
    generateBlurb,
    isGeneratingBlurb: isGeneratingBlurbContext,
    amazonKeywords: contextKeywords,
    generateKeywords,
    isGeneratingKeywords,
    exportBook,
    isExporting,
  } = useBookStudio();

  const [activeTab, setActiveTab] = useState('layout');
  const [kdpFormat, setKdpFormat] = useState('paperback');
  const [paperType, setPaperType] = useState('white');
  const [hasBleed, setHasBleed] = useState(false);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeCopyright, setIncludeCopyright] = useState(true);
  const [chapterBreakStyle, setChapterBreakStyle] = useState('new-page');
  const [copyrightYear, setCopyrightYear] = useState(new Date().getFullYear().toString());
  
  const [frontMatter, setFrontMatter] = useState({
    dedication: "",
    acknowledgments: "",
    foreword: "",
    preface: "",
  });
  
  const [backMatter, setBackMatter] = useState({
    aboutAuthor: "",
    otherBooks: "",
    resources: "",
  });
  
  const [localKeywords, setLocalKeywords] = useState<string[]>([]);
  
  // Use context blurbs or fallback to empty
  const bookBlurb = marketingBlurbs?.medium || marketingBlurbs?.long || "";
  
  // Combine context keywords with local ones (context first, then local additions)
  const allKeywords = [...contextKeywords, ...localKeywords.filter(k => !contextKeywords.includes(k))].slice(0, 7);

  const chapters = bookOutline?.chapters || [];
  const totalWordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount || ch.targetWordCount), 0);
  const estimatedPages = Math.ceil(totalWordCount / 250);
  const spineWidth = (estimatedPages * (paperType === 'cream' ? 0.0025 : 0.002252)).toFixed(3);
  const printCost = 0.90 + estimatedPages * 0.012;
  const suggestedRetail = Math.max(9.99, printCost * 2.5);
  const estimatedProfit = suggestedRetail * 0.85 - printCost;

  const handleGenerateBlurb = async () => {
    try {
      toast({ title: "Generating Marketing Copy", description: "Creating compelling blurbs..." });
      await generateBlurb();
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleGenerateKeywords = async () => {
    try {
      toast({ title: "Generating Keywords", description: "Creating Amazon-optimized keywords..." });
      await generateKeywords();
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleExportBook = async (format: 'pdf' | 'epub' | 'docx' | 'html') => {
    try {
      toast({ title: "Exporting Book", description: `Creating ${format.toUpperCase()} file...` });
      await exportBook(format);
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleAddKeyword = (keyword: string) => {
    if (keyword.trim() && localKeywords.length < 7) {
      setLocalKeywords([...localKeywords, keyword.trim()]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Layout className="w-5 h-5 text-primary" />
            Step 5: Format for KDP
          </CardTitle>
          <CardDescription>
            Set up professional formatting, front/back matter, and KDP-ready layout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 bg-card/80">
              <TabsTrigger value="layout" data-testid="tab-layout">Page Layout</TabsTrigger>
              <TabsTrigger value="front-matter" data-testid="tab-front-matter">Front Matter</TabsTrigger>
              <TabsTrigger value="back-matter" data-testid="tab-back-matter">Back Matter</TabsTrigger>
              <TabsTrigger value="export" data-testid="tab-export">Export & Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-card/80 rounded-lg border border">
                <div>
                  <Label className="text-xs text-muted-foreground">Format Type</Label>
                  <Select value={kdpFormat} onValueChange={setKdpFormat}>
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-kdp-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paperback">Paperback</SelectItem>
                      <SelectItem value="hardcover">Hardcover</SelectItem>
                      <SelectItem value="ebook">eBook (Kindle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Paper Type</Label>
                  <Select value={paperType} onValueChange={setPaperType}>
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-paper-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White Paper</SelectItem>
                      <SelectItem value="cream">Cream Paper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bleed</Label>
                  <Select value={hasBleed ? "yes" : "no"} onValueChange={(v) => setHasBleed(v === "yes")}>
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-bleed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No Bleed</SelectItem>
                      <SelectItem value="yes">With Bleed (0.125")</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Trim Size</Label>
                  <Select value={printSettings.trimSize} onValueChange={(v) => savePrintSettings({ trimSize: v })}>
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-trim-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trimSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Font Family</Label>
                    <Select value={printSettings.fontFamily} onValueChange={(v) => savePrintSettings({ fontFamily: v })}>
                      <SelectTrigger className="bg-transparent border text-foreground" data-testid="select-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontChoices.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Font Size: {printSettings.fontSize}pt</Label>
                    <Slider
                      value={[printSettings.fontSize]}
                      onValueChange={([v]) => savePrintSettings({ fontSize: v })}
                      min={9}
                      max={14}
                      step={0.5}
                      className="mt-2"
                      data-testid="slider-font-size"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Inside Margin: {printSettings.marginInner}"</Label>
                    <Slider
                      value={[printSettings.marginInner]}
                      onValueChange={([v]) => savePrintSettings({ marginInner: v })}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      className="mt-2"
                      data-testid="slider-margin-inside"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Outside Margin: {printSettings.marginOuter}"</Label>
                    <Slider
                      value={[printSettings.marginOuter]}
                      onValueChange={([v]) => savePrintSettings({ marginOuter: v })}
                      min={0.25}
                      max={1}
                      step={0.05}
                      className="mt-2"
                      data-testid="slider-margin-outside"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Page Numbers</Label>
                    <Switch
                      checked={includePageNumbers}
                      onCheckedChange={setIncludePageNumbers}
                      data-testid="switch-page-numbers"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Running Headers</Label>
                    <Switch
                      checked={includeHeaders}
                      onCheckedChange={setIncludeHeaders}
                      data-testid="switch-headers"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Table of Contents</Label>
                    <Switch
                      checked={includeToc}
                      onCheckedChange={setIncludeToc}
                      data-testid="switch-toc"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Copyright Page</Label>
                    <Switch
                      checked={includeCopyright}
                      onCheckedChange={setIncludeCopyright}
                      data-testid="switch-copyright"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Chapter Break Style</Label>
                    <Select value={chapterBreakStyle} onValueChange={setChapterBreakStyle}>
                      <SelectTrigger className="bg-transparent border text-foreground" data-testid="select-chapter-break">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-page">New Page</SelectItem>
                        <SelectItem value="odd-page">Odd Page (right)</SelectItem>
                        <SelectItem value="continuous">Continuous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">ISBN (optional)</Label>
                    <Input
                      value={isbnData.isbn || ""}
                      onChange={(e) => setIsbnData({ isbn: e.target.value })}
                      placeholder="978-0-000000-00-0"
                      className="bg-transparent border text-foreground"
                      data-testid="input-isbn"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Copyright Year</Label>
                    <Input
                      value={copyrightYear}
                      onChange={(e) => setCopyrightYear(e.target.value)}
                      placeholder={new Date().getFullYear().toString()}
                      className="bg-transparent border text-foreground"
                      data-testid="input-copyright-year"
                    />
                  </div>
                </div>
              </div>

              <Card className="bg-card border">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 text-foreground">KDP Specifications Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-medium capitalize text-foreground">{kdpFormat}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trim:</span>
                      <div className="font-medium text-foreground">{printSettings.trimSize}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Font:</span>
                      <div className="font-medium text-foreground">{fontChoices.find(f => f.value === printSettings.fontFamily)?.label}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pages:</span>
                      <div className="font-medium text-foreground">{estimatedPages}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spine:</span>
                      <div className="font-medium text-foreground">{spineWidth}"</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gutter:</span>
                      <div className="font-medium text-foreground">{printSettings.marginInner}"</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="front-matter" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Dedication</Label>
                    <Textarea
                      value={frontMatter.dedication}
                      onChange={(e) => setFrontMatter({ ...frontMatter, dedication: e.target.value })}
                      placeholder="To all the warriors who never gave up..."
                      className="min-h-[80px] bg-card/80 border text-foreground"
                      data-testid="textarea-dedication"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Acknowledgments</Label>
                    <Textarea
                      value={frontMatter.acknowledgments}
                      onChange={(e) => setFrontMatter({ ...frontMatter, acknowledgments: e.target.value })}
                      placeholder="I would like to thank..."
                      className="min-h-[120px] bg-card/80 border text-foreground"
                      data-testid="textarea-acknowledgments"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Foreword</Label>
                    <Textarea
                      value={frontMatter.foreword}
                      onChange={(e) => setFrontMatter({ ...frontMatter, foreword: e.target.value })}
                      placeholder="Written by a notable figure in the field..."
                      className="min-h-[80px] bg-card/80 border text-foreground"
                      data-testid="textarea-foreword"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Preface / Author's Note</Label>
                    <Textarea
                      value={frontMatter.preface}
                      onChange={(e) => setFrontMatter({ ...frontMatter, preface: e.target.value })}
                      placeholder="A personal note to the reader..."
                      className="min-h-[120px] bg-card/80 border text-foreground"
                      data-testid="textarea-preface"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="back-matter" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">About the Author</Label>
                    <Textarea
                      value={backMatter.aboutAuthor}
                      onChange={(e) => setBackMatter({ ...backMatter, aboutAuthor: e.target.value })}
                      placeholder="Your bio and credentials..."
                      className="min-h-[150px] bg-card/80 border text-foreground"
                      data-testid="textarea-about-author"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Other Books by Author</Label>
                    <Textarea
                      value={backMatter.otherBooks}
                      onChange={(e) => setBackMatter({ ...backMatter, otherBooks: e.target.value })}
                      placeholder="List your other published works..."
                      className="min-h-[80px] bg-card/80 border text-foreground"
                      data-testid="textarea-other-books"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label className="text-foreground">Resources & References</Label>
                    <Textarea
                      value={backMatter.resources}
                      onChange={(e) => setBackMatter({ ...backMatter, resources: e.target.value })}
                      placeholder="Helpful resources, websites, organizations..."
                      className="min-h-[250px] bg-card/80 border text-foreground"
                      data-testid="textarea-resources"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card className="bg-card border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">Amazon Book Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        onClick={handleGenerateBlurb}
                        disabled={isGeneratingBlurbContext}
                        variant="outline"
                        className="w-full border text-primary hover:bg-primary/10"
                        data-testid="button-generate-blurb"
                      >
                        {isGeneratingBlurbContext ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        Generate Book Blurb
                      </Button>
                      {marketingBlurbs && (
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <Badge variant="outline" className="text-xs">Short: {marketingBlurbs.short.length} chars</Badge>
                            <Badge variant="outline" className="text-xs">Medium: {marketingBlurbs.medium.length} chars</Badge>
                            <Badge variant="outline" className="text-xs">Long: {marketingBlurbs.long.length} chars</Badge>
                          </div>
                        </div>
                      )}
                      <Textarea
                        value={bookBlurb}
                        readOnly
                        placeholder="Click 'Generate Book Blurb' to create Amazon description..."
                        className="min-h-[200px] bg-card/80 border text-foreground"
                        data-testid="textarea-blurb"
                      />
                      <div className="text-xs text-muted-foreground">
                        {bookBlurb.length}/4000 characters (Amazon limit)
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">Amazon Keywords</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        onClick={handleGenerateKeywords}
                        disabled={isGeneratingKeywords}
                        variant="outline"
                        className="w-full border text-primary hover:bg-primary/10"
                        data-testid="button-generate-keywords"
                      >
                        {isGeneratingKeywords ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        Generate AI Keywords
                      </Button>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {allKeywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-primary/20 text-primary">
                            {keyword}
                            <button
                              onClick={() => {
                                // Remove from local if it's a local keyword
                                if (localKeywords.includes(keyword)) {
                                  setLocalKeywords(localKeywords.filter(k => k !== keyword));
                                }
                              }}
                              className="ml-1 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add keyword..."
                          className="bg-transparent border text-foreground"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              handleAddKeyword(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                          data-testid="input-add-keyword"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {allKeywords.length}/7 keywords (Amazon allows up to 7)
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="bg-primary/5 border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                        <CheckCircle className="w-5 h-5 text-primary" /> Book Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>
                          <div className="font-medium text-foreground">{bookOutline?.title || "Untitled"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Genre:</span>
                          <div className="font-medium text-foreground capitalize">{bookOutline?.genre || "Fiction"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Chapters:</span>
                          <div className="font-medium text-foreground">{chapters.length}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Word Count:</span>
                          <div className="font-medium text-foreground">{totalWordCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Pages:</span>
                          <div className="font-medium text-foreground">{estimatedPages}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Format:</span>
                          <div className="font-medium text-foreground">{printSettings.trimSize}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">Export Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start bg-primary hover:bg-primary/80" 
                        size="lg" 
                        onClick={() => handleExportBook('pdf')}
                        disabled={isExporting}
                        data-testid="button-export-pdf"
                      >
                        {isExporting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <FileDown className="w-5 h-5 mr-3" />}
                        <div className="text-left">
                          <div className="font-medium">Export PDF for Print</div>
                          <div className="text-xs opacity-80">KDP-ready with bleeds and margins</div>
                        </div>
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        size="lg" 
                        variant="outline"
                        onClick={() => handleExportBook('epub')}
                        disabled={isExporting}
                        data-testid="button-export-epub"
                      >
                        {isExporting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <FileDown className="w-5 h-5 mr-3" />}
                        <div className="text-left">
                          <div className="font-medium">Export EPUB for Kindle</div>
                          <div className="text-xs text-muted-foreground">Optimized for eBook readers</div>
                        </div>
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        size="lg" 
                        variant="outline"
                        onClick={() => handleExportBook('docx')}
                        disabled={isExporting}
                        data-testid="button-export-docx"
                      >
                        {isExporting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <FileDown className="w-5 h-5 mr-3" />}
                        <div className="text-left">
                          <div className="font-medium">Export DOCX</div>
                          <div className="text-xs text-muted-foreground">Editable Word document</div>
                        </div>
                      </Button>
                      <Button className="w-full justify-start" size="lg" variant="outline" data-testid="button-preview">
                        <Eye className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Preview Book</div>
                          <div className="text-xs text-muted-foreground">See how it looks on Kindle</div>
                        </div>
                      </Button>
                      <Button className="w-full justify-start" size="lg" variant="outline" data-testid="button-save-project">
                        <Save className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Save Project</div>
                          <div className="text-xs text-muted-foreground">Save to continue later</div>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-primary/10 to-primary/80/5 border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                        <Store className="w-5 h-5 text-primary" /> Publish to Marketplace
                      </CardTitle>
                      <CardDescription>Sell your book on the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Printer className="w-4 h-4" />
                          <span>Print-on-demand</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>Set your own price</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span>Worldwide shipping</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Zap className="w-4 h-4" />
                          <span>Instant digital delivery</span>
                        </div>
                      </div>
                      <Separator className="bg-primary/20" />
                      <div className="bg-card rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Print Cost:</span>
                          <span className="font-medium text-foreground">${printCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Suggested Retail:</span>
                          <span className="font-medium text-primary">${suggestedRetail.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Your Profit (est.):</span>
                          <span className="font-medium text-green-500">${estimatedProfit.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-primary hover:bg-primary/80"
                        size="lg"
                        data-testid="button-publish-marketplace"
                      >
                        <Rocket className="w-5 h-5 mr-2" />
                        Publish to Marketplace
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Powered by Lulu print-on-demand. No inventory, no upfront costs.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-6 pt-4 border-t border">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('build')}
              className="border text-primary hover:bg-primary/10"
              data-testid="button-back-step-publish"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('start');
                toast({ title: "Start New Book", description: "Beginning a fresh project" });
              }}
              className="border text-primary hover:bg-primary/10"
              data-testid="button-start-new-book"
            >
              Start New Book
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
