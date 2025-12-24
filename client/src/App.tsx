import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CreatorLanding from "@/pages/CreatorLanding";
import StrokeRecoveryLanding from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
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
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import SasquatchChatWidget from "@/components/SasquatchChatWidget";

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
      <Route path="/about-us" component={AboutUs} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/university" component={RecoveryUniversity} />
      <Route path="/music-studio">
        <ProtectedRoute>
          <MusicStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/book-studio">
        <ProtectedRoute>
          <BookStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/video-studio">
        <ProtectedRoute>
          <VideoStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/course-studio">
        <ProtectedRoute>
          <CourseStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/image-studio">
        <ProtectedRoute>
          <ImageStudio />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <SasquatchChatWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
