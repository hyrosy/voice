// In src/pages/ClientOrderPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Download, Check, RotateCcw, Banknote, FileText, Package, MessageSquare } from 'lucide-react';
import AccordionItem from '../components/AccordionItem'; // Import our new component
import ChatBox from '../components/ChatBox';
import emailjs from '@emailjs/browser';

// Define the shape of our data for this page
interface Order {
  client_email: any;
  id: string;
  order_id_string: string;
  client_name: string;
  status: string;
  total_price: number;
  script: string;
  revisions_used: number;
  actors: {
      ActorEmail: any; ActorName: string, revisions_allowed: number 
};
  deliveries: { file_url: string, created_at: string }[];
}
const ClientOrderPage = () => {
    const { orderId } = useParams<{ orderId: string }>(); // Get the ID from the URL
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // --- NEW: State to check if the user is logged in ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
// State to manage which accordion sections are open
    const [openSections, setOpenSections] = useState({
        payment: true,
        script: false,
        deliveries: true,
        communication: true
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchOrder = async () => {
        // --- NEW: Check for a user session ---
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsLoggedIn(true);
        }
                if (!orderId) {
                setError('No order ID provided.');
                setLoading(false);
                return;
            }

            // Fetch the order AND its related actor and deliveries in one go!
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    actors ( ActorName, revisions_allowed ),
                    deliveries ( file_url, created_at )
                `)
                .eq('id', orderId)
                .order('created_at', { foreignTable: 'deliveries', ascending: false }) // Get latest delivery first
                .single();

            if (error) {
                setError('Order not found or you do not have permission to view it.');
                console.error(error);
            } else {
                setOrder(data);
            }
            setLoading(false);
        };


useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const handleApproval = async () => {
        if (!order) return;
        await supabase.from('orders').update({ status: 'Completed' }).eq('id', order.id);
        fetchOrder(); // Refresh data
    };

    const handleRevisionRequest = async () => {
        if (!order) return;
        const newRevisionCount = order.revisions_used + 1;
        await supabase.from('orders').update({ status: 'In Progress', revisions_used: newRevisionCount }).eq('id', order.id);

        // --- THIS IS THE NOTIFICATION PART ---
    const emailParams = {
        orderId: order.order_id_string,
        actorName: order.actors.ActorName,
        actorEmail: order.actors.ActorEmail, // Fetched from the joined 'actors' table
        clientName: order.client_name,
    };

    emailjs.send(
        'service_r3pvt1s',
        'template_w9k1a08', // The template for the actor
        emailParams,
        'I51tDIHsXYKncMQpO'
    ).catch(err => console.error("Failed to send revision email:", err));
    // --- END ---    

        fetchOrder(); // Refresh data
    };



    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Your Order...</div>;
    }

    if (error || !order) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">{error || 'Could not load order.'}</div>;
    }

    const latestDelivery = order.deliveries?.[0];
    const canRequestRevision = order.revisions_used < order.actors.revisions_allowed;

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* --- Left Column (Main Content) --- */}
                <div className="lg:col-span-3 space-y-8">
                    {/* 1. Main Order Summary Card with Conditional CTA */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                        <h1 className="text-3xl font-bold text-white mb-2">Order #{order.order_id_string}</h1>
                        <p className="text-slate-400 mb-6">For voice actor: <span className="font-semibold text-white">{order.actors.ActorName}</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-400">Status</p>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block mt-1 ${order.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Total Price</p>
                                <p className="font-bold text-white text-lg">{order.total_price.toFixed(2)} MAD</p>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-slate-700 pt-4 text-center">
                            {!isLoggedIn ? (
                                <Link to="/client-auth" state={{ email: order.client_email }} className="text-purple-400 hover:text-white transition font-semibold">
                                    Create an account to track all your orders
                                </Link>
                            ) : (
                                <Link to="/client-dashboard" className="text-purple-400 hover:text-white transition font-semibold">
                                    View All Your Orders
                                </Link>
                            )}
                        </div>
                    </div>
                    

                    {/* --- 2. Accordion Sections for All Other Details --- */}
                <div className="space-y-4">
                    {/* Payment Details Accordion */}
                    <AccordionItem title="Payment Details" icon={<Banknote size={20}/>} isOpen={openSections.payment} onToggle={() => toggleSection('payment')}>
                        <p className="text-slate-300 mb-4">Please complete the payment to start the project. Use your Order ID as the payment reference.</p>
                        <div className="bg-slate-900 p-4 rounded-lg text-sm">
                            <p><span className="font-bold text-slate-400">Bank Name:</span> Attijariwafa Bank</p>
                            <p><span className="font-bold text-slate-400">Account Holder:</span> UCPMAROC</p>
                            <p><span className="font-bold text-slate-400">IBAN:</span> MA64 0077 8000 0219 5000 0005 47</p>
                        </div>
                    </AccordionItem>

                    {/* Script Accordion */}
                    <AccordionItem title="Script" icon={<FileText size={20}/>} isOpen={openSections.script} onToggle={() => toggleSection('script')}>
                        <div className="bg-slate-900 p-4 rounded-lg max-h-60 overflow-y-auto">
                           <p className="text-slate-300 whitespace-pre-wrap">{order.script}</p>
                        </div>
                    </AccordionItem>

                    {/* --- CORRECTED: Single Deliveries Accordion --- */}
                        <AccordionItem title="Deliveries" icon={<Package size={20}/>} isOpen={openSections.deliveries} onToggle={() => toggleSection('deliveries')}>
                            {order.deliveries && order.deliveries.length > 0 ? (
                                <div className="space-y-6">
                                    {order.deliveries.map((delivery, index) => (
                                      <div key={index} className="bg-slate-900 p-4 rounded-lg">
                                        <p className="font-semibold text-lg mb-2 text-white">
                                            Version {order.deliveries.length - index} 
                                            {index === 0 && <span className="text-xs text-blue-400 ml-2">(Latest)</span>}
                                        </p>
                                        <audio controls src={delivery.file_url} className="w-full mb-3"></audio>
                                        <a href={delivery.file_url} download className="text-sm text-blue-400 hover:underline">
                                            Download Version {order.deliveries.length - index}
                                        </a>
                                      </div>
                                    ))}
                            
                            {/* 2. Show the action buttons only for the latest delivery and if status is 'Pending Approval' */}
                            {order.status === 'Pending Approval' && (
                                <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Review & Confirm Latest Delivery</h3>
                                    <div className="flex gap-4">
                                        <button onClick={handleApproval} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold">
                                            <Check size={20} /> Accept Delivery
                                        </button>
                                        {canRequestRevision ? (
                                            <button onClick={handleRevisionRequest} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold">
                                                <RotateCcw size={20} /> Request Revision ({order.actors.revisions_allowed - order.revisions_used} left)
                                            </button>
                                        ) : (
                                            <div className="w-full text-center p-3 bg-slate-700 rounded-lg">
                                                <p className="text-slate-400 text-sm">No revisions remaining.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center">The actor has not delivered the files yet.</p>
                    )}
                    </AccordionItem>
                </div>
                </div>


                {/* --- Right Column (Chat) --- */}
                <div className="lg:col-span-2">
                        {/* The sticky class keeps the chat in view on scroll for desktop */}
                    <div className="sticky top-24">
                        <ChatBox orderId={order.id} userRole="client" />
                    </div>
                </div>

            </div>
            
                
            </div>
    );
};

export default ClientOrderPage;