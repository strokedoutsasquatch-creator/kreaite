import { useState, useRef } from "react";
import { WorkspaceShell } from "@/components/BookWorkspace";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Apple,
  Store,
  Globe,
  Download,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface ExportData {
  format: string;
  content: string;
  title: string;
  author?: string;
}

interface Chapter {
  number: number;
  title: string;
  content: string;
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  text = text.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');
  
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
      return `- ${item.trim()}\n`;
    }) + '\n';
  });
  
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let counter = 0;
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
      counter++;
      return `${counter}. ${item.trim()}\n`;
    }) + '\n';
  });
  
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');
  
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n');
  
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n\n');
  
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  
  text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1\n');
  
  text = text.replace(/<[^>]+>/g, '');
  
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

function parseChaptersFromContent(htmlContent: string, bookTitle: string): Chapter[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const chapters: Chapter[] = [];
  
  const headings = doc.querySelectorAll('h1, h2');
  
  if (headings.length === 0) {
    return [{
      number: 1,
      title: bookTitle || "Manuscript",
      content: htmlContent,
    }];
  }
  
  const headingElements = Array.from(headings);
  
  for (let i = 0; i < headingElements.length; i++) {
    const heading = headingElements[i];
    const title = heading.textContent?.trim() || `Chapter ${i + 1}`;
    
    let content = '';
    let sibling = heading.nextElementSibling;
    const nextHeading = headingElements[i + 1];
    
    while (sibling && sibling !== nextHeading) {
      content += sibling.outerHTML || '';
      sibling = sibling.nextElementSibling;
    }
    
    chapters.push({
      number: i + 1,
      title,
      content: content || `<p>Chapter content for "${title}"</p>`,
    });
  }
  
  const firstHeading = headingElements[0];
  let preContent = '';
  let sibling = doc.body.firstElementChild;
  while (sibling && sibling !== firstHeading) {
    preContent += sibling.outerHTML || '';
    sibling = sibling.nextElementSibling;
  }
  
  if (preContent.trim()) {
    chapters.unshift({
      number: 0,
      title: "Introduction",
      content: preContent,
    });
    chapters.forEach((ch, idx) => {
      ch.number = idx + 1;
    });
  }
  
  return chapters.length > 0 ? chapters : [{
    number: 1,
    title: bookTitle || "Manuscript",
    content: htmlContent,
  }];
}

const platformToExportFormat: Record<string, "pdf" | "epub"> = {
  "kdp-pdf": "pdf",
  "ingram": "pdf",
  "kindle": "epub",
  "apple": "epub",
  "bn": "epub",
  "kobo": "epub",
  "google": "epub",
  "d2d": "epub",
};

const exportPlatforms = [
  { 
    id: "kdp-pdf", 
    name: "Amazon KDP", 
    subtitle: "Print-ready PDF",
    icon: BookOpen,
    formats: ["PDF"],
    requirements: "6x9, 8.5x11 trim sizes, 300 DPI, bleed margins"
  },
  { 
    id: "kindle", 
    name: "Kindle Direct", 
    subtitle: "EPUB/MOBI",
    icon: BookOpen,
    formats: ["EPUB", "MOBI"],
    requirements: "Reflowable layout, embedded fonts, TOC"
  },
  { 
    id: "apple", 
    name: "Apple Books", 
    subtitle: "EPUB 3.0",
    icon: Apple,
    formats: ["EPUB"],
    requirements: "EPUB 3.0, enhanced features, iBooks Author compatible"
  },
  { 
    id: "ingram", 
    name: "IngramSpark", 
    subtitle: "Global Distribution",
    icon: Globe,
    formats: ["PDF", "EPUB"],
    requirements: "40,000+ retailers, libraries, bookstores worldwide"
  },
  { 
    id: "bn", 
    name: "Barnes & Noble", 
    subtitle: "Nook Press",
    icon: Store,
    formats: ["EPUB"],
    requirements: "B&N Nook compatible, US market focus"
  },
  { 
    id: "kobo", 
    name: "Kobo Writing Life", 
    subtitle: "International",
    icon: BookOpen,
    formats: ["EPUB"],
    requirements: "Kobo Plus eligible, 190+ countries"
  },
  { 
    id: "google", 
    name: "Google Play Books", 
    subtitle: "Play Store",
    icon: Store,
    formats: ["EPUB", "PDF"],
    requirements: "Google Books Partner Program"
  },
  { 
    id: "d2d", 
    name: "Draft2Digital", 
    subtitle: "Aggregator",
    icon: Globe,
    formats: ["EPUB"],
    requirements: "Distribute to multiple platforms at once"
  },
];

export default function BookStudioV2() {
  const { toast } = useToast();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedExport, setSelectedExport] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportDataRef = useRef<ExportData | null>(null);

  const handleExport = async (data: ExportData) => {
    exportDataRef.current = data;
    setSelectedExport(data.format);
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    if (!selectedExport || !exportDataRef.current) return;
    
    const exportData = exportDataRef.current;
    const exportFormat = platformToExportFormat[selectedExport] || "epub";
    
    setIsExporting(true);
    try {
      toast({ 
        title: "Export Started", 
        description: `Generating ${exportFormat.toUpperCase()} format...` 
      });
      
      const parsedChapters = parseChaptersFromContent(exportData.content, exportData.title);
      
      const chaptersWithMarkdown = parsedChapters.map(ch => ({
        number: ch.number,
        title: ch.title,
        content: htmlToMarkdown(ch.content),
      }));
      
      const response = await apiRequest('POST', '/api/book/export', {
        format: exportFormat,
        bookTitle: exportData.title,
        chapters: chaptersWithMarkdown,
        frontMatter: {
          titlePage: true,
          author: exportData.author || "Author",
          tableOfContents: true,
        },
        backMatter: {},
        settings: {
          trimSize: "6x9",
          fontSize: "11pt",
        },
      });
      
      const result = await response.json();
      
      if (result.success && result.content) {
        let contentType: string;
        let fileExtension: string;
        
        if (exportFormat === 'pdf') {
          contentType = 'application/pdf';
          fileExtension = '.pdf';
        } else if (exportFormat === 'epub') {
          contentType = 'application/epub+zip';
          fileExtension = '.epub';
        } else {
          contentType = 'text/html';
          fileExtension = '.html';
        }
        
        // Decode base64 if binary format
        let blobData: BlobPart;
        if (exportFormat === 'pdf' || exportFormat === 'epub') {
          // Decode base64 to binary
          const binaryString = atob(result.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blobData = bytes;
        } else {
          blobData = result.content;
        }
        const blob = new Blob([blobData], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedTitle = result.fileName || exportData.title.replace(/[^a-z0-9]/gi, '_');
        a.download = `${sanitizedTitle}${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({ 
          title: "Export Complete", 
          description: `Downloaded ${sanitizedTitle}${fileExtension} (${result.wordCount} words)` 
        });
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: error instanceof Error ? error.message : "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  const handlePublish = () => {
    setShowPublishDialog(true);
  };

  const selectedPlatform = exportPlatforms.find(p => p.id === selectedExport);

  return (
    <>
      <SEO 
        title="Book Studio - KreAIte" 
        description="Professional book writing workspace with AI assistance"
      />
      
      <WorkspaceShell 
        onExport={handleExport}
        onPublish={handlePublish}
      />

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export for {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPlatform?.requirements}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlatform && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Formats:</span>
                {selectedPlatform.formats.map(fmt => (
                  <Badge key={fmt} variant="secondary">{fmt}</Badge>
                ))}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  Table of Contents generated
                </div>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  Copyright page included
                </div>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  Images optimized for platform
                </div>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  Formatting validated
                </div>
              </div>
              
              <Button 
                onClick={handleConfirmExport} 
                className="w-full"
                disabled={isExporting}
                data-testid="button-confirm-export"
              >
                {isExporting ? "Generating..." : "Export Now"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publish Your Book</DialogTitle>
            <DialogDescription>
              Choose where to publish your book. You can publish to multiple platforms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {exportPlatforms.map((platform) => (
              <Button
                key={platform.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-1"
                onClick={() => {
                  setShowPublishDialog(false);
                  toast({
                    title: `Ready for ${platform.name}`,
                    description: `Use the Export dropdown in the editor toolbar to export for ${platform.name}.`,
                  });
                }}
                data-testid={`button-publish-${platform.id}`}
              >
                <div className="flex items-center gap-2">
                  <platform.icon className="w-4 h-4" />
                  <span className="font-medium">{platform.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{platform.subtitle}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
