import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  LayoutDashboard,
  GraduationCap,
  Hammer,
  Dumbbell,
  Building2,
  Users,
  ChevronDown,
  Heart,
  Settings,
  LogOut,
  ArrowLeft,
  Activity,
  Brain,
  Target,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import strokeLyfeLogo from "@assets/Stroke Lyfe OS Logo_1763788031983.png";

const navLinks = [
  { href: "/recovery", label: "HOME", icon: Heart, description: "Recovery landing page" },
  { href: "/recovery/academy", label: "COURSES", icon: GraduationCap, description: "Learn recovery techniques" },
  { href: "/recovery/dashboard", label: "PROGRESS", icon: Target, description: "Track your recovery journey" },
  { href: "/recovery/social", label: "COMMUNITY", icon: Users, description: "Connect with survivors" },
  { href: "/recovery/university", label: "RESOURCES", icon: Building2, description: "Guides and tools" },
];

const quickFeatures = [
  { href: "/recovery/dashboard", label: "Progress Tracking", icon: Target, description: "Monitor your milestones" },
  { href: "/recovery/exercises", label: "Daily Exercises", icon: Activity, description: "Personalized routines" },
  { href: "/recovery/academy", label: "Brain Training", icon: Brain, description: "Cognitive exercises" },
];

export default function RecoveryHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-emerald-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/creator-landing" data-testid="link-back-kreate">
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-400 hover:text-emerald-300 gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">KreAIte</span>
              </Button>
            </Link>
            
            <Link href="/recovery" data-testid="link-recovery-home">
              <div className="flex items-center gap-3 hover-elevate active-elevate-2 px-2 py-1 rounded-md cursor-pointer">
                <img 
                  src={strokeLyfeLogo} 
                  alt="Stroke Recovery Academy" 
                  className="h-10 w-auto"
                  data-testid="img-recovery-logo"
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-emerald-400 tracking-wide">
                    Stroke Recovery Academy
                  </div>
                  <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                    Your Path to Recovery
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium text-xs tracking-wide text-white gap-1"
                  data-testid="dropdown-features"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  FEATURES
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 bg-black border-emerald-700/30">
                {quickFeatures.map((feature) => (
                  <DropdownMenuItem key={feature.href} asChild>
                    <Link href={feature.href}>
                      <div className="flex items-start gap-3 py-1 cursor-pointer w-full" data-testid={`link-feature-${feature.label.toLowerCase().replace(" ", "-")}`}>
                        <feature.icon className="w-5 h-5 text-emerald-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {feature.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
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
                      ? "text-emerald-400" 
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
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="dropdown-user">
                    <Avatar className="h-7 w-7 border border-emerald-500/30">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black border-emerald-700/30">
                  <div className="px-3 py-2 border-b border-emerald-700/30">
                    <div className="font-medium text-white">{user.firstName || 'Survivor'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    <Badge variant="outline" className="mt-2 text-[10px] border-emerald-500/50 text-emerald-400">
                      <Heart className="w-3 h-3 mr-1" />
                      Recovery Member
                    </Badge>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/recovery/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2 text-emerald-500" />
                      My Progress
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2 text-emerald-500" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-emerald-700/30" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-400 focus:text-red-400"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                data-testid="button-join"
                onClick={() => window.location.href = '/api/login'}
                className="font-semibold text-xs tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                JOIN RECOVERY
              </Button>
            )}
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
          <div className="lg:hidden py-4 space-y-2 border-t border-emerald-700/30">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-zinc-900/50 rounded-lg">
                <Avatar className="h-10 w-10 border border-emerald-500/30">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white">{user.firstName || 'Survivor'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
            )}
            
            <Link href="/creator-landing">
              <Button
                variant="ghost"
                className="w-full justify-start text-emerald-400 gap-3 mb-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-link-back"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to KreAIte
              </Button>
            </Link>
            
            <div className="border-t border-emerald-700/30 my-2" />
            <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider px-3 py-2">
              Recovery Navigation
            </div>
            
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start text-white gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase()}`}
                >
                  <link.icon className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1 text-left">
                    <div>{link.label}</div>
                    <div className="text-[10px] text-muted-foreground">{link.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
            
            <div className="pt-2 space-y-2 border-t border-emerald-700/30 mt-2">
              {user ? (
                <>
                  <Link href="/settings">
                    <Button
                      variant="outline"
                      className="w-full border-emerald-500/30 text-white gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="mobile-button-join"
                  onClick={() => window.location.href = '/api/login'}
                >
                  JOIN RECOVERY
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
