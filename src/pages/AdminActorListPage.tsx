// In src/pages/AdminActorListPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Users, ShieldCheck, ToggleLeft, ToggleRight, Edit, XIcon, Check } from 'lucide-react';
// Interface for Actor data on this page
interface ActorProfile {
    id: string;
    ActorName: string;
    ActorEmail?: string;
    IsActive?: boolean;
    role?: string;
    created_at: string;
    direct_payment_enabled?: boolean; // Add if missing
    direct_payment_requested?: boolean; // Add if missing
}

const AdminActorListPage: React.FC = () => {
    const [actors, setActors] = useState<ActorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [message, setMessage] = useState(''); // <-- Make sure this line exists

    const fetchActors = useCallback(async () => {
        setLoading(true);
        setError('');

        // --- Check Admin Role ---
        // You should reuse or adapt the admin check from AdminDashboardPage
        // to ensure only admins can access this page.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/actor-login'); return; // Redirect if not logged in
        }
        const { data: profile } = await supabase.from('actors').select('role').eq('user_id', user.id).single();
        if (profile?.role !== 'admin') {
            navigate('/dashboard'); return; // Redirect if not admin
        }
        // --- End Admin Role Check ---


        // Fetch all actors - ensure RLS allows admin to select * from actors
        const { data, error: fetchError } = await supabase
            .from('actors')
            .select('id, ActorName, ActorEmail, "IsActive", role, created_at, direct_payment_enabled, direct_payment_requested')
            .order('created_at', { ascending: false }); // Or order by 'direct_payment_requested' desc to bring requests to top
        if (fetchError) {
            setError(`Error fetching actors: ${fetchError.message}`);
            console.error(fetchError);
        } else {
            setActors(data as ActorProfile[]);
        }
        setLoading(false);
    }, [navigate]);

    useEffect(() => {
        fetchActors();
    }, [fetchActors]);

    // TODO: Add functions to handle activate/deactivate, promote/demote (role change)

    // --- MODIFIED: Function to handle Activate/Deactivate via Edge Function ---
    const handleToggleActiveStatus = async (actorId: string, currentStatus: boolean | undefined) => {
        setMessage('');
        setError('');
        const newStatus = !currentStatus;
        const originalActors = [...actors];

        // Optimistic UI Update (remains the same)
        setActors(prevActors => prevActors.map(actor =>
            actor.id === actorId ? { ...actor, IsActive: newStatus } : actor
        ));

        try {
            // --- Call the Edge Function ---
            const { data: responseData, error: functionError } = await supabase.functions.invoke(
                'toggle-actor-status',
                {
                    body: { actorId, newStatus } // Pass required data
                }
            );

            if (functionError) {
                // Handle errors during invocation
                 throw functionError;
            }
            if (responseData && responseData.error) {
                // Handle errors returned BY the function
                 throw new Error(responseData.error);
            }
            if (!responseData || !responseData.success) {
                 // Handle unexpected success response
                 throw new Error("Function did not report success.");
            }
            // --- End Function Call ---

            // Update message based on actual response from function
            setMessage(`Actor ${responseData.isActive ? 'activated' : 'deactivated'} successfully.`);
            // Optional: You could update local state again based on responseData.isActive
            // to ensure absolute consistency, though optimistic should be fine.
            // setActors(prevActors => prevActors.map(actor =>
            //     actor.id === actorId ? { ...actor, IsActive: responseData.isActive } : actor
            // ));

        } catch (error) {
            const err = error as Error;
            console.error("Failed to update actor status via function:", err);
            setError(`Failed to update status: ${err.message}`);
            setActors(originalActors); // Revert UI state on failure
        }
    };
    // --- End Activate/Deactivate Handler ---

    // In src/pages/AdminActorListPage.tsx

    // --- NEW: Handlers for Direct Payment Approval ---
    const handleApproveRequest = async (actorId: string) => {
        setMessage(''); setError('');
        const originalActors = [...actors];

        // Optimistic UI update (optional but nice)
        setActors(prev => prev.map(a => a.id === actorId ? { ...a, direct_payment_enabled: true, direct_payment_requested: false } : a));

        try {
            const { error } = await supabase
                .from('actors')
                .update({
                    direct_payment_enabled: true,
                    direct_payment_requested: false
                 })
                .eq('id', actorId);

            if (error) throw error;
            setMessage(`Direct payment approved for actor.`);
            // Optional: Send notification email to actor via Edge Function or EmailJS

        } catch (error) {
            const err = error as Error;
            console.error("Error approving request:", err);
            setError(`Failed to approve request: ${err.message}`);
            setActors(originalActors); // Revert UI
        }
    };

    const handleRejectRequest = async (actorId: string) => {
        setMessage(''); setError('');
         const originalActors = [...actors];

        // Optimistic UI update
        setActors(prev => prev.map(a => a.id === actorId ? { ...a, direct_payment_requested: false } : a));


        try {
            const { error } = await supabase
                .from('actors')
                .update({ direct_payment_requested: false }) // Just clear the request flag
                .eq('id', actorId);

            if (error) throw error;
            setMessage(`Direct payment request rejected.`);
            // Optional: Send notification email to actor

        } catch (error) {
            const err = error as Error;
            console.error("Error rejecting request:", err);
            setError(`Failed to reject request: ${err.message}`);
            setActors(originalActors); // Revert UI
        }
    };
    // --- END Approval Handlers ---

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading Actors...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
            <div className="max-w-7xl mx-auto">
                {/* Back Link */}
                <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent-foreground mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Admin Dashboard
                </Link>

                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Users /> Manage Actors</h1>

                {error && <p className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-300">{error}</p>}

                <div className="bg-card rounded-lg borderoverflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-700 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Direct Pay</th> {/* New Column */}
                                <th className="p-4">Status</th>
                                <th className="p-4">Registered</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actors.map(actor => (
                                <tr key={actor.id} className="border-bhover:bg-accent/50 text-sm">
                                    <td className="p-4 font-semibold">{actor.ActorName}</td>
                                    <td className="p-4 text-muted-foreground">{actor.ActorEmail || '-'}</td>
                                    <td className="p-4 capitalize">
                                        {actor.role === 'admin' ? (
                                            <span className="flex items-center gap-1.5 text-yellow-400"><ShieldCheck size={14} /> Admin</span>
                                        ) : (
                                            'Actor'
                                        )}
                                    </td>
                                    {/* --- NEW Direct Pay Status Cell --- */}
                                    <td className="p-4 text-xs font-semibold">
                                        {actor.direct_payment_enabled ? (
                                            <span className="text-green-400">Enabled</span>
                                        ) : actor.direct_payment_requested ? (
                                             <span className="text-yellow-400">Pending Req.</span>
                                         ) : (
                                             <span className="text-slate-500">Disabled</span>
                                        )}
                                    </td>
                                    {/* --- END Direct Pay Cell --- */}



                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs ${actor.IsActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {actor.IsActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground whitespace-nowrap">{new Date(actor.created_at).toLocaleDateString()}</td>
                                    
                                    
                                        {/* --- UPDATED Actions Cell --- */}
                                     <td className="p-4 whitespace-nowrap space-x-2">
                                        {/* Show Approve/Reject ONLY if requested */}
                                        {actor.direct_payment_requested && (
                                            <>
                                                <button
                                                    onClick={() => handleApproveRequest(actor.id)}
                                                    className="text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 bg-green-600/50 text-green-300 hover:bg-green-600/70"
                                                >
                                                     <Check size={12}/> Approve Pay
                                                 </button>
                                                 <button
                                                    onClick={() => handleRejectRequest(actor.id)}
                                                     className="text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 bg-red-600/50 text-red-300 hover:bg-red-600/70"
                                                 >
                                                      <XIcon size={12}/> Reject Pay
                                                  </button>
                                            </>
                                        )}

                                        {/* Existing Edit/Activate Buttons (shown when NOT pending request?) */}
                                         {!actor.direct_payment_requested && ( 
                                             <>
                                        <button className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" title="Edit Actor (Not Implemented)">
                                             <Edit size={12}/> Edit
                                         </button>

                                         {/* Activate/Deactivate Button */}
                                        <button
                                            onClick={() => handleToggleActiveStatus(actor.id, actor.IsActive)}
                                            className={`text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 transition-colors ${
                                                actor.IsActive
                                                ? 'bg-yellow-600/50 text-yellow-300 hover:bg-yellow-600/70'
                                                : 'bg-green-600/50 text-green-300 hover:bg-green-600/70'
                                            }`}
                                        >
                                             {actor.IsActive ? <ToggleLeft size={12}/> : <ToggleRight size={12}/>}
                                             {actor.IsActive ? 'Deactivate' : 'Activate'}
                                         </button>
                                         </>
                                         )}
                                    </td>
                                     {/* --- END UPDATED Actions Cell --- */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {actors.length === 0 && !loading && (
                        <p className="text-center text-slate-500 p-8">No actors found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminActorListPage;