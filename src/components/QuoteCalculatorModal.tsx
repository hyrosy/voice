// In src/components/QuoteCalculatorModal.tsx

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Wallet, FileText, User, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom'; // Correct: Import Link from the router
import emailjs from '@emailjs/browser';
import { supabase } from '../supabaseClient';
import StripeCheckoutForm from './StripeCheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Actor {
  id: string;
  ActorEmail: string;
  ActorName: string;
  BaseRate_per_Word: string;
  WebMultiplier: string;
  BroadcastMultiplier: string;
}

interface ModalProps {
  actor: Actor;
  onClose: () => void;
}

const QuoteCalculatorModal: React.FC<ModalProps> = ({ actor, onClose }) => {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [usage, setUsage] = useState('web');
  const [videoSync, setVideoSync] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false); // New state

  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const orderId = `VO-${Date.now()}`;

  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [scriptText]);

  useEffect(() => {
    const baseRate = parseFloat(actor.BaseRate_per_Word) || 0;
    const webMultiplier = parseFloat(actor.WebMultiplier) || 1;
    const broadcastMultiplier = parseFloat(actor.BroadcastMultiplier) || 1;
    const videoSyncFee = 500;

    const basePrice = wordCount * baseRate;
    const usagePrice = basePrice * (usage === 'web' ? webMultiplier : broadcastMultiplier);
    const finalPrice = usagePrice + (videoSync ? videoSyncFee : 0);
    setTotalPrice(finalPrice);
  }, [wordCount, usage, videoSync, actor]);

  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientInfo({ ...clientInfo, [e.target.name]: e.target.value });
  };

    const createOrderInSupabase = async (method: 'stripe' | 'bank', paymentIntentId: string | null = null) => {

    // --- ADD AUTH LOGGING ---
    let userId = null;
    let userEmail = null;
    let userRole = 'anon'; // Assume anon unless session found
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error("Error getting session right before insert:", sessionError);
        } else if (session?.user) {
            userId = session.user.id;
            userEmail = session.user.email;
            userRole = session.user.role || 'authenticated'; // Get role if available
            console.log(`Auth state before insert: Authenticated. Role: ${userRole}, ID: ${userId}, Email: ${userEmail}`);
        } else {
            console.log("Auth state before insert: Anonymous (No Session)");
        }
    } catch (e) {
        console.error("Exception getting session:", e);
    }
    // --- END AUTH LOGGING ---


    const orderDataToInsert = {
        order_id_string: orderId,
        actor_id: actor?.id, // Use optional chaining just in case
        client_name: clientInfo.name,
        client_email: clientInfo.email.toLowerCase(), // Convert to lowercase
        word_count: wordCount,
        usage: usage,
        total_price: totalPrice,
        script: scriptText,
        payment_method: method,
        stripe_payment_intent_id: paymentIntentId,
        status: method === 'stripe' ? 'In Progress' : 'Awaiting Payment',
        // DO NOT explicitly set client_id here unless the user is logged in AND you have their clients.id
        // client_id: ??? // This should likely remain null initially
    };
    // Log the data just before sending
    console.log("Attempting to insert order with data:", JSON.stringify(orderDataToInsert, null, 2));
    console.log(`User Role at insert time: ${userRole}`); // Log the role being used


    // --- REPLACE INSERT WITH FUNCTION INVOCATION ---
    const { data: newOrder, error: invokeError } = await supabase.functions.invoke( // Renamed 'error' to 'invokeError' for clarity
        'create-order',
        { body: orderDataToInsert }
    );
    // --- END REPLACEMENT ---


    // Log the specific error if it occurs during invocation (e.g., network error, function not found)
    if (invokeError) {
       console.error("Supabase function invoke error details:", invokeError);
       throw invokeError; // Throw the invocation error
    }

    // Check if the function returned successfully BUT contained an internal error message
    // (Our Edge function sends { error: "message" } on failure with status 400)
    if (newOrder && newOrder.error) {
        console.error("Error returned from create-order function:", newOrder.error);
        throw new Error(newOrder.error);
    }

    // Handle case where function returns 200 OK but data is unexpected (e.g., missing id)
    if (!newOrder || !newOrder.id) {
        console.error("Unexpected response from create-order function:", newOrder);
        throw new Error("Failed to create order. Unexpected response from server.");
    }

    // If we reach here, everything looks okay
    console.log("Order created successfully via function:", newOrder);
    setNewOrderId(newOrder.id);
    return newOrder; // Return the data received from the function
}; // End of createOrderInSupabase

  const sendEmails = async (newOrder: any) => {
    try {
      const adminParams = {
          orderId,
          actorName: actor.ActorName,
          actorEmail: actor.ActorEmail,
          wordCount,
          usage,
          videoSync: videoSync ? 'Yes' : 'No',
          totalPrice: totalPrice.toFixed(2),
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          clientPhone: clientInfo.phone,
          clientCompany: clientInfo.company,
          script: scriptText,
      };

      const clientParams = {
          orderId: newOrder.order_id_string,
          order_uuid: newOrder.id,
          actorName: actor.ActorName,
          totalPrice: totalPrice.toFixed(2),
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
      };

      // Remember to replace placeholders with your actual EmailJS keys
      await emailjs.send(
            'service_r3pvt1s',
            'template_o4hehdi', // Use the Admin template ID
            adminParams,
            'I51tDIHsXYKncMQpO'
        );

        // 4. Send the second email to the Client
        await emailjs.send(
            'service_r3pvt1s',
            'template_shq9k38', // Use the new Client template ID
            clientParams,
            'I51tDIHsXYKncMQpO'
        );

    } catch (error) {
      // This is important: we log the error but don't stop the process.
      console.error("Email sending failed, but order was created:", error);
    }
  };

  // Inside QuoteCalculatorModal component

const handleConfirmation = async () => {
    // This function is now mainly for confirming Bank Transfer selection
    if (paymentMethod !== 'bank') return;
    // Basic validation
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
        setStatus("Please fill in all required (*) details.");
        return; // Stay on Step 3 if details missing
    }

    setStatus('Processing Bank Transfer Order...');
    try {
        const newOrder = await createOrderInSupabase('bank'); // Create order in DB
        await sendEmails(newOrder); // Send emails
        setStatus('Order Confirmed!'); // Update status for final step
        setStep(4); // Move to final step
    } catch (err) {
        const error = err as Error;
        console.error('FAILED...', error);
        setStatus(`An error occurred: ${error.message}`);
        setStep(4); // Still move to final step to show error
    }
};


  const onSuccessfulStripePayment = async (intentId: string) => {
    setStatus('Processing Payment...'); // Update status for final step display
    try {
        // Order creation now happens *after* successful payment
        const newOrder = await createOrderInSupabase('stripe', intentId);
        await sendEmails(newOrder); // Send emails
        setStatus('Payment Successful! Your order is now In Progress.');
    } catch (err) {
        const error = err as Error;
        console.error('Post-payment processing failed:', error);
        // Show an error, but payment was likely successful.
        // Needs careful handling - maybe guide user to contact support.
        setStatus(`Payment confirmed, but order update failed: ${error.message}. Please contact support with Order ID ${orderId}.`);
    }
    setStep(4); // Move to final step regardless of post-payment processing status to show result
};

  const onBankTransferSelect = async () => {
    try {
        const newOrder = await createOrderInSupabase('bank');
        await sendEmails(newOrder);
        setStatus('Order Confirmed!');
    } catch (err) {
        const error = err as Error;
        console.log('FAILED...', error);
        setStatus(`An error occurred: ${error.message}`);
    }
  };

  // Inside QuoteCalculatorModal component

const handlePaymentMethodChange = async (method: 'stripe' | 'bank') => {
    // Only proceed if the method actually changed or Stripe isn't already set up/setting up
    if (method === paymentMethod) {
        return;
    }

    setPaymentMethod(method);
    setStatus(''); // Clear previous statuses

    // If Stripe is selected, try to create the Payment Intent
    if (method === 'stripe') {
        setIsSettingUpStripe(true);
        setStatus('Initializing secure payment...');
        try {
            // Ensure client info needed for payment intent is available if required
            // Validate clientInfo here if necessary before creating intent
            console.log("Sending amount to function:", totalPrice); // Add this log
            const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    amount: totalPrice
                    // Add other details if needed by your function e.g., email: clientInfo.email
                 },
            });

            // Handle potential errors from the function invocation itself
            if (invokeError) throw invokeError;
            // Handle errors returned *within* the function's response body
            if (data.error) throw new Error(data.error);
            // Handle case where client_secret might be missing
            if (!data.client_secret) throw new Error("Payment client secret is missing.");

            setClientSecret(data.client_secret);
            setStatus(''); // Clear status on success

        } catch (error) {
            const err = error as Error;
            console.error("Error creating payment intent:", err); // Log the error
            setStatus(`Error initializing payment: ${err.message}. Please try again or select Bank Transfer.`);
            setClientSecret(null); // Ensure clientSecret is null on error
            setPaymentMethod(null); // Reset selection on error
        } finally {
            setIsSettingUpStripe(false);
        }
    } else if (method === 'bank') {
        // If switching back to bank, clear Stripe secret if you want to force re-creation
        // setClientSecret(null); // Optional: uncomment if needed
    }
};

  const ProgressBar = ({ currentStep }: { currentStep: number }) => {
        const steps = ["Scope", "Add-ons", "Details & Payment", "Confirm"];
        return (
            <div className="flex items-center justify-between mb-8">
                {steps.map((name, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                currentStep > index + 1 ? 'bg-green-500' :
                                currentStep === index + 1 ? 'bg-purple-600' : 'bg-slate-600'
                            }`}>
                                {currentStep > index + 1 ? <CheckCircle size={18} /> : <span className="font-bold">{index + 1}</span>}
                            </div>
                            <p className={`text-xs mt-2 transition-colors ${currentStep >= index + 1 ? 'text-white' : 'text-slate-400'}`}>{name}</p>
                        </div>
                        {index < steps.length - 1 && <div className={`flex-grow h-0.5 mx-2 ${currentStep > index + 1 ? 'bg-purple-600' : 'bg-slate-700'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Project Scope
            return (
                <div>
                    <ProgressBar currentStep={1} />
                    <h2 className="text-2xl font-bold text-center mb-6 text-white">Project Scope</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="scriptText" className="block mb-2 text-sm font-medium text-slate-300">Paste Your Script Here</label>
                            <textarea id="scriptText" rows={5} value={scriptText} onChange={e => setScriptText(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Your script..."></textarea>
                            <p className="text-right text-slate-400 text-sm mt-1">Word Count: {wordCount}</p>
                        </div>
                        <div>
                            <label htmlFor="usage" className="block mb-2 text-sm font-medium text-slate-300">Usage Rights</label>
                            <select id="usage" value={usage} onChange={e => setUsage(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="web">Web & Social Media (1 Year)</option>
                                <option value="broadcast">TV, Radio & Cinema (1 Year)</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={() => setStep(2)} className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold">Next</button>
                </div>
            );

        case 2: // Add-ons
            return (
                <div>
                    <ProgressBar currentStep={2} />
                    <h2 className="text-2xl font-bold text-center mb-6 text-white">Optional Add-ons</h2>
                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <label htmlFor="videoSync" className="flex items-center cursor-pointer">
                            <input type="checkbox" id="videoSync" checked={videoSync} onChange={e => setVideoSync(e.target.checked)} className="h-5 w-5 rounded accent-purple-500" />
                            <span className="ml-3 font-medium text-white">Timed Audio Sync (for video)</span>
                            <span className="ml-auto font-bold text-white">+500 MAD</span>
                        </label>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setStep(1)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-white">Back</button>
                        <button onClick={() => setStep(3)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white">Next</button>
                    </div>
                </div>
            );

        case 3: // Your Details & Payment Method (Combined Step)
             // Basic validation before allowing confirmation (can be enhanced)
            const canConfirmBank = paymentMethod === 'bank' && clientInfo.name && clientInfo.email && clientInfo.phone;

            return (
                <div>
                    <ProgressBar currentStep={3} />
                    <h2 className="text-2xl font-bold text-center mb-6 text-white">Your Details & Payment</h2>
                    {/* Wrap inputs for potential form handling later if needed, but not strictly required now */}
                    <div className="space-y-4">
                        {/* Client Info Inputs */}
                        <input type="text" name="name" placeholder="Full Name *" required value={clientInfo.name} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                        <input type="email" name="email" placeholder="Email Address *" required value={clientInfo.email} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                        <input type="tel" name="phone" placeholder="Phone Number *" required value={clientInfo.phone} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                        <input type="text" name="company" placeholder="Company Name (Optional)" value={clientInfo.company} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />

                        {/* Payment Method Selection */}
                        <div className="pt-4 border-t border-slate-700">
                             <label className="block mb-2 text-sm font-medium text-slate-300">Choose Payment Method *</label>
                            <div className="space-y-4">
                                {/* Stripe Radio */}
                                <label className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center gap-4 cursor-pointer ${paymentMethod === 'stripe' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600 hover:border-slate-500'}`}>
                                     <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="stripe"
                                        checked={paymentMethod === 'stripe'}
                                        onChange={() => handlePaymentMethodChange('stripe')}
                                        className="h-4 w-4 mr-2 border-slate-500 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                                        disabled={isSettingUpStripe} // Disable while setting up Stripe
                                     />
                                    <CreditCard className="w-6 h-6 text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-white">Pay by Card (Stripe)</h3>
                                        <p className="text-sm text-slate-400">Securely pay with your credit/debit card.</p>
                                    </div>
                                </label>
                                {/* Bank Transfer Radio */}
                                <label className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center gap-4 cursor-pointer ${paymentMethod === 'bank' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600 hover:border-slate-500'}`}>
                                      <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bank"
                                        checked={paymentMethod === 'bank'}
                                        onChange={() => handlePaymentMethodChange('bank')}
                                        className="h-4 w-4 mr-2 border-slate-500 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                                        disabled={isSettingUpStripe} // Disable while setting up Stripe
                                     />
                                    <Wallet className="w-6 h-6 text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-white">Bank Transfer</h3>
                                        <p className="text-sm text-slate-400">Receive payment details and pay manually.</p>
                                    </div>
                                </label>
                            </div>
                            {/* Display Status/Error Messages */}
                             {isSettingUpStripe && <p className="text-center text-sm text-slate-400 mt-4">{status || 'Initializing...'}</p>}
                             {!isSettingUpStripe && status && !clientSecret && paymentMethod === 'stripe' && <p className="text-center text-sm text-red-400 mt-4">{status}</p>}
                        </div>

                        {/* Conditionally Render Stripe Form */}
                        {paymentMethod === 'stripe' && clientSecret && !isSettingUpStripe && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
                                     {/* Pass onSuccessfulPayment directly */}
                                    <StripeCheckoutForm onSuccessfulPayment={onSuccessfulStripePayment} />
                                </Elements>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 pt-6 mt-6 border-t border-slate-700">
                            <button type="button" onClick={() => setStep(2)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-white">Back</button>

                            {/* Show Confirm for Bank Transfer ONLY */}
                            {paymentMethod === 'bank' && (
                                 <button
                                    type="button"
                                    onClick={handleConfirmation} // Use confirmation handler for bank
                                    disabled={!canConfirmBank || isSettingUpStripe} // Ensure details filled
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white disabled:opacity-50"
                                 >
                                    Confirm Bank Transfer
                                </button>
                            )}

                             {/* Note: The "Pay Now" button for Stripe is INSIDE StripeCheckoutForm */}
                             {/* Add a placeholder or disable msg if stripe selected but not ready */}
                            {paymentMethod === 'stripe' && !clientSecret && !isSettingUpStripe && (
                                <button type="button" disabled className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white opacity-50">
                                    {status ? 'Check Errors Above' : 'Select Payment'}
                                </button>
                            )}
                             {paymentMethod === 'stripe' && isSettingUpStripe && (
                                <button type="button" disabled className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white opacity-50">
                                    Initializing...
                                </button>
                             )}
                              {/* No button needed here if Stripe form is visible */}
                        </div>
                    </div>
                </div>
            );


        case 4: // Confirm/Pay (Final Step)
             // This step now primarily shows the result after payment attempt or bank confirmation
            return (
                <div>
                    <ProgressBar currentStep={4} />
                    <div className="text-center">
                        {/* Status message updated by onSuccessfulStripePayment or handleConfirmation */}
                         <h2 className={`text-3xl font-bold mb-4 ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status || 'Processing...'}</h2>

                        {/* Successful Payment/Order Confirmation */}
                        {(status === 'Payment Successful! Your order is now In Progress.' || status === 'Order Confirmed!') && (
                            <div>
                                <p className="text-slate-300 mb-6">Thank you! A confirmation email with the next steps is on its way.</p>
                                {newOrderId && (
                                    <Link to={`/order/${newOrderId}`} className="inline-block w-full mb-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform">
                                        View Your Order Details
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Bank Transfer Details */}
                        {status === 'Order Confirmed!' && paymentMethod === 'bank' && (
                            <div className="bg-slate-900 p-6 rounded-lg text-left mt-6">
                                <p className="mb-2"><span className="font-bold text-slate-400">Order ID:</span> {orderId}</p>
                                <p className="mb-4"><span className="font-bold text-slate-400">Amount Due:</span> {totalPrice.toFixed(2)} MAD</p>
                                <h4 className="font-bold text-lg mb-2 border-t border-slate-700 pt-4 text-white">Bank Transfer Details:</h4>
                                <p className="text-sm text-slate-400">Bank Name: Attijariwafa Bank</p>
                                <p className="text-sm text-slate-400">Account Holder: UCPMAROC</p>
                                <p className="text-sm text-slate-400">IBAN: MA64 0077 8000 0219 5000 0005 47</p>
                                <p className="font-bold text-white mt-4">IMPORTANT: Please use your Order ID ({orderId}) as the payment reference.</p>
                            </div>
                        )}

                         {/* Generic Error Message if needed */}
                         {status.includes('Error:') && (
                             <p className="text-slate-300 my-4">There was an issue processing your request. Please check the details and try again, or contact support.</p>
                             // Optionally add a button to go back to step 3
                             // <button onClick={() => setStep(3)} className="...">Try Again</button>
                         )}
                    </div>
                </div>
            );
        default:
            return null;
    }
};

  return (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    {/* MODIFIED: Added max-h-screen sm:max-h-[90vh], flex, flex-col */}
    <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-lg relative transition-all duration-300
                    p-6 sm:p-8 flex flex-col max-h-screen sm:max-h-[90vh]"> {/* Adjusted padding slightly */}
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"> {/* Ensure button is above content */}
        <X size={24} />
        </button>
        <div className="flex-shrink-0 mb-6 border-b border-slate-700 pb-4"> {/* Added flex-shrink-0 */}          <p className="text-center text-slate-400">Booking for: <span className="font-bold text-blue-400">{actor.ActorName}</span></p>
          <p className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-2">
            Total: {totalPrice.toFixed(2)} MAD
          </p>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 sm:pr-4 sm:-mr-4 custom-scrollbar">
            {renderStep()}
        </div> {/* End of Scrollable Wrapper */}      </div>
    </div>
  );
};

export default QuoteCalculatorModal;