import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const ActorSignUpPage = () => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // 1. Create the authentication user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Redirect to the new login page after email confirmation
                emailRedirectTo: `${window.location.origin}/actor-login`,
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
        
        // 2. Create the corresponding profile in the 'actors' table
        const { error: profileError } = await supabase
            .from('actors')
            .insert({
                user_id: user.id,
                ActorName: name,
                ActorEmail: email,
            });

        if (profileError) {
            setMessage(`Account created, but failed to create profile: ${profileError.message}`);
        } else {
            setMessage('Account created! Please check your email for a confirmation link.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-900 text-white">
            {/* Left Branding Column */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-slate-800">
                 <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">Join Our Roster</h1>
                    <p className="text-slate-400 max-w-sm">
                        Create your professional profile and connect with clients looking for your unique voice.
                    </p>
                </div>
            </div>

            {/* Right Form Column */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    <h2 className="text-4xl font-bold mb-8 text-center md:text-left">Create Account</h2>
                    <form onSubmit={handleSignUp} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="e.g., John Doe" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="••••••••" />
                        </div>
                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-md font-semibold text-lg transition-opacity disabled:opacity-50">
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                    {message && <p className="mt-4 text-center text-sm text-slate-400">{message}</p>}
                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-400">
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
