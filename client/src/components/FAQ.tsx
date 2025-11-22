import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function FAQ() {
  const faqs = [
    {
      question: "How is this different from traditional stroke rehabilitation?",
      answer:
        "Traditional rehab follows conservative timelines based on insurance, not biology. My methods combine proven clinical techniques with patient-driven innovation - the techniques I personally developed and refined over 6 years that aren't in medical textbooks. You get both cutting-edge 2025 neuroscience AND street-tested methods that actually work.",
    },
    {
      question: "I'm years post-stroke. Is it too late for me?",
      answer:
        "ABSOLUTELY NOT. My biggest breakthroughs happened in years 4, 5, and 6. The medical system's '1-year recovery window' is insurance fraud, not biology. Neuroplasticity never stops - your brain can continue healing and adapting for decades after stroke with the right approach.",
    },
    {
      question: "What makes the Sasquatch Method unique?",
      answer:
        "I'm the ONLY person teaching stroke recovery who actually went from 0% to 90% function. Every technique has been personally battle-tested for 6 years. I combine Think-Flinch-Existence, Baseball Bat Therapy, Enhanced Mirror Therapy, and plateau-busting strategies that don't exist anywhere else. This isn't theory - it's lived experience.",
    },
    {
      question: "Do I need expensive equipment?",
      answer:
        "No! My baseball bat method uses a $5 Walmart bat and outperformed $15,000 clinical equipment. Many breakthrough techniques use household items. I'll show you what's worth investing in and what you can DIY. Recovery shouldn't bankrupt you.",
    },
    {
      question: "How does this work with my current therapy?",
      answer:
        "This complements your clinical therapy - it doesn't replace it. Use what your therapists teach you, then apply my TAKE→LEARN→EXPERIMENT→COMBINE→APPLY formula. Many survivors use these methods alongside traditional rehab and see accelerated progress. Always consult your medical team about new techniques.",
    },
    {
      question: "What if I'm still in a wheelchair?",
      answer:
        "Perfect - that's exactly where I started. I was in a Hoyer lift with 0% function. The system includes protocols for every level: wheelchair transfers, standing exercises, weight-bearing progressions, and the complete path to independent walking. If I can do it from that starting point, you can too.",
    },
  ];

  return (
    <section className="py-20" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-faq-category">
            QUESTIONS ANSWERED
          </Badge>
          <h2 className="text-4xl font-bold mb-4" data-testid="text-faq-title">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="text-faq-subtitle">
            Everything you need to know about the Sasquatch Method
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-6"
              data-testid={`faq-item-${index}`}
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
