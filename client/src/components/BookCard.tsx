import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Share2, FileText } from "lucide-react";

interface BookCardProps {
  title: string;
  subtitle: string;
  pageCount: number;
  chapterCount: number;
  readingTime: string;
  coverImage: string;
  preview: string;
  onClick?: () => void;
}

export default function BookCard({
  title,
  subtitle,
  pageCount,
  chapterCount,
  readingTime,
  coverImage,
  preview,
  onClick,
}: BookCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate group">
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardHeader className="space-y-3">
        <div>
          <h3 className="text-xl font-bold leading-tight mb-2" data-testid="text-book-title">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid="text-book-subtitle">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" data-testid="badge-page-count">
            <FileText className="h-3 w-3 mr-1" />
            {pageCount} pages
          </Badge>
          <Badge variant="outline" data-testid="badge-chapter-count">
            <BookOpen className="h-3 w-3 mr-1" />
            {chapterCount} chapters
          </Badge>
          <Badge variant="outline" data-testid="badge-reading-time">
            {readingTime}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3" data-testid="text-book-preview">
          {preview}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" onClick={onClick} data-testid="button-read-now">
          <BookOpen className="mr-2 h-4 w-4" />
          Read Now
        </Button>
        <Button
          variant="outline"
          size="icon"
          data-testid="button-download"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Download clicked");
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          data-testid="button-share"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Share clicked");
          }}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
