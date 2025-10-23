// In src/pages/ActorAuthPage.tsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ActorAuthPage = () => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(''); // NEW: State for the actor's full name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Logged in successfully! Redirecting...');
            navigate('/dashboard'); // Use navigate for cleaner redirects
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') {
            setMessage('Please enter your full name.');
            return;
        }
        setLoading(true);
        setMessage('');

        // Step 1: Create the authentication account
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
            emailRedirectTo: `https://www.ucpmaroc.com/actor-auth`, // <-- Change to your domain            
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
        
        // --- THIS IS THE CRITICAL NEW PART ---
        // Step 2: Create the corresponding profile in the 'actors' table
        const { error: profileError } = await supabase
            .from('actors')
            .insert({
                user_id: user.id, // Link the profile to the auth account
                ActorName: name, // Set the name
                ActorEmail: email, // Set the email
            });
        // The database trigger will automatically create the slug from the ActorName!

        if (profileError) {
            setMessage(`Account created, but failed to create profile: ${profileError.message}`);
        } else {
            setMessage('Account created! Please check your email for a confirmation link.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg border border-slate-700">
                <h1 className="text-3xl font-bold text-center text-white mb-6">Actor Portal</h1>
                <form className="space-y-4">
                    {/* NEW: Full Name input */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300">Full Name</label>
                        <input
                            id="name"
                            className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white"
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /* ... other props */ />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-300">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /* ... other props */ />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button onClick={handleLogin} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold">
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                        <button onClick={handleSignUp} disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold">
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
                {message && <p className="mt-4 text-center text-sm text-slate-400">{message}</p>}
            </div>
        </div>
    );
};

export default ActorAuthPage;