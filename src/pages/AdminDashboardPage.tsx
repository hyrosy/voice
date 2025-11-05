import React, { useState, useEffect, useCallback, useMemo } from 'react'; // <-- Import useMemo
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle, Clock, ListOrdered, Hourglass, Banknote, ArrowUpDown, Filter, X as XIcon, Search, Users, AlertTriangle } from 'lucide-react'; // <-- Add Search here
import emailjs from '@emailjs/browser';
import { Link } from 'react-router-dom';

// Updated Interface
interface Order {
  id: string;
  order_id_string: string;
  client_name: string;
  status: string;
  created_at: string;
  total_price: number; // Added
  payment_method: 'stripe' | 'bank' | null; // Added
  actors: {
       ActorName: string;
       ActorEmail?: string; // Add optional ActorEmail
   };  // Add actor_email if needed for notifications
  // actors: { ActorName: string, ActorEmail?: string };
}

// Define possible sort keys and directions
type SortKey = 'created_at' | 'total_price' | 'client_name' | 'actor_name';
type SortDirection = 'asc' | 'desc';

const AdminDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [message, setMessage] = useState(''); // For feedback messages
    const navigate = useNavigate();

    const totalOrders = orders.length;
    const awaitingPaymentOrders = orders.filter(o => o.status === 'Awaiting Payment').length;
    const awaitingAdminConfirmation = orders.filter(o => o.status === 'Awaiting Admin Confirmation').length;
    const inProgressOrders = orders.filter(o => o.status === 'In Progress' || o.status === 'Pending Approval').length; // Combine these
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    // Optional: Calculate total revenue if needed (ensure total_price is selected in fetchData)
    // const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'Completed' ? (o.total_price || 0) : 0), 0);
    // --- END CALCULATIONS ---

    // --- NEW: State for Filters ---
    const [filterStatus, setFilterStatus] = useState<string>('all'); // e.g., 'all', 'In Progress', 'Awaiting Payment'
    const [filterPayment, setFilterPayment] = useState<string>('all'); // e.g., 'all', 'bank', 'stripe'
    const [filterSearchTerm, setFilterSearchTerm] = useState<string>(''); // For client/actor name search

    // --- NEW: State for Sorting ---
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Memoize fetchData to prevent unnecessary re-renders if used elsewhere
    const fetchData = useCallback(async () => {
        // --- Check Admin Role (existing logic) ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/actor-login'); // Redirect non-logged-in users
            return;
        }
        const { data: profile } = await supabase.from('actors').select('role').eq('user_id', user.id).single();
        if (profile?.role !== 'admin') {
            navigate('/dashboard'); // Redirect non-admins
            return;
        }
        // --- End Admin Role Check ---

        // Fetch ALL orders with added columns and related actor's name
        // Added: total_price, payment_method
        const { data: orderData, error } = await supabase
            .from('orders')
            .select('*, actors(ActorName, ActorEmail)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching orders:", error);
            setMessage(`Error fetching orders: ${error.message}`);
        } else if (orderData) {
            // Ensure data conforms to the Order interface
            setOrders(orderData as Order[]);
        }
        setLoading(false);
    }, [navigate]); // Add navigate to dependency array

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Use fetchData in dependency array

    // Existing function to handle general status changes via dropdown
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setMessage(''); // Clear previous message
        const originalOrders = [...orders]; // Keep backup in case of error
        // Optimistic UI update
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            console.error("Failed to update status:", error);
            setMessage(`Failed to update status: ${error.message}`);
            setOrders(originalOrders); // Revert UI on failure
        } else {
             setMessage(`Order status updated to ${newStatus}.`);
             // Optionally trigger notifications here
        }
    };

    // --- NEW: Function to handle Bank Payment Approval ---
    const handlePaymentApproval = async (orderId: string) => {
        setMessage('');
        const originalOrders = [...orders];
        // Find the specific order being approved to get details for email
        const orderToApprove = originalOrders.find(o => o.id === orderId);

        if (!orderToApprove) {
            setMessage('Error: Could not find order details.');
            return;
        }

        // Optimistic update
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: 'In Progress' } : o));

        const { error } = await supabase
            .from('orders')
            .update({ status: 'In Progress' })
            .match({ id: orderId, status: 'Awaiting Admin Confirmation', payment_method: 'bank' });

        if (error) {
            console.error("Failed to approve payment:", error);
            setMessage(`Failed to approve payment: ${error.message}`);
            setOrders(originalOrders); // Revert on error
        } else {
            setMessage('Payment confirmed. Order moved to In Progress.');

            // --- Send EmailJS notification to Actor ---
            if (orderToApprove.actors?.ActorEmail) {
                const emailParams = {
                    actorName: orderToApprove.actors.ActorName,
                    actorEmail: orderToApprove.actors.ActorEmail,
                    orderIdString: orderToApprove.order_id_string,
                    clientName: orderToApprove.client_name,
                    // Add any other details the actor needs, like word count or script link
                };

                // Replace with your actual Service ID, Template ID, and Public Key
                emailjs.send(
                    'service_r3pvt1s', // Replace
                    'template_zmx5e0u', // Replace (Create this template in EmailJS)
                    emailParams,
                    'I51tDIHsXYKncMQpO' // Replace (Often initialized in App.tsx)
                )
                .then(response => {
                   console.log('Actor notification email sent!', response.status, response.text);
                   setMessage('Payment confirmed & Actor notified.'); // Update message
                })
                .catch(err => {
                   console.error('Failed to send actor notification email:', err);
                   // Update message to indicate email failure
                   setMessage('Payment confirmed, but failed to notify actor.');
                });
            } else {
                console.warn("Could not send notification: Actor email missing for order", orderToApprove.order_id_string);
                setMessage('Payment confirmed, but actor email was missing.');
            }
            // --- End EmailJS notification ---
        }
    };
    // --- End Payment Approval Function ---

    // ... rest of component (loading check, return JSX) ...

    // --- NEW: Calculate Filtered and Sorted Orders using useMemo ---
    const filteredAndSortedOrders = useMemo(() => {
        let processedOrders = [...orders];

        // Apply Filters
        if (filterStatus !== 'all') {
            processedOrders = processedOrders.filter(order => order.status === filterStatus);
        }
        if (filterPayment !== 'all') {
            processedOrders = processedOrders.filter(order => order.payment_method === filterPayment);
        }
        if (filterSearchTerm.trim() !== '') {
            const searchTermLower = filterSearchTerm.toLowerCase();
            processedOrders = processedOrders.filter(order =>
                order.client_name.toLowerCase().includes(searchTermLower) ||
                (order.actors?.ActorName && order.actors.ActorName.toLowerCase().includes(searchTermLower))
            );
        }

        // Apply Sorting
        processedOrders.sort((a, b) => {
            let valA: any;
            let valB: any;

            switch (sortKey) {
                case 'actor_name':
                    valA = a.actors?.ActorName?.toLowerCase() || '';
                    valB = b.actors?.ActorName?.toLowerCase() || '';
                    break;
                case 'client_name':
                    valA = a.client_name.toLowerCase();
                    valB = b.client_name.toLowerCase();
                    break;
                case 'total_price':
                    valA = a.total_price || 0;
                    valB = b.total_price || 0;
                    break;
                case 'created_at': // Default date sort
                default:
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
                    break;
            }

            if (valA < valB) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return processedOrders;
    }, [orders, filterStatus, filterPayment, filterSearchTerm, sortKey, sortDirection]); // Dependencies

    // --- NEW: Handle Sort Click ---
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Toggle direction if same key is clicked
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new key and default to descending (or ascending if you prefer)
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    // --- Get unique statuses and payment methods for dropdowns ---
    const uniqueStatuses = useMemo(() => ['all', ...new Set(orders.map(o => o.status))], [orders]);
    const uniquePaymentMethods = useMemo(() => ['all', ...new Set(orders.map(o => o.payment_method).filter(Boolean))], [orders]); // Filter out nulls

    // --- NEW: Function to handle row click ---
    const handleRowClick = (orderId: string) => {
        navigate(`/admin/order/${orderId}`);
    };
    // --- End row click handler ---

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading Admin Panel...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
            <div className="max-w-7xl mx-auto"> {/* Wider container */}
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard: All Orders</h1>

                {/* --- ADD SUMMARY CARDS JSX --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10"> {/* Adjusted to 5 columns */}
                    {/* Total Orders Card */}
                    <div className="bg-gradient-to-br from-slate-700/50 to-slate-800 p-5 rounded-xl borderflex items-center gap-4">
                        <div className="p-3 bg-slate-600/50 rounded-lg">
                           <ListOrdered size={24} className="text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                            <p className="text-3xl font-bold text-foreground">{totalOrders}</p>
                        </div>
                    </div>                     
                    {/* Awaiting Payment Card */}
                    <div className="bg-gradient-to-br from-orange-500/20 to-slate-800 p-5 rounded-xl borderflex items-center gap-4">
                         <div className="p-3 bg-orange-500/20 rounded-lg">
                           <Hourglass size={24} className="text-orange-300" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Awaiting Payment</p>
                            <p className="text-3xl font-bold text-foreground">{awaitingPaymentOrders}</p>
                        </div>
                    </div>
                    {/* NEW: Awaiting Admin Confirmation Card */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-slate-800 p-5 rounded-xl borderflex items-center gap-4">
                         <div className="p-3 bg-yellow-500/20 rounded-lg">
                           <AlertTriangle size={24} className="text-yellow-300" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Pending Admin</p>
                            <p className="text-3xl font-bold text-foreground">{awaitingAdminConfirmation}</p>
                        </div>
                    </div>
                     {/* In Progress Card */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-slate-800 p-5 rounded-xl borderflex items-center gap-4">
                         <div className="p-3 bg-blue-500/20 rounded-lg">
                           <Clock size={24} className="text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                            <p className="text-3xl font-bold text-foreground">{inProgressOrders}</p>
                        </div>
                    </div>
                     {/* Completed Card */}
                    <div className="bg-gradient-to-br from-green-500/20 to-slate-800 p-5 rounded-xl borderflex items-center gap-4">
                         <div className="p-3 bg-green-500/20 rounded-lg">
                           <CheckCircle size={24} className="text-green-300" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Completed</p>
                            <p className="text-3xl font-bold text-foreground">{completedOrders}</p>
                        </div>
                    </div>
                     {/* Optional Revenue Card */}
                     {/*
                     <div className="bg-gradient-to-br from-yellow-500/20 to-slate-800 p-5 rounded-xl borderflex items-center gap-4">
                         <div className="p-3 bg-yellow-500/20 rounded-lg">
                             <Banknote size={24} className="text-yellow-300" />
                         </div>
                         <div>
                             <p className="text-sm text-muted-foreground mb-1">Total Revenue (Completed)</p>
                             <p className="text-3xl font-bold text-foreground">{totalRevenue.toFixed(2)} MAD</p>
                         </div>
                     </div>
                     */}
                </div>
                 {/* --- END SUMMARY CARDS JSX --- */}
                {/* --- User Management Links --- */}
                                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                                    <Link to="/admin/actors" className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-foreground font-semibold text-sm transition-colors shadow flex items-center justify-center gap-2">
                                        <Users size={16} /> Manage Actors
                                    </Link>
                                    <Link to="/admin/clients" className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-foreground font-semibold text-sm transition-colors shadow flex items-center justify-center gap-2">
                                         <Users size={16} /> Manage Clients {/* Consider a different icon */}
                                    </Link>
                                </div>
                                {/* --- End User Management Links --- */}
                {/* Feedback Message Area */}
                {message && <p className="mb-4 p-3 bg-slate-700 rounded-md text-sm">{message}</p>}

                {/* --- NEW: Filter Controls --- */}
                <div className="mb-6 p-4 bg-card rounded-lg borderflex flex-col sm:flex-row gap-4 items-center">
                     <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Filter size={16}/> Filters:</span>
                     {/* Status Filter */}
                     <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-md p-2 text-foreground text-sm focus:ring-purple-500 focus:border-purple-500 flex-grow sm:flex-grow-0"
                    >
                         {uniqueStatuses.map(status => (
                             <option key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</option>
                         ))}
                     </select>
                     {/* Payment Filter */}
                     <select
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                         className="bg-slate-700 border border-slate-600 rounded-md p-2 text-foreground text-sm focus:ring-purple-500 focus:border-purple-500 flex-grow sm:flex-grow-0"
                     >
                         <option value="all">All Payment Methods</option>
                          {uniquePaymentMethods.map(method => (
                             <option key={method} value={method!}>{method === 'all' ? 'All Methods' : method!.charAt(0).toUpperCase() + method!.slice(1)}</option>
                         ))}
                     </select>
                     {/* Search Filter */}
                    <div className="relative flex-grow">
                         <input
                            type="text"
                            placeholder="Search Client or Actor..."
                            value={filterSearchTerm}
                            onChange={(e) => setFilterSearchTerm(e.target.value)}
                             className="bg-slate-700 border border-slate-600 rounded-md p-2 pl-8 text-foreground text-sm focus:ring-purple-500 focus:border-purple-500 w-full"
                         />
                          <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-500"/>
                         {filterSearchTerm && (
                             <button
                                onClick={() => setFilterSearchTerm('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-accent-foreground"
                                title="Clear search"
                             >
                                 <XIcon size={16}/>
                             </button>
                         )}
                     </div>
                 </div>
                 {/* --- END Filter Controls --- */}


                {/* Enhanced Order Table - Now uses filteredAndSortedOrders */}
                <div className="bg-card rounded-lg borderoverflow-x-auto">
                    <table className="w-full text-left min-w-[900px]"> {/* Increased min-width slightly */}
                        <thead className="bg-slate-700 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="p-4">Order ID</th>
                                {/* --- Clickable Date Header --- */}
                                <th className="p-4 cursor-pointer hover:bg-slate-600 transition-colors" onClick={() => handleSort('created_at')}>
                                    <span className="flex items-center gap-1">Date <ArrowUpDown size={12} /></span>
                                </th>
                                {/* --- Clickable Client Header --- */}
                                <th className="p-4 cursor-pointer hover:bg-slate-600 transition-colors" onClick={() => handleSort('client_name')}>
                                     <span className="flex items-center gap-1">Client <ArrowUpDown size={12} /></span>
                                </th>
                                {/* --- Clickable Actor Header --- */}
                                <th className="p-4 cursor-pointer hover:bg-slate-600 transition-colors" onClick={() => handleSort('actor_name')}>
                                     <span className="flex items-center gap-1">Actor <ArrowUpDown size={12} /></span>
                                </th>
                                {/* --- Clickable Price Header --- */}
                                <th className="p-4 cursor-pointer hover:bg-slate-600 transition-colors text-right" onClick={() => handleSort('total_price')}> {/* Added text-right */}
                                     <span className="flex items-center justify-end gap-1">Price (MAD) <ArrowUpDown size={12} /></span> {/* Added justify-end */}
                                </th>
                                <th className="p-4">Payment</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* --- Map over filteredAndSortedOrders --- */}
                            {filteredAndSortedOrders.map(order => (
                                // --- MODIFY: Highlight row for new status ---
                                <tr key={order.id} className={`border-btext-sm ${
                                      order.status === 'Awaiting Admin Confirmation' ? 'bg-yellow-900/30 hover:bg-yellow-900/50' : // Highlight this status
                                      order.status === 'Awaiting Actor Confirmation' ? 'bg-blue-900/30 hover:bg-blue-900/50' : // Different highlight for actor
                                      'hover:bg-accent/50'
                                    }`}
                                    onClick={() => handleRowClick(order.id)}
                                >
                                    {/* --- Table data cells --- */}
                                    {/* IMPORTANT: Wrap content, not the buttons/select, if needed for finer click control */}
                                     {/* Example: Clickable Order ID */}
                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                        {/* You could make just this part navigate, or rely on the whole row */}
                                        {order.order_id_string}
                                    </td>
                                     <td className="p-4 text-muted-foreground whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                                     <td className="p-4 text-muted-foreground">{order.client_name}</td>
                                     <td className="p-4 text-muted-foreground">{order.actors?.ActorName || 'N/A'}</td>
                                     <td className="p-4 text-muted-foreground text-right">{order.total_price?.toFixed(2) || 'N/A'}</td>
                                     <td className="p-4 text-muted-foreground capitalize">{order.payment_method || 'N/A'}</td>
                                     {/* Status Dropdown - Prevent row click */}
                                    {/* Status Dropdown */}
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(order.id, e.target.value);
                                            }}
                                            className="bg-slate-600 border border-slate-500 rounded-md p-2 text-foreground text-xs w-full"
                                        >
                                           {/* Status Options - Ensure all possible statuses are here */}
                                            <option value="Awaiting Payment">Awaiting Payment</option>
                                            <option value="Awaiting Admin Confirmation">Awaiting Admin Confirmation</option>
                                            <option value="Awaiting Actor Confirmation">Awaiting Actor Confirmation</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Pending Approval">Pending Approval</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>                                        </select>
                                    </td>
                                    <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        {/* MODIFIED: Check for new status */}
                                        {order.status === 'Awaiting Admin Confirmation' && order.payment_method === 'bank' && (
                                            <button onClick={(e) => { e.stopPropagation(); handlePaymentApproval(order.id); }}
                                                    className="bg-green-600 hover:bg-green-700 text-foreground text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1">
                                                <CheckCircle size={14} /> Confirm Payment
                                            </button>
                                        )}
                                        {/* Show placeholder if no action */}
                                        {(order.status !== 'Awaiting Admin Confirmation' || order.payment_method !== 'bank') && (
                                            <span className="text-slate-500 text-xs">-</span>
                                        )}
                                    </td>                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Empty state for filtered results */}
                    {filteredAndSortedOrders.length === 0 && (
                        <p className="text-center text-slate-500 p-8">
                            {orders.length === 0 ? 'No orders found.' : 'No orders match the current filters.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;