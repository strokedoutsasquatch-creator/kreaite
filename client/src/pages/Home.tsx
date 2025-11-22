import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutNick from "@/components/AboutNick";
import Doctrine from "@/components/Doctrine";
import FeaturedExercises from "@/components/FeaturedExercises";
import RecoveryBooks from "@/components/RecoveryBooks";
import ProgressTimeline from "@/components/ProgressTimeline";
import CommunityStories from "@/components/CommunityStories";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <AboutNick />
        <Doctrine />
        <FeaturedExercises />
        <RecoveryBooks />
        <ProgressTimeline />
        <CommunityStories />
        <CTASection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
