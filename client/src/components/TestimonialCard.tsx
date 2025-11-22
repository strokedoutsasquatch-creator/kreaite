import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  recovery: string;
  initials: string;
}

export default function TestimonialCard({
  quote,
  name,
  recovery,
  initials,
}: TestimonialCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-4">
        <Quote className="h-8 w-8 text-primary opacity-50" />
        <p className="text-base leading-relaxed font-serif italic" data-testid="text-testimonial-quote">
          &quot;{quote}&quot;
        </p>
        <div className="flex items-center gap-3 pt-4">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold" data-testid="text-testimonial-name">
              {name}
            </div>
            <div className="text-sm text-muted-foreground" data-testid="text-testimonial-recovery">
              {recovery}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
