import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  Sparkles,
  X,
  FileText,
  Hash,
  Image,
  Calendar,
  Megaphone,
} from "lucide-react";
import { SiX, SiLinkedin, SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const platforms = [
  { id: "twitter", label: "Twitter/X", icon: SiX, maxLength: 280, color: "bg-background" },
  { id: "linkedin", label: "LinkedIn", icon: SiLinkedin, maxLength: 3000, color: "bg-blue-700" },
  { id: "instagram", label: "Instagram", icon: SiInstagram, maxLength: 2200, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { id: "facebook", label: "Facebook", icon: SiFacebook, maxLength: 63206, color: "bg-blue-600" },
  { id: "tiktok", label: "TikTok", icon: SiTiktok, maxLength: 2200, color: "bg-background" },
];

interface SocialMarketingPanelProps {
  bookTitle?: string;
  bookDescription?: string;
  bookGenre?: string;
  excerpt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SocialMarketingPanel({
  bookTitle = "",
  bookDescription = "",
  bookGenre = "",
  excerpt = "",
  isOpen,
  onClose,
}: SocialMarketingPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("social");
  const [activePlatform, setActivePlatform] = useState("twitter");
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [blogPost, setBlogPost] = useState("");
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (platform: string) => {
      const platformInfo = platforms.find((p) => p.id === platform)!;
      const res = await apiRequest("POST", "/api/ai/generate", {
        prompt: `Generate a compelling ${platform} post to promote this book:

Title: ${bookTitle}
Genre: ${bookGenre}
Description: ${bookDescription}
${excerpt ? `Excerpt: ${excerpt.substring(0, 500)}...` : ""}

Requirements:
- Maximum ${platformInfo.maxLength} characters
- Include relevant hashtags
- Create urgency and interest
- Match ${platform}'s tone and style
- Include a call-to-action

Return ONLY the post text, nothing else.`,
        maxTokens: 500,
      });
      const data = await res.json();
      return { platform, content: data.text || data.response };
    },
    onSuccess: ({ platform, content }) => {
      setGeneratedContent((prev) => ({ ...prev, [platform]: content }));
      toast({ title: "Content generated!", description: `${platform} post ready` });
    },
    onError: () => {
      toast({ title: "Generation failed", variant: "destructive" });
    },
  });

  const generateBlogMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        prompt: `Write a compelling blog post to promote this book:

Title: ${bookTitle}
Genre: ${bookGenre}
Description: ${bookDescription}
${excerpt ? `Excerpt: ${excerpt.substring(0, 1000)}...` : ""}

Requirements:
- 500-800 words
- Engaging introduction
- What readers will learn/experience
- Unique selling points
- Author credibility (if mentioned)
- Call-to-action to purchase
- SEO-friendly with relevant keywords
- Use markdown formatting

Return the full blog post.`,
        maxTokens: 2000,
      });
      const data = await res.json();
      return data.text || data.response;
    },
    onSuccess: (content) => {
      setBlogPost(content);
      toast({ title: "Blog post generated!" });
    },
    onError: () => {
      toast({ title: "Generation failed", variant: "destructive" });
    },
  });

  const copyToClipboard = async (platform: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  if (!isOpen) return null;

  const currentPlatform = platforms.find((p) => p.id === activePlatform)!;
  const PlatformIcon = currentPlatform.icon;

  return (
    <Card className="w-96 h-full bg-background border flex flex-col" data-testid="social-marketing-panel">
      <CardHeader className="pb-2 border-b border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm">
            <Megaphone className="w-4 h-4 text-primary" />
            Marketing Generator
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6" data-testid="button-close-marketing">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 m-2 bg-card">
          <TabsTrigger value="social" className="text-xs" data-testid="tab-social">
            <Share2 className="w-3 h-3 mr-1" />
            Social Posts
          </TabsTrigger>
          <TabsTrigger value="blog" className="text-xs" data-testid="tab-blog">
            <FileText className="w-3 h-3 mr-1" />
            Blog Post
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="social" className="m-0 p-3 space-y-3">
            <div className="flex gap-1">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isActive = activePlatform === platform.id;
                const hasContent = !!generatedContent[platform.id];
                return (
                  <button
                    key={platform.id}
                    onClick={() => setActivePlatform(platform.id)}
                    className={`flex-1 p-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary/20 border border-orange-500"
                        : "bg-card/80 border border-transparent hover:border"
                    }`}
                    data-testid={`button-platform-${platform.id}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${platform.color}`}>
                        <Icon className="w-3 h-3 text-foreground" />
                      </div>
                      {hasContent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-card/80 rounded-lg p-3 border border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentPlatform.color}`}>
                    <PlatformIcon className="w-3 h-3 text-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{currentPlatform.label}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Max {currentPlatform.maxLength} chars
                </Badge>
              </div>

              <Button
                onClick={() => generateMutation.mutate(activePlatform)}
                disabled={generateMutation.isPending || !bookTitle}
                className="w-full bg-orange-500 hover:bg-orange-600 mb-3"
                data-testid="button-generate-social"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Post
                  </>
                )}
              </Button>

              {generatedContent[activePlatform] && (
                <div className="space-y-2">
                  <Textarea
                    value={generatedContent[activePlatform]}
                    onChange={(e) =>
                      setGeneratedContent((prev) => ({
                        ...prev,
                        [activePlatform]: e.target.value,
                      }))
                    }
                    className="min-h-[150px] bg-card border text-sm"
                    data-testid="textarea-social-content"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {generatedContent[activePlatform].length} / {currentPlatform.maxLength}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(activePlatform, generatedContent[activePlatform])}
                      className="border"
                      data-testid="button-copy-social"
                    >
                      {copiedPlatform === activePlatform ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-black/20 rounded p-2 border border-orange-500/10">
              <p className="text-[10px] text-gray-500">
                Generate posts for each platform, customize them, then copy to clipboard and paste into your social media apps.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="blog" className="m-0 p-3 space-y-3">
            <div className="bg-card/80 rounded-lg p-3 border border">
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Blog Post Generator
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Create a full blog post to promote your book on your website, Medium, or other platforms.
              </p>

              <Button
                onClick={() => generateBlogMutation.mutate()}
                disabled={generateBlogMutation.isPending || !bookTitle}
                className="w-full bg-orange-500 hover:bg-orange-600"
                data-testid="button-generate-blog"
              >
                {generateBlogMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Writing Blog Post...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            </div>

            {blogPost && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-medium text-gray-400">Generated Blog Post</h5>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard("blog", blogPost)}
                    className="border"
                    data-testid="button-copy-blog"
                  >
                    {copiedPlatform === "blog" ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={blogPost}
                  onChange={(e) => setBlogPost(e.target.value)}
                  className="min-h-[300px] bg-card border text-sm font-mono"
                  data-testid="textarea-blog-content"
                />
                <p className="text-xs text-gray-500">
                  {blogPost.split(/\s+/).length} words
                </p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
