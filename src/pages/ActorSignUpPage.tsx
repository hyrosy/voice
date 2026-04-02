// In src/pages/ActorSignUpPage.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, RefreshCw, Globe, KeyRound, ArrowLeft } from "lucide-react";

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ActorSignUpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signupType =
    searchParams.get("type") === "creative" ? "creative" : "actor";

  // --- Auth States ---
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // --- OTP States ---
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // --- SECURE AAA+ SESSION CHECK ---
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        const { data: actorProfile } = await supabase
          .from("actors")
          .select("id, is_p2p_enabled, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (actorProfile) {
          if (actorProfile.role === "admin") navigate("/admin");
          else if (actorProfile.is_p2p_enabled) navigate("/dashboard");
          else navigate("/dashboard/portfolio");
        } else {
          const { data: clientProfile } = await supabase
            .from("clients")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (clientProfile) navigate("/client-dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  // --- STANDARD SIGNUP ACTION ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          signup_type: signupType,
          role: "actor",
        },
      },
    });

    if (signUpError) {
      setMessage(`Error: ${signUpError.message}`);
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      setMessage("Error: An unknown error occurred.");
      setLoading(false);
      return;
    }

    // Pre-create actor profile
    const isActor = signupType === "actor";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanSlug = name
      ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${randomSuffix}`
      : `user-${user.id.slice(0, 8)}`;

    await supabase
      .from("actors")
      .update({
        is_p2p_enabled: isActor,
        ActorName: name,
        slug: cleanSlug,
      })
      .eq("user_id", user.id);

    // Check if user already existed
    if (user.identities && user.identities.length === 0) {
      setMessage("Error: Email already registered. Please log in.");
    } else {
      setShowOtpInput(true);
      setMessage("Verification code sent! Please check your email.");
    }
    setLoading(false);
  };

  // --- OTP VERIFICATION ACTION ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      email,
      token: otpToken,
      type: "signup",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (session) {
      if (signupType === "actor") navigate("/dashboard");
      else navigate("/dashboard/portfolio");
    }
  };

  // --- OAuth Handler ---
  const handleOAuthSignIn = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setMessage(`Error signing in with ${provider}: ${error.message}`);
      setLoading(false);
    }
  };

  // --- DYNAMIC UI CONTENT ---
  const isCreative = signupType === "creative";
  const brandingTitle = isCreative ? "Build Your Portfolio" : "Join Our Roster";
  const brandingDesc = isCreative
    ? "Create a cinematic website in minutes. No coding required."
    : "Create your professional profile and connect with clients looking for your unique voice.";
  const formTitle = isCreative ? "Start Building Free" : "Create Actor Account";
  const BrandingIcon = isCreative ? Globe : UserPlus;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground pt-20">
      {/* 1. Left Branding Column */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-border text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20 shadow-xl">
            <BrandingIcon size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            {brandingTitle}
          </h1>
          <p className="text-slate-300 max-w-sm text-lg">{brandingDesc}</p>
        </div>
      </div>

      {/* 2. Right Form Column */}
      <div className="flex flex-col justify-center items-center p-8 bg-background relative">
        {showOtpInput && (
          <Button
            variant="ghost"
            className="absolute top-8 left-8 text-muted-foreground"
            onClick={() => setShowOtpInput(false)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-4xl font-bold mb-2 tracking-tight">
              {showOtpInput ? "Check your email" : formTitle}
            </h2>
            <p className="text-muted-foreground">
              {showOtpInput
                ? `We sent a 6-digit code to ${email}`
                : "Fill in your details below to get started."}
            </p>
          </div>

          {message && (
            <Alert
              variant={message.includes("Error") ? "destructive" : "default"}
              className="mb-6"
            >
              <AlertDescription className="font-medium">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {showOtpInput ? (
            // --- OTP FORM ---
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="sr-only">
                  Verification Code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                  <Input
                    id="otp"
                    type="text"
                    value={otpToken}
                    onChange={(e) =>
                      setOtpToken(e.target.value.replace(/\D/g, ""))
                    }
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="pl-14 py-8 text-center text-3xl tracking-[0.5em] font-mono rounded-xl bg-muted/50 border-2 focus-visible:border-primary transition-all"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || otpToken.length < 6}
                className="w-full py-6 text-lg rounded-xl shadow-lg"
              >
                {loading && <RefreshCw className="mr-2 h-5 w-5 animate-spin" />}
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          ) : (
            // --- STANDARD SIGNUP FORM ---
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., John Doe"
                  className="py-5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="py-5"
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
                  className="py-5"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-lg rounded-xl shadow-lg mt-2"
              >
                {loading && <RefreshCw className="mr-2 h-5 w-5 animate-spin" />}
                {loading
                  ? "Creating Account..."
                  : isCreative
                  ? "Get Started"
                  : "Create Account"}
              </Button>
            </form>
          )}

          {!showOtpInput && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-background px-3 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                  className="py-5"
                >
                  Sign up with Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOAuthSignIn("facebook")}
                  disabled={loading}
                  className="py-5"
                >
                  Sign up with Facebook
                </Button>
              </div>

              <div className="text-center mt-6">
                <Button
                  variant="ghost"
                  asChild
                  className="text-muted-foreground hover:text-primary"
                >
                  <Link to="/actor-login">Already have an account? Log in</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorSignUpPage;
