// In src/pages/AdminClientListPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Users } from 'lucide-react'; // Reusing Users icon

// Interface for Client data on this page
interface ClientProfile {
    id: string;
    full_name: string;
    company_name?: string | null;
    user_id: string; // Link to auth.users
    // We need email, but it's in auth.users, requires a join or separate fetch
    email: string; // Function should now return email
}

const AdminClientListPage: React.FC = () => {
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError('');

        // --- Check Admin Role ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/actor-login'); return; }
        const { data: profile } = await supabase.from('actors').select('role').eq('user_id', user.id).single();
        if (profile?.role !== 'admin') { navigate('/dashboard'); return; }
        // --- End Admin Role Check ---

        /// --- CALL EDGE FUNCTION INSTEAD ---
       try {
           const { data: clientsData, error: functionError } = await supabase.functions.invoke(
                'get-clients-with-emails'
           );

            if (functionError) {
               // Handle errors during invocation (network, function not found)
                throw functionError;
            }
             if (clientsData && clientsData.error) {
                 // Handle errors returned BY the function (e.g., permission denied)
                 throw new Error(clientsData.error);
             }
             if (!clientsData || !Array.isArray(clientsData)) {
                 // Handle unexpected response format
                 throw new Error("Invalid data received from function.");
             }

            console.log("Fetched clients via function:", clientsData);
            setClients(clientsData as ClientProfile[]); // Set state with data from function

       } catch (error) {
           const err = error as Error;
           console.error("Error fetching clients via function:", err);
           setError(`Error fetching clients: ${err.message}`);
           setClients([]); // Clear clients on error
       } finally {
           setLoading(false);
       }
       }, [navigate]);
       // --- END FUNCTION CALL ---

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // TODO: Add functions to view client's orders, potentially deactivate/delete client

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading Clients...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
            <div className="max-w-7xl mx-auto">
                {/* Back Link */}
                <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent-foreground mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Admin Dashboard
                </Link>

                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Users /> Manage Clients</h1>

                {error && <p className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-300">{error}</p>}

                <div className="bg-card rounded-lg borderoverflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-700 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Company</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id} className="border-bhover:bg-accent/50 text-sm">
                                    <td className="p-4 font-semibold">{client.full_name}</td>
                                    <td className="p-4 text-muted-foreground">{client.company_name || '-'}</td>
                                    <td className="p-4 text-muted-foreground">{client.email}</td> {/* Should display actual email now */}
                                    {/*<td className="p-4 whitespace-nowrap">
                                        <button className="text-xs text-blue-400 hover:underline">View Orders</button>
                                    </td>*/}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {clients.length === 0 && !loading && (
                        <p className="text-center text-slate-500 p-8">No clients found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminClientListPage;