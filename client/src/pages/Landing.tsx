import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TestimonyVideo from "@/components/TestimonyVideo";
import AboutNick from "@/components/AboutNick";
import Doctrine from "@/components/Doctrine";
import FeaturedExercises from "@/components/FeaturedExercises";
import RecoveryBooks from "@/components/RecoveryBooks";
import ProgressTimeline from "@/components/ProgressTimeline";
import CommunityStories from "@/components/CommunityStories";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen p-4" data-testid="loading-state">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="spinner" />
            <div className="w-full space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Loading...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <TestimonyVideo />
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
