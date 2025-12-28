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
  Zap,
  Crown,
  Settings,
  LogOut,
  User,
  Coins,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import kreaiteLogo from "@assets/KreAIte1_1766574083851.png";

const studios = [
  { href: "/book-studio", label: "Book Studio", icon: BookOpen, description: "Write & publish books with AI", badge: null, enabled: true },
  { href: "/music-studio", label: "Music Studio", icon: Music, description: "Create AI music & audio", badge: null, enabled: true },
  { href: "/video-studio", label: "Video Studio", icon: Video, description: "Professional video editing with AI", badge: "Coming Soon", enabled: false },
  { href: "/course-studio", label: "Course Studio", icon: GraduationCap, description: "Build online courses", badge: "Coming Soon", enabled: false },
  { href: "/image-studio", label: "Image Studio", icon: Image, description: "AI images & editing", badge: "Coming Soon", enabled: false },
  { href: "/publishing", label: "Doctrine Engine", icon: FileText, description: "Structure your expertise", badge: "Coming Soon", enabled: false },
];

const quickActions = [
  { href: "/quick-create", label: "Quick Create", icon: Zap, description: "1-click magic tools", enabled: true },
  { href: "/ai-consultant", label: "AI Consultant", icon: Bot, description: "Train AI on your content", badge: "Coming Soon", enabled: false },
];

const productionTools: { href: string; label: string; icon: any; description: string; badge?: string; enabled: boolean }[] = [];

const navLinks = [
  { href: "/marketplace", label: "KREAITORVERSE", icon: Store },
  { href: "/community", label: "COMMUNITY", icon: Users },
  { href: "/author-dashboard", label: "EARNINGS", icon: DollarSign },
];

export default function CreatorHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

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
                  Create. Publish. Earn.
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
              <DropdownMenuContent align="start" className="w-72 bg-black border-orange-500/20">
                {studios.map((studio) => (
                  <DropdownMenuItem 
                    key={studio.href} 
                    asChild={studio.enabled}
                    disabled={!studio.enabled}
                    className={!studio.enabled ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    {studio.enabled ? (
                      <Link href={studio.href}>
                        <div className="flex items-start gap-3 py-1 cursor-pointer w-full" data-testid={`link-${studio.label.toLowerCase().replace(" ", "-")}`}>
                          <studio.icon className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-white flex items-center gap-2">
                              {studio.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{studio.description}</div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 py-1 w-full" data-testid={`link-${studio.label.toLowerCase().replace(" ", "-")}`}>
                        <studio.icon className="w-5 h-5 text-orange-500/50 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-white/60 flex items-center gap-2">
                            {studio.label}
                            <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-500/70">
                              Coming Soon
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground/60">{studio.description}</div>
                        </div>
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-orange-500/20" />
                {quickActions.map((action) => (
                  <DropdownMenuItem 
                    key={action.href} 
                    asChild={action.enabled}
                    disabled={!action.enabled}
                    className={!action.enabled ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    {action.enabled ? (
                      <Link href={action.href}>
                        <div className="flex items-start gap-3 py-1 cursor-pointer w-full" data-testid={`link-${action.label.toLowerCase().replace(" ", "-")}`}>
                          <action.icon className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-white">{action.label}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 py-1 w-full" data-testid={`link-${action.label.toLowerCase().replace(" ", "-")}`}>
                        <action.icon className="w-5 h-5 text-orange-500/50 mt-0.5" />
                        <div>
                          <div className="font-medium text-white/60 flex items-center gap-2">
                            {action.label}
                            <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-500/70">
                              Coming Soon
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground/60">{action.description}</div>
                        </div>
                      </div>
                    )}
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
                      ? "text-orange-500" 
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
              <>
                <Link href="/pricing">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 text-muted-foreground hover:text-white"
                    data-testid="link-credits"
                  >
                    <Coins className="w-4 h-4 text-orange-500" />
                    <span>Credits</span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2" data-testid="dropdown-user">
                      <Avatar className="h-7 w-7 border border-orange-500/30">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-black border-orange-500/20">
                    <div className="px-3 py-2 border-b border-orange-500/20">
                      <div className="font-medium text-white">{user.firstName || 'Creator'}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <Badge variant="outline" className="mt-2 text-[10px] border-orange-500/50 text-orange-500">
                        <Crown className="w-3 h-3 mr-1" />
                        Pro Creator
                      </Badge>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/author-dashboard" className="cursor-pointer">
                        <DollarSign className="w-4 h-4 mr-2 text-orange-500" />
                        Earnings Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/creator-settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2 text-orange-500" />
                        Creator Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className="cursor-pointer">
                        <Coins className="w-4 h-4 mr-2 text-orange-500" />
                        Buy Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-orange-500/20" />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-400 focus:text-red-400"
                      onClick={() => window.location.href = '/api/logout'}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
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
              </>
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
          <div className="lg:hidden py-4 space-y-2 border-t border-orange-500/20">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-zinc-900/50 rounded-lg">
                <Avatar className="h-10 w-10 border border-orange-500/30">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-500">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white">{user.firstName || 'Creator'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
            )}
            
            <div className="text-xs font-semibold text-orange-500 uppercase tracking-wider px-3 py-2">
              Studios
            </div>
            {studios.map((studio) => (
              studio.enabled ? (
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
              ) : (
                <div key={studio.href} className="flex items-center gap-3 px-4 py-2 opacity-60">
                  <studio.icon className="w-5 h-5 text-orange-500/50" />
                  <span className="text-white/60">{studio.label}</span>
                  <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-500/70 ml-auto">
                    Coming Soon
                  </Badge>
                </div>
              )
            ))}
            
            <div className="border-t border-orange-500/20 my-2" />
            <div className="text-xs font-semibold text-orange-500 uppercase tracking-wider px-3 py-2">
              Quick Actions
            </div>
            {quickActions.map((action) => (
              action.enabled ? (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-link-${action.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <action.icon className="w-5 h-5 text-orange-500" />
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <div key={action.href} className="flex items-center gap-3 px-4 py-2 opacity-60">
                  <action.icon className="w-5 h-5 text-orange-500/50" />
                  <span className="text-white/60">{action.label}</span>
                  <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-500/70 ml-auto">
                    Coming Soon
                  </Badge>
                </div>
              )
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
              {user ? (
                <>
                  <Link href="/creator-settings">
                    <Button
                      variant="outline"
                      className="w-full border-orange-500/30 text-white gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Creator Settings
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
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
