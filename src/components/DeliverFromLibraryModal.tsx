// In src/components/DeliverFromLibraryModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Send, RefreshCw } from 'lucide-react';
import emailjs from '@emailjs/browser';

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 w-full max-w-lg relative max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white" disabled={isDelivering}>
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Deliver from Library</h2>

        {/* Scrollable list of recordings */}
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4">
          {isLoading && <p className="text-slate-400 text-center">Loading recordings...</p>}
          {!isLoading && recordings.length === 0 && (
            <p className="text-slate-400 text-center py-4">Your library is empty. Upload or record audio first.</p>
          )}
          
          {recordings.map(rec => {
            const isSelected = selectedRecordingId === rec.id;
            return (
              <button
                key={rec.id}
                onClick={() => setSelectedRecordingId(rec.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors
                            ${isSelected ? 'bg-purple-800/50 border-purple-500' : 'bg-slate-700/50 border-slate-700 hover:bg-slate-700'}
                            ${!rec.cleaned_audio_url && rec.status !== 'cleaned' ? 'opacity-60' : ''}`}
                // Disable selecting raw/processing files if you want
                // disabled={!rec.cleaned_audio_url && rec.status !== 'cleaned'} 
              >
                <p className="font-semibold text-white">{rec.name}</p>
                {rec.status === 'cleaned' && rec.cleaned_audio_url ? (
                  <span className="text-xs text-green-400">Status: AI Cleaned</span>
                ) : (
                  <span className="text-xs text-yellow-400">Status: Raw Audio Only</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Footer / Action Area */}
        <div className="flex-shrink-0 pt-4 border-t border-slate-700">
          {message && <p className="text-center text-sm text-yellow-400 mb-3">{message}</p>}
          <button
            onClick={handleDeliver}
            disabled={!selectedRecordingId || isDelivering || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isDelivering ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            {isDelivering ? 'Delivering...' : 'Deliver Selected Audio'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliverFromLibraryModal;