import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const ActorLoginPage = () => {
    const [loading, setLoading] = useState(false);
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
            // Redirect to the actor dashboard on successful login
            navigate('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-900 text-white">
            {/* Left Branding Column */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-slate-800">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">Actor Portal</h1>
                    <p className="text-slate-400 max-w-sm">
                        Manage your profile, rates, and projects all in one place.
                    </p>
                </div>
            </div>

            {/* Right Form Column */}
            <div className="flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    <h2 className="text-4xl font-bold mb-8 text-center md:text-left">Log In</h2>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-md font-semibold text-lg transition-opacity disabled:opacity-50"
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </div>
                    </form>
                    {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/actor-signup" className="font-semibold text-purple-400 hover:text-purple-300">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActorLoginPage;
