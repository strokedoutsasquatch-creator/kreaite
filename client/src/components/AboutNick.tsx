import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

const nickPhoto = "/attached_assets/Nick crooked smile_1763787525254.jpg";

export default function AboutNick() {
  const achievements = [
    "Massive hemorrhagic stroke with 50 staples in skull",
    "0% left side function to 90% full recovery",
    "Created breakthrough techniques not in medical textbooks",
    "Built million-dollar recovery business",
    "Helped 50,000+ stroke survivors worldwide",
  ];

  return (
    <section className="py-20 bg-card" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src={nickPhoto}
                alt="Nick Kremers - The Stroked Out Sasquatch"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <Badge variant="outline" className="mb-4" data-testid="badge-about-category">
              FROM WHEELCHAIR TO WARRIOR
            </Badge>
            <h2
              className="text-4xl font-bold mb-6"
              data-testid="text-about-title"
            >
              Meet Nick &quot;The Stroked Out Sasquatch&quot; Kremers
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p data-testid="text-about-intro">
                December 3, 2018 - The day everything changed. Hoyer lift. 50 staples.
                Complete paralysis. Doctors saying &quot;don&apos;t make assumptions until year 1.&quot;
              </p>
              <p data-testid="text-about-journey">
                August 14, 2025 - Typing with both hands, running my business stronger than
                ever, and teaching breakthrough techniques that combine my street-tested methods
                with 2025&apos;s revolutionary neuroscience.
              </p>
              <p className="font-semibold text-foreground" data-testid="text-about-mission">
                I&apos;m not a doctor. I&apos;m something better - I&apos;m a stroke survivor who REFUSED to
                quit.
              </p>
            </div>
          </div>
        </div>

        <Card className="p-8 mt-12">
          <h3 className="text-2xl font-bold mb-6" data-testid="text-achievements-title">
            The Journey
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex gap-3"
                data-testid={`achievement-${index}`}
              >
                <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-base font-medium">{achievement}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
