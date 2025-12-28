import CreatorHeader from "@/components/CreatorHeader";
import RecoveryHeader from "@/components/RecoveryHeader";
import { usePlatform } from "@/lib/hooks/usePlatform";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import WorkspaceShell from "@/components/book-studio/WorkspaceShell";
import StartStep from "@/components/book-studio/steps/StartStep";
import PlanStep from "@/components/book-studio/steps/PlanStep";
import GenerateStep from "@/components/book-studio/steps/GenerateStep";
import BuildStep from "@/components/book-studio/steps/BuildStep";
import PublishStep from "@/components/book-studio/steps/PublishStep";
import { BookStudioProvider, useBookStudio } from "@/lib/contexts/BookStudioContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, LogIn } from "lucide-react";

function StepRenderer() {
  const { currentStep } = useBookStudio();

  switch (currentStep) {
    case 'start':
      return <StartStep />;
    case 'plan':
      return <PlanStep />;
    case 'generate':
      return <GenerateStep />;
    case 'build':
      return <BuildStep />;
    case 'publish':
      return <PublishStep />;
    default:
      return <StartStep />;
  }
}

function BookStudioContent() {
  return (
    <WorkspaceShell>
      <StepRenderer />
    </WorkspaceShell>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen p-4" data-testid="loading-state">
      <Card className="w-full max-w-md p-8 bg-black/50 border-orange-500/20">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" data-testid="spinner" />
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full bg-orange-500/10" />
            <Skeleton className="h-4 w-3/4 bg-orange-500/10" />
            <Skeleton className="h-4 w-5/6 bg-orange-500/10" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Loading Book Studio...
          </div>
        </div>
      </Card>
    </div>
  );
}

function LoginPrompt() {
  const platform = usePlatform();
  const isRecovery = platform === "recovery";

  return (
    <div className="flex items-center justify-center h-screen p-4" data-testid="login-prompt">
      <Card className="w-full max-w-md p-8 bg-black/50 border-orange-500/20 text-center">
        <div className="flex flex-col items-center gap-6">
          <LogIn className="h-12 w-12 text-orange-500" />
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-muted-foreground">
              {isRecovery 
                ? "Sign in to start writing your recovery story"
                : "Sign in to access Book Studio and create your book"
              }
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            data-testid="button-login"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function BookStudioV3() {
  const { isAuthenticated, isLoading } = useAuth();
  const platform = usePlatform();
  const isRecovery = platform === "recovery";
  const Header = isRecovery ? RecoveryHeader : CreatorHeader;

  const seoTitle = isRecovery 
    ? "Write Your Recovery Story | Stroke Recovery Academy"
    : "Book Studio | KreAIte.xyz - AI-Powered Book Creation";
  
  const seoDescription = isRecovery
    ? "Share your stroke recovery journey. Write, edit, and publish your memoir with AI assistance."
    : "Create, edit, and publish professional books with AI assistance. From brainstorm to KDP-ready export.";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <SEO 
          title={seoTitle}
          description={seoDescription}
        />
        <Header />
        <LoginPrompt />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SEO 
        title={seoTitle}
        description={seoDescription}
      />
      <Header />
      <main className="flex-1 flex overflow-hidden" data-testid="book-studio-main">
        <BookStudioProvider>
          <BookStudioContent />
        </BookStudioProvider>
      </main>
    </div>
  );
}
