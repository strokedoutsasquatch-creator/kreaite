import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CreatorLanding from "@/pages/CreatorLanding";
import StrokeRecoveryLanding from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import OnboardingFlow, { useOnboardingComplete } from "@/components/OnboardingFlow";
import Community from "@/pages/Community";
import Thread from "@/pages/Thread";
import About from "@/pages/About";
import AboutUs from "@/pages/AboutUs";
import Marketplace from "@/pages/Marketplace";
import Academy from "@/pages/Academy";
import Builder from "@/pages/Builder";
import SurvivalGrid from "@/pages/SurvivalGrid";
import Publishing from "@/pages/Publishing";
import RecoveryDashboard from "@/pages/RecoveryDashboard";
import Achievements from "@/pages/Achievements";
import Reminders from "@/pages/Reminders";
import Settings from "@/pages/Settings";
import Activity from "@/pages/Activity";
import Exercises from "@/pages/Exercises";
import TherapistDashboard from "@/pages/TherapistDashboard";
import CommandCenter from "@/pages/CommandCenter";
import Wearables from "@/pages/Wearables";
import Messages from "@/pages/Messages";
import VideoSessions from "@/pages/VideoSessions";
import SocialNetwork from "@/pages/SocialNetwork";
import TherapistMarketplace from "@/pages/TherapistMarketplace";
import AdminPlanBuilder from "@/pages/AdminPlanBuilder";
import Stories from "@/pages/Stories";
import StoryView from "@/pages/StoryView";
import StoryEditor from "@/pages/StoryEditor";
import MyStories from "@/pages/MyStories";
import Pricing from "@/pages/Pricing";
import RecoveryUniversity from "@/pages/RecoveryUniversity";
import MusicStudio from "@/pages/MusicStudio";
import BookStudio from "@/pages/BookStudio";
import VideoStudio from "@/pages/VideoStudio";
import CourseStudio from "@/pages/CourseStudio";
import ImageStudio from "@/pages/ImageStudio";
import BookMarketplace from "@/pages/BookMarketplace";
import AuthorDashboard from "@/pages/AuthorDashboard";
import CreatorHub from "@/pages/CreatorHub";
import MovieStudio from "@/pages/MovieStudio";
import VoiceLibrary from "@/pages/VoiceLibrary";
import AudiobookFactory from "@/pages/AudiobookFactory";
import DJStudio from "@/pages/DJStudio";
import WorkflowDashboard from "@/pages/WorkflowDashboard";
import CreatorEarnings from "@/pages/CreatorEarnings";
import MediaStudioPage from "@/pages/MediaStudioPage";
import CreatorSettings from "@/pages/CreatorSettings";
import QuickCreate from "@/pages/QuickCreate";
import AIConsultant from "@/pages/AIConsultant";
import ListingDetail from "@/pages/ListingDetail";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ModerationDashboard from "@/pages/ModerationDashboard";
import PodcastStudioPage from "@/pages/PodcastStudioPage";
import AvatarStudioPage from "@/pages/AvatarStudioPage";
import TemplateMarketplacePage from "@/pages/TemplateMarketplacePage";
import DocHubPage from "@/pages/DocHubPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import CreatorScribeWidget from "@/components/CreatorScribeWidget";
import { LocaleProvider } from "@/lib/hooks/useLocale";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CreatorLanding} />
      <Route path="/stroke-recovery" component={StrokeRecoveryLanding} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/community" component={Community} />
      <Route path="/community/thread/:id" component={Thread} />
      <Route path="/about" component={About} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/books" component={BookMarketplace} />
      <Route path="/author-dashboard">
        <ProtectedRoute>
          <AuthorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/academy" component={Academy} />
      <Route path="/builder" component={Builder} />
      <Route path="/survival-grid" component={SurvivalGrid} />
      <Route path="/publishing" component={Publishing} />
      <Route path="/recovery">
        <ProtectedRoute>
          <RecoveryDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/achievements">
        <ProtectedRoute>
          <Achievements />
        </ProtectedRoute>
      </Route>
      <Route path="/reminders">
        <ProtectedRoute>
          <Reminders />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/activity">
        <ProtectedRoute>
          <Activity />
        </ProtectedRoute>
      </Route>
      <Route path="/exercises">
        <ProtectedRoute>
          <Exercises />
        </ProtectedRoute>
      </Route>
      <Route path="/therapist">
        <ProtectedRoute>
          <TherapistDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/command-center">
        <ProtectedRoute>
          <CommandCenter />
        </ProtectedRoute>
      </Route>
      <Route path="/wearables">
        <ProtectedRoute>
          <Wearables />
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>
      <Route path="/video">
        <ProtectedRoute>
          <VideoSessions />
        </ProtectedRoute>
      </Route>
      <Route path="/social">
        <ProtectedRoute>
          <SocialNetwork />
        </ProtectedRoute>
      </Route>
      <Route path="/therapist-marketplace">
        <ProtectedRoute>
          <TherapistMarketplace />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/plans">
        <ProtectedRoute>
          <AdminPlanBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/moderation">
        <ProtectedRoute>
          <ModerationDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/about-us" component={AboutUs} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/university" component={RecoveryUniversity} />
      <Route path="/music-studio" component={MusicStudio} />
      <Route path="/book-studio" component={BookStudio} />
      <Route path="/video-studio" component={VideoStudio} />
      <Route path="/course-studio" component={CourseStudio} />
      <Route path="/image-studio" component={ImageStudio} />
      <Route path="/creator-hub">
        <ProtectedRoute>
          <CreatorHub />
        </ProtectedRoute>
      </Route>
      <Route path="/movie-studio">
        <ProtectedRoute>
          <MovieStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-library">
        <ProtectedRoute>
          <VoiceLibrary />
        </ProtectedRoute>
      </Route>
      <Route path="/audiobook-factory">
        <ProtectedRoute>
          <AudiobookFactory />
        </ProtectedRoute>
      </Route>
      <Route path="/dj-studio">
        <ProtectedRoute>
          <DJStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/workflows">
        <ProtectedRoute>
          <WorkflowDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/creator/earnings">
        <ProtectedRoute>
          <CreatorEarnings />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/affiliate">
        <ProtectedRoute>
          <AffiliateDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/creator/settings">
        <ProtectedRoute>
          <CreatorSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/creator-settings">
        <ProtectedRoute>
          <CreatorSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/quick-create" component={QuickCreate} />
      <Route path="/ai-consultant">
        <ProtectedRoute>
          <AIConsultant />
        </ProtectedRoute>
      </Route>
      <Route path="/media-studio">
        <ProtectedRoute>
          <MediaStudioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/stories" component={Stories} />
      <Route path="/stories/new">
        <ProtectedRoute>
          <StoryEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/stories/my">
        <ProtectedRoute>
          <MyStories />
        </ProtectedRoute>
      </Route>
      <Route path="/stories/edit/:id">
        <ProtectedRoute>
          <StoryEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/stories/:slug" component={StoryView} />
      <Route path="/podcast-studio">
        <ProtectedRoute>
          <PodcastStudioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/avatar-studio">
        <ProtectedRoute>
          <AvatarStudioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/templates">
        <ProtectedRoute>
          <TemplateMarketplacePage />
        </ProtectedRoute>
      </Route>
      <Route path="/doc-hub">
        <ProtectedRoute>
          <DocHubPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isComplete, markComplete } = useOnboardingComplete();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isComplete === false) {
      setShowOnboarding(true);
    }
  }, [isComplete]);

  const handleOnboardingComplete = () => {
    markComplete();
    setShowOnboarding(false);
  };

  if (isComplete === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <TooltipProvider>
          <Toaster />
          {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
          {!showOnboarding && (
            <>
              <Router />
              <CreatorScribeWidget />
            </>
          )}
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
