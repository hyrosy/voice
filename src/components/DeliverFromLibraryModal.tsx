// In src/components/DeliverFromLibraryModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Send, RefreshCw } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from './ui/button';


// Copied from ActorDashboardPage.tsx
interface ActorRecording {
  id: string;
  actor_id: string;
  name: string;
  raw_audio_url: string;
  cleaned_audio_url: string | null;
  status: 'raw' | 'cleaning' | 'cleaned' | 'error';
  created_at: string;
}

// Copied from OrderDetailsModal.tsx
interface Order {
  id: string;
  order_id_string: string;
  client_name: string;
  client_email: string;
  actor_id: string;
  actors: {
    ActorName: string;
  };
}

interface ModalProps {
  order: Order;
  onClose: () => void;
  onDeliverySuccess: () => void; // This will close both modals and refresh
}

const DeliverFromLibraryModal: React.FC<ModalProps> = ({ order, onClose, onDeliverySuccess }) => {
  const [recordings, setRecordings] = useState<ActorRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDelivering, setIsDelivering] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // 1. Fetch the actor's recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('actor_recordings')
        .select('*')
        .eq('actor_id', order.actor_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching recordings:", error);
        setMessage(`Error: ${error.message}`);
      } else {
        setRecordings(data as ActorRecording[]);
      }
      setIsLoading(false);
    };
    fetchRecordings();
  }, [order.actor_id]);

  // 2. Handle the delivery logic (copied from OrderDetailsModal)
  const handleDeliver = async () => {
    if (!selectedRecordingId) {
      setMessage('Please select a recording to deliver.');
      return;
    }

    const selectedRecording = recordings.find(r => r.id === selectedRecordingId);
    if (!selectedRecording) {
      setMessage('Error: Selected recording not found.');
      return;
    }

    // Prioritize cleaned audio, fall back to raw
    const fileUrlToDeliver = selectedRecording.cleaned_audio_url || selectedRecording.raw_audio_url;
    
    setIsDelivering(true);
    setMessage('Delivering...');

    try {
      // 2a. Count existing deliveries
      const { count, error: countError } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id);

      if (countError) throw countError;
      const newVersion = (count || 0) + 1;

      // 2b. Insert new row into 'deliveries' table
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          actor_id: order.actor_id,
          file_url: fileUrlToDeliver,
          version_number: newVersion
        });
      if (deliveryError) throw deliveryError;

      // 2c. Update the order status to 'Pending Approval'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Pending Approval' })
        .eq('id', order.id);
      if (updateError) throw updateError;

      // 2d. Send notification email to Client
      const emailParams = {
        orderId: order.order_id_string,
        order_uuid: order.id,
        clientName: order.client_name,
        clientEmail: order.client_email,
        actorName: order.actors.ActorName,
      };

      await emailjs.send(
        'service_r3pvt1s',
        'template_2iuj3dr',
        emailParams,
        'I51tDIHsXYKncMQpO'
      );

      setMessage('Delivery successful! Client has been notified.');
      
      // 2e. Call the success handler
      setTimeout(onDeliverySuccess, 1500); // Give time to read message

    } catch (error) {
      const err = error as Error;
      setMessage(`An error occurred: ${err.message}`);
      console.error(err);
      setIsDelivering(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* --- THIS IS THE FIX --- */}
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none border-none p-0 flex flex-col 
                                sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[80vh] sm:rounded-lg sm:border">
        
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
          <DialogTitle className="text-2xl sm:text-3xl font-bold">Deliver from Library</DialogTitle>
        </DialogHeader>

        {/* Scrollable list */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-3 mb-4 custom-scrollbar">
          {isLoading && <p className="text-muted-foreground text-center">Loading recordings...</p>}
          {!isLoading && recordings.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Your library is empty.</p>
          )}
          
          {recordings.map(rec => {
            const isSelected = selectedRecordingId === rec.id;
            return (
              <Button
                key={rec.id}
                variant="outline"
                onClick={() => setSelectedRecordingId(rec.id)}
                className={`w-full text-left h-auto py-4 justify-start
                            ${isSelected ? 'border-primary ring-2 ring-primary' : ''}
                            ${!rec.cleaned_audio_url && rec.status !== 'cleaned' ? 'opacity-60' : ''}`}
              >
                <div>
                  <p className="font-semibold text-base">{rec.name}</p>
                  {rec.status === 'cleaned' && rec.cleaned_audio_url ? (
                    <span className="text-xs text-green-500">Status: AI Cleaned</span>
                  ) : (
                    <span className="text-xs text-yellow-500">Status: Raw Audio Only</span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Footer */}
        <DialogFooter className="p-4 sm:p-6 pt-4 border-t">
          {message && <p className="text-center text-sm text-yellow-400 mb-3 w-full">{message}</p>}
          <Button
            onClick={handleDeliver}
            disabled={!selectedRecordingId || isDelivering || isLoading}
            className="w-full"
            size="lg"
          >
            {isDelivering ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            {isDelivering ? 'Delivering...' : 'Deliver Selected Audio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliverFromLibraryModal;