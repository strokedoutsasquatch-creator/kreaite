import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import DashboardSkeleton from "@/components/DashboardSkeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PREV_AUTH_KEY = "prevAuthState";
const AUTH_INITIALIZED_KEY = "authInitialized";

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle session expiry: only redirect on true→false transitions after initialization
  // Use two-flag mechanism to survive page refreshes
  useEffect(() => {
    if (isLoading) return;

    const prevAuth = sessionStorage.getItem(PREV_AUTH_KEY);
    const initFlag = sessionStorage.getItem(AUTH_INITIALIZED_KEY);
    const wasAuthed = prevAuth === "true";
    const hasInit = initFlag === "true";

    const writeFlags = (current: boolean) => {
      sessionStorage.setItem(AUTH_INITIALIZED_KEY, "true");
      sessionStorage.setItem(PREV_AUTH_KEY, String(current));
    };

    // Session expired: user was authenticated, now they're not
    if (hasInit && wasAuthed && !isAuthenticated) {
      writeFlags(false);
      toast({
        title: "Session expired",
        description: "Sign in again to continue.",
        variant: "destructive",
        duration: 3500,
      });
      // Wait for toast to be fully visible before redirecting
      (async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 3600));
        window.location.assign("/api/login");
      })();
      return;
    }

    // First-time unauthenticated: redirect to landing
    if (!hasInit && !isAuthenticated) {
      writeFlags(false);
      setLocation("/");
      return;
    }

    // Update flags for current auth state
    writeFlags(!!isAuthenticated);
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Show reusable dashboard skeleton loader while checking auth
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Render protected content only when authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
