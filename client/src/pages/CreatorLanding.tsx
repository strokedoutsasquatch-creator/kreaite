import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { 
  BookOpen, 
  Music, 
  Video, 
  GraduationCap, 
  FileText,
  Image,
  Sparkles,
  Play,
  Users,
  DollarSign,
  Globe,
  Zap,
  Star,
  ArrowRight,
  Check,
  TrendingUp,
  Mic,
  Palette,
  Film,
} from "lucide-react";

const studios = [
  {
    icon: BookOpen,
    title: "Book Studio",
    description: "Write, format, and publish books with AI assistance. From outline to Amazon in hours, not months.",
    features: ["AI-powered writing", "Professional formatting", "Print-on-demand", "EPUB/PDF export"],
    href: "/book-studio",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Music,
    title: "Music Studio",
    description: "Create professional music, voice clones, and audio content. No musical experience required.",
    features: ["AI music generation", "Voice cloning", "Sound effects", "Podcast editing"],
    href: "/music-studio",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Video,
    title: "Video Studio",
    description: "Edit videos like TikTok and CapCut. Auto captions, overlays, effects, and viral clip detection.",
    features: ["Timeline editing", "Auto captions", "Text overlays", "Background removal"],
    href: "/video-studio",
    color: "from-red-500 to-red-600",
  },
  {
    icon: GraduationCap,
    title: "Course Studio",
    description: "Build and sell online courses. AI generates curriculum, lessons, and quizzes automatically.",
    features: ["AI curriculum", "Lesson generator", "Quiz builder", "Student analytics"],
    href: "/course-studio",
    color: "from-green-500 to-green-600",
  },
  {
    icon: FileText,
    title: "Doctrine Generator",
    description: "Turn your expertise into structured content. Manuals, guides, and frameworks in minutes.",
    features: ["Expert frameworks", "AI ghostwriting", "Brand voice", "Multi-format export"],
    href: "/publishing",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Image,
    title: "Image Studio",
    description: "Professional image editing with AI. Background removal, enhancement, and generation.",
    features: ["Background removal", "AI enhancement", "Image generation", "Batch editing"],
    href: "/image-studio",
    color: "from-cyan-500 to-cyan-600",
  },
];

const stats = [
  { value: "10K+", label: "Creators" },
  { value: "$2M+", label: "Earned" },
  { value: "50K+", label: "Projects" },
  { value: "150+", label: "Countries" },
];

const testimonials = [
  {
    quote: "I went from struggling writer to published author in 3 weeks. The AI helped me organize my thoughts and the publishing tools handled everything.",
    author: "Sarah M.",
    role: "First-time Author",
    avatar: "S",
  },
  {
    quote: "I create TikTok content 10x faster now. The auto captions and viral moment detection are game-changers.",
    author: "Marcus J.",
    role: "Content Creator",
    avatar: "M",
  },
  {
    quote: "Built my entire online course in a weekend. The AI generated my curriculum and I just refined it. Already made $15K in sales.",
    author: "Dr. Lisa K.",
    role: "Course Creator",
    avatar: "L",
  },
];

export default function CreatorLanding() {
  return (
    <div className="min-h-screen bg-black">
      <CreatorHeader />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10" />
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Creator Platform
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
                <span className="text-white">Create </span>
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Anything</span>
                <span className="text-white">.</span>
                <br />
                <span className="text-white">From </span>
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Anywhere</span>
                <span className="text-white">.</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Books. Music. Videos. Courses. You don't need Hollywood or Silicon Valley. 
                <span className="text-white font-medium"> Just AI and your ideas.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-lg px-8 gap-2"
                  data-testid="button-start-creating"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Start Creating Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Link href="/marketplace">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-orange-500/30 text-white hover:bg-orange-500/10 font-semibold text-lg px-8 gap-2"
                    data-testid="button-explore-marketplace"
                  >
                    <Play className="w-5 h-5" />
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                No credit card required. Start with free credits.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-orange-500/20 bg-orange-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-orange-500">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Studios Grid */}
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Zap className="w-3 h-3 mr-1" />
                6 Powerful Studios
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                One Platform. Unlimited Creativity.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create, publish, and monetize your content. AI does the heavy lifting.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.map((studio) => (
                <Link key={studio.href} href={studio.href}>
                  <Card className="group h-full bg-black border-border hover:border-orange-500/50 transition-all duration-300 cursor-pointer hover-elevate" data-testid={`card-${studio.title.toLowerCase().replace(" ", "-")}`}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${studio.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <studio.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                        {studio.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4">
                        {studio.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {studio.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs bg-white/5 text-muted-foreground">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                From Idea to Income in 3 Steps
              </h2>
              <p className="text-xl text-muted-foreground">
                No technical skills. No expensive equipment. Just you and AI.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500 text-black font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Create</h3>
                <p className="text-muted-foreground">
                  Pick a studio. Tell AI what you want to create. Watch it come to life in minutes.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500 text-black font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Publish</h3>
                <p className="text-muted-foreground">
                  One-click publishing to marketplace, Amazon, Spotify, YouTube, or your own website.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500 text-black font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Earn</h3>
                <p className="text-muted-foreground">
                  Sell your creations. Build an audience. Generate passive income while you sleep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Creators Are Winning
              </h2>
              <p className="text-xl text-muted-foreground">
                Real people. Real results. Join the movement.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-black border-border">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground mb-6">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-white">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* The Story */}
        <section className="py-20 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Globe className="w-3 h-3 mr-1" />
              Our Mission
            </Badge>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              You Don't Need Silicon Valley
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8">
              Built by a stroke survivor who went from 400lb bench press to wheelchair to recovery. 
              If I can rebuild my life, <span className="text-white font-medium">you can build your creator empire</span>. 
              AI levels the playing field. Your small town is now the world stage.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/about">
                <Button variant="outline" className="border-orange-500/30 text-white hover:bg-orange-500/10 gap-2">
                  Read the Full Story
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 lg:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-gradient-to-br from-orange-500/20 to-blue-500/20 border-orange-500/30">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to Create?
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Join thousands of creators turning their ideas into income. Start free today.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-lg px-8 gap-2"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-cta-start"
                  >
                    Start Creating Now
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Free to start
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    No credit card
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Cancel anytime
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
