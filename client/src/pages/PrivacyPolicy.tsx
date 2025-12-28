import { Link } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";

const sections = [
  { id: "info-collect", title: "1. Information We Collect" },
  { id: "how-use", title: "2. How We Use Your Information" },
  { id: "data-sharing", title: "3. Data Sharing" },
  { id: "cookies", title: "4. Cookies and Tracking" },
  { id: "data-security", title: "5. Data Security" },
  { id: "your-rights", title: "6. Your Rights" },
  { id: "childrens-privacy", title: "7. Children's Privacy" },
  { id: "international", title: "8. International Data Transfers" },
  { id: "data-retention", title: "9. Data Retention" },
  { id: "policy-updates", title: "10. Policy Updates" },
  { id: "contact", title: "11. Contact Information" },
];

export default function PrivacyPolicy() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-privacy-policy">
      <CreatorHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="button-back-home">
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
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="heading-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-last-updated">
            Last updated: December 26, 2025
          </p>
        </header>

        <nav className="mb-12 p-6 bg-zinc-900/50 rounded-lg border border-zinc-800" data-testid="nav-table-of-contents">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a 
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid={`link-toc-${section.id}`}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="prose prose-invert prose-lg max-w-none" data-testid="article-privacy-content">
          <p className="text-muted-foreground leading-relaxed mb-8">
            At KreAIte, we are committed to protecting your privacy and ensuring the security of your personal 
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our platform.
          </p>

          <Separator className="my-8 bg-zinc-800" />

          <section id="info-collect" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">Account Information:</strong> Name, email address, username, password, and profile picture</li>
              <li><strong className="text-foreground">Creator Profile:</strong> Bio, social media links, and portfolio information</li>
              <li><strong className="text-foreground">Payment Information:</strong> Billing address, bank account details (processed securely by Stripe)</li>
              <li><strong className="text-foreground">Content:</strong> Books, music, videos, courses, images, and other creative works you upload</li>
              <li><strong className="text-foreground">Communications:</strong> Messages, support requests, and feedback you send us</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong className="text-foreground">Usage Data:</strong> Pages viewed, features used, time spent on the platform, click patterns</li>
              <li><strong className="text-foreground">Location Data:</strong> General geographic location based on IP address</li>
              <li><strong className="text-foreground">Log Data:</strong> Access times, error logs, and referring URLs</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">Information from Third Parties</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Social login providers (if you choose to sign in with Google, Apple, etc.)</li>
              <li>Payment processors for transaction verification</li>
              <li>Analytics providers for aggregated usage statistics</li>
            </ul>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="how-use" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve the KreAIte platform</li>
              <li>Process transactions and send related information (confirmations, receipts)</li>
              <li>Calculate and distribute creator earnings</li>
              <li>Send you technical notices, updates, security alerts, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Communicate about products, services, offers, and events (with your consent)</li>
              <li>Monitor and analyze trends, usage, and activities on our platform</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>Personalize your experience and provide content recommendations</li>
              <li>Comply with legal obligations and enforce our terms of service</li>
            </ul>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="data-sharing" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">Service Providers</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[100px]">Stripe</span>
                  <span>Payment processing, creator payouts, and financial compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[100px]">Analytics</span>
                  <span>Usage analytics, performance monitoring, and error tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[100px]">Cloud Hosting</span>
                  <span>Data storage and content delivery infrastructure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[100px]">Email</span>
                  <span>Transactional emails and notifications</span>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">Other Disclosures</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, subpoena, or government request</li>
              <li><strong className="text-foreground">Protection of Rights:</strong> To protect the rights, property, or safety of KreAIte, our users, or the public</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong className="text-foreground">With Your Consent:</strong> When you explicitly authorize us to share information</li>
            </ul>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="cookies" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to collect and store information about your 
              preferences and activities on our platform.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for the platform to function (authentication, security)</li>
              <li><strong className="text-foreground">Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
              <li><strong className="text-foreground">Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">Managing Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              Most browsers allow you to control cookies through their settings. You can block or delete cookies, 
              but this may affect the functionality of our platform. Some features may not work properly without 
              essential cookies enabled.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="data-security" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection practices</li>
              <li>Secure data centers with physical and environmental controls</li>
              <li>Incident response procedures for potential breaches</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to protect your information, no method of transmission over the Internet or 
              electronic storage is 100% secure. We cannot guarantee absolute security but will notify you 
              of any breach as required by applicable law.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="your-rights" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">GDPR Rights (European Economic Area)</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-foreground">Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong className="text-foreground">Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong className="text-foreground">Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">CCPA Rights (California Residents)</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">Right to Know:</strong> What personal information is collected and how it's used</li>
              <li><strong className="text-foreground">Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong className="text-foreground">Right to Opt-Out:</strong> Opt out of the sale of personal information (we do not sell data)</li>
              <li><strong className="text-foreground">Right to Non-Discrimination:</strong> Equal service regardless of exercising privacy rights</li>
            </ul>

            <p className="text-muted-foreground leading-relaxed">
              To exercise any of these rights, please contact us at <a href="mailto:hello@kreaite.xyz" className="text-primary hover:underline">hello@kreaite.xyz</a>. 
              We will respond to your request within 30 days (or as required by applicable law).
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="childrens-privacy" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              KreAIte is not intended for children under the age of 13 (or 16 in the EEA). We do not knowingly 
              collect personal information from children under these ages.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If we become aware that we have collected personal information from a child under the applicable 
              age limit, we will take steps to delete such information promptly.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you are a parent or guardian and believe your child has provided us with personal information, 
              please contact us immediately at <a href="mailto:hello@kreaite.xyz" className="text-primary hover:underline">hello@kreaite.xyz</a>.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="international" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">8. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your country of 
              residence. These countries may have different data protection laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              When we transfer personal data outside the EEA, we ensure appropriate safeguards are in place, 
              such as Standard Contractual Clauses approved by the European Commission, or transfers to 
              countries with adequate data protection laws.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="data-retention" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Provide the services you requested</li>
              <li>Comply with legal obligations (tax records, dispute resolution)</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Maintain business records as required by law</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              When your account is deleted, we will delete or anonymize your personal information within 
              90 days, except where we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="policy-updates" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Policy Updates</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technologies, legal requirements, or other factors.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When we make material changes, we will:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Update the "Last updated" date at the top of this policy</li>
              <li>Notify you by email (for registered users) at least 30 days before changes take effect</li>
              <li>Post a prominent notice on our platform</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We encourage you to review this Privacy Policy periodically to stay informed about our 
              data practices.
            </p>
          </section>

          <Separator className="my-8 bg-zinc-800" />

          <section id="contact" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data 
              practices, please contact us:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-foreground font-semibold mb-2">KreAIte Privacy Team</p>
              <p className="text-muted-foreground mb-4">
                Email: <a href="mailto:hello@kreaite.xyz" className="text-primary hover:underline" data-testid="link-contact-email">hello@kreaite.xyz</a>
              </p>
              <p className="text-muted-foreground text-sm">
                For GDPR-related inquiries, you may also contact our Data Protection Officer at the above email address.
              </p>
            </div>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-zinc-800 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/terms">
              <Button variant="outline" data-testid="link-terms-of-service">
                Read our Terms of Service
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
          .prose-invert h3,
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
          .text-primary {
            color: #c45000 !important;
          }
          .text-foreground {
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
