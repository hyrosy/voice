// In src/pages/ActorLoginPage.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { UserCheck, RefreshCw } from "lucide-react";

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ---

const ActorLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Fetch ID AND the Role column
        const { data: actorProfile } = await supabase
          .from("actors")
          .select("id, role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (actorProfile) {
          // Route admins to the admin panel, actors to the dashboard
          if (actorProfile.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          // Not an actor/admin, check if they are a client
          const { data: clientProfile } = await supabase
            .from("clients")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (clientProfile) {
            navigate("/client-dashboard");
          }
        }
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // On successful login, check their role to route them correctly
    if (authData.session) {
      const { data: actorProfile } = await supabase
        .from("actors")
        .select("role")
        .eq("user_id", authData.session.user.id)
        .maybeSingle();

      if (actorProfile?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }

    setLoading(false);
  };

  const handleOAuthSignIn = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    setLoading(true);
    setMessage("");
    // OAuth automatically redirects to the URL provided.
    // Note: You may need a central routing handler on the /dashboard page
    // to bounce admins to /admin if they log in via OAuth.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setMessage(`Error signing in with ${provider}: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground pt-20">
      {/* 1. Left Branding Column */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-border text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20">
            <UserCheck size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            Actor Portal
          </h1>
          <p className="text-slate-300 max-w-sm">
            Manage your profile, rates, and projects all in one place.
          </p>
        </div>
      </div>

      {/* 2. Right Form Column */}
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold mb-8 text-center md:text-left">
            Log In
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {message && (
              <Alert variant="destructive" className="text-left">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Logging in..." : "Log In"}
              </Button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-muted-foreground">
                Or log in with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
            >
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthSignIn("facebook")}
              disabled={loading}
            >
              Sign in with Facebook
            </Button>
          </div>

          <div className="text-center mt-6">
            <Button variant="link" asChild className="text-muted-foreground">
              <Link to="/actor-signup">Don't have an account? Sign up now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorLoginPage;
