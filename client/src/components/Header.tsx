import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/exercises", label: "Exercise Arsenal" },
    { href: "/books", label: "Recovery Guides" },
    { href: "/equipment", label: "Equipment" },
    { href: "/community", label: "Community" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 hover-elevate active-elevate-2 px-3 py-2 rounded-md cursor-pointer">
              <img 
                src="/attached_assets/ss logo 2_1763787525258.png"
                alt="Stroked Out Sasquatch"
                className="h-10 w-10 object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-lg font-black tracking-tight">STROKE RECOVERY ACADEMY</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  The Stroked Out Sasquatch
                </div>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
                  className="font-medium"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              data-testid="button-login"
              onClick={() => window.location.href = '/api/login'}
            >
              Login
            </Button>
            <Button
              size="sm"
              data-testid="button-start-recovery"
              onClick={() => window.location.href = '/api/login'}
            >
              Start Your Recovery
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            data-testid="button-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                data-testid="mobile-button-login"
                onClick={() => window.location.href = '/api/login'}
              >
                Login
              </Button>
              <Button
                className="w-full"
                data-testid="mobile-button-start-recovery"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Your Recovery
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
