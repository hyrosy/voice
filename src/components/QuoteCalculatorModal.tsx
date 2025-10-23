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
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        order_id_string: orderId,
        actor_id: actor.id,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        word_count: wordCount,
        usage: usage,
        total_price: totalPrice,
        script: scriptText,
        payment_method: method,
        stripe_payment_intent_id: paymentIntentId,
        status: method === 'stripe' ? 'In Progress' : 'Awaiting Payment',
      })
      .select()
      .single();
      
    if (error) throw error;
    if (newOrder) setNewOrderId(newOrder.id);
    return newOrder;
  };

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

  const handleConfirmation = async () => {
        if (!paymentMethod) return;
        setStep(5); // Move to the final step
        if (paymentMethod === 'stripe') {
            try {
                setStatus('Preparing secure payment...');
                const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                    body: { amount: totalPrice },
                });

                // This is the new, detailed error handling
                if (error) throw error;
                if (data.error) throw new Error(data.error); // Throw the error message from the function's body

                setClientSecret(data.client_secret);
                setStatus('');
            } catch (error) {
                const err = error as Error;
                // Display the specific error message to the user
                setStatus(`Error: ${err.message}`);
            }
        } else if (paymentMethod === 'bank') {
            // No changes needed for bank transfer, it can proceed
            onBankTransferSelect();
        }
    };


  const onSuccessfulPayment = async (intentId: string) => {
    try {
        const newOrder = await createOrderInSupabase('stripe', intentId);
        await sendEmails(newOrder);
        setStatus('Payment Successful! Your order is now In Progress.');
    } catch (err) {
        const error = err as Error;
        console.log('FAILED...', error);
        setStatus(`An error occurred: ${error.message}`);
    }
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
  const ProgressBar = ({ currentStep }: { currentStep: number }) => {
        const steps = ["Scope", "Add-ons", "Details", "Payment", "Confirm"];
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

            case 3: // Your Details
                return (
                    <div>
                        <ProgressBar currentStep={3} />
                        <h2 className="text-2xl font-bold text-center mb-6 text-white">Your Details</h2>
                        <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-4">
                            <input type="text" name="name" placeholder="Full Name" required value={clientInfo.name} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                            <input type="email" name="email" placeholder="Email Address" required value={clientInfo.email} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                            <input type="tel" name="phone" placeholder="Phone Number" required value={clientInfo.phone} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                            <input type="text" name="company" placeholder="Company Name (Optional)" value={clientInfo.company} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                            <div className="flex gap-4 mt-4">
                                <button type="button" onClick={() => setStep(2)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-white">Back</button>
                                <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white">Proceed to Payment</button>
                            </div>
                        </form>
                    </div>
                );

            case 4: // Payment Method
                return (
                    <div>
                        <ProgressBar currentStep={4} />
                        <h2 className="text-2xl font-bold text-center mb-6 text-white">Payment Method</h2>
                        <div className="space-y-4">
                            <button onClick={() => setPaymentMethod('stripe')} className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center gap-4 ${paymentMethod === 'stripe' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600'}`}>
                                <CreditCard className="w-6 h-6 text-purple-400" />
                                <div>
                                    <h3 className="font-bold text-white">Pay by Card (Stripe)</h3>
                                    <p className="text-sm text-slate-400">Securely pay with your credit/debit card.</p>
                                </div>
                            </button>
                            <button onClick={() => setPaymentMethod('bank')} className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center gap-4 ${paymentMethod === 'bank' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600'}`}>
                                <Wallet className="w-6 h-6 text-purple-400" />
                                <div>
                                    <h3 className="font-bold text-white">Bank Transfer</h3>
                                    <p className="text-sm text-slate-400">Receive payment details and pay manually.</p>
                                </div>
                            </button>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setStep(3)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-white">Back</button>
                            <button onClick={handleConfirmation} disabled={!paymentMethod} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white disabled:opacity-50">Confirm & Proceed</button>
                        </div>
                    </div>
                );
      case 5:
        if (paymentMethod === 'bank') {
            if (!newOrderId && status === '') onBankTransferSelect();
            return (
                    <div>
                        <ProgressBar currentStep={5} />
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-green-400 mb-4">{status || 'Processing...'}</h2>
                            {status === 'Order Confirmed!' && (
                                <div>
                                    <p className="text-slate-300 mb-6">Thank you! A confirmation email is on its way. You can also view your order now.</p>
                                    {newOrderId && (
                                        <Link to={`/order/${newOrderId}`} className="inline-block w-full mb-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform">
                                            View Your Order
                                        </Link>
                                    )}
                                    <div className="bg-slate-900 p-6 rounded-lg text-left">
                                        <p className="mb-2"><span className="font-bold">Order ID:</span> {orderId}</p>
                                        <p className="mb-4"><span className="font-bold">Amount Due:</span> {totalPrice.toFixed(2)} MAD</p>
                                        <h4 className="font-bold text-lg mb-2 border-t border-slate-700 pt-4">Bank Transfer Details:</h4>
                                        <p className="text-sm text-slate-400">Bank Name: Attijariwafa Bank</p>
                                        <p className="text-sm text-slate-400">Account Holder: UCPMAROC</p>
                                        <p className="text-sm text-slate-400">IBAN: MA64 0077 8000 0219 5000 0005 47</p>
                                        <p className="font-bold mt-4">IMPORTANT: Please use your Order ID as the payment reference.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
            );
        }
        if (paymentMethod === 'stripe' && clientSecret) {
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-4">{status || 'Complete Your Payment'}</h2>
                    {status === 'Payment Successful! Your order is now In Progress.' ? (
                        <div className="text-center">
                            <p className="text-slate-300 mb-6">Thank you! Your payment was successful. A confirmation email is on its way.</p>
                            {newOrderId && (
                                <Link to={`/order/${newOrderId}`} className="inline-block w-full mb-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform">
                                    View Your Order
                                </Link>
                            )}
                        </div>
                    ) : (
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                            <StripeCheckoutForm onSuccessfulPayment={onSuccessfulPayment} />
                        </Elements>
                    )}
                </div>
            );
        }
        return <div className="text-center text-white">{status || 'Loading Payment...'}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700/50 w-full max-w-lg relative transition-all duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        <div className="mb-6 border-b border-slate-700 pb-4">
          <p className="text-center text-slate-400">Booking for: <span className="font-bold text-blue-400">{actor.ActorName}</span></p>
          <p className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-2">
            Total: {totalPrice.toFixed(2)} MAD
          </p>
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default QuoteCalculatorModal;