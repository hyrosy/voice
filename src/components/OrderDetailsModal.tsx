// In src/components/OrderDetailsModal.tsx

import { supabase } from '../supabaseClient';
import { X, Paperclip, CheckCircle, Archive, FileText, Package, Info, MessageSquare, Banknote, RefreshCw, Send, Download, History } from 'lucide-react'; // <-- Add Sendimport ChatBox from './ChatBox';
import React, { useState, useEffect } from 'react'; // <-- Added useEffect
import emailjs from '@emailjs/browser';
import DeliverFromLibraryModal from './DeliverFromLibraryModal';
import AccordionItem from './AccordionItem'; // <-- 1. Import Accordion
import { Button } from "@/components/ui/button"; // <-- Import Button
import { Input } from "@/components/ui/input"; // <-- Import Input
import { Label } from "@/components/ui/label"; // <-- Import Label
import ChatBox from './ChatBox';
import ServiceDeliveryUploader from './ServiceDeliveryUploader';
import { Textarea } from "@/components/ui/textarea"; // <-- Added Textarea
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Define the shape of the data we expect
interface Order {
  client_email: any;
  actor_id: any;
  id: string;
  order_id_string: string;
  client_name: string;
  status: string;
  script: string;
  final_audio_url?: string;
  actors: {
    ActorName: string;
    ActorEmail?: string;
  };
  // Add new fields
  service_type: 'voice_over' | 'scriptwriting' | 'video_editing';
  // Add new quote fields
  word_count?: number;
  usage?: string | null;
  quote_est_duration?: string | null;
  quote_video_type?: string | null;
  quote_footage_choice?: string | null;
  deliveries: { id: string; created_at: string; file_url: string; version_number: number }[];
}

interface ModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void; // A function to refresh the order list
  onActorConfirmPayment?: (orderId: string, clientEmail: string, clientName: string, orderIdString: string) => Promise<void>;
}

// --- NEW INTERFACE for an Offer ---
interface Offer {
  id: string;
  created_at: string;
  offer_title: string;
  offer_agreement: string | null;
  offer_price: number;
}

const OrderDetailsModal: React.FC<ModalProps> = ({ order, onClose, onUpdate, onActorConfirmPayment }) => {
    const [message, setMessage] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    // --- 2. UPDATED OFFER STATE ---
    const [offerTitle, setOfferTitle] = useState('');
    const [offerAgreement, setOfferAgreement] = useState('');
    const [offerPrice, setOfferPrice] = useState<number | string>('');
    const [isSendingOffer, setIsSendingOffer] = useState(false);
    
    // --- NEW STATE for offer history ---
    const [offerHistory, setOfferHistory] = useState<Offer[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // --- 2. Add state for accordions ---
    const [openSections, setOpenSections] = useState({
        offer_history: false, // Start history closed
        quote_details: true, // <-- Start new section open
        script: false, // Start script closed
        delivery: !['awaiting_offer', 'offer_made'].includes(order.status),
        chat: true      // Start chat open
    });

    // --- 3. NEW useEffect to fetch offer history ---
    useEffect(() => {
      if (order.status === 'awaiting_offer' || order.status === 'offer_made') {
        const fetchOfferHistory = async () => {
          setLoadingHistory(true);
          const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false }); // Newest first

          if (error) {
            console.error("Error fetching offer history:", error);
            setMessage(`Error: ${error.message}`);
          } else {
            setOfferHistory(data as Offer[]);
            // Pre-fill form with the *latest* offer if it exists
            if (data && data.length > 0) {
              setOfferTitle(data[0].offer_title);
              setOfferAgreement(data[0].offer_agreement || '');
              setOfferPrice(data[0].offer_price);
            }
          }
          setLoadingHistory(false);
        };
        fetchOfferHistory();
      }
    }, [order.id, order.status]);
    // ---

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };
    // ---

  

    const handleConfirmClick = async () => {
        if (!onActorConfirmPayment) return;
        
        setIsConfirming(true);
        setMessage(''); // Clear previous errors
        try {
          // Pass all necessary info for the email notification
          await onActorConfirmPayment(order.id, order.client_email, order.client_name, order.order_id_string);
          // Success! Parent (ActorDashboardPage) will close modal via onUpdate()
        } catch (error) {
          const err = error as Error;
          console.error("Failed to confirm payment:", err);
          setMessage(`Error: ${err.message}`);
          setIsConfirming(false); // Only set to false on error
        }
    };
    
    const handleDeliverySuccess = () => {
      // If the 'Deliver from Library' button was clicked, open that modal
      if (order.service_type === 'voice_over') {
        setIsLibraryModalOpen(true);
      } else {
        // Otherwise, (if a file was uploaded/pasted), just refresh and close
        onUpdate();
        onClose();
      }
    };
    
    const handleLibraryDeliverySuccess = () => {
      setIsLibraryModalOpen(false);
      onUpdate();
      onClose();
    }

    // --- 4. handleSendOffer (Now an "Upsert") ---
    // This function now handles both creating AND updating an offer
    const handleSendOffer = async () => {
      const price = parseFloat(String(offerPrice));
      if (!offerTitle.trim()) {
        setMessage("Please provide an Offer Title.");
        return;
      }
      if (isNaN(price) || price <= 0) {
        setMessage("Please enter a valid price.");
        return;
      }
      
      setIsSendingOffer(true);
      setMessage('');
      const isUpdate = order.status === 'offer_made'; // Check if we are updating

      try {
        // --- THIS IS THE NEW LOGIC ---
        // 1. Insert the new offer into the 'offers' table
        const { data: newOffer, error: insertError } = await supabase
          .from('offers')
          .insert({
            order_id: order.id,
            actor_id: order.actor_id,
            offer_title: offerTitle,
            offer_agreement: offerAgreement || null,
            offer_price: price
          })
          .select()
          .single();

        if (insertError) throw insertError;
        // ---

        // 2. Update the main order status to 'offer_made'
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'offer_made' })
          .eq('id', order.id);

        if (updateError) throw updateError;

        // 3. Send email to client
        const emailParams = {
          orderId: order.order_id_string,
          order_uuid: order.id,
          clientName: order.client_name,
          clientEmail: order.client_email,
          actorName: order.actors.ActorName,
          offerPrice: price.toFixed(2),
          offerTitle: offerTitle, // Pass new field
          offerAgreement: offerAgreement || 'No agreement details provided.', // Pass new field
          serviceType: order.service_type,
        };

        // TODO: Create a template for "Offer Updated"
        const templateId = isUpdate ? 'YOUR_OFFER_UPDATED_TEMPLATE_ID' : 'YOUR_QUOTE_OFFER_TEMPLATE_ID';

        await emailjs.send(
          'service_r3pvt1s',
          templateId, // <-- REPLACE with new template IDs
          emailParams,
          'I51tDIHsXYKncMQpO'
        );

        setMessage(isUpdate ? 'Offer updated!' : 'Offer sent to client!');
        onUpdate();
        setTimeout(onClose, 1500); // Close modal after 1.5s

      } catch (error) {
        const err = error as Error;
        console.error("Error sending offer:", err);
        setMessage(`Error: ${err.message}`);
      } finally {
        setIsSendingOffer(false);
      }
    };


    return (
        <>
            <Dialog open={true} onOpenChange={onClose}>
              {/* --- THIS IS THE FIX --- */}
              <DialogContent className="
w-screen h-screen max-w-none max-h-none rounded-none border-none p-0 flex flex-col
                [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]
                sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border sm:p-0                ">
                {/* Header (with mobile padding) */}
                <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
                  <DialogTitle className="text-2xl sm:text-3xl font-bold">
                    {order.service_type === 'voice_over' ? `Order #${order.order_id_string}` : `Quote #${order.order_id_string}`}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Client: {order.client_name}
                  </DialogDescription>
                  <span className="mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 capitalize w-fit">
                    {order.service_type.replace('_', ' ')}
                  </span>
                </DialogHeader>
                
                {/* Scrollable Content Area (with mobile padding) */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">

                  {/* --- Payment Confirmation Section --- */}
                  {order.status === 'Awaiting Actor Confirmation' && onActorConfirmPayment && (
                      <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg animate-in fade-in duration-300">
                          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Banknote size={18} /> Action Required</h3>
                          <p className="text-sm text-slate-300 mb-4">The client has marked this order as paid. Please check your bank account and confirm receipt to begin work.</p>
                          <Button
                              onClick={handleConfirmClick}
                              disabled={isConfirming}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                              {isConfirming ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                              {isConfirming ? 'Confirming...' : 'Confirm Payment Received'}
                          </Button>
                          {message.includes('Error') && <p className="text-red-400 text-sm mt-3 text-center">{message}</p>}
                      </div>
                  )}

                  {/* --- "Make/Update Offer" Section --- */}
                  {(order.status === 'awaiting_offer' || order.status === 'offer_made') && (
                      <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg animate-in fade-in duration-300">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Banknote size={18} /> 
                          {order.status === 'offer_made' ? 'Update Your Offer' : 'Make an Offer'}
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="offerTitle" className="text-slate-300">Offer Title *</Label>
                            <Input
                              id="offerTitle"
                              type="text"
                              placeholder="e.g., Full Video Edit + Color Grading"
                              value={offerTitle}
                              onChange={(e) => setOfferTitle(e.target.value)}
                              className="bg-slate-700 border-slate-600"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="offerAgreement" className="text-slate-300">Offer Agreement (Optional)</Label>
                            <Textarea
                              id="offerAgreement"
                              rows={3}
                              placeholder="e.g., Includes 2 revisions and royalty-free music."
                              value={offerAgreement}
                              onChange={(e) => setOfferAgreement(e.target.value)}
                              className="bg-slate-700 border-slate-600"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="offerPrice" className="text-slate-300">Your Price (MAD) *</Label>
                            <Input
                              id="offerPrice"
                              type="number"
                              step="0.01"
                              placeholder="e.g., 1500"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="bg-slate-700 border-slate-600"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleSendOffer}
                          disabled={isSendingOffer}
                          className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                        >
                          {isSendingOffer ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                          {isSendingOffer ? 'Sending...' : (order.status === 'offer_made' ? 'Update Offer' : 'Send Offer to Client')}
                        </Button>
                        {message && <p className={`text-center text-sm mt-3 ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
                      </div>
                  )}
                  
                  {/* --- Accordion Sections --- */}
                  <div className="space-y-4">
                    {/* Offer History */}
                    {(order.status === 'awaiting_offer' || order.status === 'offer_made') && (
                      <AccordionItem
                        title="Offer History"
                        icon={<History size={18} />}
                        isOpen={openSections.offer_history}
                        onToggle={() => toggleSection('offer_history')}
                      >
                        <div className="bg-slate-900 p-4 rounded-lg space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                          {loadingHistory ? (
                            <p className="text-sm text-slate-400">Loading history...</p>
                          ) : offerHistory.length === 0 ? (
                            <p className="text-sm text-slate-400">No offers have been made yet.</p>
                          ) : (
                            offerHistory.map(offer => (
                              <div key={offer.id} className="pb-3 border-b border-slate-700 last:border-b-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold text-white">{offer.offer_title}</span>
                                  <span className="font-bold text-lg text-primary">{offer.offer_price.toFixed(2)} MAD</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">{new Date(offer.created_at).toLocaleString()}</p>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{offer.offer_agreement || "No agreement details provided."}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </AccordionItem>
                    )}

                    {/* Quote Details */}
                    {order.service_type !== 'voice_over' && (
                      <AccordionItem
                        title="Quote Details"
                        icon={<Info size={18} />}
                        isOpen={openSections.quote_details}
                        onToggle={() => toggleSection('quote_details')}
                      >
                        <div className="bg-slate-900 p-4 rounded-lg space-y-2 text-sm">
                          {order.service_type === 'scriptwriting' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Est. Video Duration:</span>
                                <span className="font-semibold text-white">{order.quote_est_duration || 'N/A'} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Est. Word Count:</span>
                                <span className="font-semibold text-white">{order.word_count || 'N/A'}</span>
                              </div>
                            </>
                          )}
                          {order.service_type === 'video_editing' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Video Type:</span>
                                <span className="font-semibold text-white capitalize">{order.quote_video_type || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Footage:</span>
                                <span className="font-semibold text-white">
                                  {order.quote_footage_choice === 'has_footage' ? 'Client has footage' : 'Needs stock footage'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </AccordionItem>
                    )}
                    
                    {/* Project Description */}
                    <AccordionItem
                      title={order.service_type === 'voice_over' ? "Script" : "Project Description"}
                      icon={<FileText size={18} />}
                      isOpen={openSections.script}
                      onToggle={() => toggleSection('script')}
                    >
                      <div className="bg-slate-900 p-4 rounded-lg max-h-40 overflow-y-auto">
                        <p className="text-slate-300 whitespace-pre-wrap">{order.script}</p>
                      </div>
                    </AccordionItem>

                    {/* Delivery */}
                    {!['awaiting_offer', 'offer_made', 'Awaiting Payment'].includes(order.status) && (
                      <AccordionItem
                        title={`Deliver ${order.service_type.replace('_', ' ')}`}
                        icon={<Package size={18} />}
                        isOpen={openSections.delivery}
                        onToggle={() => toggleSection('delivery')}
                      >
                        {/* Delivery History */}
                        {order.deliveries && order.deliveries.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Delivery History</h4>
                            <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                              {order.deliveries.map((delivery) => (
                                <div key={delivery.id} className="bg-slate-900 p-3 rounded-lg flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-white">
                                      Version {delivery.version_number}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {new Date(delivery.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <Button asChild variant="ghost" size="sm">
                                    <a href={delivery.file_url} target="_blank" rel="noopener noreferrer">
                                      <Download size={16} className="mr-2" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Uploader */}
                        <div className="bg-slate-900 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-white mb-3">
                            {order.deliveries.length > 0 ? 'Upload a New Version' : 'Upload Your Delivery'}
                          </h4>
                          <ServiceDeliveryUploader
                            order={order}
                            onDeliverySuccess={handleDeliverySuccess}
                          />
                        </div>
                      </AccordionItem>
                    )}
                    
                    {/* Communication */}
                    <AccordionItem
                      title="Communication"
                      icon={<MessageSquare size={18} />}
                      isOpen={openSections.chat}
                      onToggle={() => toggleSection('chat')}
                    >
                        <ChatBox orderId={order.id} userRole="actor" />
                    </AccordionItem>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Library Modal */}
            {isLibraryModalOpen && order.service_type === 'voice_over' && (
              <DeliverFromLibraryModal
                order={order}
                onClose={() => setIsLibraryModalOpen(false)}
                onDeliverySuccess={handleLibraryDeliverySuccess}
              />
            )}
        </>
    );
};
export default OrderDetailsModal;