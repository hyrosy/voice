// In src/pages/ActorSignUpPage.tsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate is used by the trigger flow

const ActorSignUpPage = () => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    // const navigate = useNavigate(); // Not needed for handleSignUp, but good practice

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // 1. Create the authentication user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/actor-login`,
                data: {
                    full_name: name,
                    role: 'actor' // Pass the role flag for the trigger
                }
            },
        });

        if (signUpError) {
            setMessage(signUpError.message);
            setLoading(false);
            return;
        }
        if (!user) {
            setMessage('An unknown error occurred during sign up.');
            setLoading(false);
            return;
        }
        
        // 2. Profile creation is now handled by the 'handle_new_actor' trigger

        setMessage('Account created! Please check your email for a confirmation link.');
        setLoading(false);
    };

    // --- NEW: Add OAuth Handler ---
    // This function works for both Log In and Sign Up
    const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
        setLoading(true);
        setMessage('');
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                // Redirect to the Actor dashboard after successful login/signup
                redirectTo: `${window.location.origin}/dashboard`
                // Note: We cannot pass the 'role' flag here for new users.
                // This is the limitation we discussed, requiring a "Complete Profile" step.
            }
        });

        if (error) {
            setMessage(`Error signing in with ${provider}: ${error.message}`);
            setLoading(false);
        }
        // Supabase handles the redirect on success
    };
    // --- END NEW Handler ---

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-white">
            {/* Left Branding Column */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border">
                 <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">Join Our Roster</h1>
                    <p className="text-muted-foreground max-w-sm">
                        Create your professional profile and connect with clients looking for your unique voice.
                    </p>
                </div>
            </div>

            {/* Right Form Column */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    <h2 className="text-4xl font-bold mb-8 text-center md:text-left">Create Account</h2>
                    <form onSubmit={handleSignUp} className="space-y-6">
                        {/* ... (name, email, password inputs) ... */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 bg-card borderrounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="e.g., John Doe" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-card borderrounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-card borderrounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="••••••••" />
                        </div>
                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-md font-semibold text-lg transition-opacity disabled:opacity-50">
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    {/* --- NEW: OAuth Providers --- */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-background px-2 text-slate-500">Or sign up with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            type="button"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-md transition"
                        >
                            {/* <IconGoogle /> */}
                            <span className="text-sm font-semibold">Sign up with Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOAuthSignIn('facebook')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-md transition"
                        >
                            {/* <IconFacebook /> */}
                            <span className="text-sm font-semibold">Sign up with Facebook</span>
                        </button>
                    </div>
                    {/* --- END OAuth Providers --- */}

                    {message && <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>}
                    
                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/actor-login" className="font-semibold text-purple-400 hover:text-purple-300">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActorSignUpPage;