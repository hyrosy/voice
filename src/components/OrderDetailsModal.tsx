// In src/components/OrderDetailsModal.tsx

import { supabase } from '../supabaseClient';
import { X, Paperclip } from 'lucide-react';
import ChatBox from './ChatBox';
import React, { useState } from 'react'; // Make sure useState is imported
import emailjs from '@emailjs/browser';

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
}

interface ModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void; // A function to refresh the order list after an update
}

const OrderDetailsModal: React.FC<ModalProps> = ({ order, onClose, onUpdate }) => {
    const [message, setMessage] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('Uploading...');

    try {
        // First, count how many deliveries already exist to determine the new version number
        const { count, error: countError } = await supabase
            .from('deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id);

        if (countError) throw countError;
        const newVersion = (count || 0) + 1;

        const filePath = `${order.actor_id}/${order.id}/version_${newVersion}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('final-audio').upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('final-audio').getPublicUrl(filePath);

        // Insert a new row into the 'deliveries' table
        const { error: deliveryError } = await supabase
            .from('deliveries')
            .insert({
                order_id: order.id,
                actor_id: order.actor_id,
                file_url: urlData.publicUrl,
                version_number: newVersion
            });
        if (deliveryError) throw deliveryError;

        // Update the order status to 'Pending Approval'
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'Pending Approval' })
            .eq('id', order.id);
        if (updateError) throw updateError;

        // --- THIS IS THE NOTIFICATION PART ---
        // Fetch actor profile to obtain the actor's display name for the email
        let actorName = '';
        try {
            const { data: actorProfile, error: actorError } = await supabase
                .from('actors')
                .select('ActorName')
                .eq('id', order.actor_id)
                .single();
        
            if (actorError) {
                console.warn('Failed to fetch actor profile:', actorError);
                actorName = '';
            } else {
                actorName = (actorProfile as any)?.ActorName ?? '';
            }
        } catch (fetchError) {
            console.warn('Unexpected error fetching actor profile:', fetchError);
            actorName = '';
        }
        
        const emailParams = {
            orderId: order.order_id_string,
            order_uuid: order.id, // The UUID for the secure link
            clientName: order.client_name,
            clientEmail: order.client_email,
            actorName, // From the actor's profile data (fetched above)
        };
        
        emailjs.send(
            'service_r3pvt1s',
            'template_2iuj3dr', // The template for the client
            emailParams,
            'I51tDIHsXYKncMQpO'
        ).catch(err => console.error("Failed to send delivery email:", err));
        // --- END ---

        alert('Delivery successful! The client has been notified to review.');
        onUpdate();
        onClose();

    } catch (error) {
        const err = error as Error;
        alert(`An error occurred: ${err.message}`);
        setMessage('');
    }
};

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700/50 w-full max-w-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
                
                {/* Header */}
                <div className="flex-shrink-0 border-b border-slate-700 pb-4 mb-4">
                    <h2 className="text-3xl font-bold text-white">Order #{order.order_id_string}</h2>
                    <p className="text-slate-400">Client: {order.client_name}</p>
                </div>

                {/* Main Content (Scrollable) */}
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    {/* Script Section */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2">Script</h3>
                        <div className="bg-slate-900 p-4 rounded-lg max-h-40 overflow-y-auto">
                            <p className="text-slate-300 whitespace-pre-wrap">{order.script}</p>
                        </div>
                    </div>

                    {/* Delivery Section */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2">Deliver Final Audio</h3>
                        {order.status !== 'Completed' ? (
                            <div className="bg-slate-900 p-4 rounded-lg">
                                <label htmlFor="upload-modal" className="block text-sm font-medium text-slate-300 mb-2">Upload your file (e.g., MP3, WAV):</label>
                                <input type="file" id="upload-modal" onChange={handleFileUpload} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                        ) : (
                            <div className="bg-slate-900 p-4 rounded-lg flex items-center gap-3">
                                <Paperclip className="text-green-400" />
                                <a href={order.final_audio_url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline font-semibold">
                                    Delivery complete. View file.
                                </a>
                            </div>
                        )}
                        {message && (
                            <p className="text-center text-sm text-yellow-400 my-2">{message}</p>
                        )}
                    </div>
                    
                    {/* Chat Section */}
                    <ChatBox orderId={order.id} userRole="actor" />
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;