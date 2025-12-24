import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  X, 
  BookOpen, 
  Music, 
  Video, 
  GraduationCap,
  FileText,
  ChevronDown,
  Sparkles,
  Store,
  Users,
  DollarSign,
  Image,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import kreaiteLogo from "@assets/KreAIte1_1766574083851.png";

const studios = [
  { href: "/book-studio", label: "Book Studio", icon: BookOpen, description: "Write & publish books with AI" },
  { href: "/music-studio", label: "Music Studio", icon: Music, description: "Create AI music & audio" },
  { href: "/video-studio", label: "Video Studio", icon: Video, description: "Edit videos like CapCut" },
  { href: "/course-studio", label: "Course Studio", icon: GraduationCap, description: "Build online courses" },
  { href: "/publishing", label: "Doctrine Generator", icon: FileText, description: "Share your expertise" },
  { href: "/image-studio", label: "Image Studio", icon: Image, description: "Background removal & more" },
];

const navLinks = [
  { href: "/marketplace", label: "MARKETPLACE", icon: Store },
  { href: "/community", label: "COMMUNITY", icon: Users },
  { href: "/author-dashboard", label: "EARNINGS", icon: DollarSign },
];

export default function CreatorHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md cursor-pointer">
              <img 
                src={kreaiteLogo} 
                alt="KreAIte" 
                className="h-10 w-auto"
                data-testid="img-logo"
              />
              <div className="hidden sm:block">
                <div className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">
                  Create with AI
                </div>
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium text-xs tracking-wide text-white gap-1"
                  data-testid="dropdown-studios"
                >
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  STUDIOS
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-black border-orange-500/20">
                {studios.map((studio) => (
                  <DropdownMenuItem key={studio.href} asChild>
                    <Link href={studio.href}>
                      <div className="flex items-start gap-3 py-1 cursor-pointer w-full" data-testid={`link-${studio.label.toLowerCase().replace(" ", "-")}`}>
                        <studio.icon className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-white">{studio.label}</div>
                          <div className="text-xs text-muted-foreground">{studio.description}</div>
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-orange-500/20" />
                <DropdownMenuItem asChild>
                  <Link href="/recovery">
                    <div className="flex items-start gap-3 py-1 cursor-pointer w-full">
                      <Sparkles className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-white">Stroke Recovery</div>
                        <div className="text-xs text-muted-foreground">Recovery-focused tools</div>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`link-${link.label.toLowerCase()}`}
                  className={`font-medium text-xs tracking-wide gap-1 ${
                    location === link.href 
                      ? "text-white" 
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link href="/pricing">
              <Button
                variant="ghost"
                size="sm"
                data-testid="link-pricing"
                className="font-medium text-xs text-muted-foreground hover:text-white"
              >
                PRICING
              </Button>
            </Link>
            <Button
              size="sm"
              data-testid="button-login"
              onClick={() => window.location.href = '/api/login'}
              className="font-semibold text-xs tracking-wide bg-orange-500 hover:bg-orange-600 text-black"
            >
              START CREATING
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            data-testid="button-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-2 border-t border-orange-500/20">
            <div className="text-xs font-semibold text-orange-500 uppercase tracking-wider px-3 py-2">
              Studios
            </div>
            {studios.map((studio) => (
              <Link key={studio.href} href={studio.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${studio.label.toLowerCase().replace(" ", "-")}`}
                >
                  <studio.icon className="w-5 h-5 text-orange-500" />
                  {studio.label}
                </Button>
              </Link>
            ))}
            <div className="border-t border-orange-500/20 my-2" />
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start text-white gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase()}`}
                >
                  <link.icon className="w-5 h-5 text-orange-500" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="w-full border-orange-500/30 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  PRICING
                </Button>
              </Link>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                data-testid="mobile-button-login"
                onClick={() => window.location.href = '/api/login'}
              >
                START CREATING
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
