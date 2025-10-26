import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react'; // <-- Import Heart icon
// --- Interface remains the same ---
interface Order {
  id: string;
  order_id_string: string;
  status: string;
  created_at: string;
  actors: { ActorName: string }[];
  total_price?: number;
}

const ClientDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState(''); // <-- 1. Add state for email
    const navigate = useNavigate();

    // --- Calculations remain the same ---
    const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);

    useEffect(() => {
        const getClientData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                navigate('/client-auth');
                return;
            }

            setClientEmail(user.email); // <-- 2. Set email state here

            const { data: clientProfile } = await supabase
                .from('clients')
                .select('*') // Keep fetching profile for name
                .eq('user_id', user.id)
                .single();

            // Set name from profile, fallback to email if profile/name is missing
            setClientName(clientProfile?.full_name || ''); // Keep setting name

            // --- Fetching orders remains the same ---
            const { data: orderData, error } = await supabase
              .from('orders')
              // Ensure total_price is selected if needed for summary cards
              .select('id, order_id_string, status, created_at, total_price, actors(ActorName)')
              .eq('client_email', user.email)
              .order('created_at', { ascending: false });

            // --- ADD LOGGING HERE ---
           console.log("Attempted to fetch orders for email:", user.email);
           if (error) {
               console.error("Error fetching orders (RLS might be blocking):", error);
           } else {
               console.log("Fetched orderData:", orderData); // See what data (if any) is returned
               setOrders(orderData as Order[]);
           }
           // --- END LOGGING ---
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
                {/* --- 3. Update Header JSX --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-slate-700 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">My Orders</h1>
                        {/* Display Name and Email */}
                        <p className="text-lg text-slate-400">
                            Welcome back, <strong className="text-slate-200">{clientName || 'Client'}</strong>
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Logged in as: {clientEmail}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold text-sm transition-colors shadow hover:shadow-lg hover:shadow-red-900/30"
                         >
                        Log Out
                    </button>
                </div>
                {/* --- End of Header Update --- */}

                {/* --- Summary Cards remain the same --- */}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"> {/* Adjusted grid for potentially 4 cards */}
                    
                    <div className="bg-gradient-to-br from-blue-500/20 to-slate-800 p-5 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Active Orders</p>
                        <p className="text-3xl font-bold text-white">{activeOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-slate-800 p-5 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Completed Orders</p>
                        <p className="text-3xl font-bold text-white">{completedOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-slate-800 p-5 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-white">{orders.length}</p>
                    </div>
                    {/* Ensure total_price is selected in the query above for this card */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-slate-800 p-5 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Approx. Total Spent</p>
                        <p className="text-3xl font-bold text-white">{totalSpent.toFixed(2)} MAD</p>
                    </div>
                    {/* Added Shortlist Button */}
                    <Link
                    to="/my-shortlist"
                    className="order-first sm:order-none w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold text-sm transition-colors shadow hover:shadow-lg hover:shadow-purple-900/30 flex items-center justify-center gap-2"
                    >
                    <Heart size={16} /> My Shortlist
                    </Link>

                </div>

                {/* --- Order List remains the same --- */}
                <div className="bg-slate-800 rounded-lg border border-slate-700">
                    <div className="space-y-4 p-4">
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <Link
                                    to={`/order/${order.id}`}
                                    key={order.id}
                                    className="block bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600 transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex-grow">
                                            <p className="font-bold text-lg text-white mb-1">Order #{order.order_id_string}</p>
                                            <p className="text-sm text-slate-400">
                                                Actor: <span className="text-slate-300">{order.actors[0]?.ActorName || 'N/A'}</span>
                                            </p>
                                             <p className="text-xs text-slate-500 mt-2">
                                                 Created: {new Date(order.created_at).toLocaleDateString()}
                                             </p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                             <span className={`inline-block px-4 py-1.5 text-xs font-semibold tracking-wider rounded-full ${
                                                 order.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                                                 order.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' :
                                                 order.status === 'Awaiting Payment' ? 'bg-orange-500/20 text-orange-300' :
                                                 'bg-yellow-500/20 text-yellow-300' // Default/Pending Approval
                                             }`}>
                                             {order.status}
                                         </span>
                                        </div>
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