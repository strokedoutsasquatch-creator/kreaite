import { Link } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "accounts", title: "2. User Accounts and Registration" },
  { id: "content-rights", title: "3. Creator Content and Rights" },
  { id: "revenue-share", title: "4. Revenue Share" },
  { id: "prohibited-content", title: "5. Prohibited Content" },
  { id: "payment-terms", title: "6. Payment Terms" },
  { id: "dmca", title: "7. DMCA / Copyright Policy" },
  { id: "limitation", title: "8. Limitation of Liability" },
  { id: "termination", title: "9. Termination" },
  { id: "modifications", title: "10. Modifications to Terms" },
  { id: "governing-law", title: "11. Governing Law" },
  { id: "contact", title: "12. Contact Information" },
];

export default function TermsOfService() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-black" data-testid="page-terms-of-service">
      <CreatorHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-white" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="heading-terms-title">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-last-updated">
            Last updated: December 26, 2025
          </p>
        </header>

        <nav className="mb-12 p-6 bg-zinc-900/50 rounded-lg border border-zinc-800" data-testid="nav-table-of-contents">
          <h2 className="text-lg font-semibold text-white mb-4">Table of Contents</h2>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a 
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-orange-500 transition-colors"
                  data-testid={`link-toc-${section.id}`}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="prose prose-invert prose-lg max-w-none" data-testid="article-terms-content">
          <p className="text-muted-foreground leading-relaxed mb-8">
            Welcome to KreAIte. These Terms of Service ("Terms") govern your access to and use of the KreAIte platform, 
            including our website, applications, and services (collectively, the "Service"). By accessing or using KreAIte, 
            you agree to be bound by these Terms.
          </p>

          <Separator className="my-8 bg-zinc-800" />

          <section id="acceptance" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By creating an account, accessing, or using the KreAIte platform, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree 
              to these Terms, you may not access or use the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years of age to use this Service. By using KreAIte, you represent and warrant that 
              you are at least 18 years old and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="accounts" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts and Registration</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features of the Service, you must create an account. When creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in 
              fraudulent, abusive, or illegal activities.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="content-rights" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">3. Creator Content and Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Ownership:</strong> You retain full ownership of all content you create, 
              upload, or publish on KreAIte ("Creator Content"). KreAIte does not claim ownership of your original works.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">License Grant:</strong> By publishing content on KreAIte, you grant us a 
              non-exclusive, worldwide, royalty-free license to display, distribute, reproduce, and promote your 
              Creator Content solely for the purpose of operating and improving the Service, and facilitating sales 
              through our marketplace.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Your Responsibilities:</strong> You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You own or have the necessary rights to all content you upload</li>
              <li>Your content does not infringe upon the intellectual property rights of others</li>
              <li>Your content complies with all applicable laws and regulations</li>
              <li>You have obtained all necessary permissions for any third-party content</li>
            </ul>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="revenue-share" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">4. Revenue Share</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              KreAIte operates on a creator-first revenue model:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-500">85%</p>
                  <p className="text-muted-foreground">Creator Earnings</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-zinc-400">15%</p>
                  <p className="text-muted-foreground">Platform Fee</p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For all sales made through the KreAIte marketplace:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Creators receive 85% of the net sale price after payment processing fees</li>
              <li>KreAIte retains 15% as a platform fee to cover operations, hosting, and development</li>
              <li>Payment processing fees (typically 2.9% + $0.30) are deducted before the revenue split</li>
              <li>Earnings are calculated and distributed according to our payment schedule</li>
            </ul>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="prohibited-content" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">5. Prohibited Content</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may not upload, create, or distribute content that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or discriminatory</li>
              <li>Contains sexually explicit material involving minors</li>
              <li>Promotes violence, terrorism, or illegal activities</li>
              <li>Infringes upon intellectual property rights of others</li>
              <li>Contains malware, viruses, or other harmful code</li>
              <li>Constitutes spam, phishing, or fraudulent schemes</li>
              <li>Violates the privacy rights of others</li>
              <li>Impersonates another person or entity</li>
              <li>Is misleading or deceptive in nature</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to remove any content that violates these guidelines and to suspend or 
              terminate accounts of repeat offenders.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="payment-terms" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">6. Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Payment Processing:</strong> All payments are processed through 
              Stripe, our third-party payment processor. By using KreAIte, you agree to Stripe's terms of service.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Creator Payouts:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Minimum payout threshold: $25 USD</li>
              <li>Payout frequency: Monthly, within 14 days of month end</li>
              <li>Supported payout methods: Bank transfer, PayPal (where available)</li>
              <li>Creators are responsible for providing accurate payment information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Refunds:</strong> Our refund policy allows customers to request 
              refunds within 14 days of purchase for digital products that have not been substantially consumed. 
              Creators acknowledge that refunds may affect their earnings.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-white">Taxes:</strong> Creators are responsible for reporting and paying 
              all applicable taxes on their earnings. KreAIte may provide tax documentation as required by law.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="dmca" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">7. DMCA / Copyright Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              KreAIte respects the intellectual property rights of others and expects users to do the same. 
              We comply with the Digital Millennium Copyright Act (DMCA) and will respond to valid takedown notices.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Filing a DMCA Notice:</strong> If you believe your copyrighted work 
              has been infringed, please submit a notice to our designated agent containing:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>A physical or electronic signature of the copyright owner</li>
              <li>Identification of the copyrighted work claimed to be infringed</li>
              <li>Identification of the material to be removed with sufficient detail to locate it</li>
              <li>Your contact information (address, phone, email)</li>
              <li>A statement of good faith belief that use is unauthorized</li>
              <li>A statement under penalty of perjury that the information is accurate</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">Counter-Notification:</strong> If you believe your content was 
              wrongfully removed, you may file a counter-notification with the required information.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-white">Repeat Infringers:</strong> We maintain a policy of terminating 
              accounts of users who are repeat copyright infringers.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="limitation" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, KREAITE AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, 
              AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
              DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR IN CONNECTION 
              WITH YOUR USE OF THE SERVICE.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our total liability for any claims arising under these Terms shall not exceed the greater of 
              $100 USD or the amount you paid to KreAIte in the 12 months preceding the claim.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="termination" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">By You:</strong> You may terminate your account at any time by 
              contacting us or using the account deletion feature. Upon termination, you will receive any 
              outstanding earnings above the minimum payout threshold.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-white">By Us:</strong> We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Violate these Terms of Service</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Repeatedly upload prohibited content</li>
              <li>Infringe on the rights of others</li>
              <li>Fail to maintain accurate account information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-white">Effect of Termination:</strong> Upon termination, your right to 
              use the Service will immediately cease. Your content may be removed from the platform. Provisions 
              that by their nature should survive termination will remain in effect.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="modifications" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">10. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes 
              by email or through a prominent notice on the Service at least 30 days before the changes take effect.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Your continued use of the Service after the effective date of any changes constitutes your 
              acceptance of the modified Terms. If you do not agree to the changes, you must stop using the 
              Service and may terminate your account.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="governing-law" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, 
              without regard to its conflict of law provisions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall be resolved through 
              binding arbitration in accordance with the rules of the American Arbitration Association, 
              except where prohibited by law.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="contact" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-white font-semibold mb-2">KreAIte Legal Team</p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:hello@kreaite.xyz" className="text-orange-500 hover:underline" data-testid="link-contact-email">hello@kreaite.xyz</a>
              </p>
            </div>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-zinc-800 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/privacy">
              <Button variant="outline" data-testid="link-privacy-policy">
                Read our Privacy Policy
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold" data-testid="button-return-home">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .prose-invert {
            color: black !important;
          }
          .prose-invert h2,
          .prose-invert strong {
            color: black !important;
          }
          .prose-invert p,
          .prose-invert li {
            color: #333 !important;
          }
          .bg-zinc-900,
          .bg-zinc-900\\/50 {
            background: #f5f5f5 !important;
            border-color: #ddd !important;
          }
          .text-orange-500 {
            color: #c45000 !important;
          }
          .text-white {
            color: black !important;
          }
          .text-muted-foreground {
            color: #333 !important;
          }
        }
      `}</style>
    </div>
  );
}
