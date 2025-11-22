import ExerciseCard from "./ExerciseCard";
import { Badge } from "@/components/ui/badge";
import baseballBatImage from "@assets/generated_images/baseball_bat_therapy_equipment.png";
import mirrorTherapyImage from "@assets/generated_images/mirror_therapy_exercise.png";
import dropFootImage from "@assets/generated_images/drop_foot_recovery_protocol.png";

export default function FeaturedExercises() {
  const exercises = [
    {
      title: "Baseball Bat Therapy",
      description:
        "My secret weapon that outperformed $15,000 clinical equipment. Progressive challenge protocols for strength and balance.",
      difficulty: "Intermediate" as const,
      bodyArea: ["Arm", "Balance", "Proprioception"],
      duration: "15-20 min",
      imageUrl: baseballBatImage,
    },
    {
      title: "Mirror Therapy Revolution",
      description:
        "20-minute intensive sessions vs. standard 5-minute protocols. Tricking your brain into healing through visual-motor cortex training.",
      difficulty: "Beginner" as const,
      bodyArea: ["Hand", "Arm", "Neuroplasticity"],
      duration: "20 min",
      imageUrl: mirrorTherapyImage,
    },
    {
      title: "Drop Foot Protocol",
      description:
        "Complete system from AFO dependence to independent walking. Foam wedges, calf stretches, and progressive weight-bearing exercises.",
      difficulty: "Advanced" as const,
      bodyArea: ["Leg", "Ankle", "Gait"],
      duration: "30 min",
      imageUrl: dropFootImage,
    },
  ];

  return (
    <section className="py-20" id="exercises">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-exercises-category">
            BREAKTHROUGH TECHNIQUES
          </Badge>
          <h2 className="text-4xl font-bold mb-4" data-testid="text-exercises-title">
            The Complete Recovery Arsenal
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-exercises-subtitle">
            Battle-tested methods that took me from 0% to 90% function. Every technique personally refined over 6 years.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={index}
              {...exercise}
              onClick={() => console.log(`${exercise.title} clicked`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
