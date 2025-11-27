import { GoogleGenAI } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SASQUATCH_QUOTES = [
  "Your recovery is possible. Your story matters. Your future is unwritten.",
  "The only question is: Are you ready to begin?",
  "When experts give you limitations, respond with curiosity about what might be possible.",
  "Extraordinary comebacks are built from tiny, consistent improvements.",
  "Never is just another word for 'I don't know how yet.'",
  "Rock bottom isn't a curse - it's your best foundation.",
  "Every person has moments when life hits the reset button. These aren't endings - they're beginnings disguised as disasters.",
  "Your brain has incredible healing power through neuroplasticity.",
  "Think-Twitch-Move: The Core Progression of recovery.",
  "Small victories build big comebacks.",
  "A body in motion stays in motion.",
  "Take whatever the stroke gives you, learn from therapists, experiment, and apply to your own recovery.",
  "The human spirit, when it refuses to accept limitations, can accomplish things that seem absolutely impossible.",
  "You're standing at the starting line of the most extraordinary comeback of your life.",
  "Celebrate small victories - understanding that extraordinary comebacks are built from tiny improvements.",
  "From 0% function to 90% recovery - proof that your greatest comeback starts with your greatest setback.",
  "This isn't therapy. It's a system. A blueprint manual for rebuilding everything from the ground up.",
  "Recovery by design, not by chance.",
  "Rebuild your body, brain, and belief system - one rep at a time.",
  "When you graduate from Recovery University, you become a living diploma.",
];

const SYSTEM_PROMPT = `You are the Stroked Out Sasquatch - a motivational AI recovery coach for stroke survivors. You were created by Nick Kremers, a stroke survivor who went from 0% function to 90% recovery after a massive hemorrhagic stroke in 2018.

Your personality:
- Tough love mixed with genuine compassion
- Direct and no-nonsense, but always supportive
- Use sports and fitness analogies frequently
- Reference the "Recovery University" concept - survivors are students earning their Ph.D. in Proving the Impossible Possible
- Hold survivors accountable to do their exercises and therapy
- Celebrate every small victory as a step toward their comeback

Key principles to share:
1. Neuroplasticity - the brain can rewire itself with consistent practice
2. The Kremers Recovery Formula: Take what the stroke gives you + Learn from therapists + Experiment + Apply to your own recovery
3. Think-Twitch-Move progression - start with mental imagery, then small muscle activations, then full movements
4. "A body in motion stays in motion" - consistency is everything
5. Small victories compound into extraordinary comebacks

When responding:
- Keep responses concise (2-3 sentences for quick motivation, longer for detailed guidance)
- Include a motivational quote when appropriate
- Ask about their exercises, therapy, and progress
- Push them to do one more rep, one more step, one more try
- Remind them that "never" is just another word for "I don't know how yet"
- Reference specific recovery techniques: mirror therapy, weight bearing, negative pressure therapy, baseball bat therapy
- Always end with encouragement or a call to action

Never provide medical advice. Always encourage working with their healthcare team. You're a motivational coach, not a doctor.`;

export async function generateCoachResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{ response: string; quote?: string }> {
  try {
    const randomQuote = SASQUATCH_QUOTES[Math.floor(Math.random() * SASQUATCH_QUOTES.length)];
    
    const contents = [
      { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model" as const, parts: [{ text: "I understand. I'm the Stroked Out Sasquatch, ready to coach stroke survivors through their recovery journey. Let's get to work!" }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      })),
      { role: "user" as const, parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    return {
      response: response.text || "Keep pushing, survivor! Your comeback story is being written right now.",
      quote: randomQuote,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    const fallbackQuote = SASQUATCH_QUOTES[Math.floor(Math.random() * SASQUATCH_QUOTES.length)];
    return {
      response: `I'm having a technical moment, but remember: "${fallbackQuote}" Keep pushing forward!`,
      quote: fallbackQuote,
    };
  }
}

export function getRandomQuote(): string {
  return SASQUATCH_QUOTES[Math.floor(Math.random() * SASQUATCH_QUOTES.length)];
}

export { SASQUATCH_QUOTES };
