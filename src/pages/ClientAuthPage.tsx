import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react'; // Import an icon for the branding

const ClientAuthPage = () => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState(useLocation().state?.email || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSignUp, setIsSignUp] = useState(true); // Toggle between Sign Up and Log In
    const navigate = useNavigate();
    // Inside ClientAuthPage.tsx (or other auth pages)

const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            // This is where users will be sent back *after* they
            // authenticate with the provider.
            redirectTo: `${window.location.origin}/client-dashboard` // or /dashboard for actors
        }
    });

    if (error) {
        setMessage(`Error signing in with ${provider}: ${error.message}`);
        setLoading(false);
    }
    // If successful, Supabase handles the redirect automatically.
};

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (isSignUp) {
            // --- SIGN UP LOGIC ---
            if (name.trim() === '') {
                setMessage('Please enter your full name.');
                setLoading(false);
                return;
            }

            // 1. Create the authentication user
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/client-dashboard`,
                    data: {
                        full_name: name // Pass name for the trigger
                    }
                },
            });

            if (signUpError) {
                setMessage(signUpError.message);
                setLoading(false);
                return;
            }
            if (!user) {
                setMessage('Sign up successful, but no user returned. Please check your email.');
                setLoading(false);
                return;
            }
            
            // Note: The trigger handle_new_user now creates the profile in 'clients' table
            
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

    // --- UPDATED JSX ---
    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-900 text-white">
            
            {/* 1. Left Branding Column (New) */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-slate-800">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20">
                        <UserCircle size={40} className="text-white" /> 
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">Client Portal</h1>
                    <p className="text-slate-400 max-w-sm">
                        Access all your orders, track project status, and communicate with talent in one place.
                    </p>
                </div>
            </div>

            {/* 2. Right Form Column (Modified) */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    
                    {/* Title changes based on isSignUp state */}
                    <h2 className="text-4xl font-bold mb-2 text-center md:text-left">{isSignUp ? 'Create Client Account' : 'Client Log In'}</h2>
                    <p className="text-center md:text-left text-slate-400 mb-8">{isSignUp ? 'Access all your orders in one place.' : 'Welcome back!'}</p>

                    {/* Form (existing logic, updated styles) */}
                    <form onSubmit={handleAuthAction} className="space-y-6">
                        {isSignUp && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="e.g., Jane Doe" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="you@example.com" />                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="••••••••" />
                        </div>
                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-md font-semibold text-lg transition-opacity disabled:opacity-50">
                                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
                            </button>
                        </div>
                    </form>

                                        {/* --- NEW: OAuth Providers --- */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-slate-800 px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Add icons here */}
                        <button
                            type="button"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-md transition"
                        >
                            {/* <IconGoogle /> */}
                            <span className="text-sm font-semibold">Sign in with Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOAuthSignIn('facebook')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-md transition"
                        >
                            {/* <IconFacebook /> */}
                            <span className="text-sm font-semibold">Sign in with Facebook</span>
                        </button>
                        {/* Add Apple button similarly */}
                    </div>
                    {/* --- END OAuth Providers --- */}
                    
                    {message && <p className="mt-4 text-center text-sm text-slate-400">{message}</p>}
                    
                    {/* Toggle Button */}
                    <div className="text-center mt-6">
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold text-purple-400 hover:text-purple-300">
                            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientAuthPage;