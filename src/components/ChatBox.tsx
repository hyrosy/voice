// In src/components/ChatBox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, MessageSquare, Mic } from 'lucide-react';
import VoiceNoteRecorder from './VoiceNoteRecorder'; // <-- Import the new component

interface Message {
  id: string;
  created_at: string;
  sender_role: 'client' | 'actor';
  content: string;
}

interface ChatBoxProps {
  orderId: string;
  userRole: 'client' | 'actor'; // To know who is sending the message
}

const ChatBox: React.FC<ChatBoxProps> = ({ orderId, userRole }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(false); // For sending
    
    // --- NEW: State to toggle recorder ---
    const [isRecording, setIsRecording] = useState(false);

    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true });
            
            if (error) console.error("Error fetching messages:", error);
            else setMessages(data || []);
        };
        fetchMessages();
    }, [orderId]);

    // **REAL-TIME MAGIC**: Subscribe to new messages
    useEffect(() => {
        const channel = supabase.channel(`messages-for-${orderId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` },
                (payload) => {
                    setMessages(currentMessages => [...currentMessages, payload.new as Message]);
                }
            )
            .subscribe();

        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);
    
    // Scroll to bottom when new messages arrive
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsLoading(true);
        const contentToSend = newMessage.trim();
        setNewMessage(''); // Clear input immediately (optimistic)

        const { error } = await supabase
            .from('messages')
                .insert({
                order_id: orderId,
                sender_role: userRole,
                content: contentToSend, // Use the stored content
            });  

            if (error) {
            console.error("Error sending message:", error);
            setNewMessage(contentToSend); // Restore message on error
        }
        // No need to clear, optimistic update did it
        setIsLoading(false);
    };

    // --- NEW: Handler for sending a voice file ---
    const handleSendVoiceNote = async (audioFile: File) => {
        setIsLoading(true);
        setIsRecording(false); // Hide recorder

        try {
            // 1. Create a unique path
            const fileExt = audioFile.name.split('.').pop() || 'webm';
            const filePath = `${orderId}/${userRole}-${Date.now()}.${fileExt}`;

            // 2. Upload to 'voice-notes' storage
            const { error: uploadError } = await supabase.storage
                .from('voice-notes')
                .upload(filePath, audioFile);
            if (uploadError) throw uploadError;

            // 3. Get the public URL
            const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(filePath);
            if (!urlData) throw new Error("Could not get public URL for voice note.");

            const publicUrl = urlData.publicUrl;

            // 4. Insert the URL into the 'messages' table
            const { error: insertError } = await supabase
                .from('messages')
                .insert({
                    order_id: orderId,
                    sender_role: userRole,
                    // Use a special prefix to identify this as audio
                    content: `[VOICE_NOTE]:${publicUrl}` 
                });
            if (insertError) throw insertError;

        } catch (error) {
            console.error("Error sending voice note:", error);
            // Handle error (e.g., show a message)
        } finally {
            setIsLoading(false);
        }
    };
    // ---


    return (
        <div className="bg-slate-900/70 rounded-lg border border-slate-700 mt-8 flex flex-col max-h-[70vh]"> {/* Added flex-col and max-h */}
            <div className="p-4 border-b border-slate-700 flex-shrink-0"> {/* Added flex-shrink-0 */}
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare size={20}/> Communication</h2>
            </div>
            {/* Added flex-grow and overflow-y-auto to this wrapper */}
            <div className="p-4 overflow-y-auto flex-grow h-64"> 
                {messages.map(msg => (
                    <div key={msg.id} className={`flex mb-3 ${msg.sender_role === userRole ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender_role === userRole ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            
                            {/* --- NEW: Check if message is a voice note --- */}
                            {msg.content.startsWith('[VOICE_NOTE]:') ? (
                                <audio
                                    controls
                                    src={msg.content.replace('[VOICE_NOTE]:', '')}
                                    className="h-10"
                                />
                            ) : (
                                <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p> // Added break-words
                            )}
                            {/* --- END Check --- */}

                            <p className="text-xs text-slate-300 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            {/* --- MODIFIED: Conditional Input Area --- */}
            {isRecording ? (
                <VoiceNoteRecorder 
                    onSend={handleSendVoiceNote} 
                    onCancel={() => setIsRecording(false)} 
                />
            ) : (
                <div className="p-4 border-t border-slate-700 flex-shrink-0"> {/* Added flex-shrink-0 */}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                        />
                        {/* Mic Button */}
                        <button 
                            type="button" 
                            onClick={() => setIsRecording(true)}
                            className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg flex items-center justify-center"
                        >
                            <Mic size={20}/>
                        </button>
                        {/* Send Button */}
                        <button 
                            type="submit" 
                            disabled={isLoading || !newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center disabled:opacity-50"
                        >
                            {isLoading ? '...' : <Send size={20}/>}
                        </button>
                    </form>
                </div>
            )}
            {/* --- END MODIFIED Input --- */}
        </div>
    );
};

export default ChatBox;