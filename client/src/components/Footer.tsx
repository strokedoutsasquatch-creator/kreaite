import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Mail, 
  BookOpen, 
  Music, 
  Video, 
  GraduationCap, 
  Image, 
  FileText,
  Store,
  Users,
  DollarSign,
  Sparkles,
  Zap,
  ExternalLink,
} from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube, SiX } from "react-icons/si";
import kreaiteLogo from "@assets/KreAIte1_1766574083851.png";
import kremersxLogo from "@assets/Kremersx_1766356681995.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    studios: [
      { label: "Book Studio", href: "/book-studio", icon: BookOpen },
      { label: "Music Studio", href: "/music-studio", icon: Music },
      { label: "Video Studio", href: "/video-studio", icon: Video },
      { label: "Course Studio", href: "/course-studio", icon: GraduationCap },
      { label: "Image Studio", href: "/image-studio", icon: Image },
      { label: "Doctrine Engine", href: "/publishing", icon: FileText },
    ],
    platform: [
      { label: "KreAItorverse", href: "/marketplace", icon: Store },
      { label: "Community", href: "/community", icon: Users },
      { label: "Earnings Dashboard", href: "/author-dashboard", icon: DollarSign },
      { label: "Quick Create", href: "/quick-create", icon: Zap },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-background border-t border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={kreaiteLogo}
                alt="KreAIte"
                className="h-14 w-auto"
                data-testid="img-footer-logo"
              />
            </div>
            <p className="text-lg font-bold text-primary mb-2">
              CREATE. PUBLISH. EARN.
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              The #1 AI-powered creator platform. 6 professional studios, seamless publishing, 
              and the KreAItorverse marketplace. Keep 85% of everything you earn.
            </p>
            <div className="space-y-3">
              <div className="text-sm font-semibold uppercase tracking-wide text-primary">
                Join 50,000+ Creators
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-zinc-900 border focus:border-orange-500"
                  data-testid="input-newsletter-email"
                />
                <Button 
                  className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold"
                  data-testid="button-newsletter-subscribe"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Studios
            </h3>
            <ul className="space-y-2">
              {footerLinks.studios.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-4 h-4 group-hover:text-primary" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-primary flex items-center gap-2">
              <Store className="w-4 h-4" />
              Platform
            </h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-4 h-4 group-hover:text-primary" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-primary">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors block"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mb-8 bg-primary/20" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {currentYear} KreAIte. All rights reserved.
            </div>
            <a 
              href="mailto:hello@kreaite.xyz" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              data-testid="link-contact-email"
            >
              <Mail className="h-3 w-3" />
              hello@kreaite.xyz
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com/kreaite"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md text-muted-foreground hover:text-primary"
              data-testid="social-link-x"
            >
              <SiX className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@kreaite"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md text-muted-foreground hover:text-primary"
              data-testid="social-link-tiktok"
            >
              <SiTiktok className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/kreaite"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md text-muted-foreground hover:text-primary"
              data-testid="social-link-instagram"
            >
              <SiInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://youtube.com/@kreaite"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md text-muted-foreground hover:text-primary"
              data-testid="social-link-youtube"
            >
              <SiYoutube className="h-5 w-5" />
            </a>
          </div>
        </div>

        <Separator className="my-8 bg-primary/20" />

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2" data-testid="powered-by-kremersx">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Powered by</span>
            <img 
              src={kremersxLogo}
              alt="KremersX"
              className="h-20 w-auto object-contain rounded-lg opacity-80 hover:opacity-100 transition-opacity"
              data-testid="img-kremersx-logo"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
