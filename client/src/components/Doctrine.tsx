import { Badge } from "@/components/ui/badge";

export default function Doctrine() {
  const principles = [
    {
      title: "You've Already Won",
      description: "You survived. That's the first victory.",
    },
    {
      title: "Control What You Can",
      description: "Daily efforts, arena logs, control what drains you away.",
    },
    {
      title: "Stack Failures Into Success",
      description: "Every fail compounds forward. Progress through persistence.",
    },
    {
      title: "Never Zero",
      description: "If you can't do the whole drill, do a fragment. Something beats nothing.",
    },
    {
      title: "Patience Is A Virtue But A Villain",
      description: "Be patient with progress, but relentless with effort.",
    },
    {
      title: "Anger Is Fuel",
      description: "Channel it. Let defiance drive determination.",
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(/attached_assets/doctrine_1763787301561.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-doctrine-category">
            THE SASQUATCH DOCTRINE
          </Badge>
          <h2 className="text-4xl font-bold mb-4 uppercase" data-testid="text-doctrine-title">
            TATTOO GRADE LAWS
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-doctrine-subtitle">
            The unbreakable principles that guide every stroke warrior's recovery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, index) => (
            <div
              key={index}
              className="group p-6 rounded-lg border-2 border-primary/20 hover-elevate bg-card/50 backdrop-blur"
              data-testid={`principle-${index}`}
            >
              <div className="text-primary text-5xl font-black mb-2">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">
                {principle.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
