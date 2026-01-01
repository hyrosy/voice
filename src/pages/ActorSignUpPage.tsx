// In src/pages/ActorSignUpPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import { UserPlus, RefreshCw, Globe, Clapperboard } from 'lucide-react'; // Added Globe/Clapperboard icons

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ---

const ActorSignUpPage = () => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // 1. DETERMINE SIGNUP TYPE
    // defaults to 'actor' if no parameter is present
    const signupType = searchParams.get('type') === 'creative' ? 'creative' : 'actor';

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // If they are already logged in, check role and redirect accordingly
                const { data: actorProfile } = await supabase
                  .from('actors')
                  .select('id, is_p2p_enabled') // Check the flag
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                if (actorProfile) {
                    if (actorProfile.is_p2p_enabled) {
                        navigate('/dashboard');
                    } else {
                        navigate('/dashboard/portfolio');
                    }
                } else {
                    const { data: clientProfile } = await supabase
                      .from('clients')
                      .select('id')
                      .eq('user_id', session.user.id)
                      .maybeSingle();
                    
                    if (clientProfile) {
                        navigate('/client-dashboard');
                    }
                }
            }
        };

        checkSession();
    }, [navigate]);

    // --- NEW SIGNUP LOGIC ---
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // 1. Create Auth User
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Redirect logic might be tricky with email confirmations, 
                // but usually, the user stays logged in after clicking the link.
                emailRedirectTo: `${window.location.origin}/actor-login`,
                data: {
                    full_name: name,
                    signup_type: signupType // Metadata for logs
                }
            },
        });

        if (signUpError) {
            setMessage(`Error: ${signUpError.message}`);
            setLoading(false);
            return;
        }

        if (!user) {
            setMessage('Error: An unknown error occurred during sign up.');
            setLoading(false);
            return;
        }

        // 2. IMMEDIATE DATABASE UPDATE
        // We need to set the role flag and auto-generate a slug for Creatives
        const isActor = signupType === 'actor';
        
        // Auto-generate a clean slug for the portfolio (e.g. "john-doe-4521")
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const cleanSlug = name 
            ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomSuffix}`
            : `user-${user.id.slice(0,8)}`;

        const { error: profileError } = await supabase
            .from('actors')
            .update({ 
                is_p2p_enabled: isActor, // TRUE for Actors, FALSE for Creatives
                ActorName: name,         // Save the name provided
                slug: cleanSlug          // Set the portfolio URL immediately
            })
            .eq('id', user.id); // 'actors' table uses user.id as PK (usually) or linked via user_id

        if (profileError) {
            // Note: If your actors table uses a trigger to auto-create rows on auth.users insert,
            // this update will work fine. If not, you might need an .insert() here instead, 
            // but your existing logic implies the row exists or is created automatically.
            console.error("Profile update warning:", profileError);
        }

        // 3. Intelligent Redirect (Skip email check for UX if auto-confirm is on)
        // If email confirmation is REQUIRED by Supabase, the user can't login yet anyway.
        // We show the message.
        if (user.identities && user.identities.length === 0) {
            // This usually means the user already exists or needs email confirmation
             setMessage('Account created! Please check your email for a confirmation link.');
        } else {
             // If auto-confirm is ON (dev mode), redirect immediately
             if (isActor) {
                 navigate('/dashboard');
             } else {
                 navigate('/dashboard/portfolio');
             }
        }
        
        setLoading(false);
    };

    // --- OAuth Handler ---
    const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
        setLoading(true);
        setMessage('');
        
        // Note: OAuth defaults to "Actor" usually because we can't pass params easily through the callback without state.
        // For now, they land on /dashboard. We can add a "Role Switcher" in settings later.
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });

        if (error) {
            setMessage(`Error signing in with ${provider}: ${error.message}`);
            setLoading(false);
        }
    };

    // --- DYNAMIC UI CONTENT ---
    const isCreative = signupType === 'creative';
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
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20">
                        <BrandingIcon size={40} className="text-white" /> 
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">{brandingTitle}</h1>
                    <p className="text-slate-300 max-w-sm">
                        {brandingDesc}
                    </p>
                </div>
            </div>

            {/* 2. Right Form Column */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    <h2 className="text-4xl font-bold mb-8 text-center md:text-left">{formTitle}</h2>
                    
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                                id="name" 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                placeholder="e.g., John Doe" 
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
                          <Alert 
                            variant={message.includes('Error') ? 'destructive' : 'default'} 
                            className="text-left"
                          >
                            <AlertDescription>{message}</AlertDescription>
                          </Alert>
                        )}

                        <div className="pt-2">
                            <Button type="submit" disabled={loading} className="w-full" size="lg">
                                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Creating Account...' : (isCreative ? 'Get Started' : 'Create Account')}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or sign up with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={loading}
                        >
                            Sign up with Google
                        </Button>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleOAuthSignIn('facebook')}
                            disabled={loading}
                        >
                            Sign up with Facebook
                        </Button>
                    </div>
                    
                    <div className="text-center mt-6">
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link to="/actor-login">
                                Already have an account? Log in
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActorSignUpPage;