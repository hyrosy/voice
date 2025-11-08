// In src/pages/ClientOrderPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Download, Check, RotateCcw, Banknote, FileText, Package, MessageSquare, 
  Copy, CreditCard, CheckCircle, ChevronDown, ChevronUp, Star, Bell, Info, Send, Wallet, History
} from 'lucide-react';
import AccordionItem from '../components/AccordionItem';
import ChatBox from '../components/ChatBox';
import emailjs from '@emailjs/browser';

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckoutForm from '../components/StripeCheckoutForm';
// ---

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- 1. UPDATED Order Interface ---
interface Order {
  client_email: any;
  id: string;
  order_id_string: string;
  client_name: string;
  status: string;
  total_price: number | null; // Can be null
  payment_method: 'stripe' | 'bank' | null;
  script: string;
  revisions_used: number;
  actor_id: string;
  actors: {
      id: string;
      ActorEmail: any;
      ActorName: string;
      revisions_allowed: number;
      direct_payment_enabled?: boolean;
      bank_name?: string | null;
      bank_holder_name?: string | null;
      bank_iban?: string | null;
      bank_account_number?: string | null;
  };
  deliveries: { file_url: string, created_at: string }[];
  // New Quote Fields
  service_type: 'voice_over' | 'scriptwriting' | 'video_editing';
  offer_price: number | null;
  word_count?: number;
  usage?: string | null;
  quote_est_duration?: string | null;
  quote_video_type?: string | null;
  quote_footage_choice?: string | null;
  // NEW: Add offers array and latest_offer object
  offers: Offer[];
  latest_offer: Offer | null;
}

interface Offer {
  id: string;
  created_at: string;
  offer_title: string;
  offer_agreement: string | null;
  offer_price: number;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

// Bank details for "Awaiting Payment"
const bankOptions = [
    { name: 'Attijariwafa Bank', holder: 'UCPMAROC', iban: 'MA64 0077 8000 0219 5000 0005 47', accountNumber: '0077 8000 0219 5000 0005 47' },
    { name: 'CIH Bank', holder: 'HYROSY LLC', iban: 'MA64 2307 8059 1321 2210 5711 02', accountNumber: '2307 8059 1321 2210 5711 02' },
];

const ClientOrderPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');
    const [expandedBank, setExpandedBank] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState({
        payment: true,
        script: true,
        deliveries: true,
        communication: true,
        quote_details: true,
        offer_history: false, // Start history closed
});
    
    // Review State
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
    const [reviewMessage, setReviewMessage] = useState<string>('');
    const [existingReview, setExistingReview] = useState<Review | null>(null);
    const [isLoadingReview, setIsLoadingReview] = useState<boolean>(true);
    const [isChatVisible, setIsChatVisible] = useState(true);
    
    // --- 2. NEW Payment State ---
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank' | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [notifyingAdmin, setNotifyingAdmin] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };


    // --- 3. UPDATED fetchOrderAndReview ---
    const fetchOrderAndReview = useCallback(async () => {
         if (!orderId) {
             setError('No order ID provided.');
             setLoading(false);
             return;
         }

         const { data: orderData, error: orderError } = await supabase
             .from('orders')
             .select(`
                *,
                actors ( id, ActorName, ActorEmail, revisions_allowed, direct_payment_enabled, bank_name, bank_holder_name, bank_iban, bank_account_number ),
                deliveries ( file_url, created_at ),
                offers ( * )
             `)
             .eq('id', orderId)
             .order('created_at', { foreignTable: 'deliveries', ascending: false })
             .single();

         if (orderError) {
             setError('Order not found or you do not have permission.');
             console.error(orderError);
             setLoading(false);
             return;
         }

         // --- NEW: Process the offers ---
         if (orderData.offers && orderData.offers.length > 0) {
           // Sort offers to find the newest one
           orderData.offers.sort((a: Offer, b: Offer) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
           orderData.latest_offer = orderData.offers[0]; // Attach the latest one
         } else {
           orderData.latest_offer = null;
         }
         // ---

         setOrder(orderData as Order);
         setLoading(false);
         
         // Reset payment state on fetch
         setPaymentMethod(null);
         setClientSecret(null);
         setStatusMessage('');
            
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
             setIsLoadingReview(false);
             return;
         }
         setIsLoggedIn(true);

         let clientProfileId: string | null = null;
         try {
             const { data: clientProfile } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
             clientProfileId = clientProfile?.id ?? null;
         } catch(e) { /* ignore */ }
            
         if (orderData.status === 'Completed' && clientProfileId) {
             setIsLoadingReview(true);
             try {
                const { data: reviewData } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('order_id', orderId)
                    .eq('client_id', clientProfileId)
                    .maybeSingle();
                if (reviewData) setExistingReview(reviewData as Review);
             } catch (e) { console.error("Exception checking review:", e); }
             setIsLoadingReview(false);
         } else {
            setIsLoadingReview(false);
         }
    }, [orderId]); // Use useCallback

     useEffect(() => {
        fetchOrderAndReview();
    }, [fetchOrderAndReview]); // Use the memoized function



    const handleApproval = async () => {
        if (!order) return;
try {
            // --- 1. UPDATE STATUS ---
            await supabase.from('orders').update({ status: 'Completed' }).eq('id', order.id);

            // --- 2. SEND EMAIL TO ACTOR ---
            const emailParams = {
              orderId: order.order_id_string,
              actorName: order.actors.ActorName,
              actorEmail: order.actors.ActorEmail,
              clientName: order.client_name,
            };
            
            await emailjs.send(
                'service_r3pvt1s',
                'template_8708qj4', // "Order Approved (To Actor)"
                emailParams,
                'I51tDIHsXYKncMQpO'
            );
            // --- END OF EMAIL BLOCK ---

        } catch (error) {
            console.error("Error during order approval:", error);
            // Handle error (e.g., show a message to the user)
        } finally {
            fetchOrderAndReview(); // Refresh data regardless of email success
        }
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

    // --- MODIFIED: Mark as Paid Handler (Admin notification disabled) ---
    const handleMarkAsPaid = async () => {
        if (!order) return;
        setNotifyingAdmin(true);
        setNotificationMessage(''); // Clear previous message

        const isDirectToActor = order.actors?.direct_payment_enabled === true;
        const newStatus = isDirectToActor ? 'Awaiting Actor Confirmation' : 'Awaiting Admin Confirmation';
        
        // 1. Update the order status in Supabase (This still works for both)
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

        // 2. Send notification email ONLY if it's a direct-to-actor payment
        if (isDirectToActor) {
            const templateId = 'template_my3996b'; // Actor template
            const recipientEmail = order.actors.ActorEmail; // Actor email
            
            const emailParams = {
                clientName: order.client_name,
                clientEmail: order.client_email,
                orderIdString: order.order_id_string,
                orderUUID: order.id,
                recipientEmail: recipientEmail,
                actorName: order.actors.ActorName,
            };

            try {
                await emailjs.send(
                    'service_r3pvt1s', // Your Service ID
                    templateId,
                    emailParams,
                    'I51tDIHsXYKncMQpO' // Your Public Key
                );
                
                // 3. Update UI (Success for Actor)
                setNotificationMessage('Actor notified successfully!');
                fetchOrderAndReview(); // Re-fetch order to get new status

            } catch (err) {
                console.error("Failed to send actor notification:", err);
                setNotificationMessage('Status updated, but failed to notify actor.');
            }
        } else {
            // --- This is the change ---
            // It's an admin payment. We skip the email.
            console.log("Admin notification temporarily disabled. Status set to 'Awaiting Admin Confirmation'.");
            // 3. Update UI (Success for Admin, without email)
            setNotificationMessage('Payment marked, awaiting admin confirmation.');
            fetchOrderAndReview(); // Re-fetch order to get new status
        }
        
        setNotifyingAdmin(false); // Reset button state
    };
    // --- END Mark as Paid Handler ---

    // --- 4. NEW Payment Handlers (from QuoteCalculatorModal) ---
    const handlePaymentMethodChange = async (method: 'stripe' | 'bank') => {
      if (!order) return;

      // Prefer the latest offer price, fall back to the legacy offer_price field if present.
      const amount = order.latest_offer?.offer_price ?? order.offer_price ?? null;
      if (amount === null || amount === undefined) {
        setStatusMessage('No offer price available. Please contact support.');
        return;
      }
      
      setPaymentMethod(method);
      setStatusMessage('');

      if (method === 'stripe') {
        setIsSettingUpStripe(true);
        setStatusMessage('Initializing secure payment...');
        try {
          const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
            body: { amount }, // safe non-null amount variable
          });
          if (invokeError) throw invokeError;
          if (data.error) throw new Error(data.error);
          if (!data.client_secret) throw new Error("Payment client secret is missing.");
          
          setClientSecret(data.client_secret);
          setStatusMessage('');
        } catch (error) {
          setStatusMessage(`Error: ${(error as Error).message}. Please try again.`);
          setClientSecret(null);
          setPaymentMethod(null);
        } finally {
          setIsSettingUpStripe(false);
        }
      }
    };

    const onSuccessfulStripePayment = async (intentId: string) => {
      if (!order || !order.latest_offer) return;
      setStatusMessage('Processing Payment...');
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'In Progress',
            payment_method: 'stripe',
            stripe_payment_intent_id: intentId,
            total_price: order.latest_offer.offer_price // <-- SET FINAL PRICE
          })
          .eq('id', order.id);
        
        if (error) throw error;

        // Send notification email to Actor
        const emailParams = {
            actorName: order.actors.ActorName,
            actorEmail: order.actors.ActorEmail,
            orderIdString: order.order_id_string,
            clientName: order.client_name,
        };
        emailjs.send('service_r3pvt1s', 'template_zmx5e0u', emailParams, 'I51tDIHsXYKncMQpO')
          .catch(err => console.error('Failed to send actor notification email:', err));
        
        setStatusMessage('Payment Successful! The order is now In Progress.');
        fetchOrderAndReview(); // Refresh the page
      } catch (err) {
        setStatusMessage(`Error: ${(err as Error).message}. Please contact support.`);
      }
    };

    const handleBankTransferConfirmation = async () => {
      if (!order || !order.latest_offer) return;
      setStatusMessage('Updating order...');
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'Awaiting Payment',
            payment_method: 'bank',
            total_price: order.latest_offer.offer_price // <-- SET FINAL PRICE
          })
          .eq('id', order.id);
        
        if (error) throw error;
        fetchOrderAndReview();
      } catch (err) {
        setStatusMessage(`Error: ${(err as Error).message}.`);
      }
    };
    // --- END Payment Handlers ---



    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading Your Order...</div>;
    }

    if (error || !order) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-red-400">{error || 'Could not load order.'}</div>;
    }

    const latestDelivery = order.deliveries?.[0];
    const canRequestRevision = order.revisions_used < order.actors.revisions_allowed;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* --- Left Column (Main Content) --- */}
                <div className="lg:col-span-3 space-y-8">
                    {/* 1. Main Order Summary Card */}
                    <div className="bg-card/50 backdrop-blur-xl rounded-2xl p-6 border border/50">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Order #{order.order_id_string}</h1>
                        <p className="text-muted-foreground mb-6">For voice actor: <span className="font-semibold text-foreground">{order.actors.ActorName}</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
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
                                <p className="text-sm text-muted-foreground">Total Price</p>
                                <p className="font-bold text-foreground text-lg">{(order.total_price ?? 0).toFixed(2)} MAD</p>
                            </div>
                        </div>
                        <div className="mt-6 border-t pt-4 text-center">
                            {isLoggedIn ? (
                                <Link to="/client-dashboard" className="text-purple-400 hover:text-accent-foreground transition font-semibold">
                                    View All Your Orders
                                </Link>
                            ) : (
                                <Link to="/client-auth" state={{ email: order.client_email }} className="text-purple-400 hover:text-accent-foreground transition font-semibold">
                                    Create an account to track all your orders
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* --- 5. UPDATED "Accept Offer" Section --- */}
                    {order.status === 'offer_made' && order.latest_offer && (
                      <Card className="animate-in fade-in duration-300 border-primary shadow-lg shadow-primary/10">
                        <CardHeader>
                          <CardTitle className="text-2xl flex items-center gap-3">
                            <Banknote className="text-primary" />
                            Your Quote is Ready
                          </CardTitle>
                          <CardDescription>
                            {order.actors.ActorName} has sent you an offer for your "{order.service_type.replace('_', ' ')}" request.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          
                          {/* --- NEW: Offer Details --- */}
                          <Card className="bg-background">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-lg">
                                {order.latest_offer.offer_title}
                              </CardTitle>
                              <CardDescription>
                                {new Date(order.latest_offer.created_at).toLocaleString()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {order.latest_offer.offer_agreement && (
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {order.latest_offer.offer_agreement}
                                </p>
                              )}
                              <div className="text-right bg-muted p-4 rounded-lg">
                                <Label className="text-sm text-muted-foreground">Total Price</Label>
                                <p className="text-4xl font-bold text-primary">{order.latest_offer.offer_price.toFixed(2)} MAD</p>
                              </div>
                            </CardContent>
                          </Card>
                          {/* --- END: Offer Details --- */}

                            <div className="pt-6 border-t">
                            <Label className="block mb-3 font-medium">Choose Payment Method *</Label>
                            <RadioGroup value={paymentMethod || ''} onValueChange={(val) => handlePaymentMethodChange(val as 'stripe' | 'bank')}>
                              <div className="space-y-4">
                                <Label htmlFor="r-stripe" className={`p-4 border-2 rounded-lg flex items-center gap-4 cursor-pointer ${paymentMethod === 'stripe' ? 'border-primary' : 'border-border'}`}>
                                  <RadioGroupItem value="stripe" id="r-stripe" disabled={isSettingUpStripe} />
                                  <CreditCard className="w-5 h-5" />
                                  <div>
                                    <p className="font-semibold">Pay by Card (Stripe)</p>
                                    <p className="text-sm text-muted-foreground">Securely pay with your credit/debit card.</p>
                                  </div>
                                </Label>
                                <Label htmlFor="r-bank" className={`p-4 border-2 rounded-lg flex items-center gap-4 cursor-pointer ${paymentMethod === 'bank' ? 'border-primary' : 'border-border'}`}>
                                  <RadioGroupItem value="bank" id="r-bank" disabled={isSettingUpStripe} />
                                  <Wallet className="w-5 h-5" />
                                  <div>
                                    <p className="font-semibold">Bank Transfer</p>
                                    <p className="text-sm text-muted-foreground">Receive payment details and pay manually.</p>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>

                            {statusMessage && (
                              <p className={`text-center text-sm mt-4 ${statusMessage.includes('Error') ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {statusMessage}
                              </p>
                            )}

                            {paymentMethod === 'stripe' && clientSecret && !isSettingUpStripe && (
                              <div className="mt-4 pt-4 border-t">
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
                                  <StripeCheckoutForm onSuccessfulPayment={onSuccessfulStripePayment} />
                                </Elements>
                              </div>
                            )}
                            {paymentMethod === 'bank' && (
                              <Button onClick={handleBankTransferConfirmation} className="w-full mt-4" size="lg">
                                Accept & Get Bank Details
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {/* --- END: Accept Offer Section --- */}                    













                    {/* --- 2. Accordion Sections for All Other Details --- */}
                    <div className="space-y-4">
                        {/* --- Payment Details Accordion --- */}
                        <AccordionItem title="Payment Details" icon={<Banknote size={20}/>} isOpen={openSections.payment} onToggle={() => toggleSection('payment')}>
                            
                            {/* 1. If Paid via Stripe */}
                            {order.payment_method === 'stripe' && (
                                <div className="flex items-center gap-3 bg-background p-4 rounded-lg">
                                     <CreditCard size={20} className="text-blue-400"/>
                                     <div>
                                         <p className="font-semibold text-foreground">Paid via Card (Stripe)</p>
                                         <p className="text-sm text-muted-foreground">Payment has been processed.</p>
                                     </div>
                                 </div>
                            )}

                            {/* 2. If Bank Transfer and ALREADY Confirmed (In Progress, Completed, etc.) */}
                            {order.payment_method === 'bank' && !['Awaiting Payment', 'Awaiting Admin Confirmation', 'Awaiting Actor Confirmation'].includes(order.status) && (
                                 <div className="flex items-center gap-3 bg-background p-4 rounded-lg">
                                     <CheckCircle size={20} className="text-green-400"/>
                                     <div>
                                         <p className="font-semibold text-foreground">Payment Received</p>
                                         <p className="text-sm text-muted-foreground">Bank transfer confirmed.</p>
                                     </div>
                                 </div>
                            )}

                             {/* 3. If Bank Transfer and AWAITING Payment */}
                            {order.payment_method === 'bank' && order.status === 'Awaiting Payment' && (
                                <div className="space-y-4">
                                     <p className="text-muted-foreground">Please complete the payment using the details below. Use your Order ID (<strong className="text-foreground">{order.order_id_string}</strong>) as the payment reference.</p>
                                     <button onClick={() => copyToClipboard(order.order_id_string, 'Order ID')} className="mb-2 text-xs text-blue-400 hover:underline inline-flex items-center gap-1"> <Copy size={12}/> Copy Order ID </button>

                                     {/* Check if Actor Direct Payment is Enabled */}
                                     {order.actors?.direct_payment_enabled ? (
                                         // Show ACTOR's Bank Details
                                         <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-lg text-sm space-y-2 relative text-muted-foreground">
                                             <p className="text-xs text-purple-300 font-semibold mb-2">Please pay the actor directly:</p>
                                             {/* ... (Actor bank details with copy buttons) ... */}
                                             <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-muted-foreground w-28 inline-block">Bank Name:</strong> {order.actors.bank_name || 'N/A'}</span>
                                                 {order.actors.bank_name && <button onClick={() => copyToClipboard(order.actors.bank_name!, 'Bank Name')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                             <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-muted-foreground w-28 inline-block">Account Holder:</strong> {order.actors.bank_holder_name || 'N/A'}</span>
                                                  {order.actors.bank_holder_name && <button onClick={() => copyToClipboard(order.actors.bank_holder_name!, 'Account Holder')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                              <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-muted-foreground w-28 inline-block">IBAN:</strong> {order.actors.bank_iban || 'N/A'}</span>
                                                 {order.actors.bank_iban && <button onClick={() => copyToClipboard(order.actors.bank_iban!, 'IBAN')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                             <div className="flex justify-between items-center group">
                                                 <span><strong className="font-semibold text-muted-foreground w-28 inline-block">Account No (RIB):</strong> {order.actors.bank_account_number || 'N/A'}</span>
                                                  {order.actors.bank_account_number && <button onClick={() => copyToClipboard(order.actors.bank_account_number!, 'Account Number')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>}
                                             </div>
                                             {copySuccess && (
                                                 <p className="absolute -bottom-5 right-0 text-xs text-green-400 transition-opacity duration-300">{copySuccess}</p>
                                             )}
                                         </div>
                                     ) : (
                                         // Show AGENCY's Bank Details (Nested Accordion)
                                         <div className="space-y-2 relative">
                                              <p className="text-xs text-muted-foreground font-semibold mb-2">Please pay the agency using one of these options:</p>
                                             {bankOptions.map((bank) => {
                                                 const isOpen = expandedBank === bank.name;
                                                 return (
                                                     <div key={bank.name} className="bg-background rounded-lg border border overflow-hidden">
                                                         <button onClick={() => setExpandedBank(isOpen ? null : bank.name)} className="w-full flex justify-between items-center p-3 text-left hover:bg-card transition-colors">
                                                               <span className="font-semibold text-foreground">{bank.name}</span>
                                                               {isOpen ? <ChevronUp size={18} className="text-muted-foreground"/> : <ChevronDown size={18} className="text-muted-foreground"/>}
                                                         </button>
                                                         {isOpen && (
                                                             <div className="p-3 border-t text-sm space-y-2 text-muted-foreground animate-in fade-in duration-300">
                                                                  <div className="flex justify-between items-center group">
                                                                      <span><strong className="font-semibold text-muted-foreground w-28 inline-block">Account Holder:</strong> {bank.holder}</span>
                                                                      <button onClick={() => copyToClipboard(bank.holder, 'Account Holder')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>
                                                                  </div>
                                                                  <div className="flex justify-between items-center group">
                                                                      <span><strong className="font-semibold text-muted-foreground w-28 inline-block">IBAN:</strong> {bank.iban}</span>
                                                                      <button onClick={() => copyToClipboard(bank.iban, 'IBAN')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>
                                                                  </div>
                                                                  <div className="flex justify-between items-center group">
                                                                      <span><strong className="font-semibold text-muted-foreground w-28 inline-block">Account No (RIB):</strong> {bank.accountNumber}</span>
                                                                      <button onClick={() => copyToClipboard(bank.accountNumber, 'Account Number')} className="p-1 text-muted-foreground hover:text-accent-foreground transition-colors"> <Copy size={14}/> </button>
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
                                     <div className="mt-6 pt-4 border-t text-center">
                                          <button
                                            onClick={handleMarkAsPaid}
                                            disabled={notifyingAdmin || !!notificationMessage.includes('successfully')} // Disable if sending or already sent
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <div className="p-4 bg-background rounded-lg text-center">
                                    <p className="font-semibold text-yellow-400">🕒 Awaiting Payment Confirmation</p>
                                    <p className="text-sm text-muted-foreground mt-1">We have notified the {order.status === 'Awaiting Admin Confirmation' ? 'admin' : 'actor'}. The status will update once payment is confirmed.</p>
                                </div>
                            )}

                            {/* Fallback if no payment method (should not happen in this flow) */}
                            {!order.payment_method && (
                                 <p className="text-slate-500">Payment details unavailable.</p>
                            )}
                        </AccordionItem>

                        {/* --- NEW: Offer History Accordion --- */}
                        {order.offers && order.offers.length > 0 && (
                          <AccordionItem
                            title="Offer History"
                            icon={<History size={18} />}
                            isOpen={openSections.offer_history}
                            onToggle={() => toggleSection('offer_history')}
                          >
                            <div className="bg-background p-4 rounded-lg space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                              {order.offers.map(offer => (
                                <div key={offer.id} className="pb-3 border-b border last:border-b-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-foreground">{offer.offer_title}</span>
                                    <span className="font-bold text-lg text-primary">{offer.offer_price.toFixed(2)} MAD</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{new Date(offer.created_at).toLocaleString()}</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.offer_agreement || "No agreement details provided."}</p>
                                </div>
                              ))}
                            </div>
                          </AccordionItem>
                        )}


                        {/* --- NEW: Quote Details Section --- */}
                        {order.service_type !== 'voice_over' && (
                          <AccordionItem
                            title="Quote Details"
                            icon={<Info size={18} />}
                            isOpen={openSections.quote_details}
                            onToggle={() => toggleSection('quote_details')}
                          >
                            <div className="bg-background p-4 rounded-lg space-y-2 text-sm">
                              {order.service_type === 'scriptwriting' && (
                                <>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Est. Video Duration:</span><span className="font-semibold text-foreground">{order.quote_est_duration || 'N/A'} min</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Est. Word Count:</span><span className="font-semibold text-foreground">{order.word_count || 'N/A'}</span></div>
                                </>
                              )}
                              {order.service_type === 'video_editing' && (
                                <>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Video Type:</span><span className="font-semibold text-foreground capitalize">{order.quote_video_type || 'N/A'}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Footage:</span><span className="font-semibold text-foreground">{order.quote_footage_choice === 'has_footage' ? 'Client has footage' : 'Needs stock footage'}</span></div>
                                </>
                              )}
                            </div>
          
                          </AccordionItem>
                        )}



                        {/* Script Accordion */}
                        <AccordionItem
                          title={order.service_type === 'voice_over' ? "Script" : "Project Description"}
                          icon={<FileText size={20}/>}
                          isOpen={openSections.script}
                          onToggle={() => toggleSection('script')}
                        >
                          <div className="bg-background p-4 rounded-lg max-h-60 overflow-y-auto">
                             <p className="text-muted-foreground whitespace-pre-wrap">{order.script}</p>
                          </div>
                        </AccordionItem>

                        {/* Deliveries Accordion */}
                            <AccordionItem 
                            title="Deliveries" 
                            icon={<Package size={20}/>} 
                            isOpen={openSections.deliveries} 
                            onToggle={() => toggleSection('deliveries')}
                            >                            
                            {order.deliveries && order.deliveries.length > 0 ? (
                                <div className="space-y-6">
                                    {order.deliveries.map((delivery, index) => (
                                      <div key={index} className="bg-background p-4 rounded-lg">
                                        <p className="font-semibold text-lg mb-2 text-foreground">
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
                                        <div className="mt-6 pt-6 border-t space-y-4">
                                            <h3 className="text-lg font-semibold text-foreground">Review & Confirm Latest Delivery</h3>
                                            <div className="flex gap-4">
                                                <button onClick={handleApproval} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-foreground font-semibold">
                                                    <Check size={20} /> Accept Delivery
                                                </button>
                                                {canRequestRevision ? (
                                                    <button onClick={handleRevisionRequest} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-foreground font-semibold">
                                                        <RotateCcw size={20} /> Request Revision ({order.actors.revisions_allowed - order.revisions_used} left)
                                                    </button>
                                                ) : (
                                                    <div className="w-full text-center p-3 bg-slate-700 rounded-lg">
                                                        <p className="text-muted-foreground text-sm">No revisions remaining.</p>
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
                        <div className="p-5 bg-card/50 rounded-lg border border/50">
                            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                                <Star size={18}/> {existingReview ? 'Your Review' : 'Leave a Review'}
                            </h2>
                            {isLoadingReview ? (
                                <p className="text-muted-foreground text-sm">Loading review status...</p>
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
                                        <span className="ml-2 text-sm text-muted-foreground">({existingReview.rating}/5 stars)</span>
                                    </div>
                                    {existingReview.comment && (
                                         <p className="text-muted-foreground bg-slate-700/50 p-3 rounded text-sm italic">"{existingReview.comment}"</p>
                                    )}
                                     <p className="text-xs text-slate-500">Reviewed on: {new Date(existingReview.created_at).toLocaleDateString()}</p>
                                </div>
                            ) : (
                                // Show Review Form
                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Your Rating *</label>
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
                                         <label htmlFor="reviewComment" className="block text-sm font-medium text-muted-foreground mb-1">Your Comment (Optional)</label>
                                         <textarea
                                            id="reviewComment"
                                            rows={4}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Tell us about your experience..."
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-foreground text-sm focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="text-right">
                                         {reviewMessage && (
                                             <p className={`text-sm mb-2 text-center ${reviewMessage.includes('Error') || reviewMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{reviewMessage}</p>
                                         )}
                                         <button
                                            type="submit"
                                            disabled={isSubmittingReview || rating === 0}
                                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-foreground font-semibold transition-colors disabled:opacity-50"
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
                     <div className="sticky top-24 bg-card/50 backdrop-blur-md rounded-lg border border/50 overflow-hidden">
                         {/* Chat Header/Toggle Button */}
                         <button
                            onClick={() => setIsChatVisible(!isChatVisible)}
                            className="w-full flex justify-between items-center p-4 text-left bg-card hover:bg-accent/50 transition-colors"
                        >
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><MessageSquare size={18}/> Communication</h2>
                            {isChatVisible ? <ChevronUp size={20} className="text-muted-foreground"/> : <ChevronDown size={20} className="text-muted-foreground"/>}
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