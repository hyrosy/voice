// In src/components/QuoteCalculatorModal.tsx

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Wallet, FileText, User, CreditCard, Mic, PencilLine, Video, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from '../supabaseClient';
import StripeCheckoutForm from './StripeCheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- 1. UPDATED ACTOR INTERFACE ---
interface Actor {
  id: string;
  ActorEmail: string;
  ActorName: string;
  BaseRate_per_Word: string;
  WebMultiplier: string;
  BroadcastMultiplier: string;
  // New service fields
  service_scriptwriting?: boolean;
  service_videoediting?: boolean;
  service_script_rate?: number;
  service_video_rate?: number;
  service_script_description?: string | null;
  service_video_description?: string | null;
}

interface ModalProps {
  actor: Actor;
  onClose: () => void;
}

// --- 2. NEW STEP MANAGEMENT ---
type ServiceType = 'voice_over' | 'scriptwriting' | 'video_editing';

const QuoteCalculatorModal: React.FC<ModalProps> = ({ actor, onClose }) => {
  // Use numbers for steps to match old logic
  const [step, setStep] = useState(0); // 0 = Selection, 1 = Scope, 2 = Add-ons, 3 = Details, 4 = Confirm
  const [serviceType, setServiceType] = useState<ServiceType>('voice_over');
  
  const [status, setStatus] = useState('');
  const [newOrderId, setNewOrderId] = useState<string | null>(null);

  // Voice Over State
  const [scriptText, setScriptText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [usage, setUsage] = useState('web');
  const [videoSync, setVideoSync] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [minimumFeeMessage, setMinimumFeeMessage] = useState('');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);

  // Quote Request State
  const [projectDescription, setProjectDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [estimatedWordCount, setEstimatedWordCount] = useState(0);
  const [videoType, setVideoType] = useState('creative');
  const [footageChoice, setFootageChoice] = useState('has_footage');
  
  // Client Info State
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const orderId = `VO-${Date.now()}`;

  // --- 3. NEW LOGIC: Check available services ---
  const [availableServices, setAvailableServices] = useState<{ id: ServiceType; name: string; icon: React.ElementType }[]>([]);

  useEffect(() => {
    const services = [
      { id: 'voice_over' as ServiceType, name: 'Voice Over', icon: Mic },
      ...(actor.service_scriptwriting ? [{ id: 'scriptwriting' as ServiceType, name: 'Script Writing', icon: PencilLine }] : []),
      ...(actor.service_videoediting ? [{ id: 'video_editing' as ServiceType, name: 'Video Editing', icon: Video }] : []),
    ];
    setAvailableServices(services);

    // If only Voice Over is available, skip selection and go to step 1
    if (services.length === 1 && services[0].id === 'voice_over') {
      setServiceType('voice_over');
      setStep(1); // Go to Project Scope
    } else {
      setStep(0); // Go to Service Selection
    }
  }, [actor]); // Run when actor prop is available

  // --- (Existing useEffects for VO calculation) ---
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
    const minimumFee = 10.00;

    if (finalPrice > 0 && finalPrice < minimumFee) {
        setTotalPrice(minimumFee);
        setMinimumFeeMessage(`(Minimum order fee of ${minimumFee.toFixed(2)} MAD applied)`);
    } else {
        setTotalPrice(finalPrice);
        setMinimumFeeMessage('');
    }
  }, [wordCount, usage, videoSync, actor]);


  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientInfo({ ...clientInfo, [e.target.name]: e.target.value });
  };

  // --- 4. MODIFIED createOrderInSupabase ---
  const createOrderInSupabase = async (
    currentServiceType: ServiceType,
    orderStatus: string,
    finalPrice: number | null,
    method: 'stripe' | 'bank' | null,
    paymentIntentId: string | null = null
  ) => {

    const orderDataToInsert: any = { // Use 'any' to build flexibly
      order_id_string: orderId,
      actor_id: actor?.id,
      client_name: clientInfo.name,
      client_email: clientInfo.email.toLowerCase(),
      script: projectDescription || scriptText, // Use project description or script
      status: orderStatus,
      service_type: currentServiceType,
      payment_method: method,
      stripe_payment_intent_id: paymentIntentId,
      total_price: finalPrice,
    };

    // Add service-specific data
    if (currentServiceType === 'voice_over') {
      orderDataToInsert.word_count = wordCount;
      orderDataToInsert.usage = usage;
    } else if (currentServiceType === 'scriptwriting') {
      orderDataToInsert.word_count = estimatedWordCount;
      orderDataToInsert.quote_est_duration = estimatedDuration;
    } else if (currentServiceType === 'video_editing') {
      orderDataToInsert.quote_video_type = videoType;
      orderDataToInsert.quote_footage_choice = footageChoice;
    }
    
    const { data: newOrder, error: invokeError } = await supabase.functions.invoke(
        'create-order',
        { body: orderDataToInsert }
    );

    if (invokeError) throw invokeError;
    if (newOrder && newOrder.error) throw new Error(newOrder.error);
    if (!newOrder || !newOrder.id) throw new Error("Failed to create order.");

    setNewOrderId(newOrder.id);
    return newOrder;
  };

  // --- 5. MODIFIED sendEmails ---
  const sendEmails = async (newOrder: any, isQuote: boolean) => {
    try {
      const adminParams = {
          orderId: newOrder.order_id_string,
          actorName: actor.ActorName,
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          totalPrice: isQuote ? "N/A (Quote Request)" : totalPrice.toFixed(2),
          serviceType: newOrder.service_type,
          script: newOrder.script,
      };

      const clientParams = {
          orderId: newOrder.order_id_string,
          order_uuid: newOrder.id,
          actorName: actor.ActorName,
          totalPrice: isQuote ? "N/A (Quote Request)" : totalPrice.toFixed(2),
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          isQuote: isQuote,
      };

      // Admin Email
      await emailjs.send('service_r3pvt1s', 'template_o4hehdi', adminParams, 'I51tDIHsXYKncMQpO');
      // Client Email
      await emailjs.send('service_r3pvt1s', 'template_shq9k38', clientParams, 'I51tDIHsXYKncMQpO');

    } catch (error) {
      console.error("Email sending failed:", error);
    }
  };

  // --- (Existing VO Handlers: handleConfirmation, onSuccessfulStripePayment, handlePaymentMethodChange) ---
  const handleConfirmation = async () => {
    if (paymentMethod !== 'bank') return;
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
        setStatus("Please fill in all required (*) details.");
        return;
    }
    setStatus('Processing Bank Transfer Order...');
    try {
        const newOrder = await createOrderInSupabase('voice_over', 'Awaiting Payment', totalPrice, 'bank');
        await sendEmails(newOrder, false); // false = not a quote
        setStatus('Order Confirmed!');
        setStep(4);
    } catch (err) {
        const error = err as Error;
        setStatus(`An error occurred: ${error.message}`);
        setStep(4);
    }
  };

  const onSuccessfulStripePayment = async (intentId: string) => {
    setStatus('Processing Payment...');
    try {
        const newOrder = await createOrderInSupabase('voice_over', 'In Progress', totalPrice, 'stripe', intentId);
        await sendEmails(newOrder, false); // false = not a quote
        setStatus('Payment Successful! Your order is now In Progress.');
    } catch (err) {
        setStatus(`Payment confirmed, but order update failed: ${(err as Error).message}.`);
    }
    setStep(4);
  };

  const handlePaymentMethodChange = async (method: 'stripe' | 'bank') => {
    if (method === paymentMethod) return;
    setPaymentMethod(method);
    setStatus('');
    if (method === 'stripe') {
        setIsSettingUpStripe(true);
        setStatus('Initializing secure payment...');
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
                body: { amount: totalPrice },
            });
            if (invokeError) throw invokeError;
            if (data.error) throw new Error(data.error);
            if (!data.client_secret) throw new Error("Payment client secret is missing.");
            setClientSecret(data.client_secret);
            setStatus('');
        } catch (error) {
            setStatus(`Error initializing payment: ${(error as Error).message}.`);
            setClientSecret(null);
            setPaymentMethod(null);
        } finally {
            setIsSettingUpStripe(false);
        }
    }
  };
  
  // --- 6. NEW: Handler for Quote Submission ---
  const handleQuoteSubmit = async () => {
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
        setStatus("Please fill in all required (*) details.");
        return;
    }
    if (!projectDescription) {
        setStatus("Please provide a project description.");
        return;
    }

    setStatus('Submitting Quote Request...');
    setIsSettingUpStripe(true); // Re-use for loading state

    try {
        // Create the order with 'awaiting_offer' status and NULL price
        const newOrder = await createOrderInSupabase(serviceType, 'awaiting_offer', null, null);
        await sendEmails(newOrder, true); // true = this is a quote
        setStatus('Quote Request Submitted!');
        setStep(4); // Move to final "success" step
    } catch (err) {
        setStatus(`An error occurred: ${(err as Error).message}`);
        setStep(4);
    } finally {
        setIsSettingUpStripe(false);
    }
  };

  // --- 7. MODIFIED: ProgressBar ---
  const ProgressBar = ({ currentStep }: { currentStep: number }) => {
      // Show different steps for quote flow
      const steps = serviceType === 'voice_over' 
        ? ["Scope", "Add-ons", "Details & Payment", "Confirm"]
        : ["Service", "Details", "Submit", "Confirm"]; // Simplified steps for quotes
      
      // Adjust currentStep for quote flow
      let adjustedStep = currentStep;
      if (serviceType !== 'voice_over') {
        if (currentStep === 1) adjustedStep = 2; // Details
        if (currentStep === 3) adjustedStep = 3; // Submit
        if (currentStep === 4) adjustedStep = 4; // Confirm
      }
      
      return (
          <div className="flex items-center justify-between mb-8">
              {steps.map((name, index) => (
                  <React.Fragment key={index}>
                      <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              adjustedStep > index + 1 ? 'bg-green-500' :
                              adjustedStep === index + 1 ? 'bg-purple-600' : 'bg-slate-600'
                          }`}>
                              {adjustedStep > index + 1 ? <CheckCircle size={18} /> : <span className="font-bold">{index + 1}</span>}
                          </div>
                          <p className={`text-xs mt-2 transition-colors ${adjustedStep >= index + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</p>
                      </div>
                      {index < steps.length - 1 && <div className={`flex-grow h-0.5 mx-2 ${adjustedStep > index + 1 ? 'bg-purple-600' : 'bg-slate-700'}`}></div>}
                  </React.Fragment>
              ))}
          </div>
      );
  };

  // --- 8. MODIFIED: renderStep ---
  const renderStep = () => {
    switch (step) {
      // --- NEW: Step 0 (Service Selection) ---
      case 0:
        return (
          <div>
            <ProgressBar currentStep={1} />
            <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Select a Service</h2>
            <div className="space-y-4">
              {availableServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setServiceType(service.id);
                    setStep(1); // Go to Step 1 (Scope/Details)
                  }}
                  className="w-full p-4 border-2 border-slate-600 rounded-lg text-left transition flex items-center gap-4 hover:border-purple-500 hover:bg-purple-900/50"
                >
                  <service.icon className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">Get a {service.id === 'voice_over' ? 'price' : 'quote'} for {service.name.toLowerCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      
      // --- Step 1: Dynamic Scope/Details ---
      case 1:
        if (serviceType === 'voice_over') {
          // --- This is the original Step 1 (Voice Over Scope) ---
          return (
            <div>
              <ProgressBar currentStep={1} />
              <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Project Scope</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="scriptText" className="block mb-2 text-sm font-medium text-muted-foreground">Paste Your Script Here</label>
                  <textarea id="scriptText" rows={5} value={scriptText} onChange={e => setScriptText(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-foreground focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Your script..."></textarea>
                  <p className="text-right text-muted-foreground text-sm mt-1">Word Count: {wordCount}</p>
                </div>
                <div>
                  <label htmlFor="usage" className="block mb-2 text-sm font-medium text-muted-foreground">Usage Rights</label>
                  <select id="usage" value={usage} onChange={e => setUsage(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-foreground focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <option value="web">Web & Social Media (1 Year)</option>
                    <option value="broadcast">TV, Radio & Cinema (1 Year)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                {availableServices.length > 1 && <button onClick={() => setStep(0)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-foreground">Back</button>}
                <button onClick={() => setStep(2)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-foreground font-semibold">Next</button>
              </div>
            </div>
          );
        }
        if (serviceType === 'scriptwriting') {
          // --- NEW: Script Writing Form ---
          return (
            <div>
              <ProgressBar currentStep={1} />
              <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Script Writing Details</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="projectDescription" className="block mb-2 text-sm font-medium text-muted-foreground">Project Description *</label>
                  <textarea id="projectDescription" rows={5} value={projectDescription} onChange={e => setProjectDescription(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-foreground" placeholder="Tell us about your project, tone, style, and goals..."></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="estimatedDuration" className="block mb-2 text-sm font-medium text-muted-foreground">Video Duration (min)</label>
                    <input id="estimatedDuration" type="text" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3" placeholder="e.g., '2-3'" />
                  </div>
                  <div>
                    <label htmlFor="estimatedWordCount" className="block mb-2 text-sm font-medium text-muted-foreground">Est. Word Count</label>
                    <input id="estimatedWordCount" type="number" value={estimatedWordCount} onChange={e => setEstimatedWordCount(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3" />
                  </div>
                </div>
                {actor.service_script_rate && actor.service_script_rate > 0 && (
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <p className="text-sm text-muted-foreground">Est. Price: <span className="font-bold text-foreground">{ (actor.service_script_rate * estimatedWordCount).toFixed(2) } MAD</span> (at {actor.service_script_rate} MAD/word)</p>
                    <p className="text-xs text-muted-foreground">Final price will be provided in a quote from the actor.</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(0)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-foreground">Back</button>
                <button onClick={() => setStep(3)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-foreground font-semibold">Next</button>
              </div>
            </div>
          );
        }
        if (serviceType === 'video_editing') {
          // --- NEW: Video Editing Form ---
          return (
            <div>
              <ProgressBar currentStep={1} />
              <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Video Editing Details</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="projectDescription_video" className="block mb-2 text-sm font-medium text-muted-foreground">Project Description *</label>
                  <textarea id="projectDescription_video" rows={5} value={projectDescription} onChange={e => setProjectDescription(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-foreground" placeholder="Describe the video you need, style, length, etc..."></textarea>
                </div>
                <div>
                  <label htmlFor="videoType" className="block mb-2 text-sm font-medium text-muted-foreground">Video Type</label>
                  <select id="videoType" value={videoType} onChange={e => setVideoType(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-foreground">
                    <option value="creative">Creative / Podcast</option>
                    <option value="commercial">Commercial / Ad</option>
                    <option value="corporate">Corporate / Explainer</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-muted-foreground">Footage Choice</label>
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 space-y-3">
                    <label htmlFor="has_footage" className="flex items-center cursor-pointer">
                      <input type="radio" id="has_footage" name="footageChoice" value="has_footage" checked={footageChoice === 'has_footage'} onChange={e => setFootageChoice(e.target.value)} className="h-4 w-4 accent-purple-500" />
                      <span className="ml-3 text-sm text-foreground">I have my own footage</span>
                    </label>
                    <label htmlFor="needs_footage" className="flex items-center cursor-pointer">
                      <input type="radio" id="needs_footage" name="footageChoice" value="needs_footage" checked={footageChoice === 'needs_footage'} onChange={e => setFootageChoice(e.target.value)} className="h-4 w-4 accent-purple-500" />
                      <span className="ml-3 text-sm text-foreground">I need royalty-free stock footage</span>
                    </label>
                  </div>
                </div>
                {actor.service_video_rate && actor.service_video_rate > 0 && (
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <p className="text-sm text-muted-foreground">Starts from: <span className="font-bold text-foreground">{actor.service_video_rate} MAD / minute</span></p>
                    <p className="text-xs text-muted-foreground">Final price will be provided in a quote from the actor.</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(0)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-foreground">Back</button>
                <button onClick={() => setStep(3)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-foreground font-semibold">Next</button>
              </div>
            </div>
          );
        }
        return null;

      // --- Step 2: Add-ons (VOICE OVER ONLY) ---
      case 2:
        return (
          <div>
            <ProgressBar currentStep={2} />
            <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Optional Add-ons</h2>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <label htmlFor="videoSync" className="flex items-center cursor-pointer">
                <input type="checkbox" id="videoSync" checked={videoSync} onChange={e => setVideoSync(e.target.checked)} className="h-5 w-5 rounded accent-purple-500" />
                <span className="ml-3 font-medium text-foreground">Timed Audio Sync (for video)</span>
                <span className="ml-auto font-bold text-foreground">+500 MAD</span>
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-foreground">Back</button>
              <button onClick={() => setStep(3)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-foreground">Next</button>
            </div>
          </div>
        );

      // --- Step 3: Details & Payment (Dynamic) ---
      case 3:
        const canConfirmBank = paymentMethod === 'bank' && clientInfo.name && clientInfo.email && clientInfo.phone;
        const isQuoteFlow = serviceType !== 'voice_over';

        return (
          <div>
            <ProgressBar currentStep={3} />
            <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
              {isQuoteFlow ? "Your Details" : "Your Details & Payment"}
            </h2>
            <div className="space-y-4">
              {/* Client Info Inputs */}
              <input type="text" name="name" placeholder="Full Name *" required value={clientInfo.name} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              <input type="email" name="email" placeholder="Email Address *" required value={clientInfo.email} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              <input type="tel" name="phone" placeholder="Phone Number *" required value={clientInfo.phone} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              <input type="text" name="company" placeholder="Company Name (Optional)" value={clientInfo.company} onChange={handleClientInfoChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />

              {/* --- DYNAMIC CONTENT: Payment or Quote Button --- */}
              {isQuoteFlow ? (
                // --- QUOTE FLOW: Show Submit Button ---
                <div className="pt-4 border-t border">
                  <p className="text-sm text-muted-foreground text-center mb-4">You will receive an offer from the actor after submitting your request.</p>
                  <button
                    type="button"
                    onClick={handleQuoteSubmit}
                    disabled={!clientInfo.name || !clientInfo.email || !clientInfo.phone || isSettingUpStripe}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-foreground disabled:opacity-50"
                  >
                    {isSettingUpStripe ? 'Submitting...' : 'Submit Quote Request'}
                  </button>
                </div>
              ) : (
                // --- VOICE OVER FLOW: Show Payment Options ---
                <div className="pt-4 border-t border">
                  <label className="block mb-2 text-sm font-medium text-muted-foreground">Choose Payment Method *</label>
                  <div className="space-y-4">
                    <label className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center gap-4 cursor-pointer ${paymentMethod === 'stripe' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600 hover:border-slate-500'}`}>
                      <input type="radio" name="paymentMethod" value="stripe" checked={paymentMethod === 'stripe'} onChange={() => handlePaymentMethodChange('stripe')} className="h-4 w-4 mr-2 border-slate-500 text-purple-600 focus:ring-purple-500" disabled={isSettingUpStripe} />
                      <CreditCard className="w-6 h-6 text-purple-400 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-foreground">Pay by Card (Stripe)</h3>
                        <p className="text-sm text-muted-foreground">Securely pay with your credit/debit card.</p>
                      </div>
                    </label>
                    <label className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center gap-4 cursor-pointer ${paymentMethod === 'bank' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600 hover:border-slate-500'}`}>
                      <input type="radio" name="paymentMethod" value="bank" checked={paymentMethod === 'bank'} onChange={() => handlePaymentMethodChange('bank')} className="h-4 w-4 mr-2 border-slate-500 text-purple-600 focus:ring-purple-500" disabled={isSettingUpStripe} />
                      <Wallet className="w-6 h-6 text-purple-400 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-foreground">Bank Transfer</h3>
                        <p className="text-sm text-muted-foreground">Receive payment details and pay manually.</p>
                      </div>
                    </label>
                  </div>
                  {isSettingUpStripe && <p className="text-center text-sm text-muted-foreground mt-4">{status || 'Initializing...'}</p>}
                  {!isSettingUpStripe && status && !clientSecret && paymentMethod === 'stripe' && <p className="text-center text-sm text-red-400 mt-4">{status}</p>}

                  {paymentMethod === 'stripe' && clientSecret && !isSettingUpStripe && (
                    <div className="mt-4 pt-4 border-t border">
                      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
                        <StripeCheckoutForm onSuccessfulPayment={onSuccessfulStripePayment} />
                      </Elements>
                    </div>
                  )}
                </div>
              )}
              {/* --- END DYNAMIC CONTENT --- */}

              <div className="flex gap-4 pt-6 mt-6 border-t border">
                <button type="button" onClick={() => setStep(serviceType === 'voice_over' ? 2 : 1)} className="w-full py-3 bg-slate-600 rounded-full font-semibold text-foreground">Back</button>
                
                {/* Bank Transfer button (VO flow only) */}
                {serviceType === 'voice_over' && paymentMethod === 'bank' && (
                   <button
                      type="button"
                      onClick={handleConfirmation}
                      disabled={!canConfirmBank || isSettingUpStripe}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-foreground disabled:opacity-50"
                   >
                      Confirm Bank Transfer
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      // --- Step 4: Final Confirmation ---
      case 4:
        const isQuote = status.includes('Quote Request Submitted');
        return (
          <div>
            <ProgressBar currentStep={4} />
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-4 ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status || 'Processing...'}</h2>

              {status.includes('Successful') || status.includes('Confirmed') || status.includes('Submitted') ? (
                <div>
                  <p className="text-muted-foreground mb-6">
                    {isQuote
                      ? "Thank you! The actor has been notified and will send you an offer shortly."
                      : "Thank you! A confirmation email with the next steps is on its way."
                    }
                  </p>
                  {newOrderId && (
                    <Link to={`/order/${newOrderId}`} className="inline-block w-full mb-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-foreground font-semibold text-lg shadow-lg hover:scale-105 transition-transform">
                      {isQuote ? "View Your Quote Request" : "View Your Order Details"}
                    </Link>
                  )}
                </div>
              ) : status.includes('Error') ? (
                <p className="text-muted-foreground my-4">There was an issue processing your request. Please check the details and try again, or contact support.</p>
              ) : null}

              {/* Bank Transfer Details (VO flow only) */}
              {status === 'Order Confirmed!' && paymentMethod === 'bank' && !isQuote && (
                <div className="bg-background p-6 rounded-lg text-left mt-6">
                  <p className="mb-2"><span className="font-bold text-muted-foreground">Order ID:</span> {orderId}</p>
                  <p className="mb-4"><span className="font-bold text-muted-foreground">Amount Due:</span> {totalPrice.toFixed(2)} MAD</p>
                  <h4 className="font-bold text-lg mb-2 border-t border pt-4 text-foreground">Bank Transfer Details:</h4>
                  <p className="text-sm text-muted-foreground">Bank Name: Attijariwafa Bank</p>
                  <p className="text-sm text-muted-foreground">Account Holder: UCPMAROC</p>
                  <p className="text-sm text-muted-foreground">IBAN: MA64 0077 8000 0219 5000 0005 47</p>
                  <p className="font-bold text-foreground mt-4">IMPORTANT: Please use your Order ID ({orderId}) as the payment reference.</p>
                </div>
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
      <div className="bg-card rounded-2xl border border/50 w-full max-w-lg relative transition-all duration-300
                      p-6 sm:p-8 flex flex-col max-h-screen sm:max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-accent-foreground z-10">
          <X size={24} />
        </button>
        <div className="flex-shrink-0 mb-6 border-b border pb-4">
          <p className="text-center text-muted-foreground">Booking for: <span className="font-bold text-blue-400">{actor.ActorName}</span></p>
          {/* Only show total price for Voice Over flow */}
          {serviceType === 'voice_over' && (
            <>
              <p className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-2">
                Total: {totalPrice.toFixed(2)} MAD
              </p>
              {minimumFeeMessage && (
                <p className="text-center text-xs text-yellow-400 mt-1">{minimumFeeMessage}</p>
              )}
            </>
          )}
          {serviceType !== 'voice_over' && step > 0 && (
            <p className="text-center text-2xl font-bold text-foreground mt-2">
              Quote Request
            </p>
          )}
        </div>
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 sm:pr-4 sm:-mr-4 custom-scrollbar">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default QuoteCalculatorModal;