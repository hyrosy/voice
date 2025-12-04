// In src/pages/ClientAuthPage.tsx

import React, { useState, useEffect } from 'react'; // <-- 1. Add useEffect
import { supabase } from '../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCircle, RefreshCw } from 'lucide-react'; // Import loading icon
import { useTranslation } from 'react-i18next';

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ---

const ClientAuthPage = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState(useLocation().state?.email || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSignUp, setIsSignUp] = useState(true);
    const navigate = useNavigate();
    // --- 2. ADD THIS ENTIRE useEffect HOOK ---
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // User is logged in. Let's find out their role.
              // We check for an actor profile first.
                const { data: actorProfile } = await supabase
                  .from('actors')
                  .select('id')
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                if (actorProfile) {
                    // This user is an actor, send them to the actor dashboard
                    navigate('/client-dashboard');
                } else {
                    // Not an actor, check if they are a client
                    const { data: clientProfile } = await supabase
                      .from('clients')
                      .select('id')
                      .eq('user_id', session.user.id)
                      .maybeSingle();
                    
                    if (clientProfile) {
                        // This user is a client, send them to the client dashboard
                        navigate('/client-dashboard');
                    }
                  // If they have neither profile (e.g., mid-signup),
                  // we do nothing and let them stay on the page.
                }
            }
            // If no session, do nothing.
        };

        checkSession();
    }, [navigate]);

    // --- Auth logic is unchanged ---
    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (isSignUp) {
            // --- SIGN UP LOGIC ---
            if (name.trim() === '') {
                setMessage('Error: Please enter your full name.');
                setLoading(false);
                return;
            }
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/client-dashboard`,
                    data: {
                        full_name: name,
                        role: 'client' 
                    }
                },
            });
            if (signUpError) {
                setMessage(`Error: ${signUpError.message}`);
            } else {
                setMessage('Account created! Please check your email for a confirmation link.');
            }
        } else {
            // --- LOG IN LOGIC ---
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage(`Error: ${error.message}`);
            } else {
                navigate('/client-dashboard');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground pt-20">
            
            {/* 1. Left Branding Column (Unchanged, as requested) */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-border">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-foreground/20">
                        <UserCircle size={40} className="text-white" /> 
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight text-white">{t('auth.clientPortal')}</h1>
                    <p className="text-muted-foreground max-w-sm">{t('auth.accessOrders')}</p>                    
                </div>
            </div>

            {/* 2. Right Form Column (Restyled with shadcn/ui) */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    
                    <h2 className="text-4xl font-bold mb-2 text-center md:text-left">{isSignUp ? t('auth.createClientAccount') : t('auth.logInBtn')}</h2>
                    <p className="text-center md:text-left text-muted-foreground mb-8">
                      {isSignUp ? t('auth.accessOrders') : 'Welcome back!'}
                    </p>
                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('auth.fullName')}</Label>
                                <Input 
                                  id="name" 
                                  type="text" 
                                  value={name} 
                                  onChange={(e) => setName(e.target.value)} 
                                  required 
                                  placeholder="e.g., Jane Doe" 
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.email')}</Label>
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
                            <Label htmlFor="password">{t('auth.password')}</Label>
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
                              {loading ? 'Processing...' : (isSignUp ? t('auth.createAccountBtn') : t('auth.logInBtn'))}
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
                         {t('auth.orContinueWith')}
                            </span>
                        </div>
               </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Add OAuth buttons here as needed */}
                        {/*                         <Button variant="outline">Continue with Google</Button>
                        */}
                    </div>
                    {/* --- END OAuth Providers --- */}
                    
                    {/* --- Restyled Toggle Button --- */}
           <div className="text-center mt-4">
                        <Button 
                          variant="link" 
                   onClick={() => setIsSignUp(!isSignUp)} 
                          className="text-muted-foreground"
                        >
                            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}
                   </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientAuthPage;