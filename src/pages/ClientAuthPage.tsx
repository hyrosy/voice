// In src/pages/ClientAuthPage.tsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react'; // Import an icon for the branding
import { useTranslation } from 'react-i18next'; // <-- Import the hook

const ClientAuthPage = () => {
    const { t } = useTranslation(); // <-- Call the hook
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState(useLocation().state?.email || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSignUp, setIsSignUp] = useState(true); // Toggle between Sign Up and Log In
    const navigate = useNavigate();

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (isSignUp) {
            // --- SIGN UP LOGIC (Using Trigger) ---
            if (name.trim() === '') {
                setMessage('Please enter your full name.');
                setLoading(false);
                return;
            }

            // 1. Create the authentication user
            // The trigger 'handle_new_user' will catch this and create the 'clients' profile
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
                setMessage(signUpError.message);
                setLoading(false);
                return;
            }
            
            // 2. Client-side insert is NO LONGER NEEDED
            
            // 3. Linking past orders is handled by RLS policies on the 'orders' table
            //    (If using the simpler email-match method, no action is needed here)

            setMessage('Account created! Please check your email for a confirmation link.');

        } else {
            // --- LOG IN LOGIC ---
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage(error.message);
            } else {
                navigate('/client-dashboard');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-white">
            
            {/* 1. Left Branding Column */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20">
                        <UserCircle size={40} className="text-white" /> 
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">{t('auth.clientPortal')}</h1>
                    <p className="text-muted-foreground max-w-sm">{t('auth.accessOrders')}</p>                    
                </div>
            </div>

            {/* 2. Right Form Column */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    
                    <h2 className="text-4xl font-bold mb-2 text-center md:text-left">{isSignUp ? t('auth.createClientAccount') : t('auth.logInBtn')}</h2>
                    <p className="text-center md:text-left text-muted-foreground mb-8">{isSignUp ? t('auth.accessOrders') : 'Welcome back!'}</p>
                    <form onSubmit={handleAuthAction} className="space-y-6">
                        {isSignUp && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">{t('auth.fullName')}</label>                                
                                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 bg-card border border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="e.g., Jane Doe" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">{t('auth.email')}</label>                            
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-card border border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-muted-foreground mb-1">{t('auth.password')}</label>                            
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-card border border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="••••••••" />
                        </div>
                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-md font-semibold text-lg transition-opacity disabled:opacity-50">
                                {loading ? 'Processing...' : (isSignUp ? t('auth.createAccountBtn') : t('auth.logInBtn'))}                            
                                </button>
                        </div>
                    </form>
                    
                    {/* --- OAuth Providers --- */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-background px-2 text-slate-500">{t('auth.orContinueWith')}</span>                        
                            </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Add OAuth buttons here as needed */}
                    </div>
                    {/* --- END OAuth Providers --- */}

                    {message && <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>}
                    
                    {/* Toggle Button */}
                    <div className="text-center mt-6">
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold text-purple-400 hover:text-purple-300">
                            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}                        
                            </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientAuthPage;