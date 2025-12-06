// In src/pages/ActorSignUpPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, RefreshCw } from 'lucide-react'; // Import icons

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
    const navigate = useNavigate(); // Added for consistency, though only trigger is used

useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: actorProfile } = await supabase
                  .from('actors')
                  .select('id')
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                if (actorProfile) {
                    navigate('/dashboard');
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
    // --- END ADD ---

    // --- SignUp logic is unchanged ---
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/actor-login`,
                data: {
                    full_name: name,
                    role: 'actor' 
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
        
        setMessage('Account created! Please check your email for a confirmation link.');
        setLoading(false);
    };

    // --- OAuth Handler is unchanged ---
    const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
        setLoading(true);
        setMessage('');
        
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

    return (
        // --- FIX: Set base text to "text-foreground" ---
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground pt-20">
            
            {/* 1. Left Branding Column (Explicitly set text-white) */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-border text-white">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20">
                        <UserPlus size={40} className="text-white" /> 
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">Join Our Roster</h1>
                    {/* FIX: Made text lighter to be readable on gradient */}
                    <p className="text-slate-300 max-w-sm">
                        Create your professional profile and connect with clients looking for your unique voice.
                    </p>
                </div>
            </div>

            {/* 2. Right Form Column (Restyled with shadcn/ui) */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    <h2 className="text-4xl font-bold mb-8 text-center md:text-left">Create Account</h2>
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

                        {/* --- Restyled Message --- */}
                        {message && (
                          <Alert 
                            variant={message.includes('Error') ? 'destructive' : 'default'} 
                            className="text-left"
                          >
                            <AlertDescription>{message}</AlertDescription>
                          </Alert>
                        )}

                        <div className="pt-2">
                            {/* --- Restyled Button --- */}
                            <Button type="submit" disabled={loading} className="w-full" size="lg">
                              {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                           {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
             </div>
                    </form>
                    
                    {/* --- Restyled Separator --- */}
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

                    {/* --- Restyled OAuth Buttons --- */}
       <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={loading}
                        >
                            {/* <IconGoogle className="mr-2 h-4 w-4" /> */}
                            Sign up with Google
                     </Button>
                        <Button
                            variant="outline"
                   type="button"
                            onClick={() => handleOAuthSignIn('facebook')}
                            disabled={loading}
                        >
                            {/* <IconFacebook className="mr-2 h-4 w-4" /> */}
                       Sign up with Facebook
                        </Button>
                    </div>
                    {/* --- END OAuth Providers --- */}
                    
                 
                    {/* --- Restyled Toggle Button --- */}
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