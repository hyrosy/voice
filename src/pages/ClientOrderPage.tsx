// In src/pages/ClientOrderPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// Added Bell icon
import { Download, Check, RotateCcw, Banknote, FileText, Package, MessageSquare, Copy, CreditCard, CheckCircle, ChevronDown, ChevronUp, Star, Bell } from 'lucide-react';
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
  payment_method: 'stripe' | 'bank' | null;
  script: string;
  revisions_used: number;
  actor_id: string; // Added actor_id
  actors: {
      id: string; // Added actor id
      ActorEmail: any;
      ActorName: string;
      revisions_allowed: number;
      // Add fields needed for conditional display
      direct_payment_enabled?: boolean;
      bank_name?: string | null;
      bank_holder_name?: string | null;
      bank_iban?: string | null;
      bank_account_number?: string | null;
  };
  deliveries: { file_url: string, created_at: string }[];
}

// --- NEW: Interface for Review Data ---
interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}


// --- ADD BANK DETAILS ARRAY ---
const bankOptions = [
    { name: 'Attijariwafa Bank', holder: 'UCPMAROC', iban: 'MA64 0077 8000 0219 5000 0005 47', accountNumber: '0077 8000 0219 5000 0005 47' },
    { name: 'CIH Bank', holder: 'HYROSY LLC', iban: 'MA64 2307 8059 1321 2210 5711 02', accountNumber: '2307 8059 1321 2210 5711 02' },
];
// --- END BANK DETAILS ---

const ClientOrderPage = () => {
    const { orderId } = useParams<{ orderId: string }>(); // Get the ID from the URL
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [copySuccess, setCopySuccess] = useState(''); // State for copy feedback
    const [expandedBank, setExpandedBank] = useState<string | null>(bankOptions[0]?.name || null); // Default to first bank open
    const [openSections, setOpenSections] = useState({
        payment: true,
        script: false,
        deliveries: true,
        communication: true
    });
    
    // --- State for Reviews ---
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
    const [reviewMessage, setReviewMessage] = useState<string>('');
    const [existingReview, setExistingReview] = useState<Review | null>(null);
    const [isLoadingReview, setIsLoadingReview] = useState<boolean>(true);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // --- NEW: State for Mark as Paid ---
    const [notifyingAdmin, setNotifyingAdmin] = useState(false); // State for button feedback
    const [notificationMessage, setNotificationMessage] = useState(''); // State for feedback message


    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchOrderAndReview = async () => { // Renamed from fetchOrder
        setIsLoading(true);
        setIsLoadingReview(true);
        setError('');
        setExistingReview(null);

        const { data: { user } } = await supabase.auth.getUser();

        if (!orderId || !user) {
            setError('No order ID provided or user not found.');
            setLoading(false);
            setIsLoadingReview(false);
            return;
        }
        
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsLoggedIn(true);
        }

        let clientProfileId: string | null = null;
        try {
             const { data: clientProfile, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.id)
                .single();
             if (clientError) throw clientError;
             clientProfileId = clientProfile?.id ?? null;
        } catch(e) {
             console.error("Could not fetch client profile ID:", e);
        }


        // Fetch order details
        const { data, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                actors (
                    id, ActorName, ActorEmail, revisions_allowed,
                    direct_payment_enabled, bank_name, bank_holder_name, bank_iban, bank_account_number
                ),
                deliveries ( * )
            `)
            .eq('id', orderId)
            .order('created_at', { foreignTable: 'deliveries', ascending: false })
            .single();

        if (orderError) {
            setError('Order not found or you do not have permission.');
            console.error(orderError);
            setLoading(false);
            setIsLoadingReview(false);
            return;
        }

        setOrder(data);

        // Check for existing review
        if (data && data.status === 'Completed' && clientProfileId) {
             try {
                const { data: reviewData, error: reviewError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('order_id', orderId)
                    .eq('client_id', clientProfileId)
                    .maybeSingle();

                if (reviewError) {
                    console.error("Error checking for existing review:", reviewError);
                } else if (reviewData) {
                    setExistingReview(reviewData as Review);
                }
             } catch (e) {
                 console.error("Exception checking review:", e);
             }
        }

        setLoading(false);
        setIsLoadingReview(false);
    };

     useEffect(() => {
        fetchOrderAndReview();
    }, [orderId]);

    const handleApproval = async () => {
        if (!order) return;
        await supabase.from('orders').update({ status: 'Completed' }).eq('id', order.id);
        fetchOrderAndReview(); // Refresh data
    };

    const handleRevisionRequest = async () => {
        if (!order) return;
        const newRevisionCount = order.revisions_used + 1;
        await supabase.from('orders').update({ status: 'In Progress', revisions_used: newRevisionCount }).eq('id', order.id);

        const emailParams = {
            orderId: order.order_id_string,
            actorName: order.actors.ActorName,
            actorEmail: order.actors.ActorEmail,
            clientName: order.client_name,
        };

        emailjs.send(
            'service_r3pvt1s',
            'template_w9k1a08',
            emailParams,
            'I51tDIHsXYKncMQpO'
        ).catch(err => console.error("Failed to send revision email:", err));

        fetchOrderAndReview(); // Refresh data
    };

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(`${fieldName} copied!`);
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            setCopySuccess(`Failed to copy ${fieldName}.`);
             setTimeout(() => setCopySuccess(''), 2000);
        }
    };

     const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order || rating === 0) {
            setReviewMessage('Please select a star rating.');
            return;
        }
        if (!order.actors?.id) {
             setReviewMessage('Cannot submit review: Actor ID missing.');
             return;
        }

         const { data: { user } } = await supabase.auth.getUser();
         if (!user) { setReviewMessage('You must be logged in.'); return; }
         const { data: clientProfile } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
         if (!clientProfile?.id) { setReviewMessage('Could not verify client profile.'); return; }


        setIsSubmittingReview(true);
        setReviewMessage('');

        try {
            const { data: newReview, error } = await supabase
                .from('reviews')
                .insert({
                    order_id: order.id,
                    client_id: clientProfile.id,
                    actor_id: order.actors.id,
                    rating: rating,
                    comment: comment.trim() || null
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                     setReviewMessage('You have already submitted a review for this order.');
                     fetchOrderAndReview();
                } else {
                    throw error;
                }
            } else {
                setExistingReview(newReview as Review);
                setReviewMessage('Review submitted successfully! Thank you.');
            }
        } catch (error) {
            const err = error as Error;
            console.error("Error submitting review:", err);
            setReviewMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // --- NEW: Mark as Paid Handler ---
    const handleMarkAsPaid = async () => {
        if (!order) return;
        setNotifyingAdmin(true);
        setNotificationMessage(''); // Clear previous message

        const isDirectToActor = order.actors?.direct_payment_enabled === true;
        const newStatus = isDirectToActor ? 'Awaiting Actor Confirmation' : 'Awaiting Admin Confirmation';
        
        // CHOOSE TEMPLATE IDs: Create these in your EmailJS account
        const templateId = isDirectToActor ? 'template_my3996b' : '';
        
        // SET RECIPIENT EMAIL: Replace with your actual admin email
        const recipientEmail = isDirectToActor ? order.actors.ActorEmail : 'support@ucpmaroc.com'; 

        // 1. Update the order status in Supabase
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order.id);

        if (updateError) {
            console.error("Failed to update order status:", updateError);
            setNotificationMessage(`Error: ${updateError.message}`);
            setNotifyingAdmin(false);
            return;
        }

        // 2. Send the notification email
        const emailParams = {
            clientName: order.client_name,
            clientEmail: order.client_email, // Include client email
            orderIdString: order.order_id_string,
            orderUUID: order.id,
            recipientEmail: recipientEmail, // For the template
            actorName: isDirectToActor ? order.actors.ActorName : null, // Pass actor name only if relevant
        };

        try {
            await emailjs.send(
                'service_r3pvt1s', // Your Service ID
                templateId, // The correct new template
                emailParams,
                'I51tDIHsXYKncMQpO' // Your Public Key
            );
            
            // 3. Update UI
            setNotificationMessage(isDirectToActor ? 'Actor notified successfully!' : 'Admin notified successfully!');
            fetchOrderAndReview(); // Re-fetch order to get new status and hide payment UI

        } catch (err) {
            console.error("Failed to send notification:", err);
            setNotificationMessage('Status updated, but failed to send notification.');
        } finally {
            setNotifyingAdmin(false);
        }
    };
    // --- END Mark as Paid Handler ---

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
                    {/* 1. Main Order Summary Card */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                        <h1 className="text-3xl font-bold text-white mb-2">Order #{order.order_id_string}</h1>
                        <p className="text-slate-400 mb-6">For voice actor: <span className="font-semibold text-white">{order.actors.ActorName}</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-400">Status</p>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block mt-1 ${
                                     order.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                     (order.status === 'Awaiting Admin Confirmation' || order.status === 'Awaiting Actor Confirmation') ? 'bg-yellow-500/20 text-yellow-400' :
                                     order.status === 'Awaiting Payment' ? 'bg-orange-500/20 text-orange-400' :
                                     'bg-blue-500/20 text-blue-400' // Default for In Progress, etc.
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Total Price</p>
                                <p className="font-bold text-white text-lg">{order.total_price.toFixed(2)} MAD</p>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-slate-700 pt-4 text-center">
                            {isLoggedIn ? (
                                <Link to="/client-dashboard" className="text-purple-400 hover:text-white transition font-semibold">
                                    View All Your Orders
                                </Link>
                            ) : (
                                <Link to="/client-auth" state={{ email: order.client_email }} className="text-purple-400 hover:text-white transition font-semibold">
                                    Create an account to track all your orders
                                </Link>
                            )}
                        </div>
                    </div>
                    

                    {/* --- 2. Accordion Sections for All Other Details --- */}
                    <div className="space-y-4">
                        {/* --- Payment Details Accordion --- */}
                        <AccordionItem title="Payment Details" icon={<Banknote size={20}/>} isOpen={openSections.payment} onToggle={() => toggleSection('payment')}>
                            
                            {/* 1. If Paid via Stripe */}
                            {order.payment_method === 'stripe' && (
                                <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-lg">
                                     <CreditCard size={20} className="text-blue-400"/>
                                     <div>
                                         <p className="font-semibold text-white">Paid via Card (Stripe)</p>
                                         <p className="text-sm text-slate-400">Payment has been processed.</p>
                                     </div>
                                 </div>
                            )}

                            {/* 2. If Bank Transfer and ALREADY Confirmed (In Progress, Completed, etc.) */}
                            {order.payment_method === 'bank' && !['Awaiting Payment', 'Awaiting Admin Confirmation', 'Awaiting Actor Confirmation'].includes(order.status) && (
                                 <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-lg">
                                     <CheckCircle size={20} className="text-green-400"/>
                                     <div>
                                         <p className="font-semibold text-white">Payment Received</p>
                                         <p className="text-sm text-slate-400">Bank transfer confirmed.</p>
                                     </div>
                                 </div>
                            )}

                             {/* 3. If Bank Transfer and AWAITING Payment */}
                            {order.payment_method === 'bank' && order.status === 'Awaiting Payment' && (
                                <div className="space-y-4">
                                     <p className="text-slate-300">Please complete the payment using the details below. Use your Order ID (<strong className="text-white">{order.order_id_string}</strong>) as the payment reference.</p>
                                     <button onClick={() => copyToClipboard(order.order_id_string, 'Order ID')} className="mb-2 text-xs text-blue-400 hover:underline inline-flex items-center gap-1"> <Copy size={12}/> Copy Order ID </button>

                                     {/* Check if Actor Direct Payment is Enabled */}
                                     {order.actors?.direct_payment_enabled ? (
                                         // Show ACTOR's Bank Details
                                         <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-lg text-sm space-y-2 relative text-slate-300">
                                             <p className="text-xs text-purple-300 font-semibold mb-2">Please pay the actor directly:</p>
                                             {/* ... (Actor bank details with copy buttons) ... */}
                                             <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-slate-400 w-28 inline-block">Bank Name:</strong> {order.actors.bank_name || 'N/A'}</span>
                                                 {order.actors.bank_name && <button onClick={() => copyToClipboard(order.actors.bank_name!, 'Bank Name')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                             <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-slate-400 w-28 inline-block">Account Holder:</strong> {order.actors.bank_holder_name || 'N/A'}</span>
                                                  {order.actors.bank_holder_name && <button onClick={() => copyToClipboard(order.actors.bank_holder_name!, 'Account Holder')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                              <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-slate-400 w-28 inline-block">IBAN:</strong> {order.actors.bank_iban || 'N/A'}</span>
                                                 {order.actors.bank_iban && <button onClick={() => copyToClipboard(order.actors.bank_iban!, 'IBAN')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                             <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-slate-400 w-28 inline-block">Account No (RIB):</strong> {order.actors.bank_account_number || 'N/A'}</span>
                                                  {order.actors.bank_account_number && <button onClick={() => copyToClipboard(order.actors.bank_account_number!, 'Account Number')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                             {copySuccess && (
                                                 <p className="absolute -bottom-5 right-0 text-xs text-green-400 transition-opacity duration-300">{copySuccess}</p>
                                             )}
                                         </div>
                                     ) : (
                                         // Show AGENCY's Bank Details (Nested Accordion)
                                         <div className="space-y-2 relative">
                                              <p className="text-xs text-slate-400 font-semibold mb-2">Please pay the agency using one of these options:</p>
                                             {bankOptions.map((bank) => {
                                                 const isOpen = expandedBank === bank.name;
                                                 return (
                                                     <div key={bank.name} className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                                                         <button onClick={() => setExpandedBank(isOpen ? null : bank.name)} className="w-full flex justify-between items-center p-3 text-left hover:bg-slate-800 transition-colors">
                                                               <span className="font-semibold text-white">{bank.name}</span>
                                                               {isOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                                                         </button>
                                                         {isOpen && (
                                                             <div className="p-3 border-t border-slate-700 text-sm space-y-2 text-slate-300 animate-in fade-in duration-300">
                                                                  <div className="flex justify-between items-center group">
                                                                      <span><strong className="font-semibold text-slate-400 w-28 inline-block">Account Holder:</strong> {bank.holder}</span>
                                                                      <button onClick={() => copyToClipboard(bank.holder, 'Account Holder')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>
                                                                  </div>
                                                                  <div className="flex justify-between items-center group">
                                                                      <span><strong className="font-semibold text-slate-400 w-28 inline-block">IBAN:</strong> {bank.iban}</span>
                                                                      <button onClick={() => copyToClipboard(bank.iban, 'IBAN')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>
                                                                  </div>
                                                                  <div className="flex justify-between items-center group">
                                                                      <span><strong className="font-semibold text-slate-400 w-28 inline-block">Account No (RIB):</strong> {bank.accountNumber}</span>
                                                                      <button onClick={() => copyToClipboard(bank.accountNumber, 'Account Number')} className="p-1 text-slate-400 hover:text-white transition-colors"> <Copy size={14}/> </button>
                                                                  </div>
                                                             </div>
                                                         )}
                                                     </div>
                                                 );
                                             })}
                                             {copySuccess && (
                                                  <p className="absolute -bottom-5 right-0 text-xs text-green-400 transition-opacity duration-300">{copySuccess}</p>
                                              )}
                                         </div>
                                     )}

                                     {/* Mark as Paid Button */}
                                     <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                                          <button
                                            onClick={handleMarkAsPaid}
                                            disabled={notifyingAdmin || !!notificationMessage.includes('successfully')} // Disable if sending or already sent
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Bell size={18} /> {notifyingAdmin ? 'Notifying...' : (notificationMessage.includes('successfully') ? 'Notification Sent' : 'I Have Paid (Notify)')}
                                          </button>
                                          {notificationMessage && (
                                              <p className={`text-xs mt-2 ${notificationMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{notificationMessage}</p>
                                          )}
                                     </div>
                                 </div>
                            )}
                            
                            {/* 4. Show "Pending Confirmation" Message */}
                            {(order.status === 'Awaiting Admin Confirmation' || order.status === 'Awaiting Actor Confirmation') && (
                                <div className="p-4 bg-slate-900 rounded-lg text-center">
                                    <p className="font-semibold text-yellow-400">🕒 Awaiting Payment Confirmation</p>
                                    <p className="text-sm text-slate-400 mt-1">We have notified the {order.status === 'Awaiting Admin Confirmation' ? 'admin' : 'actor'}. The status will update once payment is confirmed.</p>
                                </div>
                            )}

                            {/* Fallback if no payment method (should not happen in this flow) */}
                            {!order.payment_method && (
                                 <p className="text-slate-500">Payment details unavailable.</p>
                            )}
                        </AccordionItem>

                        {/* Script Accordion */}
                        <AccordionItem title="Script" icon={<FileText size={20}/>} isOpen={openSections.script} onToggle={() => toggleSection('script')}>
                            <div className="bg-slate-900 p-4 rounded-lg max-h-60 overflow-y-auto">
                               <p className="text-slate-300 whitespace-pre-wrap">{order.script}</p>
                            </div>
                        </AccordionItem>

                        {/* Deliveries Accordion */}
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

                    {/* --- Review Section (Only if order is Completed) --- */}
                    {order.status === 'Completed' && (
                        <div className="p-5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                                <Star size={18}/> {existingReview ? 'Your Review' : 'Leave a Review'}
                            </h2>
                            {isLoadingReview ? (
                                <p className="text-slate-400 text-sm">Loading review status...</p>
                            ) : existingReview ? (
                                // Display Existing Review
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={20}
                                                className={`cursor-default ${
                                                    star <= existingReview.rating ? 'text-yellow-400 fill-current' : 'text-slate-600'
                                                }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-sm text-slate-400">({existingReview.rating}/5 stars)</span>
                                    </div>
                                    {existingReview.comment && (
                                         <p className="text-slate-300 bg-slate-700/50 p-3 rounded text-sm italic">"{existingReview.comment}"</p>
                                    )}
                                     <p className="text-xs text-slate-500">Reviewed on: {new Date(existingReview.created_at).toLocaleDateString()}</p>
                                </div>
                            ) : (
                                // Show Review Form
                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Your Rating *</label>
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    type="button"
                                                    key={star}
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    className="p-1 text-slate-600 hover:text-yellow-400 transition-colors"
                                                >
                                                    <Star
                                                        size={24}
                                                        className={`${
                                                            star <= (hoverRating || rating) ? 'text-yellow-400 fill-current' : ''
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                         <label htmlFor="reviewComment" className="block text-sm font-medium text-slate-300 mb-1">Your Comment (Optional)</label>
                                         <textarea
                                            id="reviewComment"
                                            rows={4}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Tell us about your experience..."
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="text-right">
                                         {reviewMessage && (
                                             <p className={`text-sm mb-2 text-center ${reviewMessage.includes('Error') || reviewMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{reviewMessage}</p>
                                         )}
                                         <button
                                            type="submit"
                                            disabled={isSubmittingReview || rating === 0}
                                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                         </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>


                {/* --- Right Column (Chat) --- */}
                <div className="lg:col-span-2">
                     <div className="sticky top-24 bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 overflow-hidden">
                         {/* Chat Header/Toggle Button */}
                         <button
                            onClick={() => setIsChatVisible(!isChatVisible)}
                            className="w-full flex justify-between items-center p-4 text-left bg-slate-800 hover:bg-slate-700/50 transition-colors"
                        >
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><MessageSquare size={18}/> Communication</h2>
                            {isChatVisible ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                        </button>

                        {/* Conditionally Render ChatBox */}
                        {isChatVisible && (
                             <div className="animate-in fade-in duration-300"> {/* Optional animation */}
                                 <ChatBox orderId={order.id} userRole="client" />
                             </div>
                        )}
                     </div>
                </div>

            </div>
        </div>
    );
};

export default ClientOrderPage;