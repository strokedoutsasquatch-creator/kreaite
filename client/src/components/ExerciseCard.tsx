import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";

interface ExerciseCardProps {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  bodyArea: string[];
  duration: string;
  imageUrl: string;
  onClick?: () => void;
}

export default function ExerciseCard({
  title,
  description,
  difficulty,
  bodyArea,
  duration,
  imageUrl,
  onClick,
}: ExerciseCardProps) {
  const difficultyColors = {
    Beginner: "bg-accent text-accent-foreground",
    Intermediate: "bg-secondary text-secondary-foreground",
    Advanced: "bg-primary text-primary-foreground",
  };

  return (
    <Card className="overflow-hidden hover-elevate group cursor-pointer" onClick={onClick}>
      <div className="aspect-video overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold leading-tight" data-testid={`text-exercise-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {title}
          </h3>
          <Badge className={difficultyColors[difficulty]} data-testid={`badge-difficulty-${difficulty.toLowerCase()}`}>
            {difficulty}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {bodyArea.map((area) => (
            <Badge key={area} variant="outline" data-testid={`badge-body-area-${area.toLowerCase()}`}>
              {area}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed" data-testid="text-exercise-description">
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span data-testid="text-exercise-duration">{duration}</span>
        </div>
        <Button variant="ghost" size="sm" data-testid="button-view-protocol">
          View Protocol
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
