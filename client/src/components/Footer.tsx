import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Mail, MessageCircle } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import academyLogo from "@assets/academy_logo.png";
import kremersxLogo from "@assets/Kremersx_1766356681995.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    resources: [
      { label: "Exercise Arsenal", href: "/exercises" },
      { label: "Recovery Guides", href: "/books" },
      { label: "Equipment Guide", href: "/equipment" },
      { label: "Progress Tracker", href: "/dashboard" },
    ],
    community: [
      { label: "Success Stories", href: "/community" },
      { label: "Support Forum", href: "/forum" },
      { label: "Live Q&A Sessions", href: "/live" },
      { label: "Stroke Lyfe App", href: "https://strokelyfe.app" },
    ],
    company: [
      { label: "About Nick", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={academyLogo}
                alt="Stroke Recovery Academy"
                className="h-12 w-12 object-contain"
                data-testid="img-footer-logo"
              />
              <div>
                <div className="text-xl font-black">STROKE RECOVERY ACADEMY</div>
                <div className="text-sm text-muted-foreground">The Stroked Out Sasquatch</div>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Join 50,000+ stroke warriors proving the impossible. From 0% to 90% recovery using
              breakthrough methods that actually work.
            </p>
            <div className="space-y-3">
              <div className="text-sm font-semibold uppercase tracking-wide">
                Join The Revolution
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1"
                  data-testid="input-newsletter-email"
                />
                <Button data-testid="button-newsletter-subscribe">
                  <Mail className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors block"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors block"
                      data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors block"
                      data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors block"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Stroke Recovery Academy. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.tiktok.com/@nickkremers2"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md"
              data-testid="social-link-tiktok"
            >
              <SiTiktok className="h-5 w-5" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md"
              data-testid="social-link-instagram"
            >
              <SiInstagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 p-2 rounded-md"
              data-testid="social-link-youtube"
            >
              <SiYoutube className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="hover-elevate active-elevate-2 p-2 rounded-md"
              data-testid="social-link-contact"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-disclaimer">
            <strong>Medical Disclaimer:</strong> This platform provides educational content based on
            personal recovery experience. Always consult with qualified healthcare professionals
            before beginning any new recovery protocol.
          </p>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <a 
              href="mailto:info@strokerecoveryacademy.com" 
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-contact-email"
            >
              info@strokerecoveryacademy.com
            </a>
          </div>
          
          <div className="flex flex-col items-center gap-2" data-testid="powered-by-kremersx">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Powered by</span>
            <img 
              src={kremersxLogo}
              alt="KremersX - Stroked Out Sasquatch"
              className="h-28 w-auto object-contain rounded-lg"
              data-testid="img-kremersx-logo"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
