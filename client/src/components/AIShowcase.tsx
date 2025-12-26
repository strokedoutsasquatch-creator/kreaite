import { Book, ImagePlus, Music, Video, Eye, Mic } from "lucide-react";

const aiCapabilities = [
  {
    icon: Book,
    title: "Text AI",
    description: "Gemini & xAI power intelligent ghostwriting, course creation, and content generation with human-like prose.",
    providers: ["Gemini", "xAI"],
  },
  {
    icon: ImagePlus,
    title: "Image AI",
    description: "xAI Grok & Vertex AI Imagen create stunning visuals, artwork, and graphics from your imagination.",
    providers: ["xAI Grok", "Imagen"],
  },
  {
    icon: Music,
    title: "Music AI",
    description: "Google Lyria composes original soundtracks, ambient scores, and musical pieces for your projects.",
    providers: ["Google Lyria"],
  },
  {
    icon: Video,
    title: "Video AI",
    description: "Vertex AI Veo transforms concepts into cinematic video content with professional-grade quality.",
    providers: ["Vertex AI Veo"],
  },
  {
    icon: Eye,
    title: "Vision AI",
    description: "Google Vision provides intelligent image analysis, object detection, and visual understanding.",
    providers: ["Google Vision"],
  },
  {
    icon: Mic,
    title: "Voice AI",
    description: "Google TTS/STT delivers natural narration, voice synthesis, and accurate transcription services.",
    providers: ["Google TTS", "Google STT"],
  },
];

export default function AIShowcase() {
  return (
    <section className="py-24 bg-black relative overflow-hidden" data-testid="section-ai-showcase">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B35]/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p 
            className="text-[#FF6B35] text-sm font-semibold uppercase tracking-[0.2em] mb-4"
            data-testid="text-ai-label"
          >
            POWERED BY NEXT-GEN AI
          </p>
          <h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="text-ai-headline"
          >
            Six AI Studios.<br />
            <span className="text-[#FF6B35]">Infinite Possibilities.</span>
          </h2>
          <p 
            className="text-lg sm:text-xl text-[#D0D0D0] max-w-3xl mx-auto leading-relaxed"
            data-testid="text-ai-description"
          >
            Harness the world's most advanced AI models to create books, music, videos, 
            courses, and more—all from one unified creative platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {aiCapabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <div
                key={index}
                className="group relative p-8 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] hover:border-[#FF6B35]/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,107,53,0.15)]"
                data-testid={`card-ai-capability-${index}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6B35]/0 to-transparent group-hover:via-[#FF6B35]/60 transition-all duration-500" />
                
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-[#1A1A1A] group-hover:bg-[#FF6B35]/10 transition-colors duration-300">
                    <IconComponent 
                      className="h-8 w-8 text-white group-hover:text-[#FF6B35] transition-colors duration-300" 
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-semibold text-white mb-2 group-hover:text-[#FF6B35] transition-colors duration-300"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {capability.title}
                    </h3>
                    <p className="text-[#D0D0D0] text-sm leading-relaxed mb-4">
                      {capability.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {capability.providers.map((provider, pIndex) => (
                        <span
                          key={pIndex}
                          className="text-xs px-2 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#808080]"
                        >
                          {provider}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-8 border-t border-[#2A2A2A]">
          <p className="text-[#808080] text-sm mb-6 uppercase tracking-wider">
            Powered By Industry Leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            <div className="flex items-center gap-2 text-[#D0D0D0] opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="font-medium">Google Cloud</span>
            </div>
            <div className="flex items-center gap-2 text-[#D0D0D0] opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">V</span>
              </div>
              <span className="font-medium">Vertex AI</span>
            </div>
            <div className="flex items-center gap-2 text-[#D0D0D0] opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold">X</span>
              </div>
              <span className="font-medium">xAI</span>
            </div>
            <div className="flex items-center gap-2 text-[#D0D0D0] opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="font-medium">Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
