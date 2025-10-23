import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';

const ClientAuthPage = () => {
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
                emailRedirectTo: `https://www.ucpmaroc.com/client-dashboard`, // <-- Change to your domain                
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
            
            // 2. Create the corresponding profile in the 'clients' table
            const { data: clientProfile, error: clientError } = await supabase
                .from('clients')
                .insert({ user_id: user.id, full_name: name })
                .select()
                .single();

            if (clientError) {
                setMessage(`Account created, but failed to create profile: ${clientError.message}`);
                setLoading(false);
                return;
            }

            // 3. Link past anonymous orders to this new account
            await supabase
                .from('orders')
                .update({ client_id: clientProfile.id })
                .eq('client_email', email)
                .is('client_id', null);

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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg border border-slate-700">
                <h1 className="text-3xl font-bold text-center text-white mb-2">{isSignUp ? 'Create Client Account' : 'Client Log In'}</h1>
                <p className="text-center text-slate-400 mb-6">{isSignUp ? 'Access all your orders in one place.' : 'Welcome back!'}</p>

                <form onSubmit={handleAuthAction} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300">Full Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-300">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold">
                            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
                        </button>
                    </div>
                </form>
                {message && <p className="mt-4 text-center text-sm text-slate-400">{message}</p>}
                
                <div className="text-center mt-6">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-purple-400 hover:text-purple-300">
                        {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientAuthPage;