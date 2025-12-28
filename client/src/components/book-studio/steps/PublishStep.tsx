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
  
  const [bookBlurb, setBookBlurb] = useState("");
  const [amazonKeywords, setAmazonKeywords] = useState<string[]>([]);
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState(false);

  const chapters = bookOutline?.chapters || [];
  const totalWordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount || ch.targetWordCount), 0);
  const estimatedPages = Math.ceil(totalWordCount / 250);
  const spineWidth = (estimatedPages * (paperType === 'cream' ? 0.0025 : 0.002252)).toFixed(3);
  const printCost = 0.90 + estimatedPages * 0.012;
  const suggestedRetail = Math.max(9.99, printCost * 2.5);
  const estimatedProfit = suggestedRetail * 0.85 - printCost;

  const handleGenerateBlurb = async () => {
    setIsGeneratingBlurb(true);
    setTimeout(() => {
      setBookBlurb(`Discover the transformative journey that will change your life forever. In "${bookOutline?.title || 'this compelling book'}", you'll find practical wisdom, inspiring stories, and actionable strategies to overcome any obstacle.\n\nWhether you're facing challenges or seeking personal growth, this book provides the roadmap you need to achieve your goals and live your best life.`);
      setIsGeneratingBlurb(false);
      toast({ title: "Blurb Generated" });
    }, 1500);
  };

  const handleAddKeyword = (keyword: string) => {
    if (keyword.trim() && amazonKeywords.length < 7) {
      setAmazonKeywords([...amazonKeywords, keyword.trim()]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Layout className="w-5 h-5 text-orange-500" />
            Step 5: Format for KDP
          </CardTitle>
          <CardDescription>
            Set up professional formatting, front/back matter, and KDP-ready layout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 bg-black/30">
              <TabsTrigger value="layout" data-testid="tab-layout">Page Layout</TabsTrigger>
              <TabsTrigger value="front-matter" data-testid="tab-front-matter">Front Matter</TabsTrigger>
              <TabsTrigger value="back-matter" data-testid="tab-back-matter">Back Matter</TabsTrigger>
              <TabsTrigger value="export" data-testid="tab-export">Export & Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-black/30 rounded-lg border border-orange-500/20">
                <div>
                  <Label className="text-xs text-muted-foreground">Format Type</Label>
                  <Select value={kdpFormat} onValueChange={setKdpFormat}>
                    <SelectTrigger className="h-8 bg-transparent border-orange-500/20 text-white" data-testid="select-kdp-format">
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
                    <SelectTrigger className="h-8 bg-transparent border-orange-500/20 text-white" data-testid="select-paper-type">
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
                    <SelectTrigger className="h-8 bg-transparent border-orange-500/20 text-white" data-testid="select-bleed">
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
                    <SelectTrigger className="h-8 bg-transparent border-orange-500/20 text-white" data-testid="select-trim-size">
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
                    <Label className="text-white">Font Family</Label>
                    <Select value={printSettings.fontFamily} onValueChange={(v) => savePrintSettings({ fontFamily: v })}>
                      <SelectTrigger className="bg-transparent border-orange-500/20 text-white" data-testid="select-font">
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
                    <Label className="text-white">Font Size: {printSettings.fontSize}pt</Label>
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
                    <Label className="text-white">Inside Margin: {printSettings.marginInner}"</Label>
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
                    <Label className="text-white">Outside Margin: {printSettings.marginOuter}"</Label>
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
                    <Label className="text-white">Page Numbers</Label>
                    <Switch
                      checked={includePageNumbers}
                      onCheckedChange={setIncludePageNumbers}
                      data-testid="switch-page-numbers"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Running Headers</Label>
                    <Switch
                      checked={includeHeaders}
                      onCheckedChange={setIncludeHeaders}
                      data-testid="switch-headers"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Table of Contents</Label>
                    <Switch
                      checked={includeToc}
                      onCheckedChange={setIncludeToc}
                      data-testid="switch-toc"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Copyright Page</Label>
                    <Switch
                      checked={includeCopyright}
                      onCheckedChange={setIncludeCopyright}
                      data-testid="switch-copyright"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Chapter Break Style</Label>
                    <Select value={chapterBreakStyle} onValueChange={setChapterBreakStyle}>
                      <SelectTrigger className="bg-transparent border-orange-500/20 text-white" data-testid="select-chapter-break">
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
                    <Label className="text-white">ISBN (optional)</Label>
                    <Input
                      value={isbnData.isbn || ""}
                      onChange={(e) => setIsbnData({ isbn: e.target.value })}
                      placeholder="978-0-000000-00-0"
                      className="bg-transparent border-orange-500/20 text-white"
                      data-testid="input-isbn"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Copyright Year</Label>
                    <Input
                      value={copyrightYear}
                      onChange={(e) => setCopyrightYear(e.target.value)}
                      placeholder={new Date().getFullYear().toString()}
                      className="bg-transparent border-orange-500/20 text-white"
                      data-testid="input-copyright-year"
                    />
                  </div>
                </div>
              </div>

              <Card className="bg-black/40 border-orange-500/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 text-white">KDP Specifications Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-medium capitalize text-white">{kdpFormat}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trim:</span>
                      <div className="font-medium text-white">{printSettings.trimSize}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Font:</span>
                      <div className="font-medium text-white">{fontChoices.find(f => f.value === printSettings.fontFamily)?.label}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pages:</span>
                      <div className="font-medium text-white">{estimatedPages}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spine:</span>
                      <div className="font-medium text-white">{spineWidth}"</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gutter:</span>
                      <div className="font-medium text-white">{printSettings.marginInner}"</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="front-matter" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Dedication</Label>
                    <Textarea
                      value={frontMatter.dedication}
                      onChange={(e) => setFrontMatter({ ...frontMatter, dedication: e.target.value })}
                      placeholder="To all the warriors who never gave up..."
                      className="min-h-[80px] bg-black/30 border-orange-500/20 text-white"
                      data-testid="textarea-dedication"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Acknowledgments</Label>
                    <Textarea
                      value={frontMatter.acknowledgments}
                      onChange={(e) => setFrontMatter({ ...frontMatter, acknowledgments: e.target.value })}
                      placeholder="I would like to thank..."
                      className="min-h-[120px] bg-black/30 border-orange-500/20 text-white"
                      data-testid="textarea-acknowledgments"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Foreword</Label>
                    <Textarea
                      value={frontMatter.foreword}
                      onChange={(e) => setFrontMatter({ ...frontMatter, foreword: e.target.value })}
                      placeholder="Written by a notable figure in the field..."
                      className="min-h-[80px] bg-black/30 border-orange-500/20 text-white"
                      data-testid="textarea-foreword"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Preface / Author's Note</Label>
                    <Textarea
                      value={frontMatter.preface}
                      onChange={(e) => setFrontMatter({ ...frontMatter, preface: e.target.value })}
                      placeholder="A personal note to the reader..."
                      className="min-h-[120px] bg-black/30 border-orange-500/20 text-white"
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
                    <Label className="text-white">About the Author</Label>
                    <Textarea
                      value={backMatter.aboutAuthor}
                      onChange={(e) => setBackMatter({ ...backMatter, aboutAuthor: e.target.value })}
                      placeholder="Your bio and credentials..."
                      className="min-h-[150px] bg-black/30 border-orange-500/20 text-white"
                      data-testid="textarea-about-author"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Other Books by Author</Label>
                    <Textarea
                      value={backMatter.otherBooks}
                      onChange={(e) => setBackMatter({ ...backMatter, otherBooks: e.target.value })}
                      placeholder="List your other published works..."
                      className="min-h-[80px] bg-black/30 border-orange-500/20 text-white"
                      data-testid="textarea-other-books"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label className="text-white">Resources & References</Label>
                    <Textarea
                      value={backMatter.resources}
                      onChange={(e) => setBackMatter({ ...backMatter, resources: e.target.value })}
                      placeholder="Helpful resources, websites, organizations..."
                      className="min-h-[250px] bg-black/30 border-orange-500/20 text-white"
                      data-testid="textarea-resources"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card className="bg-black/40 border-orange-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white">Amazon Book Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        onClick={handleGenerateBlurb}
                        disabled={isGeneratingBlurb}
                        variant="outline"
                        className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        data-testid="button-generate-blurb"
                      >
                        {isGeneratingBlurb ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        Generate Book Blurb
                      </Button>
                      <Textarea
                        value={bookBlurb}
                        onChange={(e) => setBookBlurb(e.target.value)}
                        placeholder="Your book description for Amazon..."
                        className="min-h-[200px] bg-black/30 border-orange-500/20 text-white"
                        data-testid="textarea-blurb"
                      />
                      <div className="text-xs text-muted-foreground">
                        {bookBlurb.length}/4000 characters (Amazon limit)
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-orange-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white">Amazon Keywords</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {amazonKeywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-orange-500/20 text-orange-400">
                            {keyword}
                            <button
                              onClick={() => setAmazonKeywords(amazonKeywords.filter((_, idx) => idx !== i))}
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
                          className="bg-transparent border-orange-500/20 text-white"
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
                        {amazonKeywords.length}/7 keywords (Amazon allows up to 7)
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <CheckCircle className="w-5 h-5 text-orange-500" /> Book Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>
                          <div className="font-medium text-white">{bookOutline?.title || "Untitled"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Genre:</span>
                          <div className="font-medium text-white capitalize">{bookOutline?.genre || "Fiction"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Chapters:</span>
                          <div className="font-medium text-white">{chapters.length}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Word Count:</span>
                          <div className="font-medium text-white">{totalWordCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Pages:</span>
                          <div className="font-medium text-white">{estimatedPages}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Format:</span>
                          <div className="font-medium text-white">{printSettings.trimSize}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-orange-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white">Export Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start bg-orange-500 hover:bg-orange-600" size="lg" data-testid="button-export-pdf">
                        <FileDown className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Export PDF for Print</div>
                          <div className="text-xs opacity-80">KDP-ready with bleeds and margins</div>
                        </div>
                      </Button>
                      <Button className="w-full justify-start" size="lg" variant="outline" data-testid="button-export-epub">
                        <FileDown className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Export EPUB for Kindle</div>
                          <div className="text-xs text-muted-foreground">Optimized for eBook readers</div>
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

                  <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <Store className="w-5 h-5 text-orange-500" /> Publish to Marketplace
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
                      <Separator className="bg-orange-500/20" />
                      <div className="bg-black/40 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Print Cost:</span>
                          <span className="font-medium text-white">${printCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Suggested Retail:</span>
                          <span className="font-medium text-orange-400">${suggestedRetail.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Your Profit (est.):</span>
                          <span className="font-medium text-green-500">${estimatedProfit.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600"
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

          <div className="flex justify-between mt-6 pt-4 border-t border-orange-500/20">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('build')}
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
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
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
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
