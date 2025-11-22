import ExerciseCard from '../ExerciseCard';
import baseballBatImage from "@assets/generated_images/baseball_bat_therapy_equipment.png";

export default function ExerciseCardExample() {
  return (
    <div className="max-w-sm">
      <ExerciseCard
        title="Baseball Bat Therapy"
        description="My secret weapon that outperformed $15,000 clinical equipment. Progressive challenge protocols for strength and balance."
        difficulty="Intermediate"
        bodyArea={["Arm", "Balance", "Proprioception"]}
        duration="15-20 min"
        imageUrl={baseballBatImage}
        onClick={() => console.log("Baseball Bat Therapy clicked")}
      />
    </div>
  );
}
