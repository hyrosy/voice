// In src/pages/AdminDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Order {
  id: string;
  order_id_string: string;
  client_name: string;
  status: string;
  created_at: string;
  actors: { ActorName: string }; // For joined data
}

const AdminDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminAndFetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/actor-auth'); // Not logged in
                return;
            }

            // Check if the logged-in user has the 'admin' role
            const { data: profile } = await supabase.from('actors').select('role').eq('user_id', user.id).single();
            if (profile?.role !== 'admin') {
                navigate('/dashboard'); // Not an admin, send to regular dashboard
                return;
            }

            // If user is an admin, fetch ALL orders and the related actor's name
            const { data: orderData, error } = await supabase
                .from('orders')
                .select('*, actors(ActorName)') // This joins the tables!
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching orders:", error);
            } else if (orderData) {
                setOrders(orderData as Order[]);
            }
            setLoading(false);
        };

        checkAdminAndFetchOrders();
    }, [navigate]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        // Optimistically update the UI for a faster feel
        const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);

        // Update the database
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            console.error("Failed to update status:", error);
            // Revert UI change on failure if needed
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Admin Panel...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard: All Orders</h1>
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-700">
                            <tr>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Actor</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b border-slate-700">
                                <td className="p-4 font-mono text-sm text-slate-300">{order.order_id_string}</td>
                                <td className="p-4 text-slate-300">{order.client_name}</td>
                                <td className="p-4 text-slate-300">{order.actors?.ActorName || 'N/A'}</td>
                                <td className="p-4">
                                    {/* The select dropdown already has its own styling, so it's fine */}
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        className="bg-slate-600 border border-slate-500 rounded-md p-2 text-white"
                                    >
                                        <option value="Awaiting Payment">Awaiting Payment</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;