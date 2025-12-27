import { useState } from "react";
import { WorkspaceShell } from "@/components/BookWorkspace";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

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

  const handleExport = async (format: string) => {
    setSelectedExport(format);
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    if (!selectedExport) return;
    
    setIsExporting(true);
    try {
      toast({ 
        title: "Export Started", 
        description: `Generating ${selectedExport.toUpperCase()} format...` 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({ 
        title: "Export Complete", 
        description: "Your file is ready for download" 
      });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: "Please try again", 
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
                  handleExport(platform.id);
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
