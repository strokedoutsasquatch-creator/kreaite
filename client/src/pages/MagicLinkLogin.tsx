import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, Loader2, AlertCircle } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function MagicLinkLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const sendMagicLinkMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await apiRequest("POST", "/api/auth/magic-link", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      setEmailSent(true);
      setSentEmail(variables.email);
      toast({
        title: "Magic link sent!",
        description: "Check your email for the sign-in link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send magic link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailFormData) => {
    sendMagicLinkMutation.mutate(data);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle data-testid="text-success-title">Check your email</CardTitle>
            <CardDescription data-testid="text-success-description">
              We sent a magic link to <span className="font-medium text-foreground">{sentEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to sign in. The link expires in 15 minutes.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setSentEmail("");
                form.reset();
              }}
              data-testid="button-try-different-email"
            >
              Try a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle data-testid="text-login-title">Sign in with Magic Link</CardTitle>
          <CardDescription data-testid="text-login-description">
            Enter your email to receive a secure sign-in link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={sendMagicLinkMutation.isPending}
                data-testid="button-send-magic-link"
              >
                {sendMagicLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Magic Link"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/api/login")}
              data-testid="button-replit-login"
            >
              Or sign in with Replit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MagicLinkVerify() {
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!params.token) {
        setStatus("error");
        setErrorMessage("Invalid magic link");
        return;
      }

      try {
        const response = await fetch(`/api/auth/magic-link/verify/${params.token}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.message || "Invalid or expired magic link");
          return;
        }

        setStatus("success");
        toast({
          title: "Signed in successfully!",
          description: "Welcome back to KreAIte.",
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify magic link");
      }
    };

    verifyToken();
  }, [params.token, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
              <CardTitle data-testid="text-verifying-title">Verifying magic link...</CardTitle>
              <CardDescription>Please wait while we sign you in.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle data-testid="text-success-title">Signed in!</CardTitle>
              <CardDescription>Redirecting to your dashboard...</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle data-testid="text-error-title">Verification failed</CardTitle>
              <CardDescription data-testid="text-error-description">{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        {status === "error" && (
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate("/magic-link")}
              data-testid="button-try-again"
            >
              Try again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
