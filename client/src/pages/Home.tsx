import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const wasAuthenticated = useRef(false);

  // Track if user was ever authenticated during this session
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
    }
  }, [isAuthenticated]);

  // Page-level protection: redirect to login ONLY if session expires (user was authenticated but now isn't)
  // This handles session expiry while the component is mounted
  // First-time unauthenticated users should see the landing page, not be redirected
  useEffect(() => {
    if (!isLoading && !isAuthenticated && wasAuthenticated.current) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Show landing page while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return <Landing />;
  }

  // Show dashboard when authenticated
  return <Dashboard />;
}
