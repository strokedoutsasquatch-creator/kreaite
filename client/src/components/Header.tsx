import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/academy", label: "ACADEMY" },
    { href: "/builder", label: "BUILDER" },
    { href: "/community", label: "COMMUNITY" },
    { href: "/marketplace", label: "MARKETPLACE" },
    { href: "/survival-grid", label: "SURVIVAL GRID" },
    { href: "/about", label: "ABOUT" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-2 rounded-md cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="text-primary text-2xl font-black">0</span>
                <span className="text-primary text-2xl font-black">9</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold tracking-tight text-white">
                  STROKE RECOVERY OS
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Sasquatch Survival System
                </div>
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
                  className={`font-medium text-xs tracking-wide ${
                    location === link.href 
                      ? "text-white" 
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            <Button
              size="sm"
              data-testid="button-login"
              onClick={() => window.location.href = '/api/login'}
              className="font-semibold text-xs tracking-wide"
            >
              LOGIN / JOIN
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
          <div className="lg:hidden py-4 space-y-2 border-t border-border">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start text-white"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="pt-2">
              <Button
                className="w-full"
                data-testid="mobile-button-login"
                onClick={() => window.location.href = '/api/login'}
              >
                LOGIN / JOIN
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
