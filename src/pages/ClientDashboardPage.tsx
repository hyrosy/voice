import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

// --- THIS IS THE FIRST FIX ---
// The 'actors' property is now an array of objects
interface Order {
  id: string;
  order_id_string: string;
  status: string;
  created_at: string;
  actors: { ActorName: string }[]; // Changed to an array
}

const ClientDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [clientName, setClientName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const getClientData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/client-auth');
                return;
            }

            const { data: clientProfile } = await supabase
                .from('clients')
                .select('id, full_name')
                .eq('user_id', user.id)
                .single();
            
            if (!clientProfile) {
                setLoading(false);
                return;
            }
            setClientName(clientProfile.full_name || '');

            const { data: orderData, error } = await supabase
                .from('orders')
                .select('id, order_id_string, status, created_at, actors(ActorName)')
                .eq('client_id', clientProfile.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching orders:", error);
            } else {
                // The type assertion 'as Order[]' will now work correctly
                setOrders(orderData as Order[]);
            }
            setLoading(false);
        };
        getClientData();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/client-auth');
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Your Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">My Orders</h1>
                        <p className="text-slate-400">Welcome back, {clientName}</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold">
                        Log Out
                    </button>
                </div>

                <div className="bg-slate-800 rounded-lg border border-slate-700">
                    <div className="space-y-4 p-4">
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <Link to={`/order/${order.id}`} key={order.id} className="block bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-white">Order #{order.order_id_string}</p>
                                            {/* --- THIS IS THE SECOND FIX --- */}
                                            {/* Access the first actor in the array */}
                                            <p className="text-sm text-slate-400">Actor: {order.actors[0]?.ActorName || 'N/A'}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-8">You have not placed any orders yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboardPage;