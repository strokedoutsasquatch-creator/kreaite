import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  FileText,
  Grid3X3,
  MoveHorizontal,
  Square,
  Crop,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookPreviewProps {
  content: string;
  coverImageUrl?: string;
  trimSize: '6x9' | '5.5x8.5' | '8.5x11' | '5x8' | '5.25x8';
  margins?: { top: number; bottom: number; inside: number; outside: number };
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  imagePlacements?: Array<{
    imageUrl: string;
    pageNumber?: number;
    position: 'left' | 'right' | 'center' | 'full';
    size: 'small' | 'medium' | 'large' | 'full';
  }>;
  onPageChange?: (page: number) => void;
  showCropMarks?: boolean;
}

type ViewMode = 'spread' | 'single' | 'thumbnails';

const TRIM_SIZE_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  '5x8': { width: 5, height: 8, label: '5" × 8"' },
  '5.25x8': { width: 5.25, height: 8, label: '5.25" × 8"' },
  '5.5x8.5': { width: 5.5, height: 8.5, label: '5.5" × 8.5"' },
  '6x9': { width: 6, height: 9, label: '6" × 9"' },
  '8.5x11': { width: 8.5, height: 11, label: '8.5" × 11"' },
};

const DEFAULT_MARGINS = { top: 0.75, bottom: 0.75, inside: 0.875, outside: 0.625 };

const PPI = 72;
const CHARS_PER_PAGE_6X9 = 2200;

function parseHtmlToPages(
  html: string,
  trimSize: string,
  fontSize: number,
  lineHeight: number
): string[] {
  const dim = TRIM_SIZE_DIMENSIONS[trimSize] || TRIM_SIZE_DIMENSIONS['6x9'];
  const pageArea = dim.width * dim.height;
  const baseArea = 6 * 9;
  const areaRatio = pageArea / baseArea;
  
  const fontRatio = 12 / fontSize;
  const lineRatio = 1.5 / lineHeight;
  const charsPerPage = Math.floor(CHARS_PER_PAGE_6X9 * areaRatio * fontRatio * lineRatio);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const textContent = tempDiv.textContent || '';
  
  const totalChars = textContent.length;
  const estimatedPages = Math.max(1, Math.ceil(totalChars / charsPerPage));
  
  const chapters = html.split(/<h[1-2][^>]*>/gi);
  const pages: string[] = [];
  
  if (chapters.length > 1) {
    chapters.forEach((chapter, index) => {
      if (!chapter.trim()) return;
      
      const chapterHtml = index > 0 ? `<h2>${chapter}` : chapter;
      const chapterText = document.createElement('div');
      chapterText.innerHTML = chapterHtml;
      const chapterLength = chapterText.textContent?.length || 0;
      const chapterPages = Math.max(1, Math.ceil(chapterLength / charsPerPage));
      
      for (let i = 0; i < chapterPages; i++) {
        const start = i * charsPerPage;
        const end = Math.min((i + 1) * charsPerPage, chapterLength);
        const pageText = (chapterText.textContent || '').slice(start, end);
        pages.push(`<div class="page-content">${pageText}</div>`);
      }
    });
  } else {
    for (let i = 0; i < estimatedPages; i++) {
      const start = i * charsPerPage;
      const end = Math.min((i + 1) * charsPerPage, totalChars);
      const pageText = textContent.slice(start, end);
      pages.push(`<div class="page-content">${pageText}</div>`);
    }
  }
  
  return pages.length > 0 ? pages : ['<div class="page-content empty">Start writing to see preview...</div>'];
}

function CropMarks({ className }: { className?: string }) {
  return (
    <svg className={cn("absolute inset-0 w-full h-full pointer-events-none", className)} viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="2" x2="5" y2="2" stroke="#666" strokeWidth="0.2" />
      <line x1="2" y1="0" x2="2" y2="5" stroke="#666" strokeWidth="0.2" />
      <line x1="95" y1="2" x2="100" y2="2" stroke="#666" strokeWidth="0.2" />
      <line x1="98" y1="0" x2="98" y2="5" stroke="#666" strokeWidth="0.2" />
      <line x1="0" y1="98" x2="5" y2="98" stroke="#666" strokeWidth="0.2" />
      <line x1="2" y1="95" x2="2" y2="100" stroke="#666" strokeWidth="0.2" />
      <line x1="95" y1="98" x2="100" y2="98" stroke="#666" strokeWidth="0.2" />
      <line x1="98" y1="95" x2="98" y2="100" stroke="#666" strokeWidth="0.2" />
    </svg>
  );
}

interface PageProps {
  content: string;
  pageNumber: number;
  isLeft: boolean;
  trimSize: string;
  margins: { top: number; bottom: number; inside: number; outside: number };
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  showCropMarks: boolean;
  coverImageUrl?: string;
  isCover?: boolean;
  zoom: number;
}

function Page({
  content,
  pageNumber,
  isLeft,
  trimSize,
  margins,
  fontSize,
  fontFamily,
  lineHeight,
  showCropMarks,
  coverImageUrl,
  isCover,
  zoom,
}: PageProps) {
  const dim = TRIM_SIZE_DIMENSIONS[trimSize] || TRIM_SIZE_DIMENSIONS['6x9'];
  const aspectRatio = dim.width / dim.height;
  const baseHeight = 500;
  const scaledHeight = baseHeight * (zoom / 100);
  const scaledWidth = scaledHeight * aspectRatio;
  
  const marginStyles = {
    paddingTop: `${margins.top * 0.5}rem`,
    paddingBottom: `${margins.bottom * 0.5}rem`,
    paddingLeft: isLeft ? `${margins.inside * 0.5}rem` : `${margins.outside * 0.5}rem`,
    paddingRight: isLeft ? `${margins.outside * 0.5}rem` : `${margins.inside * 0.5}rem`,
  };

  if (isCover && coverImageUrl) {
    return (
      <div
        className="relative bg-white shadow-2xl rounded-sm overflow-hidden flex-shrink-0"
        style={{ width: scaledWidth, height: scaledHeight }}
        data-testid={`page-cover`}
      >
        <img
          src={coverImageUrl}
          alt="Book Cover"
          className="w-full h-full object-cover"
        />
        {showCropMarks && <CropMarks />}
      </div>
    );
  }

  return (
    <div
      className="relative bg-white shadow-2xl rounded-sm overflow-hidden flex-shrink-0"
      style={{ width: scaledWidth, height: scaledHeight }}
      data-testid={`page-${pageNumber}`}
    >
      {showCropMarks && <CropMarks />}
      <div
        className="h-full overflow-hidden"
        style={{
          ...marginStyles,
          fontSize: `${fontSize * 0.6}px`,
          fontFamily: fontFamily,
          lineHeight: lineHeight,
          color: '#1a1a1a',
        }}
      >
        <div
          className="prose prose-sm max-w-none h-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <div
        className={cn(
          "absolute bottom-2 text-xs text-gray-400",
          isLeft ? "left-4" : "right-4"
        )}
      >
        {pageNumber}
      </div>
    </div>
  );
}

interface ThumbnailProps {
  content: string;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  isCover?: boolean;
  coverImageUrl?: string;
  trimSize: string;
}

function Thumbnail({ content, pageNumber, isActive, onClick, isCover, coverImageUrl, trimSize }: ThumbnailProps) {
  const dim = TRIM_SIZE_DIMENSIONS[trimSize] || TRIM_SIZE_DIMENSIONS['6x9'];
  const aspectRatio = dim.width / dim.height;
  const height = 80;
  const width = height * aspectRatio;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 bg-white rounded overflow-hidden transition-all",
        isActive 
          ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black shadow-lg scale-105" 
          : "ring-1 ring-gray-700 opacity-70 hover:opacity-100"
      )}
      style={{ width, height }}
      data-testid={`thumbnail-${pageNumber}`}
    >
      {isCover && coverImageUrl ? (
        <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        <div
          className="p-1 text-[4px] text-gray-600 leading-tight overflow-hidden h-full"
          dangerouslySetInnerHTML={{ __html: content.slice(0, 200) }}
        />
      )}
      <div className={cn(
        "absolute bottom-0.5 right-0.5 text-[8px] px-1 rounded",
        isActive ? "bg-orange-500 text-foreground" : "bg-gray-200 text-gray-600"
      )}>
        {pageNumber}
      </div>
    </button>
  );
}

export default function BookPreview({
  content,
  coverImageUrl,
  trimSize = '6x9',
  margins = DEFAULT_MARGINS,
  fontSize = 12,
  fontFamily = 'Georgia, serif',
  lineHeight = 1.5,
  imagePlacements = [],
  onPageChange,
  showCropMarks = false,
}: BookPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<ViewMode>('spread');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(
    () => parseHtmlToPages(content, trimSize, fontSize, lineHeight),
    [content, trimSize, fontSize, lineHeight]
  );

  const totalPages = pages.length + (coverImageUrl ? 1 : 0);
  const hasCover = !!coverImageUrl;

  const getPageIndex = useCallback((displayPage: number) => {
    return hasCover ? displayPage - 1 : displayPage;
  }, [hasCover]);

  const handlePageChange = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    setPageInput(String(newPage));
    onPageChange?.(newPage);
  }, [totalPages, onPageChange]);

  const goToPreviousPage = useCallback(() => {
    if (viewMode === 'spread') {
      handlePageChange(Math.max(1, currentPage - 2));
    } else {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, viewMode, handlePageChange]);

  const goToNextPage = useCallback(() => {
    if (viewMode === 'spread') {
      handlePageChange(Math.min(totalPages, currentPage + 2));
    } else {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, viewMode, handlePageChange]);

  const handlePageInputSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page)) {
      handlePageChange(page);
    }
  }, [pageInput, handlePageChange]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const fitToWidth = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 64;
    const dim = TRIM_SIZE_DIMENSIONS[trimSize];
    const pageWidth = viewMode === 'spread' ? (500 * dim.width / dim.height) * 2 + 16 : 500 * dim.width / dim.height;
    const newZoom = Math.min(200, Math.max(50, (containerWidth / pageWidth) * 100));
    setZoom(Math.round(newZoom));
  }, [trimSize, viewMode]);

  const fitToPage = useCallback(() => {
    if (!containerRef.current) return;
    const containerHeight = containerRef.current.clientHeight - 150;
    const newZoom = Math.min(200, Math.max(50, (containerHeight / 500) * 100));
    setZoom(Math.round(newZoom));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage, isFullscreen, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const renderSpreadView = () => {
    const leftPageNum = currentPage % 2 === 0 ? currentPage : currentPage - 1 || currentPage;
    const rightPageNum = leftPageNum + 1;

    const leftContent = hasCover && leftPageNum === 0 
      ? null 
      : pages[getPageIndex(leftPageNum) - (hasCover ? 0 : 1)];
    const rightContent = pages[getPageIndex(rightPageNum) - (hasCover ? 0 : 1)];

    const showLeftAsCover = hasCover && leftPageNum === 1;
    const showRightAsCover = hasCover && rightPageNum === 1;

    return (
      <div className="flex items-center justify-center gap-1">
        {leftPageNum >= 1 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${leftPageNum}`}
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
            >
              <Page
                content={showLeftAsCover ? '' : (leftContent || '')}
                pageNumber={leftPageNum}
                isLeft={true}
                trimSize={trimSize}
                margins={margins}
                fontSize={fontSize}
                fontFamily={fontFamily}
                lineHeight={lineHeight}
                showCropMarks={showCropMarks}
                coverImageUrl={showLeftAsCover ? coverImageUrl : undefined}
                isCover={showLeftAsCover}
                zoom={zoom}
              />
            </motion.div>
          </AnimatePresence>
        )}
        {rightPageNum <= totalPages && rightContent && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${rightPageNum}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
            >
              <Page
                content={showRightAsCover ? '' : rightContent}
                pageNumber={rightPageNum}
                isLeft={false}
                trimSize={trimSize}
                margins={margins}
                fontSize={fontSize}
                fontFamily={fontFamily}
                lineHeight={lineHeight}
                showCropMarks={showCropMarks}
                coverImageUrl={showRightAsCover ? coverImageUrl : undefined}
                isCover={showRightAsCover}
                zoom={zoom}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  const renderSingleView = () => {
    const isCoverPage = hasCover && currentPage === 1;
    const pageContent = isCoverPage ? '' : pages[getPageIndex(currentPage) - (hasCover ? 0 : 1)];

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`single-${currentPage}`}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Page
            content={isCoverPage ? '' : (pageContent || '')}
            pageNumber={currentPage}
            isLeft={currentPage % 2 === 0}
            trimSize={trimSize}
            margins={margins}
            fontSize={fontSize}
            fontFamily={fontFamily}
            lineHeight={lineHeight}
            showCropMarks={showCropMarks}
            coverImageUrl={isCoverPage ? coverImageUrl : undefined}
            isCover={isCoverPage}
            zoom={zoom}
          />
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderThumbnailsView = () => {
    const allPages = hasCover 
      ? [{ isCover: true, content: '', pageNum: 1 }, ...pages.map((p, i) => ({ isCover: false, content: p, pageNum: i + 2 }))]
      : pages.map((p, i) => ({ isCover: false, content: p, pageNum: i + 1 }));

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
        {allPages.map((page) => (
          <Thumbnail
            key={page.pageNum}
            content={page.content}
            pageNumber={page.pageNum}
            isActive={page.pageNum === currentPage}
            onClick={() => handlePageChange(page.pageNum)}
            isCover={page.isCover}
            coverImageUrl={coverImageUrl}
            trimSize={trimSize}
          />
        ))}
      </div>
    );
  };

  const dim = TRIM_SIZE_DIMENSIONS[trimSize];

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-background rounded-lg overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "h-full min-h-[600px]"
      )}
      data-testid="book-preview-container"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
            {dim.label}
          </Badge>
          <Separator orientation="vertical" className="h-4 bg-zinc-700" />
          <span className="text-xs text-gray-400">
            {totalPages} {totalPages === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={viewMode === 'spread' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('spread')}
                className="h-8 w-8"
                data-testid="button-view-spread"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Two-page spread</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={viewMode === 'single' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('single')}
                className="h-8 w-8"
                data-testid="button-view-single"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Single page</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={viewMode === 'thumbnails' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('thumbnails')}
                className="h-8 w-8"
                data-testid="button-view-thumbnails"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Thumbnail overview</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-4 bg-zinc-700 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={fitToWidth}
                className="h-8 w-8"
                data-testid="button-fit-width"
              >
                <MoveHorizontal className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to width</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={fitToPage}
                className="h-8 w-8"
                data-testid="button-fit-page"
              >
                <Square className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to page</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-4 bg-zinc-700 mx-1" />

          <div className="flex items-center gap-2 px-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="h-7 w-7"
              data-testid="button-zoom-out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <div className="w-24">
              <Slider
                value={[zoom]}
                min={50}
                max={200}
                step={10}
                onValueChange={([v]) => setZoom(v)}
                data-testid="slider-zoom"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="h-7 w-7"
              data-testid="button-zoom-in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-gray-400 w-10 text-center">{zoom}%</span>
          </div>
          
          <Separator orientation="vertical" className="h-4 bg-zinc-700 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={showCropMarks ? 'secondary' : 'ghost'}
                onClick={() => {}}
                className="h-8 w-8"
                data-testid="button-crop-marks"
              >
                <Crop className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Crop marks</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                data-testid="button-fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
          
          {isFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              data-testid="button-close-fullscreen"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-auto">
        {viewMode === 'thumbnails' ? (
          <ScrollArea className="h-full">
            {renderThumbnailsView()}
          </ScrollArea>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {viewMode === 'spread' ? renderSpreadView() : renderSingleView()}
          </div>
        )}

        {viewMode !== 'thumbnails' && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-card hover:bg-black/70 disabled:opacity-30"
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-card hover:bg-black/70 disabled:opacity-30"
              data-testid="button-next-page"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      {viewMode !== 'thumbnails' && (
        <div className="flex flex-col gap-2 px-4 py-3 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="text-xs"
              data-testid="button-nav-prev"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Page</span>
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                min={1}
                max={totalPages}
                className="w-14 h-7 text-xs text-center bg-zinc-800 border-zinc-700"
                data-testid="input-page-number"
              />
              <span className="text-xs text-gray-400">of {totalPages}</span>
            </form>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="text-xs"
              data-testid="button-nav-next"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 py-1 px-2">
              {(hasCover 
                ? [{ isCover: true, content: '', pageNum: 1 }, ...pages.map((p, i) => ({ isCover: false, content: p, pageNum: i + 2 }))]
                : pages.map((p, i) => ({ isCover: false, content: p, pageNum: i + 1 }))
              ).map((page) => (
                <Thumbnail
                  key={page.pageNum}
                  content={page.content}
                  pageNumber={page.pageNum}
                  isActive={page.pageNum === currentPage || (viewMode === 'spread' && page.pageNum === currentPage + 1)}
                  onClick={() => handlePageChange(page.pageNum)}
                  isCover={page.isCover}
                  coverImageUrl={coverImageUrl}
                  trimSize={trimSize}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
